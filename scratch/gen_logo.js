const Jimp = require('jimp');
const path = require('path');

async function generateLogo() {
  const width = 320;
  const height = 96;

  const logo = new Jimp(width, height);
  
  // Left half (Red)
  const red = Jimp.rgbaToInt(237, 28, 36, 255);
  for(let y = 0; y < height; y++) {
    for(let x = 0; x < width / 2; x++) {
      logo.setPixelColor(red, x, y);
    }
  }

  // Right half (Blue)
  const blue = Jimp.rgbaToInt(0, 75, 135, 255);
  for(let y = 0; y < height; y++) {
    for(let x = width / 2; x < width; x++) {
      logo.setPixelColor(blue, x, y);
    }
  }

  // Load font
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  
  logo.print(font, 0, 16, { text: "QR", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, width / 2);
  logo.print(font, width / 2, 16, { text: "IS", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, width / 2);

  await logo.writeAsync(path.join(__dirname, '../assets/qris_logo.png'));
  console.log('Logo generated successfully!');
}

generateLogo();
