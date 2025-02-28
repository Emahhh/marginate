// Explanation: This file contains utility functions for fetching PDF bytes and merging PDF documents.
// People unfamiliar with React can consider these as "helper" or "library" functions 
// that do not deal with UI, only with data (PDF operations).

import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';

/**
 * Fetches PDF content either from a URL or local file bytes.
 * At least one of the two parameters must contain a PDF.
 */
async function fetchPdfBytesOrFile(
  url: string,
  fileBytes: ArrayBuffer | null
): Promise<ArrayBuffer> {

  if (fileBytes) {
    console.info('fetchPdfBytesOrFile: Using fileBytes');
    return fileBytes;
  } else {
    const trimmedUrl = url.trim();
    console.log(`Since fileBytes was empty, fetching PDF from URL: ${trimmedUrl}, with length: ${trimmedUrl.length}`);
    if (trimmedUrl.length === 0) {
      throw new Error('URL is empty or undefined');
    }
    const response = await fetch(trimmedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from ${trimmedUrl}: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error(`Fetched PDF from ${trimmedUrl} is empty`);
    }
    return arrayBuffer;
  }
}

/**
 * Our function that merges a background PDF with an optional foreground PDF.
 * For now, the foreground PDF is not actually used, but it's here in case
 * we expand the feature in the future.
 */
export async function createMergedPdf(
  backgroundUrl: string,
  backgroundBytes: ArrayBuffer | null,
  foregroundUrl: string,
  foregroundBytes: ArrayBuffer | null,
  pagesLimit: number = Infinity,
  includeWatermark: boolean = false
): Promise<Uint8Array> {

  let backgroundPdfBytes: ArrayBuffer;
  let foregroundPdfBytes: ArrayBuffer;

  // getting the background PDF page
  try {
    backgroundPdfBytes = await fetchPdfBytesOrFile(backgroundUrl, backgroundBytes);
  } catch (error) {
    console.error('Error while fetching the BACKGROUND PDF:', error);
    throw new Error('Error while fetching the BACKGROUND PDF:' + error);
  }
  const basePdfDoc = await PDFDocument.load(backgroundPdfBytes); 
  const backgroundPage : PDFPage = basePdfDoc.getPages()[0];

  // getting the foreground PDF pages
  try {
    foregroundPdfBytes = await fetchPdfBytesOrFile(foregroundUrl, foregroundBytes);
  } catch (error) {
    console.error('Error while fetching the FOREGROUND PDF:', error);
    throw new Error('Error while fetching the FOREGROUND PDF:' + error);
  }
  const foregroundPdfDoc = await PDFDocument.load(foregroundPdfBytes);
  const foregroundPages : PDFPage[]= foregroundPdfDoc.getPages();

  const resultPdfDoc = await PDFDocument.create();
  const helveticaFont = await resultPdfDoc.embedFont(StandardFonts.Helvetica);

  const embeddedBackground = await resultPdfDoc.embedPage(backgroundPage);
  const embeddedForegrounds = await resultPdfDoc.embedPages(foregroundPages);

  let i = 0;
  for (const embeddedForeground of embeddedForegrounds) {
    if (i++ >= pagesLimit) break;
    const newPage = resultPdfDoc.addPage([backgroundPage.getWidth(), backgroundPage.getHeight()]);

    // Draw the chosen background
    newPage.drawPage(embeddedBackground, {
      x: 0,
      y: 0,
      width: newPage.getWidth(),
      height: newPage.getHeight(),
    });

    // Center the "foreground" page
    const centerX = (newPage.getWidth() - embeddedForeground.width) / 2;
    const centerY = (newPage.getHeight() - embeddedForeground.height) / 2;
    newPage.drawPage(embeddedForeground, {
      x: centerX,
      y: centerY,
      width: embeddedForeground.width,
      height: embeddedForeground.height,
    });

    // Optionally add a watermark
    if (includeWatermark) {
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
  }

  return resultPdfDoc.save();
}

/**
 * Picks which local PDF path or URL to use as the background,
 * based on user settings.
 * Note: You must place the matching PDF files under "public/pdf-templates".
 */
export function getBackgroundPdfUrl(paperSize: string, marginColor: string, paperStyle: string) {
  // Convert "Cornell (best for study)" to a simpler identifier. 
  const styleKey = paperStyle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sizeKey = paperSize.toLowerCase();
  const colorKey = marginColor.toLowerCase();

  // We'll assume we have files named like "a4-yellow-lines.pdf", "a4-dark-squares.pdf", etc.
  return `/pdf-templates/${sizeKey}-${colorKey}-${styleKey}.pdf`;
}