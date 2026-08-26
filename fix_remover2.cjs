const fs = require('fs');

let content = fs.readFileSync('src/lib/backgroundRemover.ts', 'utf8');

content = content.replace(/cropCtx\.clearRect\(0, 0, cropW, cropH\);/g, 'cropCtx.clearRect(0, 0, finalCropW, finalCropH);');
content = content.replace(/cropCtx\.drawImage\(cutoutImg, 0, 0, cropW, cropH\);/g, 'cropCtx.drawImage(cutoutImg, 0, 0, finalCropW, finalCropH);');
content = content.replace(/getOpaqueBoundingBox\(cropCtx, cropW, cropH\);/g, 'getOpaqueBoundingBox(cropCtx, finalCropW, finalCropH);');
content = content.replace(/Math\.min\(cropW - trimX,/g, 'Math.min(finalCropW - trimX,');
content = content.replace(/Math\.min\(cropH - trimY,/g, 'Math.min(finalCropH - trimY,');

fs.writeFileSync('src/lib/backgroundRemover.ts', content);
