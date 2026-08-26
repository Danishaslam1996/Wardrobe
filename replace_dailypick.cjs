const fs = require('fs');
let content = fs.readFileSync('src/components/DailyPickView.tsx', 'utf8');

content = content.replace(
  "import { useWardrobeStore } from '../store/useWardrobeStore';",
  "import { useWardrobeStore } from '../store/useWardrobeStore';\nimport { processSelectedFile } from '../lib/imageUtils';"
);

content = content.replace(
  /const handleSelfieFile = \(e: React\.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?reader\.readAsDataURL\(file\);\n    }\n  };/m,
  `const handleSelfieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.playCameraShutter();
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processSelectedFile(file);
        setSelfieImagePreview(base64);
      } catch (err) {
        console.error("Selfie load failed", err);
      }
    }
  };`
);

fs.writeFileSync('src/components/DailyPickView.tsx', content);
