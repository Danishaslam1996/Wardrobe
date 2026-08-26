import React from 'react';
import { 
  Search, Bell, User, Calendar, Camera, Sparkles, Plus, Image as ImageIcon, Shirt, Barcode, Plane
} from 'lucide-react';
import { WardrobeItem, Outfit } from '../types';
import { soundService } from '../lib/soundHaptics';

interface HomeDashboardViewProps {
  recentItems: WardrobeItem[];
  recentOutfits: Outfit[];
  onActionClick: (action: string) => void;
  onOpenOutfits: () => void;
  onOpenItem: (item: WardrobeItem) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  recentItems,
  recentOutfits,
  onActionClick,
  onOpenOutfits,
  onOpenItem,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 pb-20">
      {/* Top Header / Nav area is handled by global header, but we can add specific ones here */}
      <div className="px-4 pt-4 pb-2 space-y-4">
        {/* Banner */}
        <div className="bg-zinc-800 text-white rounded-3xl p-4 flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Extracting clothes...</h3>
              <p className="text-xs text-zinc-400">0/1 photos processed</p>
            </div>
          </div>
          <button className="relative z-10 bg-zinc-700/50 hover:bg-zinc-700 p-2 rounded-full transition-colors">
            <User className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Quick Lists */}
        <div className="space-y-2">
          <button 
            onClick={() => onActionClick('find_outfit')}
            className="w-full bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <span className="text-lg">🧑</span>
            </div>
            <span className="font-semibold text-sm">Find an outfit</span>
            <div className="ml-auto text-zinc-400">›</div>
          </button>
          
          <button 
            onClick={() => onActionClick('daily_pick')}
            className="w-full bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <span className="text-lg">⏱️</span>
            </div>
            <div className="text-left">
              <span className="font-semibold text-sm block">Work · Now</span>
              <span className="text-xs text-zinc-400">Minimalist</span>
            </div>
            <div className="ml-auto text-zinc-400">›</div>
          </button>
        </div>

        {/* App Functions Grid */}
        <div className="grid grid-cols-3 gap-2 py-2">
          {[
            { id: 'planner', icon: Calendar, label: 'Planner' },
            { id: 'dressing_room', icon: Shirt, label: 'Dressing Room' },
            { id: 'ai_try_on', icon: Sparkles, label: 'AI Try On' },
            { id: 'selfie', icon: Camera, label: 'Selfie' },
            { id: 'scanner', icon: Barcode, label: 'Scanner' },
            { id: 'travel', icon: Plane, label: 'Travel' },
          ].map((action) => (
            <button 
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-2xl shadow-sm active:scale-95 transition-all"
            >
              <action.icon className="w-5 h-5 text-zinc-700" />
              <span className="text-[10px] font-semibold text-zinc-600">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Outfits */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-lg text-black">Recent outfits</h2>
            <button className="text-zinc-400">›</button>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
            {recentOutfits.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto w-full pb-2">
                {recentOutfits.map(outfit => (
                  <div key={outfit.id} className="min-w-[120px] rounded-2xl bg-zinc-50 p-2 shrink-0">
                    <div className="font-bold text-xs mb-1 truncate">{outfit.name}</div>
                    <div className="text-[10px] text-zinc-500">{outfit.vibe}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-[-20px] mb-4">
                  {/* Mock stacked outfits placeholder */}
                  <div className="w-16 h-20 bg-zinc-100 rounded-xl -rotate-6 z-10 border-2 border-white" />
                  <div className="w-16 h-20 bg-zinc-200 rounded-xl z-20 shadow-sm border-2 border-white" />
                  <div className="w-16 h-20 bg-zinc-100 rounded-xl rotate-6 z-10 border-2 border-white" />
                </div>
                <p className="text-xs text-zinc-500 font-medium mb-3">Your outfits will appear here.</p>
                <button 
                  onClick={onOpenOutfits}
                  className="px-5 py-2 bg-black text-white text-xs font-bold rounded-full"
                >
                  Create outfit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recently Added Items */}
        <div className="pt-4 pb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-lg text-black">Recently added items</h2>
            <button className="text-zinc-400">›</button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {recentItems.length > 0 ? (
              recentItems.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item)}
                  className="shrink-0 snap-start active:scale-95 transition-transform"
                >
                  <div className="w-24 h-28 bg-white rounded-2xl p-2 shadow-sm flex items-center justify-center mb-1">
                    <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain " />
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center font-medium capitalize">{item.subcategory || item.category}</p>
                </button>
              ))
            ) : (
              <div className="w-full text-center py-6 text-zinc-400 text-xs">
                No items added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
