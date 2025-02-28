import React, { useState, useEffect, ChangeEvent } from 'react';

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
  const chosenBackgroundUrl = React.useMemo( function(){
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
        } catch (err: any) {
          console.error(err);
          setErrorMessage(`Error while generating preview: ${err.message}`);
        }
      })();
    }
  }, [
    step,
    chosenBackgroundUrl,
    null,
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
    <main style={{ margin: '1rem' }}>


      {/*
        Title Section
        Always visible, no matter the step
      */}
      <header>
        <h1>Marginate</h1>
        <p>Add Space for Your Notes to Any PDF</p>
      </header>



      {/*
        STEP 1: UPLOAD PDF OR ENTER URL
      */}
      {step === 1 && (
        <section style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '0.5rem' }}>
          <h2>Upload Your PDF or Enter URL</h2>
          <label>Choose File:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleBackgroundUpload}
          />

          <label>Enter PDF URL:</label>
          <input
            type="text"
            value={backgroundPdfUrl}
            onChange={(e) => setBackgroundPdfUrl(e.target.value)}
            placeholder="https://example.com/yourpdf.pdf"
          />

          <button
            onClick={() => {
              // If the user picked a file or typed a URL, go to step 2
              // Otherwise, fallback to local "generated" background
              setStep(2);
            }}
          >
            Next
          </button>
        </section>
      )}





      {/*
        STEP 2: PERSONALIZATION AND PREVIEW
      */}
      {step === 2 && (
        <>
          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {/*
              Left side: Personalization card
            */}
            <article style={{
              flex: '1 1 300px',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h2>Personalize</h2>

              {/* Choose size */}
              <label style={{ display: 'block', marginTop: '0.5rem' }}>
                <strong>Margin Size:</strong>
              </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPaperSize("a1")}
                  className={paperSize === "a1" ? "secondary" : ""}
                >
                  A1
                </button>
                <button
                  onClick={() => setPaperSize("a2")}
                  className={paperSize === "a2" ? "secondary" : ""}
                >
                  A2
                </button>
                <button
                  onClick={() => setPaperSize("a3")}
                  className={paperSize === "a3" ? "secondary" : ""}
                >
                  A3
                </button>
                </div>




              {/* Choose margin color */}
              <label style={{ display: 'block', marginTop: '1rem' }}>
                <strong>Margin Color:</strong>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setMarginColor("yellow")}
                  className={marginColor === "yellow" ? "secondary" : ""}
                >
                  Yellow
                </button>
                <button
                  onClick={() => setMarginColor("white")}
                  className={marginColor === "white" ? "secondary" : ""}
                  disabled={true}
                >
                  White <small>(coming soon)</small>
                </button>
                <button
                  onClick={() => setMarginColor("dark")}
                  className={marginColor === "dark" ? "secondary" : ""}
                  disabled={true}
                >
                  Dark <small>(coming soon)</small>
                </button>
              </div>
              
              {/* Choose paper style */}
              <label style={{ display: 'block', marginTop: '1rem' }}>
                <strong>Paper Style:</strong>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPaperStyle("lines")}
                  className={paperStyle === "lines" ? "secondary" : ""}
                  disabled={true}
                >
                  Lines <small>(coming soon)</small>
                </button>
                <button
                  onClick={() => setPaperStyle("squares")}
                  className={paperStyle === "squares" ? "secondary" : ""}
                >
                  Squares
                </button>
                <button
                  onClick={() => setPaperStyle("plain")}
                  className={paperStyle === "plain" ? "secondary" : ""}
                  disabled={true}
                >
                  Plain <small>(coming soon)</small>
                </button>
                <button
                  onClick={() => setPaperStyle("cornell")}
                  className={paperStyle === "cornell" ? "secondary" : ""}
                  disabled={true}
                >
                  Cornell (best for study) <small>(coming soon)</small>
                </button>
              </div>




              {/* Watermark toggle */}
                <label style={{ marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={includeWatermark}
                    onChange={() => setIncludeWatermark(!includeWatermark)}
                  />
                  Add Watermark
                </label>


            </article>




            {/*
              PREVIEW CARD ON THE RIGHT
            */}
            <article style={{
              flex: '2 1 300px',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>

              <h2>Preview</h2>
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

              <div style={{ marginTop: '1rem' }}>
                <button onClick={handleDownload} style={{ fontSize: '1.2rem' }}>
                  Download PDF
                </button>
                <button onClick={handleOpenInNewTab} style={{ marginLeft: '1rem' }}>
                  or Open in New Tab
                </button>
              </div>
            </article>




          </section>
        </>
      )}
    </main>
  );
}

export default App;