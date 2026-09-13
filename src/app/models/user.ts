import { Data } from "./userData";

export interface User {
  id: string;
  username: string;
  password: string;
  data: Data;
}
