// `npm run serve -- <port>`: the built Nitro server on that port
import { spawn } from "node:child_process";
spawn(process.execPath, [".output/server/index.mjs"], { stdio: "inherit", env: { ...process.env, PORT: process.argv[2] ?? "3000" } });
