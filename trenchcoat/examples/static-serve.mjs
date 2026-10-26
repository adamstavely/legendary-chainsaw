// A tiny static file server for built examples: node ../static-serve.mjs <dir> <port>
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const [dir, port] = process.argv.slice(2);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".map": "application/json", ".ico": "image/x-icon" };
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let file = normalize(join(dir, decodeURIComponent(url.pathname)));
  if (!file.startsWith(normalize(dir))) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(dir, "index.html");
  }
  try {
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(Number(port));
