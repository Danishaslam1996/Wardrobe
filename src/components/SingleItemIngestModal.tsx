import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Sparkles, RotateCw } from 'lucide-react';
import { WardrobeItem, ProfileId, ClothingCategory } from '../types';
import { removeImageBackground } from '../lib/backgroundRemover';
import { requestAnalyzeItem } from '../lib/geminiClient';
import { processSelectedFile } from '../lib/imageUtils';
import { soundService } from '../lib/soundHaptics';

interface SingleItemIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: ProfileId;
  customApiKey?: string;
  onAddItem: (
    itemData: Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>
  ) => void;
}

interface PendingItem {
  imageUrl: string;
  name: string;
  category: ClothingCategory;
}

export const SingleItemIngestModal: React.FC<SingleItemIngestModalProps> = ({
  isOpen,
  onClose,
  profileId,
  customApiKey,
  onAddItem
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRotate = () => {
    soundService.playTap();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      soundService.playTap();
      setIsProcessing(true); // Optional: show loading state while converting HEIC
      try {
        const base64 = await processSelectedFile(file);
        setImage(base64);
        setRotation(0);
      } catch (err) {
        console.error("Failed to load image", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleProcessImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      // Remove background with specified manual rotation
      const cutouts = await removeImageBackground(image, customApiKey, rotation);
      
      // Auto tag all identified pieces
      const analyzed = await Promise.all(
        cutouts.map(async (c) => {
          try {
            const analysis = await requestAnalyzeItem(c, profileId, [], customApiKey);
            return {
              imageUrl: c,
              name: analysis.name,
              category: (analysis.category as ClothingCategory) || 'tops'
            };
          } catch (err) {
            console.error("Analysis failed for item", err);
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
               alert("Network error: Could not reach the AI server. If you are using an ad-blocker, please disable it for this site and try again, or check your internet connection.");
            }
            return {
              imageUrl: c,
              name: 'New Item',
              category: 'tops' as ClothingCategory
            };
          }
        })
      );
      setPendingItems(analyzed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<PendingItem>) => {
    setPendingItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleSave = () => {
    if (pendingItems.length > 0) {
      soundService.playSuccess();
      pendingItems.forEach(item => {
        onAddItem({
          name: item.name || 'New Item',
          category: item.category,
          color: { primary: 'white', hex: '#ffffff' },
          material: [],
          vibe: ['casual'],
          season: ['spring'],
          imageUrl: item.imageUrl,
          isLaundry: false,
          tags: []
        });
      });
      onClose();
      setImage(null);
      setRotation(0);
      setPendingItems([]);
    }
  };

  const handleReset = () => {
    setImage(null);
    setRotation(0);
    setPendingItems([]);
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100">
        <h2 className="text-lg font-bold">Add Item(s)</h2>
        <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {!image ? (
          <div className="w-full aspect-square border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center gap-4 bg-zinc-50">
            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-black text-white rounded-full">
              <Upload className="w-6 h-6" />
            </button>
            <p className="text-sm font-semibold text-zinc-500">Upload photo</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
          </div>
        ) : isProcessing ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <img 
                src={image} 
                style={{ transform: `rotate(${rotation}deg)` }}
                className="w-48 h-48 object-contain rounded-2xl opacity-30 grayscale blur-sm transition-transform duration-300" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-black flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" /> AI processing image...
              </p>
              <p className="text-xs text-zinc-500 max-w-[240px]">
                Removing background, formatting studio crop, and identifying garment tags.
              </p>
            </div>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="w-full flex-1 flex flex-col items-center justify-between gap-6 pb-6">
            <div className="relative w-full aspect-square bg-zinc-50 rounded-3xl border border-zinc-100 p-4 flex items-center justify-center overflow-hidden">
              <img 
                src={image} 
                alt="Upload preview" 
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-w-full max-h-full object-contain rounded-2xl transition-transform duration-300 shadow-md"
              />
              
              {/* Sleek Pure Black Rotate Button Overlay */}
              <button
                onClick={handleRotate}
                className="absolute top-4 right-4 bg-black text-white px-3.5 py-2 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all hover:bg-zinc-800"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate
              </button>
            </div>

            <div className="w-full flex gap-3">
              <button 
                onClick={handleReset} 
                className="flex-1 py-3.5 bg-zinc-100 text-zinc-700 font-bold rounded-full text-sm active:scale-95 transition-all"
              >
                Change Photo
              </button>
              <button 
                onClick={handleProcessImage} 
                className="flex-[2] py-3.5 bg-black text-white font-bold rounded-full text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Process & Isolate
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-8 pb-8">
            {pendingItems.map((item, idx) => (
              <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5 shadow-sm">
                <div className="w-full aspect-square bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] rounded-2xl p-4 shadow-inner flex items-center justify-center mb-6">
                  <img src={item.imageUrl} className="max-w-full max-h-full object-contain drop-shadow-md" />
                </div>
                
                <div className="space-y-4 w-full">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Name</label>
                    <input type="text" value={item.name} onChange={e => handleUpdateItem(idx, { name: e.target.value })} className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Category</label>
                    <select value={item.category} onChange={e => handleUpdateItem(idx, { category: e.target.value as ClothingCategory })} className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-black capitalize">
                       {['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories', 'stoles_scarves', 'jewelry', 'bags'].map(c => (
                         <option key={c} value={c}>{c.replace('_', ' ')}</option>
                       ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            <button onClick={handleSave} className="w-full p-4 bg-black text-white rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 sticky bottom-4">
              <Check className="w-5 h-5" /> Save {pendingItems.length} {pendingItems.length === 1 ? 'Item' : 'Items'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
