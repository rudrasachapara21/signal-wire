import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, "../.output/public");
const assetsDir = path.join(publicDir, "assets");

if (!fs.existsSync(assetsDir)) {
  console.error("Assets directory not found:", assetsDir);
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!jsFile || !cssFile) {
  console.error("Failed to find index JS or styles CSS in assets directory.", { jsFile, cssFile });
  process.exit(1);
}

const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Signal Wire</title>
    <link rel="stylesheet" href="./assets/${cssFile}" />
    <link rel="icon" type="image/x-icon" href="./favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/${jsFile}"></script>
  </body>
</html>
`;

const targetHtml = path.join(publicDir, "index.html");
fs.writeFileSync(targetHtml, htmlContent, "utf-8");
console.log(`[Capacitor Helper] Created ${targetHtml} pointing to assets/${jsFile} & assets/${cssFile}`);
