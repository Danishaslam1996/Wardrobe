const fs = require('fs');
let content = fs.readFileSync('src/components/OutfitDeconstructorModal.tsx', 'utf8');

content = content.replace(
  "import { extractRegionAndRemoveBackground, sanitizeImageDataUrl } from '../lib/backgroundRemover';",
  "import { extractRegionAndRemoveBackground, sanitizeImageDataUrl } from '../lib/backgroundRemover';\nimport { processSelectedFile } from '../lib/imageUtils';"
);

content = content.replace(
  /const handleFile = \(file: File\) => {[\s\S]*?reader\.readAsDataURL\(file\);\n  };/m,
  `const handleFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');
    setIsAnalyzing(true);
    setAnalysisStep('Loading image...');
    try {
      let base64 = await processSelectedFile(file);
      base64 = await sanitizeImageDataUrl(base64);
      setPhotoDataUrl(base64);
      processPhotoWithGemini(base64, 'image/jpeg');
    } catch (err) {
      console.error('Could not load image', err);
      setIsAnalyzing(false);
      setErrorMsg('Failed to process uploaded image.');
    }
  };`
);

fs.writeFileSync('src/components/OutfitDeconstructorModal.tsx', content);
