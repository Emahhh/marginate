import React, { useState, useEffect, ChangeEvent } from 'react';
import { Alert } from './components/ui/alert';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  createMergedPdf,
  getBackgroundPdfUrl
} from './utils/pdfUtils';

function App(): JSX.Element {
  // Step management for a simple wizard navigation
  const [step, setStep] = useState(1);

  // Background PDF
  const [backgroundPdfUrl, setBackgroundPdfUrl] = useState<string>("");

  // Foreground PDF
  const [foregroundPdfUrl, setForegroundPdfUrl] = useState<string>("");
  const [foregroundFileBytes, setForegroundFileBytes] = useState<ArrayBuffer | null>(null);

  // PDF preview and error
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Personalization controls
  const [paperSize, setPaperSize] = useState<string>("a2");
  const [marginColor, setMarginColor] = useState<string>("yellow");
  const [paperStyle, setPaperStyle] = useState<string>("squares");
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);

  // HANDLE UPLOAD
  // This function is triggered when the user selects a PDF file
  // We store the file's bytes for advanced usage in step 2
  const handleBackgroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileBytes = await e.target.files[0].arrayBuffer();
      setForegroundFileBytes(fileBytes);
      // Clear any typed URL since user picked a file
      setForegroundPdfUrl("");
    } else {
      setForegroundFileBytes(null);
    }
  };

  // CALCULATE NEW BACKGROUND URL
  // when the dependencies change, we need to return the new background URL
  const chosenBackgroundUrl = React.useMemo(() => {
    try {
      const newBackgroundUrl = getBackgroundPdfUrl(paperSize, marginColor, paperStyle);
      return newBackgroundUrl;
    } catch (err) {
      console.error(err);
      setErrorMessage(`Error while generating preview: ${err}`);
      return "";
    }
  }, [paperSize, marginColor, paperStyle]);

  // PREVIEW UPDATE
  // Whenever needed, update or generate the preview
  useEffect(() => {
    if (step === 2) {
      setErrorMessage("");
      (async () => {
        try {
          // We use "chosenBackgroundUrl" for the background
          const pdfBytes = await createMergedPdf(
            chosenBackgroundUrl,
            null,
            foregroundPdfUrl,
            foregroundFileBytes,
            1,
            includeWatermark
          );
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } catch (err) {
          console.error(err);
          setErrorMessage(`Error while generating preview: ${err}`);
        }
      })();
    }
  }, [
    step,
    chosenBackgroundUrl,
    foregroundPdfUrl,
    foregroundFileBytes,
    includeWatermark
  ]);

  // Trigger the final PDF merge and prompt the user to download
  const handleDownload = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        chosenBackgroundUrl,
        null,
        foregroundPdfUrl,
        foregroundFileBytes,
        Infinity,
        includeWatermark
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "marginate-merged.pdf";
      link.click();
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the PDF. Check console for details.");
    }
  };

  // Helper to open the PDF in a new tab
  const handleOpenInNewTab = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        chosenBackgroundUrl,
        null,
        foregroundPdfUrl,
        foregroundFileBytes,
        Infinity,
        includeWatermark
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert("Could not open PDF in new tab. Check console for details.");
    }
  };

  return (
    <Container>
      <header>
        <Title onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          Marginate
        </Title>
        <Text>Add Space for Your Notes to Any PDF</Text>
      </header>

      {step === 1 && (
        <Card>
          <Title>Upload Your PDF or Enter URL</Title>
          <Label>Choose File:</Label>
          <Input type="file" accept="application/pdf" onChange={handleBackgroundUpload} />

          <Label>Enter PDF URL:</Label>
          <Input
            type="text"
            value={backgroundPdfUrl}
            onChange={(e) => setBackgroundPdfUrl(e.target.value)}
            placeholder="https://example.com/yourpdf.pdf"
          />

          <Button onClick={() => setStep(2)}>Next</Button>
        </Card>
      )}

      {step === 2 && (
        <>
          <Link href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
            ← use another PDF
          </Link>

          <Flex gap="1rem" wrap="wrap">
            <Card flex="1 1 300px">
              <Title>Personalize</Title>

              <Label>Margin Size:</Label>
              <RadioGroup value={paperSize} onChange={setPaperSize}>
                <Radio value="a1">A1 <small>Huge</small></Radio>
                <Radio value="a2">A2 <small>Big</small></Radio>
                <Radio value="a3">A3 <small>Medium</small></Radio>
              </RadioGroup>

              <Label>Margin Color:</Label>
              <RadioGroup value={marginColor} onChange={setMarginColor}>
                <Radio value="yellow">Yellow</Radio>
                <Radio value="white" disabled>White <small>(coming soon)</small></Radio>
                <Radio value="dark" disabled>Dark <small>(coming soon)</small></Radio>
              </RadioGroup>

              <Label>Paper Style:</Label>
              <RadioGroup value={paperStyle} onChange={setPaperStyle}>
                <Radio value="lines" disabled>Lines <small>(coming soon)</small></Radio>
                <Radio value="squares">Squares</Radio>
                <Radio value="plain" disabled>Plain <small>(coming soon)</small></Radio>
                <Radio value="cornell" disabled>Cornell (best for study) <small>(coming soon)</small></Radio>
              </RadioGroup>

              <Checkbox
                checked={includeWatermark}
                onChange={() => setIncludeWatermark(!includeWatermark)}
              >
                Add Watermark
              </Checkbox>
            </Card>

            <Card flex="2 1 300px">
              <Title>Preview</Title>
              {errorMessage && <Alert type="error">{errorMessage}</Alert>}

              {previewUrl ? (
                <Embed title="PDF Preview" src={previewUrl} width="100%" type="application/pdf" />
              ) : (
                <Text>No preview available.</Text>
              )}

              <Button onClick={handleDownload} style={{ marginTop: '1rem', fontSize: '1.2rem', width: '100%' }}>
                <span style={{ marginRight: '0.5rem' }}>Download PDF</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-download">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </Button>

              <Link onClick={handleOpenInNewTab} style={{ marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                or Open in New Tab
              </Link>
            </Card>
          </Flex>
        </>
      )}
    </Container>
  );
}

export default App;