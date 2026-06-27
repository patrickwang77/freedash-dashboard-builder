import { useState, useEffect } from 'react';
import type { DataColumn, DashboardCard, ThemeConfig, CalculatedColumn, ColumnType, DashboardTemplate } from './types';
import { ThemeSelector } from './components/ThemeSelector';
import { UploadTab } from './components/UploadTab';
import { TemplatesTab } from './components/TemplatesTab';
import { CustomLayoutTab } from './components/CustomLayoutTab';
import { DashboardTab } from './components/DashboardTab';
import { normalizeValue } from './utils/parser';
import { Upload, LayoutTemplate, Settings, LineChart, Cpu } from 'lucide-react';

function App() {
  // Main data states
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<string>('upload');

  // Theme settings state
  const [theme, setTheme] = useState<ThemeConfig>({
    name: 'indigo',
    mode: 'light'
  });

  // Builder configuration states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [slicers, setSlicers] = useState<string[]>([]);
  const [calculatedColumns, setCalculatedColumns] = useState<CalculatedColumn[]>([]);

  // User Custom Saved Templates
  const [customTemplates, setCustomTemplates] = useState<DashboardTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('freedash_user_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('freedash_user_templates', JSON.stringify(customTemplates));
    } catch (e) {
      console.error('Failed to save custom templates to localStorage', e);
    }
  }, [customTemplates]);

  const handleDeleteCustomTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Apply Dark Mode Class
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme.mode === 'dark') {
        root.classList.add('dark');
      } else if (theme.mode === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference detection
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (theme.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme.mode]);

  // Color Palette Theme values
  const colorPalettes: Record<string, { primary: string; primaryHover: string; gradientEnd: string }> = {
    indigo: { primary: '#4f46e5', primaryHover: '#4338ca', gradientEnd: '#818cf8' },
    emerald: { primary: '#059669', primaryHover: '#047857', gradientEnd: '#34d399' },
    rose: { primary: '#e11d48', primaryHover: '#be123c', gradientEnd: '#fb7185' },
    amber: { primary: '#d97706', primaryHover: '#b45309', gradientEnd: '#fbbf24' },
    slate: { primary: '#475569', primaryHover: '#334155', gradientEnd: '#94a3b8' },
    violet: { primary: '#7c3aed', primaryHover: '#6d28d9', gradientEnd: '#a78bfa' },
    space: { primary: '#38bdf8', primaryHover: '#0ea5e9', gradientEnd: '#818cf8' }
  };

  const palette = theme.name === 'custom'
    ? {
        primary: theme.customPrimary || '#4f46e5',
        primaryHover: theme.customPrimary || '#4338ca',
        gradientEnd: theme.customSecondary || '#818cf8'
      }
    : (colorPalettes[theme.name] || colorPalettes.indigo);

  // File loading callback
  const handleDataLoaded = (newColumns: DataColumn[], newData: any[], newFileName: string) => {
    setData(newData);
    setColumns(newColumns);
    setFileName(newFileName);
    setCalculatedColumns([]); // Reset previous calculations
    setSelectedTemplateId(null);
    setCards([]);
    setSlicers([]);

    // Automatically transition to Templates Tab
    setTimeout(() => {
      setActiveTab('templates');
    }, 300);
  };

  // Modify Column Type manually
  const handleColumnTypeChange = (colName: string, newType: ColumnType) => {
    setColumns((prev) =>
      prev.map((c) => (c.name === colName ? { ...c, type: newType } : c))
    );

    setData((prev) =>
      prev.map((row) => ({
        ...row,
        [colName]: normalizeValue(row[colName], newType)
      }))
    );
  };

  // Select Layout Template
  const handleSelectTemplate = (templateId: string, templateCards: DashboardCard[], templateSlicers: string[]) => {
    setSelectedTemplateId(templateId);
    setCards(templateCards);
    setSlicers(templateSlicers);
  };

  // Add calculated column
  const handleAddCalculatedColumn = (cc: CalculatedColumn) => {
    setCalculatedColumns((prev) => [...prev, cc]);
    setColumns((prev) => [...prev, { name: cc.name, type: 'number', isCalculated: true }]);
  };

  // Remove calculated column
  const handleRemoveCalculatedColumn = (name: string) => {
    setCalculatedColumns((prev) => prev.filter((cc) => cc.name !== name));
    setColumns((prev) => prev.filter((c) => c.name !== name));

    // Cleanup references in active cards
    setCards((prev) =>
      prev
        .filter((card) => {
          const config = card.config as any;
          if (card.type === 'indicator' && config.field === name) return false;
          if (card.type === 'chart' && (config.xAxis === name || config.yAxis === name)) return false;
          return true;
        })
        .map((card) => {
          if (card.type === 'data') {
            const config = card.config as any;
            return {
              ...card,
              config: {
                ...config,
                fields: (config.fields || []).filter((f: string) => f !== name)
              }
            };
          }
          return card;
        })
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-200">
      {/* Dynamic Theme Color Injection */}
      <style>{`
        :root {
          --brand: ${palette.primary};
          --brand-hover: ${palette.primaryHover};
          --brand-light: ${palette.gradientEnd};
        }
      `}</style>

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-brand to-brand-light text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">FreeDash 數據視覺化產生器</h1>
              <p className="text-[11px] opacity-85 mt-0.5">離線運作 • 本地處理 • 極致隱私安全</p>
            </div>
          </div>
          <div className="text-xs bg-white/15 px-3 py-1.5 rounded-full border border-white/10">
            TypeScript + React + Tailwind v4
          </div>
        </div>
      </header>

      {/* Navigation tabs & Theme controls */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Global theme controls */}
        <ThemeSelector theme={theme} onChange={setTheme} />

        {/* Tab List */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-brand text-brand font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. 資料匯入與辨識</span>
          </button>
          
          <button
            onClick={() => setActiveTab('templates')}
            disabled={data.length === 0}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              data.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                : activeTab === 'templates'
                ? 'border-brand text-brand font-black cursor-pointer'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 cursor-pointer'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>2. 智慧自適應範本</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            disabled={data.length === 0}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              data.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                : activeTab === 'custom'
                ? 'border-brand text-brand font-black cursor-pointer'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 cursor-pointer'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>3. 儀表板自訂佈局</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            disabled={data.length === 0}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              data.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                : activeTab === 'dashboard'
                ? 'border-brand text-brand font-black cursor-pointer'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 cursor-pointer'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>4. 互動式分析看板</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="py-6 min-h-[500px]">
          {activeTab === 'upload' && (
            <UploadTab
              onDataLoaded={handleDataLoaded}
              columns={columns}
              data={data}
              fileName={fileName}
              onColumnTypeChange={handleColumnTypeChange}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab
              columns={columns}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              activeSlicers={slicers}
              onSlicersChange={setSlicers}
              customTemplates={customTemplates}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
            />
          )}

          {activeTab === 'custom' && (
            <CustomLayoutTab
              columns={columns}
              cards={cards}
              onUpdateCards={setCards}
              calculatedColumns={calculatedColumns}
              onAddCalculatedColumn={handleAddCalculatedColumn}
              onRemoveCalculatedColumn={handleRemoveCalculatedColumn}
              onSaveAsTemplate={(name) => {
                const newT = {
                  id: `custom_template_${Date.now()}`,
                  name: name || `自訂佈局 (${new Date().toLocaleDateString()})`,
                  description: `使用者自訂儲存的儀表板排版，包含 ${cards.length} 張卡片及 ${slicers.length} 個篩選器。`,
                  cards: cards,
                  slicers: slicers,
                  isUserCustom: true
                };
                setCustomTemplates(prev => [...prev, newT]);
              }}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              columns={columns}
              data={data}
              cards={cards}
              theme={theme}
              slicers={slicers}
              calculatedColumns={calculatedColumns}
            />
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-8 bg-white dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <p>© 2026 FreeDash. 所有的試算表解析與視覺化繪製均在瀏覽器端本地完成，本機 100% 離線安全。</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
