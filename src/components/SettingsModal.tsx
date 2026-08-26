import React, { useState } from 'react';
import { X, Sparkles, Key, Check, RotateCcw, ShieldCheck, Heart } from 'lucide-react';
import { ProfileId } from '../types';
import { PROFILES } from '../data/seedData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  onResetData: () => void;
  activeProfileId: ProfileId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSaveApiKey,
  onResetData,
  activeProfileId,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(apiKeyInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black" />
            <h3 className="font-serif italic text-base font-bold text-black">
              Daily Threads Luxe Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bring-Your-Own-Key Gemini AI Configuration */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-700" />
              Google AI Studio Gemini Key (BYOK)
            </label>
          </div>

          <p className="text-[11px] text-zinc-500 leading-normal">
            Your key is used for real-time vision auto-tagging, background removal assistance, and personalized styling logic for Danish & Eesha.
          </p>

          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-black focus:outline-none focus:border-black"
          />

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Key Saved</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save Key Preference</span>
              </>
            )}
          </button>
        </div>

        {/* Active Profile Rules Summary */}
        <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
          <p className="text-xs font-bold text-black capitalize">
            Active Profile: {PROFILES[activeProfileId].name}
          </p>
          <p className="text-[11px] text-zinc-600 leading-normal">
            {PROFILES[activeProfileId].stylingDirectives}
          </p>
        </div>

        {/* Reset / Demo seed data */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Reset wardrobe to original luxury sample collection for Danish & Eesha?')) {
                onResetData();
                onClose();
              }
            }}
            className="text-xs text-zinc-500 hover:text-red-600 font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Wardrobes
          </button>
        </div>
      </div>
    </div>
  );
};
