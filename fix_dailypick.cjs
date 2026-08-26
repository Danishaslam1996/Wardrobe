const fs = require('fs');
let content = fs.readFileSync('src/components/DailyPickView.tsx', 'utf8');

if (!content.includes("import { processSelectedFile }")) {
  content = content.replace(
    "import { useWardrobeStore } from '../store/useWardrobeStore';",
    "import { useWardrobeStore } from '../store/useWardrobeStore';\nimport { processSelectedFile } from '../lib/imageUtils';"
  );
}

fs.writeFileSync('src/components/DailyPickView.tsx', content);
