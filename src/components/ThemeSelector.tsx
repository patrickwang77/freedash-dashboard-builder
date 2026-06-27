import React from 'react';
import type { ThemeConfig, ThemeName, ThemeMode } from '../types';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSelectorProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, onChange }) => {
  const themes: { id: ThemeName; name: string; desc: string; sub: string; gradientBar: string }[] = [
    { 
      id: 'earthy', 
      name: 'Earthy & Soft', 
      desc: '大地色系：柔和水彩綠、藍、黃', 
      sub: '(Greens, blues, muted yellows)', 
      gradientBar: 'from-emerald-300 via-sky-300 to-amber-200' 
    },
    { 
      id: 'vibrant', 
      name: 'Vibrant 3D', 
      desc: '鮮豔飽和：冷暖光影對比', 
      sub: '(Saturated, warm vs cool)', 
      gradientBar: 'from-blue-600 via-red-500 to-yellow-400' 
    },
    { 
      id: 'highcontrast', 
      name: 'High Contrast Ink', 
      desc: '強烈對比：黑金配色', 
      sub: '(Indigo/Black vs Gold)', 
      gradientBar: 'from-slate-900 via-indigo-950 to-amber-400' 
    },
    { 
      id: 'trust', 
      name: 'Trust Blue', 
      desc: '專業信任：藍白配色', 
      sub: '(Professional blues and whites)', 
      gradientBar: 'from-blue-900 via-blue-500 to-emerald-400' 
    },
    { 
      id: 'blackwhite', 
      name: 'Black & White', 
      desc: '黑板配色：深綠底白線', 
      sub: '(Dark slate background)', 
      gradientBar: 'from-slate-800 via-slate-700 to-slate-400' 
    },
    { 
      id: 'neon', 
      name: 'Neon Dark', 
      desc: '暗黑霓虹：發光青紫', 
      sub: '(Black, Cyan, Magenta)', 
      gradientBar: 'from-purple-950 via-purple-650 to-cyan-400' 
    },
    { 
      id: 'pastel', 
      name: 'Pastel Pop', 
      desc: '柔和粉彩：粉紅、薄荷綠', 
      sub: '(Soft pinks, purples, mint)', 
      gradientBar: 'from-pink-200 via-purple-200 to-teal-200' 
    },
    { 
      id: 'custom', 
      name: 'Custom Color', 
      desc: '自訂色彩：調配您專屬配色', 
      sub: '(Your custom color scheme)', 
      gradientBar: 'custom-gradient' 
    }
  ];

  const modes: { id: ThemeMode; name: string; icon: React.ReactNode }[] = [
    { id: 'light', name: '淺色', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', name: '深色', icon: <Moon className="w-4 h-4" /> },
    { id: 'system', name: '系統', icon: <Laptop className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 w-full bg-white dark:bg-slate-800 p-6 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm transition-colors duration-200">
      
      {/* Top row: Mode controls & Custom pickers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/40">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">💡 佈局主題與顯示模式</h3>
          <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5">選擇符合您報表風格的配色主題與深淺底色模式。</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Mode Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            {modes.map((m) => {
              const isActive = theme.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChange({ ...theme, mode: m.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/40'
                      : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-200'
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
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">主色:</span>
                <input
                  type="color"
                  value={theme.customPrimary || '#1e40af'}
                  onChange={(e) => onChange({ ...theme, customPrimary: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent outline-none p-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">漸層尾色:</span>
                <input
                  type="color"
                  value={theme.customSecondary || '#34d399'}
                  onChange={(e) => onChange({ ...theme, customSecondary: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent outline-none p-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Theme Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {themes.map((t) => {
          const isSelected = theme.name === t.id;
          
          // Generate inline style for custom gradient preview, else tailwind classes
          const gradientStyle = t.id === 'custom'
            ? { background: `linear-gradient(to right, ${theme.customPrimary || '#1e40af'}, ${theme.customSecondary || '#34d399'})` }
            : {};
          const gradientClass = t.id === 'custom'
            ? ''
            : `bg-gradient-to-r ${t.gradientBar}`;

          return (
            <div
              key={t.id}
              onClick={() => onChange({ 
                ...theme, 
                name: t.id,
                customPrimary: t.id === 'custom' ? (theme.customPrimary || '#1e40af') : undefined,
                customSecondary: t.id === 'custom' ? (theme.customSecondary || '#34d399') : undefined
              })}
              className={`group flex flex-col justify-between p-4 bg-white dark:bg-slate-850 border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                isSelected
                  ? 'border-brand ring-2 ring-brand/20 dark:ring-brand/40'
                  : 'border-slate-200 dark:border-slate-750 hover:border-brand/40 dark:hover:border-brand/40'
              }`}
            >
              {/* Top Row: Title & Radio Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="truncate">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors truncate">
                    {t.name}
                  </h4>
                </div>
                
                {/* Radio Indicator */}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSelected 
                    ? 'border-brand bg-brand text-white' 
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
                }`}>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* Descriptions */}
              <div className="mt-1.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-normal">
                  {t.desc}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                  {t.sub}
                </p>
              </div>

              {/* Bottom Preview Gradient Bar */}
              <div 
                style={gradientStyle}
                className={`w-full h-2 rounded-full mt-3.5 ${gradientClass}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
