import React, { useState } from 'react';
import { X, Sun, Cloud, CloudRain, Check, MapPin } from 'lucide-react';
import { WeatherData } from '../store/useWardrobeStore';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather?: WeatherData;
  currentWeather?: WeatherData;
  onSaveWeather: (w: WeatherData) => void;
}

const DEFAULT_WEATHER: WeatherData = {
  city: 'Abu Dhabi',
  tempC: 34,
  humidity: 62,
  condition: 'Sunny & Warm',
  isCustom: false,
};

const PRESET_CITIES = [
  { city: 'Abu Dhabi', tempC: 34, humidity: 62, condition: 'Sunny & Warm' },
  { city: 'Dubai', tempC: 36, humidity: 65, condition: 'Sunny & Humid' },
  { city: 'London', tempC: 21, humidity: 55, condition: 'Mild & Breezy' },
  { city: 'Milan', tempC: 24, humidity: 50, condition: 'Pleasant & Crisp' },
  { city: 'New York', tempC: 26, humidity: 58, condition: 'Clear Skies' },
];

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  currentWeather,
  onSaveWeather,
}) => {
  const activeWeather = weather || currentWeather || DEFAULT_WEATHER;
  const [selectedCity, setSelectedCity] = useState(activeWeather.city || 'Abu Dhabi');
  const [tempC, setTempC] = useState(activeWeather.tempC ?? 34);
  const [humidity, setHumidity] = useState(activeWeather.humidity ?? 60);
  const [condition, setCondition] = useState(activeWeather.condition || 'Sunny & Warm');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof PRESET_CITIES)[0]) => {
    setSelectedCity(preset.city);
    setTempC(preset.tempC);
    setHumidity(preset.humidity);
    setCondition(preset.condition);
  };

  const handleSave = () => {
    onSaveWeather({
      city: selectedCity,
      tempC,
      humidity,
      condition,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif italic text-base font-bold text-black">
              Weather Context for AI Stylist
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preset Cities */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Quick City Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CITIES.map((p) => {
              const isSelected = selectedCity === p.city;
              return (
                <button
                  key={p.city}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {p.city} ({p.tempC}°C)
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Inputs */}
        <div className="space-y-2.5 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Location Name
            </label>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Humidity (%)
              </label>
              <input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>Apply Weather to AI Stylist</span>
        </button>
      </div>
    </div>
  );
};
