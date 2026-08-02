import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const playwrightPath = path.join(
  __dirname,
  "../../../../node_modules/.pnpm/playwright@1.59.1/node_modules/playwright",
);
const { chromium } = require(playwrightPath);

const htmlPath = path.join(__dirname, "scope.html");
const outPdf = path.join(
  __dirname,
  "../../CATALOG_DATA_QUALITY_AND_EXPANSION_SCOPE.pdf",
);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "10mm", bottom: "14mm", left: "10mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `
    <div style="width:100%;font-size:8px;color:#5A6E64;padding:0 14mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;">
      <span>QueGym · Catálogo Caracas · Alcance junior</span>
      <span>Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
});
await browser.close();
console.log("PDF written:", outPdf);
