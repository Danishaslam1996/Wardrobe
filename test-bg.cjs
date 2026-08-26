const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
async function run() {
  try {
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).jpeg().toBuffer();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    await removeBackground(blob);
    console.log('Success!');
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
