const fs = require('fs');

let code = fs.readFileSync('src/components/AIOutfitWizard.tsx', 'utf8');

const oldButtonSection = `<button 
          onClick={handleGenerate}
          className="w-full bg-black text-white p-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-900 active:scale-95 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          CURATE ENSEMBLE
        </button>`;

const newButtonSection = `<button 
          onClick={handleGenerate}
          disabled={step === 'generating'}
          className="w-full bg-black text-white p-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-900 active:scale-95 transition-all disabled:opacity-80 disabled:scale-100"
        >
          {step === 'generating' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {step === 'generating' ? 'CURATING...' : 'CURATE ENSEMBLE'}
        </button>`;

code = code.replace(oldButtonSection, newButtonSection);
code = code.replace(`{step === 'context' && renderContextStep()}`, `{step !== 'results' && renderContextStep()}`);
code = code.replace(`{step === 'generating' && renderGenerating()}`, ``); // Remove old loading screen

fs.writeFileSync('src/components/AIOutfitWizard.tsx', code);
