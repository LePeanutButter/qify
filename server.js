import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let browser;

// Launch browser on startup
async function startBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Puppeteer browser launched');
}

// Convert SVG to PDF using puppeteer
async function svgToPdf(svg, width, height) {
  const page = await browser.newPage();

  try {
    // Set viewport to match SVG dimensions
    await page.setViewport({
      width: Math.ceil(width),
      height: Math.ceil(height),
      deviceScaleFactor: 1
    });

    // Create HTML with SVG
    const html = `
      <html>
        <body style="margin:0; padding:0;">
          ${svg}
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: `${width}px`,
      height: `${height}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

// Endpoint to convert SVG to PDF
app.post('/api/svg-to-pdf', async (req, res) => {
  try {
    const { svg } = req.body;

    if (!svg) {
      return res.status(400).json({ error: 'SVG is required' });
    }

    // Extract width and height from SVG
    const widthMatch = svg.match(/width="([\d.]+)(px)?"/);
    const heightMatch = svg.match(/height="([\d.]+)(px)?"/);

    const width = widthMatch ? parseFloat(widthMatch[1]) : 1000;
    const height = heightMatch ? parseFloat(heightMatch[1]) : 1000;

    // Convert SVG to PDF
    const pdfBuffer = await svgToPdf(svg, width, height);

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.send(pdfBuffer);

    console.log(`PDF generated: ${width}x${height}`);
  } catch (error) {
    console.error('Error converting SVG to PDF:', error);
    res.status(500).json({ error: 'Failed to convert SVG to PDF' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', browser: !!browser });
});

// Start server
startBrowser().then(() => {
  app.listen(PORT, () => {
    console.log(`PDF conversion server running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
