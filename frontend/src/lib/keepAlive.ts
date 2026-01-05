// frontend/src/lib/keepAlive.ts
import { api } from "./api";

export const keepBackendAlive = () => {
  setInterval(() => {
    api.get("/health").catch(() => {});
  }, 10 * 60 * 1000); // every 10 min
};
