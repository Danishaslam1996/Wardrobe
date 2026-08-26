const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Reduce pre-processing dimension
content = content.replace(
  /.resize\(1024, 1024, {/g,
  ".resize(800, 800, {"
);

// Reduce output JPEG quality
content = content.replace(
  /\.jpeg\({ quality: 90 }\)/g,
  ".jpeg({ quality: 70 })"
);

// Fix the hardcoded PNG mime type in the response
content = content.replace(
  /imageUrl: \`data:image\/png;base64,\$\{flattenedBuffer\.toString\('base64'\)\}\`/g,
  "imageUrl: \`data:image/jpeg;base64,\${flattenedBuffer.toString('base64')}\`"
);

content = content.replace(
  /images: \[\`data:image\/png;base64,\$\{flattenedBuffer\.toString\('base64'\)\}\`\]/g,
  "images: [\`data:image/jpeg;base64,\${flattenedBuffer.toString('base64')}\`]"
);

fs.writeFileSync('server.ts', content);
