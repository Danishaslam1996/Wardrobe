import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  RotateCw,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  WardrobeItem,
  BuySkipScanResult,
  ProfileId,
  ClothingCategory,
} from '../types';
import { requestBuySkipAnalysis, BuySkipResponse } from '../lib/geminiClient';
import { processSelectedFile } from '../lib/imageUtils';
import { soundService } from '../lib/soundHaptics';
import confetti from 'canvas-confetti';

interface BuySkipScannerViewProps {
  profileId: ProfileId;
  wardrobe: WardrobeItem[];
  recentScans: BuySkipScanResult[];
  customApiKey?: string;
  onSaveScanResult: (scan: Omit<BuySkipScanResult, 'id' | 'profileId' | 'scannedAt'>) => void;
  onAddPurchasedItem: (itemData: Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>) => void;
}

export const BuySkipScannerView: React.FC<BuySkipScannerViewProps> = ({
  profileId,
  wardrobe,
  recentScans,
  customApiKey,
  onSaveScanResult,
  onAddPurchasedItem,
}) => {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeResult, setActiveResult] = useState<BuySkipResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = async (file: File) => {
    soundService.playCameraShutter();
    setIsAnalyzing(true);
    setActiveResult(null);
    setErrorMsg('');
    try {
      const base64 = await processSelectedFile(file);
      setImagePreview(base64);
      
      const res = await requestBuySkipAnalysis({ imageBase64: base64, profileId, currentWardrobe: wardrobe }, customApiKey);
      setActiveResult(res);
      
      onSaveScanResult({
        candidateImageUrl: base64,
        analysis: res,
      });
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg('Analysis failed. Please try again with a clearer photo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAddToWardrobe = () => {
    if (!activeResult || !imagePreview) return;
    soundService.playChime();
    onAddPurchasedItem({
      name: activeResult.detectedItem.name || 'New In-Store Purchase',
      category: (activeResult.detectedItem.category as ClothingCategory) || 'tops',
      color: {
        primary: activeResult.detectedItem.color || 'Neutral',
        hex: '#333333',
      },
      material: [activeResult.detectedItem.material || 'Wool Blend'],
      vibe: ['smart_casual'],
      season: ['all_year'],
      imageUrl: imagePreview,
      originalImageUrl: imagePreview,
      isLaundry: false,
      purchasePrice: 0,
      tags: ['in-store-scan', 'bought'],
    });

    confetti({ particleCount: 40 });
    setActiveResult(null);
    setImagePreview('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa] relative select-none">
      {/* Header Banner */}
      <div className="p-4 bg-white border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight text-black flex items-center gap-2">
            <span>Buy / Skip In-Store Scanner</span>
          </h1>
          <p className="text-[11px] text-zinc-500">
            Realtime AI redundancy check & 3 capsule styling formulas
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
        {/* Scanner Viewport / Upload Target */}
        {!imagePreview ? (
          <div className="space-y-3">
            <div
              onClick={() => {
                soundService.playTap();
                cameraInputRef.current?.click();
              }}
              className="w-full h-64 rounded-3xl border-2 border-dashed border-zinc-300 hover:border-black bg-zinc-50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.99] p-6 text-center shadow-xs"
            >
              <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Snap In-Store Garment Tag or Item</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Gemini checks for closet duplicates and tells you if you should buy or skip
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  soundService.playTap();
                  cameraInputRef.current?.click();
                }}
                className="flex-1 py-3 rounded-2xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                Live Camera Scan
              </button>
              <button
                onClick={() => {
                  soundService.playTap();
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4" />
                Choose Photo
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageSelected(e.target.files[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageSelected(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview Card */}
            <div className="relative w-full h-56 rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img src={imagePreview} alt="Candidate Item" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  soundService.playTap();
                  setImagePreview('');
                  setActiveResult(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-zinc-800 hover:text-black"
                title="Scan another item"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Loading Indicator */}
            {isAnalyzing && (
              <div className="p-4 bg-zinc-900 text-white rounded-3xl flex items-center gap-3 animate-pulse shadow-lg">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <div className="text-xs font-medium">
                  Auditing {profileId === 'eesha' ? "Eesha's" : "Danish's"} closet for redundancies...
                </div>
              </div>
            )}

            {/* Buy / Skip Verdict Result Card */}
            {activeResult && (
              <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Verdict Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      activeResult.verdict === 'BUY'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-red-500 text-white shadow-sm'
                    }`}
                  >
                    {activeResult.verdict === 'BUY' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>
                      Verdict: {activeResult.verdict} ({activeResult.confidenceScore}% Confidence)
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono">In-Store AI Audit</span>
                </div>

                <div>
                  <h2 className="text-lg font-serif font-bold text-black">
                    {activeResult.headline}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {activeResult.detectedItem.name} &bull; {activeResult.detectedItem.color} &bull;{' '}
                    {activeResult.detectedItem.material}
                  </p>
                </div>

                {/* Redundancy Justification */}
                <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-700 leading-relaxed">
                  <strong className="text-black font-semibold">Redundancy Analysis: </strong>
                  {activeResult.redundancyAnalysis.explanation}
                </div>

                {/* 3 Capsule Styling Ways with Owned Pieces */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    3 Ways to Style with Your Owned Clothes
                  </h3>

                  <div className="space-y-2">
                    {activeResult.styleCombinations.map((combo, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2"
                      >
                        <p className="text-xs font-bold text-black">{combo.title}</p>
                        <p className="text-[11px] text-zinc-600 leading-normal">
                          {combo.stylingTip}
                        </p>

                        {/* Owned Items Thumbnails */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                          {combo.ownedItemIds.map((itemId) => {
                            const owned = wardrobe.find((w) => w.id === itemId);
                            if (!owned) return null;
                            return (
                              <div
                                key={owned.id}
                                className="w-12 h-12 bg-white rounded-xl p-1 border border-zinc-200 flex items-center justify-center shrink-0"
                                title={owned.name}
                              >
                                <img
                                  src={owned.imageUrl}
                                  alt={owned.name}
                                  className="max-h-10 max-w-full object-contain"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add to Closet Button */}
                <button
                  onClick={handleQuickAddToWardrobe}
                  className="w-full py-3 rounded-2xl bg-black text-white hover:bg-zinc-900 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Bought It! Add to {profileId === 'eesha' ? "Eesha's" : "Danish's"} Closet</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
