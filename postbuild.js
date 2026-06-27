import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('Error: dist/index.html not found!');
  process.exit(1);
}

let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Find asset files in dist/assets
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  
  const cssFile = files.find(f => f.endsWith('.css'));
  const jsFile = files.find(f => f.endsWith('.js'));

  if (cssFile) {
    const cssPath = path.join(assetsDir, cssFile);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Inline CSS using index slicing (immune to regex/replace/dollar-sign bugs)
    const cssStartMarker = '<link rel="stylesheet" crossorigin href="./assets/';
    const cssEndMarker = '">';
    
    const cssStartIdx = htmlContent.indexOf(cssStartMarker);
    if (cssStartIdx !== -1) {
      const cssEndIdx = htmlContent.indexOf(cssEndMarker, cssStartIdx);
      if (cssEndIdx !== -1) {
        const fullCssEndIdx = cssEndIdx + cssEndMarker.length;
        htmlContent = htmlContent.substring(0, cssStartIdx) + 
                      `<style>${cssContent}</style>` + 
                      htmlContent.substring(fullCssEndIdx);
        console.log(`Inlined CSS file: ${cssFile}`);
      }
    }
  }

  if (jsFile) {
    const jsPath = path.join(assetsDir, jsFile);
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Escape </script> inside JS strings to prevent browser terminating inline script tags early
    jsContent = jsContent.split('</script>').join('<\\/script>');
    
    // Inline JS using index slicing (immune to regex/replace/dollar-sign bugs)
    const jsStartMarker = '<script type="module" crossorigin src="./assets/';
    const jsEndMarker = '</script>';
    
    const jsStartIdx = htmlContent.indexOf(jsStartMarker);
    if (jsStartIdx !== -1) {
      const jsEndIdx = htmlContent.indexOf(jsEndMarker, jsStartIdx);
      if (jsEndIdx !== -1) {
        const fullJsEndIdx = jsEndIdx + jsEndMarker.length;
        htmlContent = htmlContent.substring(0, jsStartIdx) + 
                      `<script type="module">${jsContent}</script>` + 
                      htmlContent.substring(fullJsEndIdx);
        console.log(`Inlined JS file: ${jsFile}`);
      }
    }
  }

  // Write back to dist/index.html
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Successfully generated single-file build in dist/index.html!');

  // Clean up assets directory for clean single-file delivery
  try {
    fs.rmSync(assetsDir, { recursive: true, force: true });
    console.log('Cleaned up assets/ folder.');
  } catch (err) {
    console.warn('Warning: Could not remove assets folder:', err.message);
  }
} else {
  console.log('Assets directory not found. Already inlined?');
}
