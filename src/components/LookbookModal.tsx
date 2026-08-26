import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Layers,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Outfit, WardrobeItem, ProfileId } from '../types';
import { PROFILES } from '../data/seedData';
import { soundService } from '../lib/soundHaptics';
import confetti from 'canvas-confetti';

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: Outfit | { name: string; vibe: string; itemIds: string[]; stylingNotes?: string; reasoning?: string };
  allWardrobeItems: WardrobeItem[];
  profileId: ProfileId;
  onWearToday?: () => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({
  isOpen,
  onClose,
  outfit,
  allWardrobeItems,
  profileId,
  onWearToday,
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const profile = PROFILES[profileId];
  const items = (outfit.itemIds || [])
    .map((id) => allWardrobeItems.find((w) => w.id === id))
    .filter(Boolean) as WardrobeItem[];

  // Extract unique colors for palette bar
  const colorPalette = Array.from(
    new Set(items.map((i) => i.color?.hex).filter(Boolean))
  );

  const handleCopyLookDetails = () => {
    soundService.playTap();
    const text = `✨ Daily Threads Édition Luxe — ${profile.name}'s Lookbook
Outfit: ${outfit.name} (${outfit.vibe?.replace('_', ' ') || 'Smart Casual'})

Pieces:
${items.map((it) => `• ${it.name} (${it.category} - ${it.color?.primary || 'neutral'})`).join('\n')}

Styling Notes:
${(outfit as any).reasoning || outfit.stylingNotes || 'Coordinated luxury styling for balanced proportion and modern silhouette.'}
`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleNativeShare = async () => {
    soundService.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${outfit.name} | Daily Threads Lookbook`,
          text: `Check out this curated look for ${profile.name}: ${items.map((i) => i.name).join(', ')}`,
          url: window.location.href,
        });
      } catch {
        handleCopyLookDetails();
      }
    } else {
      handleCopyLookDetails();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-bold text-black text-sm">
              Daily Threads
            </span>
            <span className="text-[9px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-black text-white font-semibold">
              Lookbook Card
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Editorial Card Content */}
        <div className="overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Card Container with Luxury Frame */}
          <div
            ref={cardRef}
            className="bg-[#fafafa] rounded-3xl p-5 border border-zinc-200/80 shadow-xs flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Top Brand & Profile */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
              <div className="flex items-center gap-2.5">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10"
                />
                <div>
                  <h4 className="text-xs font-bold text-black">{profile.name}'s Rotation</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {profileId === 'eesha' ? 'Modest Luxury Aesthetic' : 'Modern Tailored Aesthetic'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-900 text-white font-semibold capitalize tracking-tight">
                {outfit.vibe?.replace('_', ' ') || 'Smart Casual'}
              </span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-serif font-bold text-black tracking-tight leading-snug">
                {outfit.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {(outfit as any).reasoning ||
                  outfit.stylingNotes ||
                  'Harmonious layering with natural fiber drape and crisp silhouettes.'}
              </p>
            </div>

            {/* Garment Grid Visualizer */}
            <div className="grid grid-cols-3 gap-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-2 border border-zinc-100 shadow-2xs flex flex-col items-center justify-between h-32 group"
                >
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-20 max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="w-full text-center mt-1">
                    <p className="text-[10px] font-bold text-black truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 capitalize truncate">
                      {item.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Color Palette Chips */}
            {colorPalette.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-zinc-200/60">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Color Harmony
                </span>
                <div className="flex items-center gap-1.5">
                  {colorPalette.map((hex, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white shadow-xs ring-1 ring-black/10"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {onWearToday && (
              <button
                onClick={() => {
                  soundService.playChime();
                  onWearToday();
                  confetti({ particleCount: 40, spread: 50 });
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-black text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-95 transition-all shadow-md"
              >
                <Calendar className="w-4 h-4" />
                Wear Today & Log
              </button>
            )}

            <button
              onClick={handleNativeShare}
              className="px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={handleCopyLookDetails}
              className="px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
