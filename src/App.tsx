import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LineMdFilePlus } from "@/components/icons/LineMdFilePlus";

import { createMergedPdf, getBackgroundPdfUrl } from '@/utils/pdfUtils';



// tipo per aggiungere la funzione handleSharedPDF al window
declare global {
  interface Window {
    handleSharedPDF: (fileURL: string) => void;
  }
}

// questa funzione viene chiamata direttamente da Swift quando viene condiviso un file PDF
// mando una notifica alla React app quando viene condiviso un file PDF
window.handleSharedPDF = (fileURL) => {
  window.dispatchEvent(new CustomEvent('sharedPDF', { detail: fileURL }));
};



function App(): JSX.Element {
  const [step, setStep] = useState(1);
  const [foregroundFileBytes, setForegroundFileBytes] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [paperSize, setPaperSize] = useState<string>("a2");
  const [marginColor, setMarginColor] = useState<string>("yellow");
  const [paperStyle, setPaperStyle] = useState<string>("squares");
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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


  // listener per l'evento 'sharedPDF'
  useEffect(() => {

    // funzione che gestisce l'evento 'sharedPDF'
    const onSharedPDF = async (e : any) => {
      const fileURL = e.detail; // fileURL ricevuto dal native bridge
      console.info("onSharedPDF: Received shared PDF file URL:", fileURL);
      try {
        // Fetch del file PDF tramite il file URL
        const response = await fetch(fileURL);
        const arrayBuffer = await response.arrayBuffer();
        
        // Simula l'upload: imposta lo stato come se l'utente avesse caricato il PDF
        setForegroundFileBytes(arrayBuffer);
        setStep(2); // Passa allo step successivo per la personalizzazione/preview
      } catch (error) {
        console.error("Errore durante la gestione del PDF condiviso:", error);
      }
    };

    // Aggiungi listener per il custom event: chiama la funzione onSharedPDF quando viene ricevuto un evento 'sharedPDF'
    window.addEventListener('sharedPDF', onSharedPDF);
    
    // Rimuovi listener al cleanup del componente
    return () => window.removeEventListener('sharedPDF', onSharedPDF);
  }, []);




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
      console.info('Downloading PDF with URL:' + link.href + ' and filename:' + link.download);
      link.click();
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the PDF. Check console for details.");
    }
  };

/*   const handleOpenInCurrentTab = async () => {
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
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the PDF. Check console for details.");
    }
  }; */









  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 onClick={() => window.location.reload()} className="text-3xl font-bold cursor-pointer">
          Marginate
        </h1>
        <p className="text-lg uppercase">Add space for your notes to any PDF</p>
      </header>



      {/*
        STEP 1: UPLOAD PDF OR ENTER URL
      */}
      {step === 1 && (
        <Card 
          className={`p-8 max-w-lg mx-auto mt-40 border border-gray-200 shadow-lg rounded-lg ${isDragging ? 'border-blue-500 bg-blue-50' : ''}`}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type === "application/pdf") {
              const fileBytes = await file.arrayBuffer();
              setForegroundFileBytes(fileBytes);
              setStep(2);
            } else if (file && file.type !== "application/pdf") {
              console.error("Invalid file type. Please upload a PDF file.");
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div>
            <h2 className="text-2xl font-bold text-center">Choose a PDF to start</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">Select a PDF file to add margins to.</p>
          </div>
        
          <div className='mx-auto'>
            <label htmlFor="pdf-upload" className="bg-primary text-white shadow-md hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-all h-12 px-6 mb-2 w-full cursor-pointer max-w-xs mx-auto">
              <LineMdFilePlus className="mr-2 size-5" />
              Choose File
            </label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-600 text-center">Or drag and drop the file here.</p>
          </div>
        </Card>
      )}
      
      {/*
        STEP 2: PERSONALIZE AND PREVIEW
      */}
      {step === 2 && (
        <>

          <button onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="text-sm text-secondary-foreground block px-2 pb-1">
            ← use another PDF
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className='text-2xl font-bold mb-4'>Personalize</h2>

              <div className="mb-4">
                <p className='personalize-option-title'>Margin Size:</p>
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
                <p className='personalize-option-title'>Margin Color:</p>
                <RadioCards.Root value={marginColor} onValueChange={setMarginColor} columns={{ initial: "1", sm: "3" }}>
                  <RadioCards.Item value="yellow"> {/* TODO: mettere immagini con image={{ src: "/placeholder.svg?height=48&width=48", alt: "Yellow" } */}
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Yellow</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="white" disabled>
                    <div className="flex flex-col w-full">
                      <Text weight="bold">White</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                  <RadioCards.Item value="dark" disabled>
                    <div className="flex flex-col w-full">
                      <Text weight="bold">Dark</Text>
                      <Text variant="muted" size="xs">(coming soon)</Text>
                    </div>
                  </RadioCards.Item>
                </RadioCards.Root>
              </div>

              <div className="mb-4">
              <p className='personalize-option-title'>Paper Style:</p>
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




            {/* RIGHT CARD WITH PREVIEW */}
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

              <Button onClick={handleDownload} className="mt-2 w-full text-lg shadow-lg cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h7.175q.4 0 .763.15t.637.425l4.85 4.85q.275.275.425.638t.15.762V13q0 .425-.288.713T19 14t-.712-.288T18 13V9h-4q-.425 0-.712-.288T13 8V4H6v16h8q.425 0 .713.288T15 21t-.288.713T14 22zm13-2.575v1.225q0 .425-.288.713T18 21.65t-.712-.287T17 20.65V17q0-.425.288-.712T18 16h3.65q.425 0 .713.288t.287.712t-.287.713t-.713.287H20.4l2.25 2.25q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3zM6 20V4z"/></svg>
                <span className="mr-2">Open PDF</span>
                {/* TODO:  explain che devono fare share per salvare */  }
              </Button>

{/*               <button
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenInCurrentTab();
                }}
                className="mt-2 block text-center text-blue-500 hover:underline cursor-pointer"
              >
                or Open in current tab
              </button>
            */}

            </Card> 




          </div>
        </>
      )}
    </div>
  );

  
}

// Cerca questa stringa su Google per trovare se il codice è stato copiato etc.
const plagiarismString = "626795d7588740f3a1056fbdecc7b62a";
console.info(plagiarismString);

export default App;