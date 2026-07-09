const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function render() {
  try {
    const svgPath = path.join(__dirname, '../assets/qris_logo.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Create HTML file that wraps the SVG and fills the screen
    const htmlContent = `
<!DOCTYPE html>
<html style="margin: 0; padding: 0; overflow: hidden; background: transparent;">
<head>
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }
  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
  ${svgContent}
</body>
</html>
    `;

    const tempHtmlPath = path.join(__dirname, 'temp_render.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);

    const tempPngPath = path.join(__dirname, 'temp_render.png');

    console.log('Rendering via Headless Chrome...');
    
    // Command to launch chrome and take a screenshot
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    // We use aspect ratio of the viewBox: 45.938003 / 17.413 = 2.638138.
    // 528 x 200 is 2.64.
    const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --screenshot="${tempPngPath}" --window-size=528,200 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
    
    execSync(cmd);
    
    // Wait up to 5 seconds for file to be written (since Chrome runs asynchronously sometimes, though execSync might wait for it)
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(tempPngPath)) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (fs.existsSync(tempPngPath)) {
      console.log('Successfully rendered PNG!');
      // Copy to assets/qris_logo.png
      const destPath = path.join(__dirname, '../assets/qris_logo.png');
      fs.copyFileSync(tempPngPath, destPath);
      console.log(`Copied PNG to ${destPath}`);
      
      // Cleanup temp files
      fs.unlinkSync(tempHtmlPath);
      fs.unlinkSync(tempPngPath);
      console.log('Cleaned up temp files.');
    } else {
      console.error('Failed to generate PNG screenshot.');
    }
  } catch (err) {
    console.error('Error during rendering:', err);
  }
}

render();
