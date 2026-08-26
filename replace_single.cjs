const fs = require('fs');
let content = fs.readFileSync('src/components/SingleItemIngestModal.tsx', 'utf8');

content = content.replace(
  "import { requestAnalyzeItem } from '../lib/geminiClient';",
  "import { requestAnalyzeItem } from '../lib/geminiClient';\nimport { processSelectedFile } from '../lib/imageUtils';"
);

content = content.replace(
  /const handleImageSelect = \(e: React\.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?reader\.readAsDataURL\(file\);\n    }\n  };/m,
  `const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      soundService.playTap();
      setIsProcessing(true); // Optional: show loading state while converting HEIC
      try {
        const base64 = await processSelectedFile(file);
        setImage(base64);
        setRotation(0);
      } catch (err) {
        console.error("Failed to load image", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };`
);

fs.writeFileSync('src/components/SingleItemIngestModal.tsx', content);
