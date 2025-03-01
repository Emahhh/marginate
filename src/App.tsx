import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createMergedPdf, getBackgroundPdfUrl } from './utils/pdfUtils';

function App(): JSX.Element {
  const [step, setStep] = useState(1);
  const [foregroundFileBytes, setForegroundFileBytes] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [paperSize, setPaperSize] = useState<string>("a2");
  const [marginColor, setMarginColor] = useState<string>("yellow");
  const [paperStyle, setPaperStyle] = useState<string>("squares");
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);


  // HANDLE UPLOAD
  // This function is triggered when the user selects a PDF file
  const handleBackgroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileBytes = await e.target.files[0].arrayBuffer();
      setForegroundFileBytes(fileBytes);
      setStep(2); // Automatically proceed to the next step
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



  // GENERATE PREVIEW
  useEffect(() => {
    if (step === 2) {
      setErrorMessage("");
      (async () => {
        try {
          const pdfBytes = await createMergedPdf(
            chosenBackgroundUrl,
            null,
            "",
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
  }, [step, chosenBackgroundUrl, "", foregroundFileBytes, includeWatermark]);

  const handleDownload = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        chosenBackgroundUrl,
        null,
        "",
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

  const handleOpenInNewTab = async () => {
    try {
      const pdfBytes = await createMergedPdf(
        chosenBackgroundUrl,
        null,
        "",
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
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 onClick={() => window.location.reload()} className="text-3xl font-bold cursor-pointer">
          Marginate
        </h1>
        <p className="text-lg">Add Space for Your Notes to Any PDF</p>
      </header>



      {/*
        STEP 1: UPLOAD PDF OR ENTER URL
      */}
      {step === 1 && (
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Choose a PDF</h2>
          <p className="text-sm text-gray-500 mb-4">Select a PDF file to add margins to.</p>

          <Input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleBackgroundUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            style={{ color: 'transparent' }}
          />
        </Card>
      )}



      {/*
        STEP 2: PERSONALIZE AND PREVIEW
      */}
      {step === 2 && (
        <>
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="text-sm text-gray-500 mb-4 block">
            ← use another PDF
          </a>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className='text-2xl font-bold mb-4'>Personalize</h2>

              <div className="mb-4">
                <p>Margin Size:</p>
                <RadioCards.Root value={paperSize} onValueChange={setPaperSize} columns={{ initial: "1", sm: "3" }}>
                  <RadioCards.Item value="a1">
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Very big</Text>
                      <Text variant="muted">A1 paper</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="a2">
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Big</Text>
                      <Text variant="muted">A2 paper</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="a3">
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Medium</Text>
                      <Text variant="muted">A3 paper</Text>
                    </div>
                  </RadioCards.Item>
                </RadioCards.Root>
              </div>

              <div className="mb-4">
                <p>Margin Color:</p>
                <RadioCards.Root value={marginColor} onValueChange={setMarginColor} columns={{ initial: "1", sm: "3" }}>
                  <RadioCards.Item value="yellow" image={{ src: "/placeholder.svg?height=48&width=48", alt: "Yellow" }}>
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Yellow</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="white" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "White" }}>
                    <div className="flex flex-col w-full">
                      <Text weight="bold">White</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="dark" disabled image={{ src: "/placeholder.svg?height=48&width=48", alt: "Dark" }}>
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Dark</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                </RadioCards.Root>
              </div>

              <div className="mb-4">
                <p>Paper Style:</p>
                <RadioCards.Root value={paperStyle} onValueChange={setPaperStyle} columns={{ initial: "1", sm: "3" }}>
                  <RadioCards.Item value="lines" disabled >
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Lines</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="squares" >
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Squares</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="plain" disabled >
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Plain</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="cornell" disabled >
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Cornell</Text>
                      <Text variant="muted" size="xs">(best for study)</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                </RadioCards.Root>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="include-watermark"
                  checked={includeWatermark}
                  onCheckedChange={setIncludeWatermark}
                />
                <Label htmlFor="include-watermark">Add Watermark</Label>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className='text-2xl font-bold mb-4'>Preview</h2>
              {errorMessage && (
                <p style={{ color: 'red' }}>{errorMessage}</p>
              )}

              {previewUrl ? (
                <embed
                  title="PDF Preview"
                  src={previewUrl}
                  width="100%"
                  type="application/pdf"
                  style={{ border: '1px solid #ccc' }}
                />
              ) : (
                <p>No preview available.</p>
              )}

              <Button onClick={handleDownload} className="mt-4 w-full">
                <span className="mr-2">Download PDF</span>
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