const fs = require('fs');

let code = fs.readFileSync('src/components/AIOutfitWizard.tsx', 'utf8');

const oldButtons = `<div className="flex flex-col gap-3">
          <button 
            onClick={handleSave}
            className="w-full bg-black text-white p-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <Bookmark className="w-5 h-5" />
            Send to Dressing Room
          </button>
          <button 
            onClick={() => {
              setStep('context');
              setResult(null);
            }}
            className="w-full bg-white text-black p-4 rounded-full font-bold border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            Try Another Prompt
          </button>
        </div>`;

const newButtons = `<div className="flex flex-col gap-3">
          <button 
            onClick={() => {
               soundService.playSuccess();
               handleSave(); // In a real app this might also set it as today's outfit
            }}
            className="w-full bg-black text-white p-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Wear Today
          </button>
          <button 
            onClick={handleSave}
            className="w-full bg-white text-black p-4 rounded-full font-bold border border-zinc-200 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
          >
            <Bookmark className="w-5 h-5" />
            Send to Dressing Room
          </button>
        </div>`;

code = code.replace(oldButtons, newButtons);
fs.writeFileSync('src/components/AIOutfitWizard.tsx', code);
