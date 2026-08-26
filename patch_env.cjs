const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "if (process.env.NODE_ENV !== 'production') {",
  "const isProduction = process.env.NODE_ENV === 'production' || process.env.K_SERVICE !== undefined || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));\n  if (!isProduction) {"
);

fs.writeFileSync('server.ts', code);
