// Electron entry that renders one OGP image (1200 x 630) offscreen: the app
// icon, the product name and the tagline on the site's dark background in
// the site's font. Run through scripts/renderOgImages.ts, which passes the
// arguments: <icon.svg> <inter.woff2> <lang> <name> <tagline> <output.png>.
import { readFileSync, writeFileSync } from "node:fs";
import { app, BrowserWindow } from "electron";

const WIDTH = 1200;
const HEIGHT = 630;

const [iconPath, fontPath, lang, name, tagline, output] = process.argv.slice(2);

const escapeHtml = (text) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const icon = readFileSync(iconPath).toString("base64");
const font = readFileSync(fontPath).toString("base64");

// Colours are the dark theme tokens of web/src/styles/tokens.css.
// `lang` matters: auto-phrase line breaking only applies to a known language.
const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "Inter Variable";
    font-weight: 100 900;
    src: url(data:font/woff2;base64,${font}) format("woff2");
  }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    display: flex; align-items: center; justify-content: center; gap: 72px;
    background: oklch(0.145 0 0); color: oklch(0.985 0 0);
    font-family: "Inter Variable", sans-serif;
  }
  img { width: 280px; height: 280px; }
  .text { display: flex; flex-direction: column; gap: 20px; max-width: 680px; }
  h1 { margin: 0; font-size: 112px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
  /* auto-phrase breaks Japanese at phrase boundaries instead of mid-word. */
  p { margin: 0; font-size: 36px; line-height: 1.3; color: oklch(0.708 0 0); word-break: auto-phrase; }
</style>
</head>
<body>
  <img src="data:image/svg+xml;base64,${icon}" alt="">
  <div class="text">
    <h1>${escapeHtml(name)}</h1>
    <p>${escapeHtml(tagline)}</p>
  </div>
</body>
</html>`;

app
  .whenReady()
  .then(async () => {
    const win = new BrowserWindow({
      show: false,
      width: WIDTH,
      height: HEIGHT,
      webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );
    await win.webContents.executeJavaScript("document.fonts.ready");
    // One more frame so the font swap is painted before the capture.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const image = await win.webContents.capturePage();
    const size = image.getSize();
    if (size.width !== WIDTH || size.height !== HEIGHT) {
      console.error(`unexpected capture size ${size.width} x ${size.height}`);
      app.exit(1);
      return;
    }
    writeFileSync(output, image.toPNG());
    app.exit(0);
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
