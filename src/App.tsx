import React, { useState, useEffect, ChangeEvent } from 'react';


import { Alert } from './components/ui/alert';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioCards } from "@/components/ui/radio-cards"
import { Text } from "@/components/ui/text"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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
    <div>
      <header>
        <h1 onClick={() => window.location.reload()} className="text-3xl font-bold cursor-pointer">
          Marginate
        </h1>
        <p className="text-lg">Add Space for Your Notes to Any PDF</p>
      </header>

      {step === 1 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Upload Your PDF or Enter URL</h2>
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
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="text-sm text-gray-500">
            ← use another PDF
          </a>

          <div className="flex gap-4 flex-wrap">
            <Card className="flex-2 flex-1-300px">
              <h1>Personalize</h1>

              <Label>Margin Size:</Label>
              <RadioCards.Root value={paperSize} onValueChange={setPaperSize} columns={{ initial: "1", sm: "3" }}>
                <RadioCards.Item value="a1" >
                  <div className="flex flex-col w-full">
                    <Text weight="bold">A1</Text>
                    <Text variant="muted">Huge</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="a2">
                  <div className="flex flex-col w-full">
                    <Text weight="bold">A2</Text>
                    <Text variant="muted">Big</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="a3">
                  <div className="flex flex-col w-full">
                    <Text weight="bold">A3</Text>
                    <Text variant="muted">Medium</Text>
                  </div>
                </RadioCards.Item>
              </RadioCards.Root>

              <Label>Margin Color:</Label>
              <RadioCards.Root value={marginColor} onValueChange={setMarginColor} columns={{ initial: "1", sm: "3" }}>
                <RadioCards.Item value="yellow" image={{ src: "/placeholder.svg?height=48&width=48", alt: "Yellow" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Yellow</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="white" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "White" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">White</Text>
                    <Text variant="muted">(coming soon)</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="dark" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "Dark" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Dark</Text>
                    <Text variant="muted">(coming soon)</Text>
                  </div>
                </RadioCards.Item>
              </RadioCards.Root>

              <Label>Paper Style:</Label>
              <RadioCards.Root value={paperStyle} onValueChange={setPaperStyle} columns={{ initial: "1", sm: "3" }}>
                <RadioCards.Item value="lines" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "Lines" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Lines</Text>
                    <Text variant="muted">(coming soon)</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="squares" image={{ src: "/placeholder.svg?height=48&width=48", alt: "Squares" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Squares</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="plain" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "Plain" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Plain</Text>
                    <Text variant="muted">(coming soon)</Text>
                  </div>
                </RadioCards.Item>
                <RadioCards.Item value="cornell" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "Cornell" }}>
                  <div className="flex flex-col w-full">
                    <Text weight="bold">Cornell</Text>
                    <Text variant="muted">(best for study)</Text>
                    <Text variant="muted">(coming soon)</Text>
                  </div>
                </RadioCards.Item>
              </RadioCards.Root>

                <div className="flex items-center space-x-2">
                <Switch
                  id="include-watermark"
                  checked={includeWatermark}
                  onCheckedChange={setIncludeWatermark}
                />
                <Label htmlFor="include-watermark">Add Watermark</Label>
                </div>

            </Card>

            <Card className="flex-2 flex-1-300px">
              <h2 className="text-xl font-bold mb-4">Preview</h2>
              {errorMessage && (
                <p style={{ color: 'red' }}>{errorMessage}</p>
              )}

              {/* On iOS safari, embed with no height is better. But on desktop, we should put the height. */}
              {previewUrl ? (
                <embed
                  title="PDF Preview"
                  src={previewUrl}
                  width="100%"
                  //height="100%"
                  type="application/pdf"
                  style={{ 
                    border: '1px solid #ccc', 
                  }}
                />
              ) : (
                <p>No preview available.</p>
              )}

              <Button onClick={handleDownload} style={{ marginTop: '1rem', fontSize: '1.2rem', width: '100%' }}>
                <span style={{ marginRight: '0.5rem' }}>Download PDF</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-download">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </Button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenInNewTab();
                }}
                className="mt-2 block text-center text-blue-500 hover:underline cursor-pointer"
                >
                or Open in New Tab
              </button>
          </Card>


          </div>
        </>
      )}
    </div>
  );
}

export default App;