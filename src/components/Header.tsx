import React from 'react';
import { Sparkles, Sun, CloudRain, Settings, Check } from 'lucide-react';
import { ProfileId } from '../types';
import { PROFILES } from '../data/seedData';
import { WeatherData } from '../store/useWardrobeStore';

interface HeaderProps {
  activeProfileId: ProfileId;
  onSwitchProfile: (id: ProfileId) => void;
  weather?: WeatherData;
  onOpenWeatherModal: () => void;
  onOpenSettings: () => void;
  hasApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfileId,
  onSwitchProfile,
  weather,
  onOpenWeatherModal,
  onOpenSettings,
  hasApiKey = false,
}) => {
  const cityName = weather?.city ? weather.city.split(',')[0] : 'Abu Dhabi';
  const temp = weather?.tempC ?? 33;
  return (
    <header className="w-full px-4 pt-1 pb-3 bg-white/95 backdrop-blur-md border-b border-zinc-100/80 z-30 flex flex-col gap-2 shrink-0">
      {/* Top Row: App Brand + Weather + AI Key */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-serif italic text-lg tracking-tight font-bold text-black">
            Daily Threads
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold tracking-wider">
            Édition Luxe
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Weather Widget Button */}
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 hover:bg-zinc-100 active:scale-95 transition-all text-xs text-zinc-800 font-medium border border-zinc-100"
            title="Current Weather Context for AI Stylist"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {cityName} {temp}°C
            </span>
          </button>

          {/* AI Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center text-zinc-700 relative border border-zinc-100"
            title="Gemini AI Settings & Keys"
          >
            <Settings className="w-3.5 h-3.5" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dual Profile Switcher Pill (High-Contrast Luxury Segmented Control) */}
      <div className="w-full bg-zinc-100/90 p-1 rounded-full flex items-center relative select-none">
        {(['danish', 'eesha'] as ProfileId[]).map((pid) => {
          const profile = PROFILES[pid];
          const isActive = activeProfileId === pid;

          return (
            <button
              key={pid}
              onClick={() => onSwitchProfile(pid)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 relative z-10 ${
                isActive
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className={`w-4 h-4 rounded-full object-cover ring-1 ${
                  isActive ? 'ring-white/40' : 'ring-zinc-300'
                }`}
              />
              <span className="capitalize">{profile.name}</span>
              {isActive && (
                <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded-full font-mono font-normal">
                  {pid === 'eesha' ? 'Modest' : 'Tailored'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
