const fs = require('fs');
let content = fs.readFileSync('src/components/SingleItemIngestModal.tsx', 'utf8');

content = content.replace(
  /console\.error\("Analysis failed for item", err\);\n            return {/m,
  `console.error("Analysis failed for item", err);
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
               alert("Network error: Could not reach the AI server. If you are using an ad-blocker, please disable it for this site and try again, or check your internet connection.");
            }
            return {`
);

fs.writeFileSync('src/components/SingleItemIngestModal.tsx', content);
