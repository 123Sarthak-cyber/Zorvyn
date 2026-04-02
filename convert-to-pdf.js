import { marked } from 'marked';
import puppeteer from 'puppeteer';
import fs from 'fs';

async function convertMarkdownToPdf() {
  try {
    // Read markdown file
    const markdown = fs.readFileSync('./SUBMISSION.md', 'utf-8');

    // Convert markdown to HTML
    const html = marked(markdown);

    // Create full HTML document with styling
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Submission Deliverables</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #0366d6;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          code {
            background-color: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
          }
          a {
            color: #0366d6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    // Launch browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    await page.pdf({
      path: './SUBMISSION.pdf',
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();
    console.log('PDF created successfully: SUBMISSION.pdf');
    process.exit(0);
  } catch (err) {
    console.error('Error creating PDF:', err);
    process.exit(1);
  }
}

convertMarkdownToPdf();
