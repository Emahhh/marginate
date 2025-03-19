// This file contains utility functions for PDF operations, unrelated to UI or React.

import { PDFDocument, PDFName, PDFString, rgb, StandardFonts, PDFArray, PDFPage } from 'pdf-lib';

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
      console.warn(`The response code was not ok. The response code was ${response.status} for the request for ${trimmedUrl}, with statusText: ${response.statusText}. This might happen if you're not using a server, but you're serving files using the file:// protocol, for example in iOS!!!.`);
      // continuo la esecuzione, perché potrebbe non essere un errore, ma un warning, quando sto usando iOS
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error(`Fetched PDF from ${trimmedUrl} is empty`);
    }
    return arrayBuffer;
  }
}


export async function createMergedPdf(
  backgroundUrl: string,
  backgroundBytes: ArrayBuffer | null,
  foregroundUrl: string,
  foregroundBytes: ArrayBuffer | null,
  pagesLimit = Infinity,
  includeWatermark = false
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

  // Embed the background page once and reuse it for all foreground pages
  const embeddedBackground = await resultPdfDoc.embedPage(backgroundPage);
  
  // Embed all foreground pages at once to improve performance. If you embed them one by one, it will embed the same resources multiple times, and the resulting PDF will be HUGE in size. See this comment for more details: https://github.com/Hopding/pdf-lib/issues/639#issuecomment-905759877
  const pagesToEmbed = foregroundPages.slice(0, pagesLimit); // not all, just the first pagesLimit
  const embeddedForegrounds = await resultPdfDoc.embedPages(pagesToEmbed);

  for (const embeddedForeground of embeddedForegrounds) {
    const newPage = resultPdfDoc.addPage([backgroundPage.getWidth(), backgroundPage.getHeight()]);

    // Draw the chosen background
    newPage.drawPage(embeddedBackground, {
      x: 0,
      y: 0,
      width: newPage.getWidth(),
      height: newPage.getHeight(),
    });

    // Center the "foreground" page with proper spacing
    const margin = 20; // Add a margin to avoid overlapping
    const availableWidth = newPage.getWidth() - 2 * margin;
    const availableHeight = newPage.getHeight() - 2 * margin;

    const scale = Math.min(
      availableWidth / embeddedForeground.width,
      availableHeight / embeddedForeground.height
    );

    const scaledWidth = embeddedForeground.width * scale;
    const scaledHeight = embeddedForeground.height * scale;

    const centerX = (newPage.getWidth() - scaledWidth) / 2;
    const centerY = (newPage.getHeight() - scaledHeight) / 2;

    newPage.drawPage(embeddedForeground, {
      x: centerX,
      y: centerY,
      width: scaledWidth,
      height: scaledHeight,
    });

    // Optionally add a watermark
    if (includeWatermark) {
      const watermarkText1 = "Add margins to your documents using Marginate";
      const watermarkText2 = "Download from the App Store or at marginate.emanuele.click";
      const textSize = 10;
      const textWidth1 = helveticaFont.widthOfTextAtSize(watermarkText1, textSize);
      const textWidth2 = helveticaFont.widthOfTextAtSize(watermarkText2, textSize);
      const linkUrl = "http://marginate.emanuele.click";

      // Draw the first line of the watermark text
      newPage.drawText(watermarkText1, {
        x: newPage.getWidth() - textWidth1 - 10,
        y: 20,
        size: textSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Draw the second line of the watermark text
      newPage.drawText(watermarkText2, {
        x: newPage.getWidth() - textWidth2 - 10,
        y: 10,
        size: textSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Create a clickable link annotation for the first line
      const linkAnnotation1 = resultPdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [
          newPage.getWidth() - textWidth1 - 10,
          20,
          newPage.getWidth() - 10,
          20 + textSize + 2,
        ],
        Border: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(linkUrl),
        },
      });
      const linkAnnotationRef1 = resultPdfDoc.context.register(linkAnnotation1);

      // Create a clickable link annotation for the second line
      const linkAnnotation2 = resultPdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [
          newPage.getWidth() - textWidth2 - 10,
          10,
          newPage.getWidth() - 10,
          10 + textSize + 2,
        ],
        Border: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(linkUrl),
        },
      });
      const linkAnnotationRef2 = resultPdfDoc.context.register(linkAnnotation2);

      // Add the link annotations to the page
      const annotations = newPage.node.lookup(PDFName.of('Annots'), PDFArray) || resultPdfDoc.context.obj([]);
      annotations.push(linkAnnotationRef1);
      annotations.push(linkAnnotationRef2);
      newPage.node.set(PDFName.of('Annots'), annotations);
    }
  }

  return resultPdfDoc.save();
}





/**
 * Given some settings, like paperSize="A2", marginColor="yellow", paperStyle="squares", 
 * this function returns the URL of the corresponding background PDF, like: "/pdf-backgrounds/a2-yellow-squares.pdf".
 * Note: You must place the matching PDF files under "/public/pdf-backgrounds".
 */
export function getBackgroundPdfUrl(paperSize: string, marginColor: string, paperStyle: string): string {

  const url = `./pdf-backgrounds/${paperSize}-${marginColor}-${paperStyle}.pdf`;
  console.debug(`getBackgroundPdfUrl: ${url}`);
  return url;
}



