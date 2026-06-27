import React from 'react';
import type { ThemeConfig, ThemeName, ThemeMode } from '../types';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeSelectorProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, onChange }) => {
  const themes: { id: ThemeName; name: string; colorClass: string; bgClass: string }[] = [
    { id: 'indigo', name: '深藍靛青', colorClass: 'bg-indigo-600', bgClass: 'from-indigo-500 to-indigo-700' },
    { id: 'emerald', name: '翡翠青綠', colorClass: 'bg-emerald-600', bgClass: 'from-emerald-500 to-emerald-700' },
    { id: 'rose', name: '玫瑰嫣紅', colorClass: 'bg-rose-600', bgClass: 'from-rose-500 to-rose-700' },
    { id: 'amber', name: '暖金橘', colorClass: 'bg-amber-500', bgClass: 'from-amber-400 to-amber-600' },
    { id: 'slate', name: '冷冽灰', colorClass: 'bg-slate-600', bgClass: 'from-slate-500 to-slate-700' },
    { id: 'violet', name: '紫羅蘭', colorClass: 'bg-violet-600', bgClass: 'from-violet-500 to-violet-750' },
    { id: 'space', name: '太空極光', colorClass: 'bg-gradient-to-r from-sky-400 to-indigo-500', bgClass: 'from-sky-400 to-indigo-600' },
    { id: 'custom', name: '自訂色彩', colorClass: 'bg-gradient-to-r from-slate-200 via-rose-300 to-teal-200 dark:from-slate-700 dark:to-slate-900', bgClass: 'from-slate-100 to-slate-350' }
  ];

  const modes: { id: ThemeMode; name: string; icon: React.ReactNode }[] = [
    { id: 'light', name: '淺色', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', name: '深色', icon: <Moon className="w-4 h-4" /> },
    { id: 'system', name: '系統', icon: <Laptop className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm transition-colors duration-200 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
        {/* Theme Mode Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
          {modes.map((m) => {
            const isActive = theme.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChange({ ...theme, mode: m.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {m.icon}
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        {theme.name === 'custom' && (
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850 animate-fade-in w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">主色:</span>
              <input
                type="color"
                value={theme.customPrimary || '#4f46e5'}
                onChange={(e) => onChange({ ...theme, customPrimary: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent outline-none p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">漸層尾色:</span>
              <input
                type="color"
                value={theme.customSecondary || '#818cf8'}
                onChange={(e) => onChange({ ...theme, customSecondary: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent outline-none p-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Palette Colors selection */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          色彩主題：
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {themes.map((t) => {
            const isSelected = theme.name === t.id;
            return (
              <button
                key={t.id}
                title={t.name}
                onClick={() => onChange({ 
                  ...theme, 
                  name: t.id,
                  customPrimary: t.id === 'custom' ? (theme.customPrimary || '#4f46e5') : undefined,
                  customSecondary: t.id === 'custom' ? (theme.customSecondary || '#818cf8') : undefined
                })}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${
                  t.colorClass
                } ${isSelected ? 'ring-2 ring-offset-2 ring-brand dark:ring-offset-slate-800' : 'ring-1 ring-black/10'}`}
              >
                {isSelected && <Check className="w-4 h-4 text-white font-bold" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
