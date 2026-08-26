import React from 'react';
import { 
  Home, User, Plus
} from 'lucide-react';

export type TabId = 'home' | 'wardrobe' | 'profile' | 'studio' | 'daily' | 'scan' | 'travel'; // 'wardrobe' serves as the profile/closet view

interface NavigationTrayProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenActionSheet?: () => void;
}

export const NavigationTray: React.FC<NavigationTrayProps> = ({
  activeTab,
  onSelectTab,
  onOpenActionSheet,
}) => {
  return (
    <nav className="w-full px-8 pt-3 pb-6 bg-white/95 backdrop-blur-xl border-t border-zinc-100 z-30 shrink-0 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between max-w-[280px] mx-auto">
        
        {/* Home Tab */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'home' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] tracking-tight leading-none ${activeTab === 'home' ? 'font-bold' : 'font-semibold'}`}>Home</span>
        </button>

        {/* Central Plus Button */}
        <button
          onClick={onOpenActionSheet}
          className="flex flex-col items-center justify-center -mt-6 z-10 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg text-white">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
        </button>

        {/* Profile / Closet Tab */}
        <button
          onClick={() => onSelectTab('wardrobe')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'wardrobe' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <User className={`w-6 h-6 ${activeTab === 'wardrobe' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] tracking-tight leading-none ${activeTab === 'wardrobe' ? 'font-bold' : 'font-semibold'}`}>Wardrobe</span>
        </button>
      </div>
    </nav>
  );
};
