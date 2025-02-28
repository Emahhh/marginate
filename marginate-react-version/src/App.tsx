import React, { useState, useEffect, ChangeEvent } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Simple data structure for an example PDF.
 */
interface PdfExample {
  name: string;
  url: string;
}

/**
 * A small helper that fetches PDFs from a URL or uses an uploaded file byte array
 */
async function fetchPdfBytesOrFile(
  url: string,
  fileBytes: ArrayBuffer | null
): Promise<ArrayBuffer> {
  if (fileBytes) {
    return fileBytes;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Core merging function, which uses background and foreground PDF bytes
 */
async function createMergedPdf(
  backgroundUrl: string,
  backgroundBytes: ArrayBuffer | null,
  foregroundUrl: string,
  foregroundBytes: ArrayBuffer | null,
  pagesLimit: number = Infinity
): Promise<Uint8Array> {
  const backgroundPdfBytes = await fetchPdfBytesOrFile(backgroundUrl, backgroundBytes);
  const basePdfDoc = await PDFDocument.load(backgroundPdfBytes);
  const backgroundPage = basePdfDoc.getPages()[0];

  const foregroundPdfBytes = await fetchPdfBytesOrFile(foregroundUrl, foregroundBytes);
  const foregroundPdfDoc = await PDFDocument.load(foregroundPdfBytes);
  const foregroundPages = foregroundPdfDoc.getPages();

  const resultPdfDoc = await PDFDocument.create();
  const helveticaFont = await resultPdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed the background page once
  const embeddedBackground = await resultPdfDoc.embedPage(backgroundPage);
  // Embed all foreground pages at once for performance
  const embeddedForegrounds = await resultPdfDoc.embedPages(foregroundPages);

  let i = 0;
  for (const embeddedForeground of embeddedForegrounds) {
    if (i++ >= pagesLimit) break;

    // Create a new page in the result doc
    const newPage = resultPdfDoc.addPage([backgroundPage.getWidth(), backgroundPage.getHeight()]);

    // Draw the background
    newPage.drawPage(embeddedBackground, {
      x: 0,
      y: 0,
      width: newPage.getWidth(),
      height: newPage.getHeight(),
    });

    // Center and draw the foreground
    const centerX = (newPage.getWidth() - embeddedForeground.width) / 2;
    const centerY = (newPage.getHeight() - embeddedForeground.height) / 2;
    newPage.drawPage(embeddedForeground, {
      x: centerX,
      y: centerY,
      width: embeddedForeground.width,
      height: embeddedForeground.height,
    });

    // Add watermark (same as in the original code)
    const watermarkText = "Add margins to help you take notes using marginate";
    const textSize = 10;
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, textSize);

    newPage.drawText(watermarkText, {
      x: newPage.getWidth() - textWidth - 10,
      y: 10,
      size: textSize,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return resultPdfDoc.save();
}

/**
 * Main React component and entry point of our PDF merging app
 */
function App(): JSX.Element {
  // For storing URLs of the background and foreground PDFs
  const [backgroundPdfUrl, setBackgroundPdfUrl] = useState<string>(
    "https://emahhh.github.io/marginate/examples/a1.pdf"
  );
  const [foregroundPdfUrl, setForegroundPdfUrl] = useState<string>(
    "https://emahhh.github.io/marginate/examples/slides.pdf"
  );

  // For storing uploaded file bytes
  const [backgroundFileBytes, setBackgroundFileBytes] = useState<ArrayBuffer | null>(null);
  const [foregroundFileBytes, setForegroundFileBytes] = useState<ArrayBuffer | null>(null);

  // Preview URL and possible error
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Whenever the user chooses a file, read it as array buffer
  const handleBackgroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileBytes = await e.target.files[0].arrayBuffer();
      setBackgroundFileBytes(fileBytes);
    } else {
      setBackgroundFileBytes(null);
    }
  };

  const handleForegroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileBytes = await e.target.files[0].arrayBuffer();
      setForegroundFileBytes(fileBytes);
    } else {
      setForegroundFileBytes(null);
    }
  };

  // Update the PDF preview each time inputs change
  useEffect(() => {
    setErrorMessage("");
    (async () => {
      try {
        // Merge only the first page for preview
        const pdfBytes = await createMergedPdf(
          backgroundPdfUrl,
          backgroundFileBytes,
          foregroundPdfUrl,
          foregroundFileBytes,
          1
        );
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err: any) {
        console.error("Error while generating preview:", err);
        setErrorMessage(`Error while generating preview: ${err.message}`);
      }
    })();
  }, [backgroundPdfUrl, backgroundFileBytes, foregroundPdfUrl, foregroundFileBytes]);

  // Download the merged PDF
  const handleDownload = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        backgroundPdfUrl,
        backgroundFileBytes,
        foregroundPdfUrl,
        foregroundFileBytes
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "marginate-merged.pdf";
      link.click();
    } catch (err) {
      console.error("Error creating PDF:", err);
      alert("An error occurred while creating the PDF. Check console for details.");
    }
  };

  // Open the merged PDF in a new tab
  const handleOpenInNewTab = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        backgroundPdfUrl,
        backgroundFileBytes,
        foregroundPdfUrl,
        foregroundFileBytes
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error opening PDF:", err);
      alert("Could not open PDF in new tab. Check console for details.");
    }
  };

  // Example PDF sets (similar to original)
  const backgroundExamples: PdfExample[] = [
    { name: "foglio a1 con quadretti gialli", url: "https://emahhh.github.io/marginate/examples/a1.pdf" },
    { name: "foglio a2 con quadretti gialli", url: "https://emahhh.github.io/marginate/examples/a2.pdf" },
    { name: "foglio a3 con quadretti gialli", url: "https://emahhh.github.io/marginate/examples/a3.pdf" }
  ];
  const foregroundExamples: PdfExample[] = [
    { name: "slides unipi about time series con CORS", url: "https://corsproxy.io/?url=https://didawiki.cli.di.unipi.it/lib/exe/fetch.php/dm/time_series_from_keogh_tutorial.pdf" },
    { name: "slides TEST", url: "https://emahhh.github.io/marginate/examples/slides.pdf" }
  ];

  return (
    <div style={{ margin: '1em' }}>
      <h1>PDF Merger in React (TypeScript)</h1>
      <p>Enter or upload PDFs and see a preview of the first page.</p>
      <p><code>https://corsproxy.io/?url=</code> can help with CORS issues.</p>

      {/* Input and Upload for Background PDF */}
      <div style={{ marginTop: '1em' }}>
        <label>Background PDF URL:</label>
        <input 
          type="text" 
          value={backgroundPdfUrl} 
          onChange={(e) => setBackgroundPdfUrl(e.target.value)} 
          placeholder="Background PDF URL" 
          style={{ display: 'block', width: '100%', marginBottom: '1em' }}
        />
        <label>Upload Background PDF:</label>
        <input type="file" accept="application/pdf" onChange={handleBackgroundUpload} />
      </div>

      {/* Input and Upload for Foreground PDF */}
      <div style={{ marginTop: '1em' }}>
        <label>Foreground PDF URL:</label>
        <input 
          type="text" 
          value={foregroundPdfUrl} 
          onChange={(e) => setForegroundPdfUrl(e.target.value)} 
          placeholder="Foreground PDF URL"
          style={{ display: 'block', width: '100%', marginBottom: '1em' }}
        />
        <label>Upload Foreground PDF:</label>
        <input type="file" accept="application/pdf" onChange={handleForegroundUpload} />
      </div>

      {/* Preview and Error Message */}
      {errorMessage && (
        <p style={{ color: 'red', marginTop: '1em' }}>{errorMessage}</p>
      )}
      <div style={{ marginTop: '1em' }}>
        <iframe
          title="PDF Preview"
          src={previewUrl}
          width="100%"
          height="500px"
          style={{ border: '1px solid #ccc' }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '1em' }}>
        <button onClick={handleDownload}>Download PDF</button>
        <button onClick={handleOpenInNewTab} style={{ marginLeft: '1em' }}>Open PDF in New Tab</button>
      </div>

      {/* Example URLs for quick testing */}
      <div style={{ marginTop: '2em' }}>
        <h3>Examples</h3>
        <p>Pick a background example:</p>
        <ul style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: 0 }}>
          {backgroundExamples.map((ex) => (
            <li key={ex.name} style={{ listStyle: 'none' }}>
              <button onClick={() => setBackgroundPdfUrl(ex.url)}>
                {ex.name}
              </button>
            </li>
          ))}
        </ul>

        <p>Pick a foreground example:</p>
        <ul style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: 0 }}>
          {foregroundExamples.map((ex) => (
            <li key={ex.name} style={{ listStyle: 'none' }}>
              <button onClick={() => setForegroundPdfUrl(ex.url)}>
                {ex.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;