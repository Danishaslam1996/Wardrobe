const fs = require('fs');
let content = fs.readFileSync('src/components/BuySkipScannerView.tsx', 'utf8');

// Ensure import for processSelectedFile is there
if (!content.includes('processSelectedFile')) {
  content = content.replace(
    "import { requestBuySkipAnalysis, BuySkipResponse } from '../lib/geminiClient';",
    "import { requestBuySkipAnalysis, BuySkipResponse } from '../lib/geminiClient';\nimport { processSelectedFile } from '../lib/imageUtils';"
  );
}

// Replace the bad handleImageSelected function
const badFunc = `  const handleImageSelected = async (file: File) => {
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
  };`;

const goodFunc = `  const handleImageSelected = async (file: File) => {
    soundService.playCameraShutter();
    setIsAnalyzing(true);
    setActiveResult(null);
    setErrorMsg('');
    try {
      const base64 = await processSelectedFile(file);
      setImagePreview(base64);
      
      const res = await requestBuySkipAnalysis(base64, profileId, wardrobe, customApiKey);
      setActiveResult(res);
      
      onSaveScanResult({
        candidateImageUrl: base64,
        analysis: res,
      });
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg('Analysis failed. Please try again with a clearer photo.');
    } finally {
      setIsAnalyzing(false);
    }
  };`;

content = content.replace(badFunc, goodFunc);

fs.writeFileSync('src/components/BuySkipScannerView.tsx', content);
