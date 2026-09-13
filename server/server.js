import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { users, games, sessions, awardedWins } from './data.js';

const app = express();

app.use(express.json({ limit: '250kb' }));

function normalizeUsername(value) {
    return String(value ?? '').trim();
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        wins: user.wins
    };
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
    const [salt, saved] = String(stored).split(':');

    if (!salt || !saved) {
        return false;
    }

    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(saved, 'hex');

    return expected.length === derived.length
        && crypto.timingSafeEqual(expected, derived);
}

function setSessionCookie(response, sessionId, maxAge = 86400 * 1000) {
    const maxAgeSeconds = Math.floor(maxAge / 1000);

    response.setHeader(
        'Set-Cookie',
        `session=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`
    );
}

function getSessionId(request) {
    const cookieHeader = String(request.headers.cookie ?? '');
    const cookies = cookieHeader.split(';').map(part => part.trim());
    const sessionCookie = cookies.find(cookie => cookie.startsWith('session='));

    return sessionCookie?.slice(8) ?? null;
}

function getAuthenticatedUser(request) {
    const sessionId = getSessionId(request);
    const userId = sessions.get(sessionId);

    return users.find(user => user.id === userId) ?? null;
}

function requireUser(request, response) {
    const user = getAuthenticatedUser(request);

    if (!user) {
        response.status(401).json({ message: 'Bitte zuerst einloggen.' });
        return null;
    }

    return user;
}

app.post('/api/auth/register', (request, response) => {
    const username = normalizeUsername(request.body?.username);
    const password = String(request.body?.password ?? '');

    if (username.length < 3 || username.length > 20) {
        return response.status(400).json({
            message: 'Der Username muss 3-20 Zeichen lang sein.'
        });
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return response.status(400).json({
            message: 'Erlaubt sind Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich.'
        });
    }

    const usernameExists = users.some(
        user => user.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameExists) {
        return response.status(409).json({
            message: 'Dieser Username existiert bereits.'
        });
    }

    const nextId = users.length
        ? Math.max(...users.map(user => user.id)) + 1
        : 1;

    const user = {
        id: nextId,
        username,
        passwordHash: hashPassword(password),
        wins: 0
    };

    users.push(user);

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user.id);
    setSessionCookie(response, sessionId);

    return response.status(201).json(publicUser(user));
});

app.post('/api/auth/login', (request, response) => {
    const username = normalizeUsername(request.body?.username);
    const password = String(request.body?.password ?? '');

    const user = users.find(
        candidate => candidate.username.toLowerCase() === username.toLowerCase()
    );

    if (!user || !checkPassword(password, user.passwordHash)) {
        return response.status(401).json({
            message: 'Username oder Passwort ist falsch.'
        });
    }

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user.id);
    setSessionCookie(response, sessionId);

    return response.json(publicUser(user));
});

app.post('/api/auth/logout', (request, response) => {
    const sessionId = getSessionId(request);

    if (sessionId) {
        sessions.delete(sessionId);
    }

    setSessionCookie(response, 'deleted', 0);

    response.json({ ok: true });
});

app.get('/api/user', (request, response) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
        return response.status(401).json({
            message: 'Nicht eingeloggt.'
        });
    }

    return response.json({
        ...publicUser(user),
        hasSavedGame: games.has(user.id)
    });
});

app.get('/api/leaderboard', (request, response) => {
    const rows = [...users]
        .sort((a, b) => {
            return b.wins - a.wins
                || a.username.localeCompare(b.username, 'de');
        })
        .map((user, index) => ({
            ...publicUser(user),
            rank: index + 1
        }));

    response.json(rows);
});

app.get('/api/game', (request, response) => {
    const user = requireUser(request, response);

    if (!user) {
        return;
    }

    response.json(games.get(user.id) ?? null);
});

app.post('/api/game', (request, response) => {
    const user = requireUser(request, response);

    if (!user) {
        return;
    }

    const game = request.body;

    const isValidGame = game
        && typeof game === 'object'
        && typeof game.gameId === 'string'
        && Array.isArray(game.players);

    if (!isValidGame) {
        return response.status(400).json({
            message: 'Ungültiger Spielstand.'
        });
    }

    games.set(user.id, game);
    response.json(game);
});

app.delete('/api/game', (request, response) => {
    const user = requireUser(request, response);

    if (!user) {
        return;
    }

    games.delete(user.id);
    response.status(204).send();
});

app.post('/api/game/win', (request, response) => {
    const user = requireUser(request, response);

    if (!user) {
        return;
    }

    const gameId = String(request.body?.gameId ?? '');

    if (!gameId) {
        return response.status(400).json({
            message: 'Spiel-ID fehlt.'
        });
    }

    const winKey = `${user.id}:${gameId}`;

    if (!awardedWins.has(winKey)) {
        awardedWins.add(winKey);
        user.wins += 1;
        games.delete(user.id);
    }

    response.json({ wins: user.wins });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(
    __dirname,
    'dist/Uno/browser'
);

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (request, response, next) => {
    const indexFile = path.join(clientDist, 'index.html');

    response.sendFile(indexFile, error => {
        if (error) {
            next();
        }
    });
});

app.listen(3000, () => {
    console.log('UNO API: http://localhost:3000');
});
