import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Store the invite locally; it is never printed into logs or bundled for the browser.
appendFileSync(
  fileURLToPath(new URL("../.env", import.meta.url)),
  `\nADMIN_INVITE_CODE=${randomBytes(24).toString("hex")}\n`,
);
console.log(
  "A fresh administrator invite is saved in backend/.env. Restart the API and use it on admin registration.",
);
