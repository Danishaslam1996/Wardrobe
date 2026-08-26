import React, { useState } from 'react';
import { Wifi, Battery, Signal, Smartphone, Monitor } from 'lucide-react';
import { soundService } from '../lib/soundHaptics';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div id="iphone-wrapper" className="min-h-screen w-full bg-[#EBEBEF] flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 font-sans relative">
      {/* Viewport Mode Switcher for App Evaluator on Desktop */}
      <div className="hidden sm:flex fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-200 shadow-md items-center gap-2">
        <button
          onClick={() => {
            soundService.playTap();
            setIsExpanded(false);
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
            !isExpanded ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iPhone 16 Pro</span>
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            setIsExpanded(true);
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isExpanded ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Expanded View</span>
        </button>
      </div>

      {/* Outer Shell */}
      <div
        id="iphone-device"
        className={`w-full h-[100dvh] bg-white transition-all duration-300 overflow-hidden relative flex flex-col shadow-2xl ${
          isExpanded
            ? 'sm:max-w-3xl sm:h-[92vh] sm:rounded-[32px] sm:border-4 sm:border-zinc-300'
            : 'sm:max-w-[430px] sm:h-[932px] sm:rounded-[54px] sm:border-[10px] sm:border-[#1F1F24] ring-1 ring-black/5'
        }`}
      >
        {/* Dynamic Island on Desktop Mockup */}
        {!isExpanded && (
          <div className="hidden sm:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-[124px] h-[34px] bg-black rounded-full z-50 items-center justify-between px-3.5 pointer-events-none transition-all duration-300">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] ring-1 ring-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-[#151517] ring-1 ring-zinc-800" />
            </div>
          </div>
        )}

        {/* iOS Status Bar */}
        <div className="w-full h-11 pt-2 px-6 flex items-center justify-between text-black text-xs font-semibold select-none z-40 bg-white/90 backdrop-blur-md shrink-0">
          <span className="tracking-tight text-[13px]">9:41</span>
          <div className="flex items-center gap-2 text-zinc-900">
            <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <div className="flex items-center gap-0.5">
              <span className="text-[11px] font-bold">100%</span>
              <Battery className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Dynamic Viewport Container */}
        <div className="flex-1 w-full overflow-hidden flex flex-col relative bg-white">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="w-full h-6 shrink-0 flex items-center justify-center bg-white/90 backdrop-blur-md pointer-events-none z-40">
          <div className="w-36 h-1 bg-black/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
