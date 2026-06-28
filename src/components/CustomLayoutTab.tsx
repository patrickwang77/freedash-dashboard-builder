import React, { useState } from 'react';
import type { DataColumn, DashboardCard, CalculatedColumn, CardType } from '../types';
import { Plus, Trash2, ArrowUpDown, Edit, Move, Check } from 'lucide-react';

interface CustomLayoutTabProps {
  columns: DataColumn[];
  cards: DashboardCard[];
  onUpdateCards: (cards: DashboardCard[]) => void;
  calculatedColumns: CalculatedColumn[];
  onAddCalculatedColumn: (cc: CalculatedColumn) => void;
  onRemoveCalculatedColumn: (name: string) => void;
  onSaveAsTemplate?: (name: string) => void;
}

export const CustomLayoutTab: React.FC<CustomLayoutTabProps> = ({
  columns,
  cards,
  onUpdateCards,
  calculatedColumns,
  onAddCalculatedColumn,
  onRemoveCalculatedColumn,
  onSaveAsTemplate
}) => {
  // Numeric and Calculated columns for formulas
  const numericFields = columns
    .filter((c) => c.type === 'number' || c.isCalculated)
    .map((c) => c.name);

  // Calculated Columns form state
  const [formulaName, setFormulaName] = useState('');
  const [leftField, setLeftField] = useState(numericFields[0] || '');
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/'>('+');
  const [rightField, setRightField] = useState(numericFields[1] || numericFields[0] || '');
  const [isConstant, setIsConstant] = useState(false);
  const [constantValue, setConstantValue] = useState('1');

  // Save custom template states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveAsTemplate) {
      onSaveAsTemplate(newTemplateName.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
        setNewTemplateName('');
      }, 2000);
    }
  };

  // Drag and Drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Edit card configuration panel state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Add card form state
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardType, setNewCardType] = useState<CardType>('indicator');

  // Add Calculated Column handler
  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaName.trim()) return;

    // Check duplicate name
    if (columns.some((c) => c.name === formulaName.trim())) {
      alert('欄位名稱已存在，請使用其他名稱！');
      return;
    }

    const cc: CalculatedColumn = {
      name: formulaName.trim(),
      leftField,
      operator,
      rightField: isConstant ? constantValue : rightField,
      isConstant
    };

    onAddCalculatedColumn(cc);
    setFormulaName('');
    setConstantValue('1');
  };

  // Add Card handler
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const defaultNum = numericFields[0] || '';
    const defaultText = columns.filter((c) => c.type === 'text')[0]?.name || columns[0]?.name || '';

    let config: any;
    if (newCardType === 'indicator') {
      config = { field: defaultNum, agg: 'sum', prefix: '', suffix: '' };
    } else if (newCardType === 'chart') {
      config = { type: 'bar', xAxis: defaultText, yAxis: defaultNum, agg: 'sum' };
    } else {
      config = { pageSize: 10, fields: columns.slice(0, 4).map((c) => c.name) };
    }

    const newCard: DashboardCard = {
      id: `card_${Date.now()}`,
      type: newCardType,
      title: newCardTitle.trim(),
      w: newCardType === 'indicator' ? 2 : newCardType === 'chart' ? 3 : 6,
      h: 'auto',
      config
    };

    onUpdateCards([...cards, newCard]);
    setNewCardTitle('');
    setEditingCardId(newCard.id); // Open config immediately
  };

  // Drag and Drop handlers
  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedCardId || draggedCardId === targetId) return;

    const dragIdx = cards.findIndex((c) => c.id === draggedCardId);
    const targetIdx = cards.findIndex((c) => c.id === targetId);

    const updated = [...cards];
    const [draggedItem] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    onUpdateCards(updated);
    setDraggedCardId(null);
  };

  // Update card details
  const updateCardConfig = (cardId: string, updatedConfig: any) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return { ...c, config: { ...c.config, ...updatedConfig } };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  const updateCardTitle = (cardId: string, title: string) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return { ...c, title };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  const handleDeleteCard = (cardId: string) => {
    if (editingCardId === cardId) setEditingCardId(null);
    onUpdateCards(cards.filter((c) => c.id !== cardId));
  };

  // Canvas-style quick sizing and positioning adjustments
  const adjustWidth = (id: string, delta: number) => {
    const updated = cards.map((c) => {
      if (c.id === id) {
        const nextW = Math.max(1, Math.min(6, c.w + delta)) as 1 | 2 | 3 | 4 | 5 | 6;
        return { ...c, w: nextW };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  const adjustHeight = (id: string, delta: number) => {
    const heights: ('auto' | 'sm' | 'md' | 'lg')[] = ['auto', 'sm', 'md', 'lg'];
    const updated = cards.map((c) => {
      if (c.id === id) {
        const currentIdx = heights.indexOf(c.h);
        const nextIdx = Math.max(0, Math.min(3, currentIdx + delta));
        return { ...c, h: heights[nextIdx] };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  const moveCard = (id: string, delta: number) => {
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= cards.length) return;
    const updated = [...cards];
    const temp = updated[idx];
    updated[idx] = updated[nextIdx];
    updated[nextIdx] = temp;
    onUpdateCards(updated);
  };

  const editingCard = cards.find((c) => c.id === editingCardId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Left Sidebar: Calculations & Add Card */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Calculated Columns formula editor */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-2 flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-brand" />
            <span>自訂數值計算公式</span>
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mb-5 leading-relaxed">
            對數據庫中的數值進行四則運算，新增的計算欄位會即時加入資料集，並可立刻被選作指標、圖表或篩選器。
          </p>

          {numericFields.length === 0 ? (
            <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-xl font-medium">
              請先載入包含數值欄位的資料表。
            </p>
          ) : (
            <form onSubmit={handleAddFormula} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase">新增欄位名稱</label>
                <input
                  type="text"
                  placeholder="例如：折後單價, 銷售占比"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                {/* Left operand */}
                <select
                  value={leftField}
                  onChange={(e) => setLeftField(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                >
                  {numericFields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as any)}
                  className="text-xs text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 font-bold focus:ring-1 focus:ring-brand focus:outline-none"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="*">×</option>
                  <option value="/">÷</option>
                </select>

                {/* Right operand toggle */}
                {isConstant ? (
                  <input
                    type="number"
                    step="any"
                    value={constantValue}
                    onChange={(e) => setConstantValue(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                  />
                ) : (
                  <select
                    value={rightField}
                    onChange={(e) => setRightField(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                  >
                    {numericFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Toggle operand constant mode */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="rightConstantCheck"
                  checked={isConstant}
                  onChange={(e) => setIsConstant(e.target.checked)}
                  className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                />
                <label htmlFor="rightConstantCheck" className="text-xs text-slate-500 cursor-pointer select-none">
                  第二參數使用固定常數 (Constant)
                </label>
              </div>

              <button
                type="submit"
                disabled={!formulaName.trim()}
                className="w-full bg-slate-100 hover:bg-slate-250 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>新增計算欄位</span>
              </button>
            </form>
          )}

          {/* List of active Calculated fields */}
          {calculatedColumns.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">當前自訂欄位</h4>
              {calculatedColumns.map((cc) => (
                <div key={cc.name} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl gap-2">
                  <div className="text-xs truncate">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{cc.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      = {cc.leftField} {cc.operator === '*' ? '×' : cc.operator === '/' ? '÷' : cc.operator} {cc.isConstant ? cc.rightField : cc.rightField}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveCalculatedColumn(cc.name)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="刪除此計算欄位"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Card Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-2">
            🆕 新增儀表板卡片
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mb-5">
            在此設定並生成一個新的空白卡片，卡片將被追加到儀表板右側清單底端。
          </p>

          <form onSubmit={handleAddCard} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase">卡片標題</label>
              <input
                type="text"
                placeholder="例如：總營收指標、各商品銷售分佈"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase">卡片類型</label>
              <select
                value={newCardType}
                onChange={(e) => setNewCardType(e.target.value as CardType)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
              >
                <option value="indicator">🎯 指標卡 (Indicator Card)</option>
                <option value="chart">📊 圖表卡 (Chart Card)</option>
                <option value="data">🗂️ 資料表卡 (Data Card)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!newCardTitle.trim()}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-brand/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>將卡片加入儀表板</span>
            </button>
          </form>
        </div>

      </div>

      {/* Center & Right: Dashboard Card Sorter & Card Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Drag and Drop Card list */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-2 flex flex-wrap items-center justify-between gap-2">
            <span>🔀 儀表板設計畫布 (自訂佈局)</span>
            {cards.length > 0 && onSaveAsTemplate && (
              <div className="flex items-center gap-2">
                {saveSuccess ? (
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 font-semibold">✓ 範本儲存成功！</span>
                ) : showSaveModal ? (
                  <form onSubmit={handleSaveTemplate} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="輸入範本名稱..."
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      autoFocus
                      required
                    />
                    <button
                      type="submit"
                      className="text-[10px] bg-brand text-white px-2.5 py-1 rounded-lg font-extrabold hover:bg-brand-hover transition-colors cursor-pointer"
                    >
                      確認
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(false)}
                      className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 px-2 py-1 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveModal(true);
                      setNewTemplateName(`自訂佈局 (${new Date().toLocaleDateString()})`);
                    }}
                    className="text-[10px] bg-brand/10 hover:bg-brand/20 text-brand px-3 py-1.5 rounded-lg border border-brand/25 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    💾 儲存為自訂範本
                  </button>
                )}
              </div>
            )}
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mb-5 leading-relaxed">
            系統支援拖曳排序。您可以拖曳卡片上的 Move 圖示調整卡片順序，並在下方欄位設定寬度與高度。
          </p>

          {cards.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-405">拖曳設計畫布為空。請由左側新增卡片，或從範本頁籤匯入佈局。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-100/50 dark:bg-slate-900/50 p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl min-h-[400px]">
              {cards.map((card) => {
                const isEditing = editingCardId === card.id;

                const widthClass = card.w === 1
                  ? 'col-span-1'
                  : card.w === 2
                    ? 'col-span-1 md:col-span-2'
                    : card.w === 3
                      ? 'col-span-1 md:col-span-3'
                      : card.w === 4
                        ? 'col-span-1 md:col-span-4'
                        : card.w === 5
                          ? 'col-span-1 md:col-span-5'
                          : 'col-span-1 md:col-span-6';

                const heightClass = card.h === 'auto'
                  ? 'h-fit min-h-[144px]'
                  : card.h === 'sm'
                    ? 'h-32'
                    : card.h === 'md'
                      ? 'h-48'
                      : 'h-64';

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(card.id)}
                    className={`${widthClass} ${heightClass} flex flex-col justify-between p-4 bg-white dark:bg-slate-850 border rounded-2xl shadow-sm hover:shadow-md transition-all relative group cursor-default ${
                      isEditing
                        ? 'border-brand ring-1 ring-brand'
                        : 'border-slate-200 dark:border-slate-750 hover:border-brand/40 dark:hover:border-brand/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="cursor-grab active:cursor-grabbing text-slate-405 hover:text-brand p-1" title="按住拖曳以重新排列">
                          <Move className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-xs text-slate-750 dark:text-slate-200 truncate">{card.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingCardId(isEditing ? null : card.id)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                            isEditing
                              ? 'bg-brand/10 border-brand/20 text-brand'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title="卡片細部設定"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-lg transition-all bg-slate-50 dark:bg-slate-850 hover:bg-rose-50/50"
                          title="刪除卡片"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Placeholder Body */}
                    <div className="flex-1 flex flex-col justify-center items-center border border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 my-2 overflow-hidden relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/5 px-2 py-0.5 rounded-full mb-1">
                        {card.type === 'indicator' ? '🎯 指標卡' : card.type === 'chart' ? '📊 圖表卡' : '🗂️ 資料表卡'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono mb-2">
                        寬 {card.w}x高 {card.h}
                      </span>
                      
                      {/* Canvas Resizer Controls */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-sm z-10">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); adjustWidth(card.id, -1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="減少寬度"
                        >
                          寬-
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); adjustWidth(card.id, 1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="增加寬度"
                        >
                          寬+
                        </button>
                        <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); adjustHeight(card.id, -1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="減少高度"
                        >
                          高-
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); adjustHeight(card.id, 1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="增加高度"
                        >
                          高+
                        </button>
                        <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveCard(card.id, -1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="往前移"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveCard(card.id, 1); }}
                          className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-650 font-extrabold text-[8px] text-slate-600 dark:text-slate-200 cursor-pointer"
                          title="往後移"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate border-t border-slate-50 dark:border-slate-800 pt-1.5 pointer-events-none">
                      {card.type === 'indicator' && `欄位: ${(card.config as any).field} (${(card.config as any).agg})`}
                      {card.type === 'chart' && `欄位: ${(card.config as any).xAxis} ➔ ${(card.config as any).yAxis}`}
                      {card.type === 'data' && `分頁筆數: ${(card.config as any).pageSize} 筆`}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
        </div>

        {/* Card Configuration details panel */}
        {editingCard && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-brand/30 shadow-md shadow-brand/[0.01] space-y-6 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand" />
                <span>卡片細部設定：{editingCard.title}</span>
              </h3>
              <button
                onClick={() => setEditingCardId(null)}
                className="text-xs text-brand hover:text-brand-hover font-extrabold flex items-center gap-1 bg-brand/10 px-2.5 py-1.5 rounded-lg border border-brand/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>完成設定</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">編輯卡片標題</label>
                <input
                  type="text"
                  value={editingCard.title}
                  onChange={(e) => updateCardTitle(editingCard.id, e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">卡片寬度 (畫布欄寬度)</label>
                <select
                  value={editingCard.w || 2}
                  onChange={(e) => {
                    const updated = cards.map((c) => c.id === editingCard.id ? { ...c, w: Number(e.target.value) as any } : c);
                    onUpdateCards(updated);
                  }}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                >
                  <option value={1}>1 欄寬 (16.7% 寬度)</option>
                  <option value={2}>2 欄寬 (33.3% 寬度)</option>
                  <option value={3}>3 欄寬 (50% 寬度)</option>
                  <option value={4}>4 欄寬 (66.7% 寬度)</option>
                  <option value={5}>5 欄寬 (83.3% 寬度)</option>
                  <option value={6}>6 欄寬 (100% 滿版)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">卡片高度</label>
                <select
                  value={editingCard.h || 'auto'}
                  onChange={(e) => {
                    const updated = cards.map((c) => c.id === editingCard.id ? { ...c, h: e.target.value as any } : c);
                    onUpdateCards(updated);
                  }}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                >
                  <option value="auto">自動高度 (h-fit)</option>
                  <option value="sm">矮卡片 (sm)</option>
                  <option value="md">中等卡片 (md)</option>
                  <option value="lg">高卡片 (lg)</option>
                </select>
              </div>

              {/* Indicator Configurations */}
              {editingCard.type === 'indicator' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">運算欄位</label>
                    <select
                      value={(editingCard.config as any).field}
                      onChange={(e) => updateCardConfig(editingCard.id, { field: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                    >
                      {columns.map((col) => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">計算方法</label>
                    <select
                      value={(editingCard.config as any).agg}
                      onChange={(e) => updateCardConfig(editingCard.id, { agg: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                    >
                      <option value="sum">加總 (Sum)</option>
                      <option value="avg">平均 (Average)</option>
                      <option value="min">最小值 (Min)</option>
                      <option value="max">最大值 (Max)</option>
                      <option value="count">計數筆數 (Count)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">數字前綴 (Prefix)</label>
                    <input
                      type="text"
                      placeholder="例如：$, NT$"
                      value={(editingCard.config as any).prefix || ''}
                      onChange={(e) => updateCardConfig(editingCard.id, { prefix: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">數字後綴 (Suffix)</label>
                    <input
                      type="text"
                      placeholder="例如：元, %, 筆"
                      value={(editingCard.config as any).suffix || ''}
                      onChange={(e) => updateCardConfig(editingCard.id, { suffix: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                    />
                  </div>
                </>
              )}

              {/* Chart Configurations */}
              {editingCard.type === 'chart' && (() => {
                const conf = editingCard.config as any;
                const isProgressOrOverlap = conf.type === 'bar-overlap' || conf.type === 'progress-ring';
                
                return (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">圖表類型</label>
                      <select
                        value={conf.type}
                        onChange={(e) => updateCardConfig(editingCard.id, { type: e.target.value })}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                      >
                        <option value="bar">📊 直條圖 (Bar Chart)</option>
                        <option value="pie">🍕 圓餅圖 (Pie Chart)</option>
                        <option value="line">📈 折線圖 (Line Chart)</option>
                        <option value="line-horizontal">➖ 橫條圖 (Horizontal Bar)</option>
                        <option value="area">🏔️ 面積圖 (Area Chart)</option>
                        <option value="bar-overlap">🪜 重疊嵌套長條圖 (Actual / Plan)</option>
                        <option value="progress-ring">⭕ 環狀進度圈 (Progress Ring)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">X 軸 (類別/維度)</label>
                      <select
                        value={conf.xAxis}
                        onChange={(e) => updateCardConfig(editingCard.id, { xAxis: e.target.value })}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                      >
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                        {isProgressOrOverlap ? 'Y 軸 (實際值 Actual)' : 'Y 軸 (度量數值)'}
                      </label>
                      <select
                        value={conf.yAxis}
                        onChange={(e) => updateCardConfig(editingCard.id, { yAxis: e.target.value })}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                      >
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">計算方法 (Y 軸 aggregation)</label>
                      <select
                        value={conf.agg}
                        onChange={(e) => updateCardConfig(editingCard.id, { agg: e.target.value })}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                      >
                        <option value="sum">加總 (Sum)</option>
                        <option value="avg">平均 (Average)</option>
                        <option value="min">最小值 (Min)</option>
                        <option value="max">最大值 (Max)</option>
                        <option value="count">交易筆數計數 (Count)</option>
                      </select>
                    </div>

                    {/* Target / Plan values settings */}
                    {isProgressOrOverlap && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 space-y-3 col-span-1 md:col-span-2">
                        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200">目標值 (Plan / Target) 設定</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">目標值來源</label>
                            <select
                              value={conf.isPlanStatic ? 'static' : 'field'}
                              onChange={(e) => updateCardConfig(editingCard.id, { 
                                isPlanStatic: e.target.value === 'static',
                                planField: e.target.value === 'field' ? (conf.planField || columns[0]?.name) : undefined,
                                staticPlanValue: e.target.value === 'static' ? (conf.staticPlanValue || 100) : undefined
                              })}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                            >
                              <option value="field">📊 資料表欄位 (Database Column)</option>
                              <option value="static">🔢 固定數值 (Static Target)</option>
                            </select>
                          </div>

                          {conf.isPlanStatic ? (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">目標數值</label>
                              <input
                                type="number"
                                value={conf.staticPlanValue !== undefined ? conf.staticPlanValue : 100}
                                onChange={(e) => updateCardConfig(editingCard.id, { staticPlanValue: Number(e.target.value) })}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">選擇目標值欄位</label>
                              <select
                                value={conf.planField || ''}
                                onChange={(e) => updateCardConfig(editingCard.id, { planField: e.target.value })}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                              >
                                <option value="">-- 選擇目標欄位 --</option>
                                {columns.map((col) => (
                                  <option key={col.name} value={col.name}>{col.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {conf.type === 'progress-ring' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">環狀圈類型</label>
                            <select
                              value={conf.ringType || 'full'}
                              onChange={(e) => updateCardConfig(editingCard.id, { ringType: e.target.value as any })}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                            >
                              <option value="full">⭕ 全圓環 (Full Circle)</option>
                              <option value="half">🌙 半圓環 (Half Circle / Gauge)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Threshold / Ranges settings */}
                    {isProgressOrOverlap && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 space-y-3 col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!conf.hasThreshold}
                              onChange={(e) => updateCardConfig(editingCard.id, { 
                                hasThreshold: e.target.checked,
                                thresholds: e.target.checked ? (conf.thresholds || [
                                  { value: 60, color: '#f87171', label: '落後' },
                                  { value: 90, color: '#fbbf24', label: '尚可' },
                                  { value: 100, color: '#34d399', label: '達標' }
                                ]) : undefined
                              })}
                              className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                            />
                            <span>啟用區間閥值 (Thresholds / Ranges)</span>
                          </label>
                        </div>

                        {conf.hasThreshold && (
                          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1">
                              * 進度達到該數值時，圖表將採用該警示色。長條圖亦會繪製對應背景色區間。
                            </div>
                            
                            {(conf.thresholds || []).map((th: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  placeholder="值"
                                  value={th.value}
                                  onChange={(e) => {
                                    const nextThs = [...(conf.thresholds || [])];
                                    nextThs[idx] = { ...nextThs[idx], value: Number(e.target.value) };
                                    updateCardConfig(editingCard.id, { thresholds: nextThs });
                                  }}
                                  className="w-16 text-center text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 focus:ring-1 focus:ring-brand outline-none"
                                />
                                <select
                                  value={th.color}
                                  onChange={(e) => {
                                    const nextThs = [...(conf.thresholds || [])];
                                    nextThs[idx] = { ...nextThs[idx], color: e.target.value };
                                    updateCardConfig(editingCard.id, { thresholds: nextThs });
                                  }}
                                  className="w-20 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 focus:ring-1 focus:ring-brand outline-none"
                                >
                                  <option value="#f87171">🔴 紅色</option>
                                  <option value="#fbbf24">🟡 黃色</option>
                                  <option value="#34d399">🟢 綠色</option>
                                  <option value="#60a5fa">🔵 藍色</option>
                                  <option value="#a78bfa">🟣 紫色</option>
                                  <option value="#94a3b8">⚪ 灰色</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="標籤"
                                  value={th.label}
                                  onChange={(e) => {
                                    const nextThs = [...(conf.thresholds || [])];
                                    nextThs[idx] = { ...nextThs[idx], label: e.target.value };
                                    updateCardConfig(editingCard.id, { thresholds: nextThs });
                                  }}
                                  className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextThs = (conf.thresholds || []).filter((_: any, i: number) => i !== idx);
                                    updateCardConfig(editingCard.id, { thresholds: nextThs });
                                  }}
                                  className="text-rose-500 hover:text-rose-600 text-xs font-bold px-1.5 py-1 cursor-pointer"
                                >
                                  刪
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const nextThs = [...(conf.thresholds || []), { value: 100, color: '#34d399', label: '優秀' }];
                                updateCardConfig(editingCard.id, { thresholds: nextThs });
                              }}
                              className="w-full text-center text-xs border border-dashed border-slate-200 dark:border-slate-700/60 text-slate-500 hover:text-brand dark:text-slate-400 py-1.5 rounded-lg hover:border-brand/40 transition-all cursor-pointer mt-1 font-semibold"
                            >
                              + 新增閥值區間
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Data Table Configurations */}
              {editingCard.type === 'data' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">分頁筆數 (Page Size)</label>
                    <select
                      value={(editingCard.config as any).pageSize}
                      onChange={(e) => updateCardConfig(editingCard.id, { pageSize: Number(e.target.value) })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                    >
                      <option value={5}>5 筆</option>
                      <option value={10}>10 筆</option>
                      <option value={20}>20 筆</option>
                      <option value={50}>50 筆</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">分組彙總欄位 (Group By)</label>
                    <select
                      value={(editingCard.config as any).groupBy || 'raw_data'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextGroupBy = val === 'raw_data' ? undefined : val;
                        
                        // Automatically check and prepend the group-by column to fields
                        let nextFields = [...((editingCard.config as any).fields || [])];
                        if (nextGroupBy) {
                          nextFields = nextFields.filter((f: string) => f !== nextGroupBy);
                          nextFields = [nextGroupBy, ...nextFields];
                        }
                        
                        updateCardConfig(editingCard.id, { 
                          groupBy: nextGroupBy,
                          groupInterval: 'none', // Reset interval
                          fields: nextFields
                        });
                      }}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                    >
                      <option value="raw_data">🗂️ 原始明細資料 (Raw Data)</option>
                      {columns.map((c: any) => (
                        <option key={c.name} value={c.name}>📊 依「{c.name}」分組彙總</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const grp = (editingCard.config as any).groupBy;
                    if (!grp || grp === 'raw_data') return null;
                    const colDef = columns.find((c: any) => c.name === grp);
                    if (!colDef) return null;
                    
                    if (colDef.type === 'date') {
                      return (
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">日期分群維度 (Date Interval)</label>
                          <select
                            value={(editingCard.config as any).groupInterval || 'none'}
                            onChange={(e) => updateCardConfig(editingCard.id, { groupInterval: e.target.value as any })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                          >
                            <option value="none">📅 不分群 (Raw Date)</option>
                            <option value="week">📅 按週 (Weekly)</option>
                            <option value="month">📅 按月 (Monthly)</option>
                            <option value="year">📅 按年 (Yearly)</option>
                          </select>
                        </div>
                      );
                    }
                    
                    if (colDef.type === 'number') {
                      return (
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">數值分群區間 (Number Range)</label>
                          <select
                            value={(editingCard.config as any).groupInterval || 'none'}
                            onChange={(e) => updateCardConfig(editingCard.id, { groupInterval: e.target.value as any })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand focus:outline-none"
                          >
                            <option value="none">🔢 不分群 (Raw Value)</option>
                            <option value="range">🔢 自動劃分 5 個數值等距區間</option>
                          </select>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {(() => {
                    const config = editingCard.config as any;
                    const currentFields = config.fields || [];
                    const aggTypeMap = config.aggTypeMap || {};
                    const isGrouped = config.groupBy && config.groupBy !== 'raw_data';
                    const groupField = config.groupBy;
                    
                    // Filter checked columns in the actual spreadsheet columns order
                    const checkedCols = currentFields.filter((name: string) => columns.some((c: any) => c.name === name));
                    // Get columns that are not checked
                    const uncheckedCols = columns.filter((c: any) => !currentFields.includes(c.name)).map((c: any) => c.name);
                    
                    const toggleCol = (name: string, isChecked: boolean) => {
                      let nextFields: string[];
                      if (isChecked) {
                        nextFields = currentFields.filter((f: string) => f !== name);
                      } else {
                        nextFields = [...currentFields, name];
                      }
                      updateCardConfig(editingCard.id, { fields: nextFields });
                    };
                    
                    const moveField = (field: string, direction: number) => {
                      const index = currentFields.indexOf(field);
                      if (index === -1) return;
                      const newIndex = index + direction;
                      if (newIndex < 0 || newIndex >= currentFields.length) return;
                      
                      const nextFields = [...currentFields];
                      nextFields[index] = nextFields[newIndex];
                      nextFields[newIndex] = field;
                      
                      updateCardConfig(editingCard.id, { fields: nextFields });
                    };

                    const changeAggType = (colName: string, type: string) => {
                      const nextMap = { ...aggTypeMap, [colName]: type };
                      updateCardConfig(editingCard.id, { aggTypeMap: nextMap });
                    };

                    return (
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">呈現的資料欄位勾選與排序</label>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-855 rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto">
                          {checkedCols.map((name: string, idx: number) => {
                            const colDef = columns.find((c: any) => c.name === name);
                            const isNum = colDef?.type === 'number';
                            const currentAgg = aggTypeMap[name] || (isNum ? 'sum' : 'none');
                            const showAggDropdown = isGrouped && name !== groupField;

                            return (
                              <div key={name} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-2 rounded-lg gap-2 group hover:border-brand/40 transition-all">
                                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none truncate flex-1">
                                  <input
                                    type="checkbox"
                                    checked={true}
                                    onChange={() => toggleCol(name, true)}
                                    className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                                  />
                                  <span className="truncate font-semibold">{name}</span>
                                </label>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                  {showAggDropdown && (
                                    <select
                                      value={currentAgg}
                                      onChange={(e) => changeAggType(name, e.target.value)}
                                      className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-brand focus:outline-none font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      <option value="none">無 (去重字串)</option>
                                      <option value="sum">加總 (SUM)</option>
                                      <option value="count">計數 (COUNT)</option>
                                      <option value="avg">平均 (AVG)</option>
                                    </select>
                                  )}

                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveField(name, -1)}
                                      className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs"
                                      title="向上移動"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === checkedCols.length - 1}
                                      onClick={() => moveField(name, 1)}
                                      className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs"
                                      title="向下移動"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {checkedCols.length > 0 && uncheckedCols.length > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">未選取欄位</div>
                          )}
                          
                          {uncheckedCols.map((name: string) => (
                            <div key={name} className="flex items-center bg-white/40 dark:bg-slate-800/40 border border-transparent p-2 rounded-lg gap-2">
                              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none truncate flex-1">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => toggleCol(name, false)}
                                  className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                                />
                                <span className="truncate">{name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

            </div>
          </div>
        )}
      </div>

    </div>
  );
};
