# marginate

What is Marginate?
Marginate is a web app that allows you to add margins to your PDFs. This is useful when you want to take notes on a PDF, for example during a lecture or a meeting over some powerpoint slides. The margins give you space to write down your thoughts, questions, or ideas. You can customize the size and color of the margins to suit your preferences. Marginate is easy to use and works in the browser, but is particularly designed for iPads.

How to try it:
- run 'npm run dev' to start the development server
- or go to https://emahhh.github.io/marginate/ (auto-deployed from the "docs" folder in the main branch, which is the build folder - remember to run 'npm run build' before pushing changes)

# Appunti per lo sviluppo
- Documentazione di pdf-lib https://pdf-lib.js.org

# Features possibili TODO:

Implementare share button per condividere da menù di iOS in questo modo:
- la React app, alla sua apertura e ad intervalli regolari, controlla se esiste ad un certo path un file pdf con nome specifico (es. "sharedPdfByOs.pdf")
  - Oppure: la React app controlla se nell'URL ci sono parametri che indicano un file da scaricare (non so se fattibile)
- Dopo essere stato usato, il file può essere cancellato (come sapere se è stato usato? Con Native bridge? Oppure anche se è più vecchio di 5 minuti?)
- La React app ora usa il file esattamente come se fosse stato caricato

- sfondo bianco per pdf bianchi
- ruota sfondo in verticale
- se height o width del foreground è maggiore di quella del background, allora il background viene ridimensionato per adattarsi

# Marketing
"i want a tagline that is catchy and explains in short what the app does, which is adding margins to your pdfs like slides, so that yo can take notes easily. generate many taglines and choose the best one"
Here are some tagline suggestions that highlight the app's functionality of adding margins for note-taking:

"Add Margins, Take Notes"
"Perfect Margins for Your Notes"
"Transform PDFs for Note-Taking"
"Create Note-Friendly PDFs"
"PDFs with Margins for Notes"
"Enhance PDFs for Better Notes"
"Note-Taking Made Easy with Margins"
"Add Space, Take Notes"
"PDFs with Room for Your Thoughts"
"Optimize PDFs for Note-Taking"