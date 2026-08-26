const fs = require('fs');

// 1. Fix SingleItemIngestModal
let single = fs.readFileSync('src/components/SingleItemIngestModal.tsx', 'utf8');
single = single.replace('{ paddingRatio: 0.1 }', '{ paddingRatio: 0.15 }');
fs.writeFileSync('src/components/SingleItemIngestModal.tsx', single);

// 2. Fix OutfitDeconstructorModal
let deconstruct = fs.readFileSync('src/components/OutfitDeconstructorModal.tsx', 'utf8');
deconstruct = deconstruct.replace(/{ tolerance: 48, paddingRatio: 0.04 }/g, '{ tolerance: 48, paddingRatio: 0.15 }');
deconstruct = deconstruct.replace(/{ tolerance: customTolerance, paddingRatio: 0.04 }/g, '{ tolerance: customTolerance, paddingRatio: 0.15 }');
fs.writeFileSync('src/components/OutfitDeconstructorModal.tsx', deconstruct);

