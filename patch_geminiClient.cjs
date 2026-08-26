const fs = require('fs');
let code = fs.readFileSync('src/lib/geminiClient.ts', 'utf8');

const oldResponse = `export interface DailyPickResponse {
  name: string;
  selectedItemIds: string[];
  vibe: string;
  reasoning: string;
  weatherFitExplanation: string;
  stylingTips: string[];
}`;

const newResponse = `export interface DailyPickResponse {
  outfitName: string;
  vibeSummary: string;
  selectedItemIds: string[];
  stylingAdvice: string;
  missingPieceTip?: string;
}`;

code = code.replace(oldResponse, newResponse);

fs.writeFileSync('src/lib/geminiClient.ts', code);
