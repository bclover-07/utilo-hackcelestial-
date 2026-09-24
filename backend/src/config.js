import dotenv from "dotenv";
import dns from "node:dns";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(","));
export const config = {
  port: Number(process.env.PORT || 4000),
  mongo: process.env.MONGODB_URI,
  jwt: process.env.JWT_SECRET,
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  production: process.env.NODE_ENV === "production",
};
export function validateConfig() {
  if (!config.mongo || !config.jwt || config.jwt.length < 32)
    throw new Error(
      "Set MONGODB_URI and a JWT_SECRET of at least 32 characters in backend/.env",
    );
}
