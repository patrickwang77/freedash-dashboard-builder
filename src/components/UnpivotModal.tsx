import React, { useState } from 'react';
import type { DataColumn } from '../types';
import { X, HelpCircle, Check, ArrowRightLeft } from 'lucide-react';

interface UnpivotModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: DataColumn[];
  data: any[];
  onApply: (newColumns: DataColumn[], newData: any[]) => void;
}

export const UnpivotModal: React.FC<UnpivotModalProps> = ({
  isOpen,
  onClose,
  columns,
  data,
  onApply
}) => {
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [attrName, setAttrName] = useState('項目');
  const [valName, setValName] = useState('數值');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleCol = (name: string) => {
    setSelectedCols(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedCols(columns.map(c => c.name));
  };

  const handleSelectNone = () => {
    setSelectedCols([]);
  };

  const handleExecute = () => {
    if (selectedCols.length === 0) {
      setErrorMsg('請至少選擇一個要合併的欄位。');
      return;
    }
    if (!attrName.trim()) {
      setErrorMsg('請輸入新屬性欄位名稱。');
      return;
    }
    if (!valName.trim()) {
      setErrorMsg('請輸入新值欄位名稱。');
      return;
    }
    if (columns.some(c => c.name === attrName && !selectedCols.includes(c.name))) {
      setErrorMsg(`欄位名稱「${attrName}」已被非合併欄位佔用，請換個名稱。`);
      return;
    }
    if (columns.some(c => c.name === valName && !selectedCols.includes(c.name))) {
      setErrorMsg(`欄位名稱「${valName}」已被非合併欄位佔用，請換個名稱。`);
      return;
    }

    setErrorMsg(null);

    // 1. Filter out the unpivoted columns to keep the baseline columns
    const baselineColumns = columns.filter(c => !selectedCols.includes(c.name));
    
    // 2. Perform wide-to-long transformation
    const transformedData: any[] = [];
    data.forEach(row => {
      selectedCols.forEach(colName => {
        const val = row[colName];
        const newRow: any = {};
        
        // Copy baseline columns
        baselineColumns.forEach(c => {
          newRow[c.name] = row[c.name];
        });
        
        // Add new Unpivoted columns
        newRow[attrName] = colName;
        newRow[valName] = val;
        
        transformedData.push(newRow);
      });
    });

    // 3. Determine the data type for the new value column
    const sampleVal = columns.find(c => c.name === selectedCols[0]);
    const valType = sampleVal?.type || 'number';

    const finalColumns: DataColumn[] = [
      ...baselineColumns,
      { name: attrName, type: 'text' },
      { name: valName, type: valType }
    ];

    onApply(finalColumns, transformedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/80 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-white">
            <div className="w-9 h-9 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">逆樞紐資料清洗 (Unpivot / 寬轉長)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">將多個同質性的欄位合併成單一維度與數值欄位</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Intro description */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-xs text-blue-700 dark:text-blue-300">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <div className="leading-relaxed">
              <p className="font-bold mb-1">什麼時候需要逆樞紐？</p>
              當您的 Excel 表格將月份（1月、2月...）或部門（BU1、BU2...）個別作為獨立欄位排開時，這屬於「寬表格」，無法方便地在圖表中將其進行統一的加總與交叉分析。
              透過本功能，可以選擇這些欄位將其「摺疊」合併。例如將 `BU1: 1.95, BU2: 0` 轉化為：
              屬性欄位：`BU1`、值欄位：`1.95`；以及屬性欄位：`BU2`、值欄位：`0`。
            </div>
          </div>

          {/* Form input configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                新屬性欄位名稱（存放原欄位名稱，例如：部門 / 月份）
              </label>
              <input
                type="text"
                value={attrName}
                onChange={e => setAttrName(e.target.value)}
                placeholder="例如：部門"
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                新數值欄位名稱（存放各別數值，例如：人數 / 銷售額）
              </label>
              <input
                type="text"
                value={valName}
                onChange={e => setValName(e.target.value)}
                placeholder="例如：人數"
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              />
            </div>
          </div>

          {/* Columns checklist */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                選擇要進行逆樞紐合併的欄位 (將被摺疊)
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={handleSelectAll} className="text-[10px] font-bold text-brand hover:underline cursor-pointer">全選</button>
                <span className="text-[10px] text-slate-355">|</span>
                <button type="button" onClick={handleSelectNone} className="text-[10px] font-bold text-brand hover:underline cursor-pointer">清除全部</button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto grid grid-cols-2 gap-3.5">
              {columns.map(c => {
                const isChecked = selectedCols.includes(c.name);
                return (
                  <label
                    key={c.name}
                    className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand/40 bg-brand/5 dark:bg-brand/10 text-slate-800 dark:text-white'
                        : 'border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCol(c.name)}
                      className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                    />
                    <span className="text-xs truncate font-medium">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-450 border border-rose-150 dark:border-rose-900/30 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/10">
          <button
            type="button"
            onClick={onClose}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="bg-brand hover:bg-brand-hover text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-brand/10 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>確認執行轉換</span>
          </button>
        </div>

      </div>
    </div>
  );
};
