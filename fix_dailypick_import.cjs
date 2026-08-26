const fs = require('fs');
let content = fs.readFileSync('src/components/DailyPickView.tsx', 'utf8');
if (!content.includes('import { processSelectedFile }')) {
  content = "import { processSelectedFile } from '../lib/imageUtils';\n" + content;
}
fs.writeFileSync('src/components/DailyPickView.tsx', content);
