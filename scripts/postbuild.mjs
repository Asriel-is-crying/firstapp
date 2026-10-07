import { readFileSync, writeFileSync } from "node:fs";
const file = "dist/index.html";
let html = readFileSync(file, "utf8");
html = html.replace(
  "<head>",
  '<head><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icon-192.png"><meta name="theme-color" content="#153B32"><meta name="apple-mobile-web-app-capable" content="yes">',
);
writeFileSync(file, html);
