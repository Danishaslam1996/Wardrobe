const fs = require('fs');

let content = fs.readFileSync('src/lib/backgroundRemover.ts', 'utf8');

// We need to scale the crop Canvas
const newLogic = `
  const maxDim = 1200;
  let finalCropW = cropW;
  let finalCropH = cropH;

  if (finalCropW > maxDim || finalCropH > maxDim) {
    if (finalCropW > finalCropH) {
      finalCropH = Math.round((finalCropH * maxDim) / finalCropW);
      finalCropW = maxDim;
    } else {
      finalCropW = Math.round((finalCropW * maxDim) / finalCropH);
      finalCropH = maxDim;
    }
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = finalCropW;
  cropCanvas.height = finalCropH;
  const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
  if (!cropCtx) throw new Error('Canvas 2D context unavailable');

  // Apply visual enhancements (auto-contrast, brightness, saturation fix)
  cropCtx.filter = 'contrast(1.05) saturate(1.1) brightness(1.02)';
  cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, finalCropW, finalCropH);
  cropCtx.filter = 'none';
`;

content = content.replace(
  /const cropCanvas = document\.createElement\('canvas'\);[\s\S]*?cropCtx\.filter = 'none';/m,
  newLogic
);

fs.writeFileSync('src/lib/backgroundRemover.ts', content);
