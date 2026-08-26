const fs = require('fs');
let content = fs.readFileSync('src/components/BuySkipScannerView.tsx', 'utf8');

if (!content.includes("import { processSelectedFile }")) {
  content = content.replace(
    "import { requestBuySkipAnalysis, BuySkipResponse } from '../lib/geminiClient';",
    "import { requestBuySkipAnalysis, BuySkipResponse } from '../lib/geminiClient';\nimport { processSelectedFile } from '../lib/imageUtils';"
  );
}

content = content.replace(
  "const res = await requestBuySkipAnalysis(base64, profileId, wardrobe, customApiKey);",
  "const res = await requestBuySkipAnalysis({ imageBase64: base64, profileId, currentWardrobe: wardrobe }, customApiKey);"
);

fs.writeFileSync('src/components/BuySkipScannerView.tsx', content);
