import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", arg("--dir", "."));
const port = Number(arg("--port", "5173"));
const base = arg("--base", "/");
const config = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
const headers = Object.fromEntries(config.headers[0].headers.map(entry => [entry.key, entry.value]));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(base)) throw new Error("Not found");
    let file = path.resolve(root, pathname.slice(base.length) || "index.html");
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error("Not found");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const content = await readFile(file);
    response.writeHead(200, { ...headers, "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Static server: http://127.0.0.1:${port}${base}`));
