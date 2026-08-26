const fs = require('fs');
let code = fs.readFileSync('dist/server.cjs', 'utf8');
code = code.replace(/3000/g, '3001');
fs.writeFileSync('dist/server_test.cjs', code);
