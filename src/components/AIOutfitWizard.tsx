import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Plus, Check, Loader2, X, Shirt, ArrowRight, Bookmark } from 'lucide-react';
import { ProfileId, WardrobeItem, Outfit } from '../types';
import { requestDailyPick, DailyPickResponse } from '../lib/geminiClient';
import { soundService } from '../lib/soundHaptics';

interface AIOutfitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: ProfileId;
  wardrobe: WardrobeItem[];
  customApiKey?: string;
  onSaveOutfit: (outfit: Omit<Outfit, 'id' | 'profileId' | 'createdAt' | 'wearCount'>) => void;
}

type Step = 'context' | 'generating' | 'results';

const WHO_MEETING_OPTIONS = ['Solo', 'Partner / Date Night', 'Friends', 'Business / Professional', 'Family Gathering'];
const VIBE_OPTIONS = ['Sharp Tailoring', 'Modest Luxury', 'Smart Casual', 'Old Money Minimalist', 'Evening Elegance', 'Effortless Weekend', 'Artistic / Creative'];
const OCCASION_PRESETS = ['Fine Dining', 'Casual Cafe', 'Boardroom / Office', 'Evening Event', 'Outdoor / Travel'];

export const AIOutfitWizard: React.FC<AIOutfitWizardProps> = ({
  isOpen,
  onClose,
  profileId,
  wardrobe,
  customApiKey,
  onSaveOutfit,
}) => {
  const [step, setStep] = useState<Step>('context');
  
  // Form State
  const [whoMeeting, setWhoMeeting] = useState<string>('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Results State
  const [result, setResult] = useState<DailyPickResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const toggleVibe = (vibe: string) => {
    soundService.playTap();
    setSelectedVibes(prev => 
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const handleGenerate = async () => {
    soundService.playTap();
    setStep('generating');
    setErrorMsg('');
    
    try {
      const response = await requestDailyPick({
        profileId,
        availableItems: wardrobe.filter(w => !w.isLaundry),
        weather: { tempC: 22, condition: 'Clear' }, // Assuming static for now or pass actual weather
        context: {
          whoMeeting,
          vibes: selectedVibes,
          occasion,
          notes
        }
      }, customApiKey);
      
      setResult(response);
      setStep('results');
      soundService.playSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed.');
      setStep('context');
    }
  };

  const handleSave = () => {
    if (!result) return;
    soundService.playTap();
    onSaveOutfit({
      name: result.outfitName,
      vibe: result.vibeSummary,
      itemIds: result.selectedItemIds,
      isFavorite: false,
    });
    onClose();
  };

  const renderContextStep = () => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24 space-y-8 px-1">
        
        {/* Who Are You Meeting? */}
        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Who Are You Meeting?</h3>
          <div className="flex flex-wrap gap-2">
            {WHO_MEETING_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { soundService.playTap(); setWhoMeeting(opt); }}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                  whoMeeting === opt 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 active:bg-zinc-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Desired Vibe */}
        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Desired Vibe</h3>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map(vibe => {
              const isSelected = selectedVibes.includes(vibe);
              return (
                <button
                  key={vibe}
                  onClick={() => toggleVibe(vibe)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    isSelected 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 active:bg-zinc-50'
                  }`}
                >
                  {vibe}
                </button>
              );
            })}
          </div>
        </section>

        {/* Occasion & Setting */}
        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Occasion & Setting</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {OCCASION_PRESETS.map(opt => (
              <button
                key={opt}
                onClick={() => { soundService.playTap(); setOccasion(opt); }}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                  occasion === opt 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 active:bg-zinc-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any specific styling instructions or weather notes? (e.g., 'It's raining outside, need a jacket')"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none h-24 shadow-sm"
          />
        </section>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pt-12">
        <button 
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
        </button>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full pb-20 space-y-8">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-zinc-200 border-t-black rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-black animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-black font-serif">Curating Your Look</h3>
        <p className="text-sm text-zinc-500 animate-pulse">Consulting your personal stylist...</p>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;
    
    const selectedItems = result.selectedItemIds
      .map(id => wardrobe.find(w => w.id === id))
      .filter(Boolean) as WardrobeItem[];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 h-full overflow-y-auto pb-24">
        
        {/* Editorial Header */}
        <div className="text-center mb-8 px-4">
          <h2 className="text-3xl font-bold text-black font-serif tracking-tight leading-tight mb-3">
            {result.outfitName}
          </h2>
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-zinc-100 rounded-full">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{result.vibeSummary}</span>
          </div>
        </div>

        {/* Selected Pieces Grid */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100 mb-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 text-center">The Pieces</h3>
          {selectedItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center group">
                  <div className="w-full aspect-square bg-zinc-50 rounded-2xl p-4 flex items-center justify-center mb-3 relative overflow-hidden transition-colors group-hover:bg-zinc-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs font-bold text-center text-zinc-800 line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{item.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 text-sm">No specific items found.</div>
          )}
        </div>

        {/* Styling Advice */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-6 shadow-xl mb-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Styling Notes</h3>
          <p className="text-sm leading-relaxed text-zinc-200">
            {result.stylingAdvice}
          </p>
          {result.missingPieceTip && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Missing Piece Tip
              </p>
              <p className="text-sm text-zinc-300 mt-1">{result.missingPieceTip}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
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
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-zinc-50 h-[90vh] sm:h-[85vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10">
          <button 
            onClick={() => {
              soundService.playTap();
              if (step === 'results' || step === 'generating') {
                setStep('context');
              } else {
                onClose();
              }
            }}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-zinc-100 hover:bg-zinc-50 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <h2 className="text-lg font-bold font-serif tracking-wide">
            {step === 'context' ? 'Style Wizard' : step === 'generating' ? 'Curating' : 'Your Look'}
          </h2>
          <button 
            onClick={() => { soundService.playTap(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-zinc-100 hover:bg-zinc-50 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative px-6">
          {step === 'context' && renderContextStep()}
          {step === 'generating' && renderGenerating()}
          {step === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
};
