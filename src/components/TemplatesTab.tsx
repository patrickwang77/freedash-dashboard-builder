import React from 'react';
import type { DataColumn, DashboardCard, DashboardTemplate } from '../types';
import { BarChart3, PieChart, LineChart, Table, Check, Layers, Trash2 } from 'lucide-react';

interface TemplatesTabProps {
  columns: DataColumn[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string, cards: DashboardCard[], slicers: string[]) => void;
  activeSlicers: string[];
  onSlicersChange: (slicers: string[]) => void;
  customTemplates?: DashboardTemplate[];
  onDeleteCustomTemplate?: (templateId: string) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  columns,
  selectedTemplateId,
  onSelectTemplate,
  activeSlicers,
  onSlicersChange,
  customTemplates = [],
  onDeleteCustomTemplate
}) => {
  // Helper to extract columns of specific types
  const numericCols = columns.filter((c) => c.type === 'number').map((c) => c.name);
  const textCols = columns.filter((c) => c.type === 'text').map((c) => c.name);
  const dateCols = columns.filter((c) => c.type === 'date').map((c) => c.name);
  const boolCols = columns.filter((c) => c.type === 'boolean').map((c) => c.name);

  // Fallback defaults if columns are missing
  const defaultNum = numericCols[0] || '';
  const secondNum = numericCols[1] || defaultNum;
  const defaultText = textCols[0] || '';
  const secondText = textCols[1] || defaultText;
  const defaultDate = dateCols[0] || defaultText;
  const defaultBool = boolCols[0] || '';

  // Define the 4 adaptive templates
  const templates = [
    {
      id: 'template_executive',
      name: '👑 核心決策經營看板 (Executive Overview)',
      description: '最經典的主管經營決策佈局。頂部放置三大營運核心KPI，中間為不對稱配置的主視覺折線趨勢圖 (寬4) 與類別佔比圓餅圖 (寬2)，底端呈現完整明細表。',
      slicers: [defaultText, defaultBool].filter(Boolean) as string[],
      cards: [
        {
          id: 'kpi_total_sales',
          type: 'indicator' as const,
          title: `總${defaultNum || '營收'}`,
          w: 2 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'sum' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_avg_price',
          type: 'indicator' as const,
          title: `平均${secondNum || '數值'}`,
          w: 2 as const,
          h: 'auto' as const,
          config: { field: secondNum, agg: 'avg' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_count_transactions',
          type: 'indicator' as const,
          title: '總交易筆數',
          w: 2 as const,
          h: 'auto' as const,
          config: { field: defaultNum || columns[0]?.name || '', agg: 'count' as const, prefix: '', suffix: ' 筆' }
        },
        {
          id: 'chart_line_sales_trend',
          type: 'chart' as const,
          title: `營運趨勢走向分析`,
          w: 4 as const,
          h: 'auto' as const,
          config: {
            type: 'line' as const,
            xAxis: defaultDate || defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'chart_pie_category',
          type: 'chart' as const,
          title: `${defaultText || '類別'}比例`,
          w: 2 as const,
          h: 'auto' as const,
          config: {
            type: 'pie' as const,
            xAxis: defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'table_details',
          type: 'data' as const,
          title: '明細數據資料表',
          w: 6 as const,
          h: 'auto' as const,
          config: {
            pageSize: 10,
            fields: columns.slice(0, 8).map((c) => c.name)
          }
        }
      ]
    },
    {
      id: 'template_regional',
      name: '⚖️ 雙欄對比與數據分流 (Comparison & Split)',
      description: '適合進行跨維度或跨通路的對比分析。採用完美的左右對稱結構，將垂直長條圖與水平長條圖並列，下方將資料明細表與面積走勢圖並列，實現精準的數據對稱視野。',
      slicers: [secondText || defaultText, defaultBool].filter(Boolean) as string[],
      cards: [
        {
          id: 'kpi_total_sales',
          type: 'indicator' as const,
          title: `累積銷售總額`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'sum' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_avg_price',
          type: 'indicator' as const,
          title: `平均單筆金額`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'avg' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'chart_bar_region_sales',
          type: 'chart' as const,
          title: `直向對比分析`,
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'bar' as const,
            xAxis: secondText || defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'chart_hbar_product_sales',
          type: 'chart' as const,
          title: `橫向分佈排名`,
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'line-horizontal' as const,
            xAxis: defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'table_details',
          type: 'data' as const,
          title: '區域明細對照',
          w: 3 as const,
          h: 'auto' as const,
          config: {
            pageSize: 5,
            fields: columns.slice(0, 6).map((c) => c.name)
          }
        },
        {
          id: 'chart_area_regional_trend',
          type: 'chart' as const,
          title: '業績走勢走向 (面積圖)',
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'area' as const,
            xAxis: defaultDate || defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        }
      ]
    },
    {
      id: 'template_product',
      name: '🛍️ 商品效能與排行分析 (Rank & Detail View)',
      description: '為產品經理與業務人員打造。頂部置放最大與最小指標，中間層將熱銷商品排名水平長條圖與商品明細列表對稱排列，極大化單品效能對照。',
      slicers: [defaultText, secondText].filter(Boolean) as string[],
      cards: [
        {
          id: 'kpi_max_price',
          type: 'indicator' as const,
          title: `單筆最高銷售`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'max' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_min_price',
          type: 'indicator' as const,
          title: `單筆最低銷售`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'min' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'chart_hbar_product_sales',
          type: 'chart' as const,
          title: `${defaultText || '類別'}熱銷排名`,
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'line-horizontal' as const,
            xAxis: defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'table_details',
          type: 'data' as const,
          title: '商品明細清單',
          w: 3 as const,
          h: 'auto' as const,
          config: {
            pageSize: 10,
            fields: columns.slice(0, 6).map((c) => c.name)
          }
        },
        {
          id: 'chart_pie_category',
          type: 'chart' as const,
          title: `銷售佔比圓餅`,
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'pie' as const,
            xAxis: defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'chart_bar_product_qty',
          type: 'chart' as const,
          title: `產品總數分佈`,
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'bar' as const,
            xAxis: defaultText,
            yAxis: secondNum,
            agg: 'sum' as const
          }
        }
      ]
    },
    {
      id: 'template_kpi_tracker',
      name: '📈 營運指標極簡追蹤器 (KPI Tracker)',
      description: '偏好高階數據監控與純粹視覺化的現代看板。以四大 KPI 數值卡開啟頂部，中間為滿版整體業務增長趨勢圖，底部並列類別比例圖與增長折線圖（無表格）。',
      slicers: [defaultText].filter(Boolean) as string[],
      cards: [
        {
          id: 'kpi_total_sales',
          type: 'indicator' as const,
          title: `總銷售額`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'sum' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_avg_price',
          type: 'indicator' as const,
          title: `平均金額`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum, agg: 'avg' as const, prefix: '$', suffix: '' }
        },
        {
          id: 'kpi_count_transactions',
          type: 'indicator' as const,
          title: '總交易量',
          w: 3 as const,
          h: 'auto' as const,
          config: { field: defaultNum || columns[0]?.name || '', agg: 'count' as const, prefix: '', suffix: ' 筆' }
        },
        {
          id: 'kpi_total_qty',
          type: 'indicator' as const,
          title: `累積件數`,
          w: 3 as const,
          h: 'auto' as const,
          config: { field: secondNum, agg: 'sum' as const, prefix: '', suffix: ' 件' }
        },
        {
          id: 'chart_area_tracker_trend',
          type: 'chart' as const,
          title: '整體業務增長走勢 (面積圖)',
          w: 6 as const,
          h: 'auto' as const,
          config: {
            type: 'area' as const,
            xAxis: defaultDate || defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'chart_pie_category',
          type: 'chart' as const,
          title: '佔比比例分佈',
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'pie' as const,
            xAxis: defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        },
        {
          id: 'chart_line_tracker_trend',
          type: 'chart' as const,
          title: '折線波動趨勢',
          w: 3 as const,
          h: 'auto' as const,
          config: {
            type: 'line' as const,
            xAxis: defaultDate || defaultText,
            yAxis: defaultNum,
            agg: 'sum' as const
          }
        }
      ]
    }
  ];

  const handleSlicerToggle = (colName: string) => {
    if (activeSlicers.includes(colName)) {
      onSlicersChange(activeSlicers.filter((s) => s !== colName));
    } else {
      onSlicersChange([...activeSlicers, colName]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {columns.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Layers className="w-12 h-12 text-slate-350 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">請先在第一個 Tab 上傳試算表，系統才能載入對應的佈局範本。</p>
        </div>
      ) : (
        <>
          {/* Layout templates grid */}
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-5">
              選擇智慧自適應儀表板範本
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                     key={tpl.id}
                     onClick={() => onSelectTemplate(tpl.id, tpl.cards, tpl.slicers)}
                     className={`relative p-6 bg-white dark:bg-slate-800 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] hover:shadow-md cursor-pointer ${
                       isSelected
                         ? 'border-brand ring-1 ring-brand shadow-sm shadow-brand/5'
                         : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                     }`}
                  >
                    <div className="space-y-3 mb-6 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-slate-800 dark:text-slate-100">{tpl.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {tpl.description}
                      </p>
                      
                      {/* Visual Mockup Preview */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 grid grid-cols-6 gap-1.5 w-full mt-4 h-28 pointer-events-none">
                        {tpl.id === 'template_executive' && (
                          <>
                            <div className="col-span-2 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-2 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-2 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-4 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <LineChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-2 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <PieChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-6 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <Table className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </>
                        )}
                        {tpl.id === 'template_regional' && (
                          <>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <Table className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <LineChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </>
                        )}
                        {tpl.id === 'template_product' && (
                          <>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <Table className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <PieChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </>
                        )}
                        {tpl.id === 'template_kpi_tracker' && (
                          <>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-3 bg-brand/10 dark:bg-brand/20 border border-brand/20 rounded-lg flex items-center justify-center"><span className="text-[9px] text-brand font-bold">KPI</span></div>
                            <div className="col-span-6 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <LineChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <PieChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="col-span-3 bg-slate-200 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-300/40 dark:border-slate-750/30">
                              <LineChart className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom right selection status */}
                    <div className="w-full flex justify-end">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-lg border border-brand/25">
                          <Check className="w-3.5 h-3.5" />
                          <span>使用中</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 hover:text-slate-600 font-semibold py-1">
                          套用此佈局
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {customTemplates && customTemplates.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-5">
                您的自訂儲存範本 (Your Custom Templates)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customTemplates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`relative p-6 bg-white dark:bg-slate-800 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] hover:shadow-md ${
                        isSelected
                          ? 'border-brand ring-1 ring-brand shadow-sm shadow-brand/5'
                          : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-3 mb-6 w-full">
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 truncate flex-1">{tpl.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteCustomTemplate) onDeleteCustomTemplate(tpl.id);
                            }}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                            title="刪除此自訂範本"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="w-full flex justify-between items-center mt-4">
                        <span className="text-[10px] text-slate-405 font-bold">包含 {tpl.cards.length} 張卡片</span>
                        <button
                          onClick={() => onSelectTemplate(tpl.id, tpl.cards, tpl.slicers || [])}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand/10 text-brand border-brand/25'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                          }`}
                        >
                          {isSelected ? '✓ 使用中' : '套用此佈局'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slicer Config Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-2">
              🎛️ 篩選器欄位選擇 (Slicers)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mb-5 leading-relaxed">
              勾選下列欄位，將其設為全域篩選器。篩選器會以側邊欄卡片形式呈現，供您在第三與第四頁籤即時過濾數據與重新計算圖表。通常適用於文字、日期或布林值欄位。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {columns.map((col) => {
                const isChecked = activeSlicers.includes(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => handleSlicerToggle(col.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      isChecked
                        ? 'border-brand bg-brand/5 text-slate-800 dark:text-white font-semibold'
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xs truncate max-w-[130px]">{col.name}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-brand border-brand text-white' : 'border-slate-300 dark:border-slate-650'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
