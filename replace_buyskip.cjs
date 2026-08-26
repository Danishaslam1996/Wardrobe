const fs = require('fs');
let content = fs.readFileSync('src/components/BuySkipScannerView.tsx', 'utf8');

content = content.replace(
  "import { requestBuySkipScan } from '../lib/geminiClient';",
  "import { requestBuySkipScan } from '../lib/geminiClient';\nimport { processSelectedFile } from '../lib/imageUtils';"
);

content = content.replace(
  /const handleImageSelected = async \(file: File\) => {[\s\S]*?reader\.readAsDataURL\(file\);\n  };/m,
  `const handleImageSelected = async (file: File) => {
    soundService.playCameraShutter();
    setIsAnalyzing(true);
    setActiveResult(null);
    setErrorMsg('');
    try {
      const base64 = await processSelectedFile(file);
      setImagePreview(base64);
      
      const scanResult = await requestBuySkipScan(base64, profileId, profileItems, customApiKey);
      setActiveResult({ ...scanResult, imageUrl: base64, timestamp: Date.now() });
      
      onAddScan({ ...scanResult, imageUrl: base64, timestamp: Date.now() });
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg('Analysis failed. Please try again with a clearer photo.');
      soundService.playError();
    } finally {
      setIsAnalyzing(false);
    }
  };`
);

fs.writeFileSync('src/components/BuySkipScannerView.tsx', content);
