import React, { useState, useMemo } from 'react';
import type { DataColumn, DashboardCard, ThemeConfig, CalculatedColumn } from '../types';
import { exportDashboardHTML } from '../utils/exporter';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Download, SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

const bulletBandsPlugin = {
  id: 'bulletBands',
  beforeDraw: (chart: any) => {
    const { ctx, chartArea: { left, right, top }, scales: { y } } = chart;
    const chartOptions = chart.options;
    const thresholds = chartOptions.plugins?.bulletBands?.thresholds;
    const hasThreshold = chartOptions.plugins?.bulletBands?.hasThreshold;
    if (!hasThreshold || !thresholds || thresholds.length === 0) return;

    ctx.save();
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    const yZero = y.getPixelForValue(0);
    let prevY = yZero;

    const toLowOpacity = (hex: string) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, 0.11)`;
    };

    sorted.forEach((th: any) => {
      const currentY = y.getPixelForValue(th.value);
      ctx.fillStyle = toLowOpacity(th.color);
      ctx.fillRect(left, currentY, right - left, prevY - currentY);
      prevY = currentY;
    });

    ctx.fillStyle = toLowOpacity(sorted[sorted.length - 1].color);
    ctx.fillRect(left, top, right - left, prevY - top);

    ctx.restore();
  }
};

interface DashboardTabProps {
  columns: DataColumn[];
  data: any[];
  cards: DashboardCard[];
  theme: ThemeConfig;
  slicers: string[];
  calculatedColumns: CalculatedColumn[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  columns,
  data,
  cards,
  theme,
  slicers,
  calculatedColumns
}) => {
  const [exporting, setExporting] = useState(false);

  // 1. Filter selection state: fieldName -> Set of checked values
  const [filterState, setFilterState] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    slicers.forEach((s) => {
      init[s] = new Set<string>();
    });
    return init;
  });

  // Table paging and search: cardId -> { page, search, sortBy, sortDesc }
  const [tableStates, setTableStates] = useState<Record<string, { page: number; search: string; sortBy?: string; sortDesc?: boolean }>>({});

  // Reset all slicer selections
  const handleResetFilters = () => {
    const reset: Record<string, Set<string>> = {};
    slicers.forEach((s) => {
      reset[s] = new Set<string>();
    });
    setFilterState(reset);
  };

  // Toggle checklist filter item
  const handleFilterToggle = (field: string, value: string) => {
    setFilterState((prev) => {
      const nextSet = new Set(prev[field]);
      if (nextSet.has(value)) {
        nextSet.delete(value);
      } else {
        nextSet.add(value);
      }
      return { ...prev, [field]: nextSet };
    });
  };

  // 2. Evaluate calculated columns in real-time
  const computedData = useMemo(() => {
    return data.map((row) => {
      const newRow = { ...row };
      calculatedColumns.forEach((cc) => {
        const leftVal = Number(newRow[cc.leftField]) || 0;
        const rightVal = cc.isConstant ? Number(cc.rightField) : (Number(newRow[cc.rightField]) || 0);

        let result = 0;
        if (cc.operator === '+') result = leftVal + rightVal;
        else if (cc.operator === '-') result = leftVal - rightVal;
        else if (cc.operator === '*') result = leftVal * rightVal;
        else if (cc.operator === '/') result = rightVal !== 0 ? leftVal / rightVal : 0;

        newRow[cc.name] = result;
      });
      return newRow;
    });
  }, [data, calculatedColumns]);

  // 3. Filter data dynamically
  const filteredData = useMemo(() => {
    return computedData.filter((row) => {
      for (const [field, selectedSet] of Object.entries(filterState)) {
        if (selectedSet && selectedSet.size > 0) {
          const val = String(row[field] !== undefined ? row[field] : '');
          if (!selectedSet.has(val)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [computedData, filterState]);

  // Slicer unique values mapping
  const slicersValues = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    slicers.forEach((field) => {
      const unique = Array.from(new Set(computedData.map((r) => String(r[field] !== undefined ? r[field] : ''))))
        .filter((v) => v !== '')
        .sort();
      mapping[field] = unique;
    });
    return mapping;
  }, [computedData, slicers]);

  // Helper: Card aggregation
  const aggregate = (records: any[], field: string, aggType: string) => {
    if (records.length === 0) return 0;
    const vals = records.map((r) => Number(r[field]) || 0);
    switch (aggType) {
      case 'sum':
        return vals.reduce((a, b) => a + b, 0);
      case 'avg':
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      case 'min':
        return Math.min(...vals);
      case 'max':
        return Math.max(...vals);
      case 'count':
        return records.length;
      default:
        return 0;
    }
  };

  // Color Palettes
  const brandColors: Record<string, string> = {
    earthy: '#2e7d32',
    vibrant: '#2563eb',
    highcontrast: '#0f172a',
    trust: '#1e40af',
    blackwhite: '#334155',
    neon: '#7e22ce',
    pastel: '#db2777'
  };

  const brandColorsLight: Record<string, string> = {
    earthy: '#a3cfbb',
    vibrant: '#f87171',
    highcontrast: '#f59e0b',
    trust: '#34d399',
    blackwhite: '#94a3b8',
    neon: '#06b6d4',
    pastel: '#5eead4'
  };

  const activeBrandColor = theme.name === 'custom'
    ? (theme.customPrimary || '#1e40af')
    : (brandColors[theme.name] || brandColors.trust);

  const activeBrandLightColor = theme.name === 'custom'
    ? (theme.customSecondary || '#34d399')
    : (brandColorsLight[theme.name] || brandColorsLight.trust);

  // Chart configuration builder
  const buildChartProps = (card: DashboardCard) => {
    const config = card.config as any;
    const isDark = document.documentElement.classList.contains('dark');
    
    // Group records by X axis
    const groups: Record<string, any[]> = {};
    filteredData.forEach((row) => {
      const xVal = String(row[config.xAxis] !== undefined ? row[config.xAxis] : '(Blank)');
      if (!groups[xVal]) groups[xVal] = [];
      groups[xVal].push(row);
    });

    const labels = Object.keys(groups).sort();
    const values = labels.map((label) => aggregate(groups[label], config.yAxis, config.agg));

    const isPie = config.type === 'pie';
    const isProgress = config.type === 'progress-ring';
    const isOverlap = config.type === 'bar-overlap';
    const isHorizontal = config.type === 'line-horizontal';

    const hexToRgba = (hex: string, opacity: number) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const pieThemeColors: Record<string, string[]> = {
      earthy: ['#2e7d32', '#4b7c59', '#78909c', '#607d8b', '#8d6e63', '#a1887f', '#d7ccc8', '#c5e1a5', '#e6ee9c', '#fff9c4'],
      vibrant: ['#2563eb', '#3b82f6', '#ef4444', '#f57c00', '#fbc02d', '#059669', '#10b981', '#7c3aed', '#ec4899', '#06b6d4'],
      highcontrast: ['#0f172a', '#1e293b', '#334155', '#fbbf24', '#d97706', '#92400e', '#7c3aed', '#5b21b6', '#0f766e', '#0d9488'],
      trust: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#34d399', '#a7f3d0', '#0d9488', '#14b8a6'],
      blackwhite: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#94a3b8'],
      neon: ['#a21caf', '#d946ef', '#06b6d4', '#22d3ee', '#f43f5e', '#fb7185', '#ec4899', '#f472b6', '#7c3aed', '#a78bfa'],
      pastel: ['#fbcfe8', '#e9d5ff', '#ccfbf1', '#c084fc', '#f472b6', '#2dd4bf', '#fed7aa', '#fef08a', '#bfdbfe', '#a7f3d0']
    };

    const activePieColors = theme.name === 'custom'
      ? [theme.customPrimary || '#1e40af', theme.customSecondary || '#34d399', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#f43f5e', '#a7f3d0', '#60a5fa']
      : (pieThemeColors[theme.name] || pieThemeColors.trust);

    let chartData: any;
    let chartOptions: any;

    const labelColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)';

    if (isProgress) {
      // Progress Ring: single overall actual vs plan
      const actual = aggregate(filteredData, config.yAxis, config.agg);
      const plan = config.isPlanStatic
        ? (config.staticPlanValue || 100)
        : aggregate(filteredData, config.planField || config.yAxis, config.agg);
      const pct = plan > 0 ? (actual / plan) * 100 : 0;

      let ringColor = activeBrandColor;
      if (config.hasThreshold && config.thresholds && config.thresholds.length > 0) {
        const sorted = [...config.thresholds].sort((a, b) => a.value - b.value);
        ringColor = sorted[0].color;
        for (const th of sorted) {
          if (pct >= th.value) ringColor = th.color;
        }
      }

      chartData = {
        labels: ['實際值 (Actual)', '未達標 (Remaining)'],
        datasets: [
          {
            data: [actual, Math.max(0, plan - actual)],
            backgroundColor: [
              ringColor,
              isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(226, 232, 240, 0.65)'
            ],
            borderColor: isDark ? '#1e293b' : '#fff',
            borderWidth: 1.5,
            cutout: '80%'
          }
        ]
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        circumference: config.ringType === 'half' ? 180 : 360,
        rotation: config.ringType === 'half' ? 270 : 0,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      };

    } else if (isOverlap) {
      // Overlapping Bar Chart: Plan (wide, light) + Actual (narrow, dark/colored)
      const planValues = labels.map((label) => {
        if (config.isPlanStatic) return config.staticPlanValue || 0;
        return aggregate(groups[label], config.planField || config.yAxis, config.agg);
      });

      const actualValues = values;

      const actColors = actualValues.map((act, idx) => {
        const plan = planValues[idx] || 1;
        const pct = (act / plan) * 100;
        if (config.hasThreshold && config.thresholds && config.thresholds.length > 0) {
          const sorted = [...config.thresholds].sort((a, b) => a.value - b.value);
          let matchColor = sorted[0].color;
          for (const th of sorted) {
            if (pct >= th.value) matchColor = th.color;
          }
          return matchColor;
        }
        return activeBrandLightColor;
      });

      chartData = {
        labels,
        datasets: [
          {
            label: '目標值 (Plan)',
            data: planValues,
            backgroundColor: isDark ? 'rgba(71, 85, 105, 0.35)' : 'rgba(226, 232, 240, 0.75)',
            borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.7)',
            borderWidth: 1,
            barPercentage: 0.82,
            categoryPercentage: 0.75,
            grouped: false,
            order: 2
          },
          {
            label: '實際值 (Actual)',
            data: actualValues,
            backgroundColor: actColors,
            borderColor: actColors.map(c => hexToRgba(c, 0.8)),
            borderWidth: 1.5,
            barPercentage: 0.46,
            categoryPercentage: 0.75,
            grouped: false,
            order: 1
          }
        ]
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: labelColor, font: { size: 10 } }
          },
          bulletBands: {
            hasThreshold: config.hasThreshold,
            thresholds: config.thresholds
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: { size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: { size: 10 } }
          }
        }
      };

    } else {
      // Standard Charts
      const bgColors = isPie
        ? activePieColors
        : config.type === 'area'
          ? hexToRgba(activeBrandColor, 0.15)
          : activeBrandColor;

      chartData = {
        labels,
        datasets: [
          {
            label: `${config.yAxis} (${config.agg === 'sum' ? '加總' : config.agg === 'avg' ? '平均' : config.agg === 'count' ? '筆數' : config.agg})`,
            data: values,
            backgroundColor: bgColors,
            borderColor: isPie ? (isDark ? '#1e293b' : '#fff') : activeBrandColor,
            borderWidth: 1.5,
            fill: config.type === 'area',
            tension: config.type === 'line' || config.type === 'area' ? 0.35 : 0
          }
        ]
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isPie,
            labels: { color: labelColor, font: { size: 10 } }
          }
        },
        indexAxis: isHorizontal ? ('y' as const) : ('x' as const),
        scales: isPie
          ? {}
          : {
              x: {
                grid: { color: gridColor },
                ticks: { color: labelColor, font: { size: 10 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: labelColor, font: { size: 10 } }
              }
            }
      };
    }

    return { chartData, chartOptions };
  };

  // Export Dashboard trigger
  const handleExport = async () => {
    setExporting(true);
    try {
      const html = await exportDashboardHTML({
        columns,
        data,
        cards,
        theme,
        slicers,
        calculatedColumns
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dashboard-${theme.name}-${Date.now()}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('產生 HTML 儀表板失敗！');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      
      {/* Slicers Filters sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand" />
              <span>📊 篩選過濾器</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-0.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>清除全部</span>
            </button>
          </div>

          <div className="space-y-6">
            {slicers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">尚無啟用任何篩選器，可至範本頁面勾選啟用。</p>
            ) : (
              slicers.map((field) => {
                const vals = slicersValues[field] || [];
                const selectedSet = filterState[field] || new Set();
                return (
                  <div key={field} className="space-y-2 border-b border-slate-100 dark:border-slate-850 pb-4 last:border-0 last:pb-0">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{field}</h4>
                    <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5">
                      {vals.map((v) => {
                        const isChecked = selectedSet.has(v);
                        return (
                          <label
                            key={v}
                            className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 p-1 rounded transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleFilterToggle(field, v)}
                              className="rounded border-slate-300 text-brand focus:ring-brand w-3.5 h-3.5"
                            />
                            <span className="truncate">{v === 'true' ? '是' : v === 'false' ? '否' : v}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Export & summary header */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-105 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              📊 儀表板看板預覽
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              當前篩選資料：共計 <strong className="text-brand">{filteredData.length}</strong> / {data.length} 筆
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || data.length === 0}
            className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm shadow-brand/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>下載中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>匯出離線 HTML 儀表板</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard Grid cards */}
        {cards.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <SlidersHorizontal className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">此佈局無任何卡片，請先到第二或第三頁籤設定卡片。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {cards.map((card) => {
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
                ? 'h-fit min-h-[140px]'
                : card.h === 'sm'
                  ? 'min-h-[140px] justify-between'
                  : card.h === 'md'
                    ? 'min-h-[290px]'
                    : 'min-h-[420px]';

              if (card.type === 'indicator') {
                const config = card.config as any;
                const value = aggregate(filteredData, config.field, config.agg);
                
                const displayVal = config.agg === 'count'
                  ? value.toLocaleString()
                  : config.agg === 'avg'
                    ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    : Math.round(value).toLocaleString();

                return (
                  <div
                    key={card.id}
                    className={`${widthClass} ${heightClass} bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col`}
                  >
                    <h3 className="font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">
                      {card.title}
                    </h3>
                    <div className="flex items-baseline gap-1 py-3">
                      {config.prefix && <span className="text-lg font-medium text-slate-400">{config.prefix}</span>}
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        {displayVal}
                      </span>
                      {config.suffix && <span className="text-xs font-semibold text-slate-400 ml-1">{config.suffix}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-50 dark:border-slate-850 pt-2 mt-2">
                      運算欄位：{config.field} ({config.agg === 'sum' ? '加總' : config.agg === 'avg' ? '平均' : config.agg === 'count' ? '筆數' : config.agg})
                    </div>
                  </div>
                );
              }

              if (card.type === 'chart') {
                const config = card.config as any;
                const { chartData, chartOptions } = buildChartProps(card);
                const chartHeightClass = card.h === 'lg' ? 'h-96' : card.h === 'sm' ? 'h-28' : 'h-60';

                return (
                  <div
                    key={card.id}
                    className={`${widthClass} ${heightClass} bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-105 dark:border-slate-700/60 flex flex-col justify-between`}
                  >
                    <h3 className="font-bold text-slate-750 dark:text-slate-205 text-sm mb-4">
                      {card.title}
                    </h3>
                    <div className={`${chartHeightClass} relative w-full flex items-center justify-center`}>
                      {config.type === 'pie' ? (
                        <Doughnut data={chartData} options={chartOptions} />
                      ) : config.type === 'progress-ring' ? (
                        <>
                          <Doughnut data={chartData} options={chartOptions} />
                          {(() => {
                            const actual = aggregate(filteredData, config.yAxis, config.agg);
                            const plan = config.isPlanStatic 
                              ? (config.staticPlanValue || 100) 
                              : aggregate(filteredData, config.planField || config.yAxis, config.agg);
                            const pct = plan > 0 ? (actual / plan) * 100 : 0;
                            
                            return (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                  {pct.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                  實際: {Math.round(actual).toLocaleString()} / 目標: {Math.round(plan).toLocaleString()}
                                </span>
                              </div>
                            );
                          })()}
                        </>
                      ) : config.type === 'line' || config.type === 'area' ? (
                        <Line data={chartData} options={chartOptions} />
                      ) : config.type === 'bar-overlap' ? (
                        <Bar data={chartData} options={chartOptions} plugins={[bulletBandsPlugin]} />
                      ) : (
                        <Bar data={chartData} options={chartOptions} />
                      )}
                    </div>
                  </div>
                );
              }

              if (card.type === 'data') {
                const config = card.config as any;
                const state = tableStates[card.id] || { page: 1, search: '', sortBy: undefined, sortDesc: false };

                // Determine table columns
                const isGrouped = config.groupBy && config.groupBy !== 'raw_data';
                const groupField = config.groupBy;
                const aggFields = config.aggFields || [];
                
                let tableCols: string[] = [];
                if (!isGrouped) {
                  tableCols = config.fields && config.fields.length > 0 ? config.fields : columns.map(c => c.name);
                } else {
                  const otherChecked = (config.fields || []).filter((f: string) => f !== groupField && !aggFields.includes(f));
                  tableCols = [groupField, ...aggFields, ...otherChecked];
                }

                // Apply search in React
                let sourceData = filteredData;
                if (state.search.trim() !== '') {
                  const query = state.search.toLowerCase();
                  sourceData = sourceData.filter((row) =>
                    columns.some((col) =>
                      String(row[col.name] ?? '').toLowerCase().includes(query)
                    )
                  );
                }

                // Apply grouping if not raw data
                let tData = sourceData;
                if (isGrouped) {
                  const groupColDef = columns.find(c => c.name === groupField);
                  const groupColType = groupColDef?.type || 'text';
                  
                  let numericBands: { min: number; max: number; label: string }[] = [];
                  if (groupColType === 'number' && config.groupInterval === 'range') {
                    const nums = sourceData.map(r => Number(r[groupField])).filter(n => !isNaN(n));
                    if (nums.length > 0) {
                      const minVal = Math.min(...nums);
                      const maxVal = Math.max(...nums);
                      const step = (maxVal - minVal) / 5;
                      numericBands = Array.from({ length: 5 }, (_, idx) => {
                        const start = minVal + idx * step;
                        const end = idx === 4 ? maxVal : minVal + (idx + 1) * step;
                        return {
                          min: start,
                          max: end,
                          label: `${Math.round(start).toLocaleString()} - ${Math.round(end).toLocaleString()}`
                        };
                      });
                    }
                  }

                  const getGroupKey = (val: any) => {
                    if (val === undefined || val === null || val === '') return '(空白)';
                    
                    if (groupColType === 'date' || val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
                      const d = new Date(val);
                      if (!isNaN(d.getTime())) {
                        if (config.groupInterval === 'year') {
                          return `${d.getFullYear()}年`;
                        }
                        if (config.groupInterval === 'month') {
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          return `${d.getFullYear()}年${m}月`;
                        }
                        if (config.groupInterval === 'week') {
                          const day = d.getDay();
                          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                          const monday = new Date(d.setDate(diff));
                          const mm = String(monday.getMonth() + 1).padStart(2, '0');
                          const dd = String(monday.getDate()).padStart(2, '0');
                          return `${monday.getFullYear()}/${mm}/${dd} 週`;
                        }
                      }
                    }
                    
                    if (groupColType === 'number') {
                      if (config.groupInterval === 'range' && numericBands.length > 0) {
                        const num = Number(val);
                        const band = numericBands.find(b => num >= b.min && num <= b.max);
                        if (band) return band.label;
                      }
                    }
                    
                    return String(val);
                  };

                  const groups: Record<string, any[]> = {};
                  sourceData.forEach(row => {
                    const rawVal = row[groupField];
                    const key = getGroupKey(rawVal);
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(row);
                  });

                  tData = Object.keys(groups).map(key => {
                    const groupRows = groups[key];
                    const rowObj: Record<string, any> = {
                      [groupField]: key
                    };
                    
                    tableCols.forEach(col => {
                      if (col === groupField) return;
                      const cDef = columns.find(c => c.name === col);
                      const isNumeric = cDef?.type === 'number';
                      
                      if (aggFields.includes(col) || isNumeric) {
                        rowObj[col] = groupRows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
                      } else {
                        const uniqueVals = Array.from(new Set(groupRows.map(r => String(r[col] ?? '')).filter(Boolean)));
                        if (uniqueVals.length === 0) {
                          rowObj[col] = '';
                        } else if (uniqueVals.length <= 3) {
                          rowObj[col] = uniqueVals.join(', ');
                        } else {
                          rowObj[col] = `${uniqueVals.slice(0, 3).join(', ')} 等 ${uniqueVals.length} 項`;
                        }
                      }
                    });
                    
                    return rowObj;
                  });
                }

                // Apply sorting in React
                if (state.sortBy) {
                  const sortByField = state.sortBy;
                  const desc = !!state.sortDesc;
                  tData = [...tData].sort((a, b) => {
                    const valA = a[sortByField];
                    const valB = b[sortByField];

                    if (valA === valB) return 0;
                    if (valA === undefined || valA === null) return 1;
                    if (valB === undefined || valB === null) return -1;

                    if (typeof valA === 'number' && typeof valB === 'number') {
                      return desc ? valB - valA : valA - valB;
                    }

                    const strA = String(valA).toLowerCase();
                    const strB = String(valB).toLowerCase();
                    return desc ? strB.localeCompare(strA) : strA.localeCompare(strB);
                  });
                }

                // Compute Subtotal Row values
                const subtotalObj: Record<string, any> = {};
                if (isGrouped && tData.length > 0) {
                  subtotalObj[groupField] = '小計 (Total)';
                  tableCols.forEach(col => {
                    if (col === groupField) return;
                    const cDef = columns.find(c => c.name === col);
                    const isNumeric = cDef?.type === 'number';
                    
                    if (aggFields.includes(col) || isNumeric) {
                      subtotalObj[col] = tData.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
                    } else {
                      subtotalObj[col] = '';
                    }
                  });
                }

                const total = tData.length;
                const pages = Math.max(1, Math.ceil(total / config.pageSize));
                const activePage = Math.min(state.page, pages);
                const startIdx = (activePage - 1) * config.pageSize;
                const pageData = tData.slice(startIdx, startIdx + config.pageSize);

                const handleSearchChange = (val: string) => {
                  setTableStates((prev) => ({
                    ...prev,
                    [card.id]: { page: 1, search: val, sortBy: state.sortBy, sortDesc: state.sortDesc }
                  }));
                };

                const handleSortChange = (field: string) => {
                  const isCurrent = state.sortBy === field;
                  const nextDesc = isCurrent ? !state.sortDesc : false;
                  const nextSortBy = isCurrent && state.sortDesc ? undefined : field;

                  setTableStates((prev) => ({
                    ...prev,
                    [card.id]: {
                      ...state,
                      page: 1,
                      sortBy: nextSortBy,
                      sortDesc: nextSortBy ? nextDesc : false
                    }
                  }));
                };

                const handlePageChange = (direction: number) => {
                  const nextPage = activePage + direction;
                  if (nextPage >= 1 && nextPage <= pages) {
                    setTableStates((prev) => ({
                      ...prev,
                      [card.id]: { ...state, page: nextPage }
                    }));
                  }
                };

                return (
                  <div
                    key={card.id}
                    className={`${widthClass} ${heightClass} bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col`}
                  >
                    <h3 className="font-bold text-slate-750 dark:text-slate-205 text-sm mb-4">
                      {card.title}
                    </h3>
                    
                    {/* Search and summary bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="搜尋此表格..."
                        value={state.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full sm:w-60 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-medium">
                        顯示 {total === 0 ? 0 : startIdx + 1} - {Math.min(startIdx + config.pageSize, total)} 筆，共 {total} 筆
                      </span>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
                      {total === 0 ? (
                        <div className="text-center text-slate-450 dark:text-slate-500 py-12 text-xs font-semibold">
                          無符合篩選條件的資料
                        </div>
                      ) : (
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold uppercase">
                            <tr>
                              {tableCols.map((f: string) => {
                                const isSorted = state.sortBy === f;
                                const isDesc = !!state.sortDesc;
                                return (
                                  <th
                                    key={f}
                                    onClick={() => handleSortChange(f)}
                                    className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-355 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850/60 select-none group"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span>{f}</span>
                                      <span className="text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-slate-450 transition-colors">
                                        {isSorted ? (isDesc ? '▼' : '▲') : '↕'}
                                      </span>
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pageData.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all border-b border-slate-100 dark:border-slate-800">
                                {tableCols.map((f: string) => {
                                  const cell = row[f];
                                  return (
                                    <td key={f} className="px-4 py-2 text-slate-650 dark:text-slate-355 max-w-[200px] truncate">
                                      {typeof cell === 'number' ? (
                                        <span className="font-mono">{cell.toLocaleString()}</span>
                                      ) : typeof cell === 'boolean' ? (
                                        cell ? (
                                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/40">是</span>
                                        ) : (
                                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">否</span>
                                        )
                                      ) : (
                                        String(cell ?? '')
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {isGrouped && total > 0 && (
                              <tr className="bg-slate-50/70 dark:bg-slate-900/40 font-extrabold border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                {tableCols.map((f: string) => {
                                  const cell = subtotalObj[f];
                                  return (
                                    <td key={f} className="px-4 py-2.5 font-bold">
                                      {typeof cell === 'number' ? (
                                        <span className="font-mono">{cell.toLocaleString()}</span>
                                      ) : (
                                        String(cell ?? '')
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Pagination */}
                    {total > 0 && (
                      <div className="flex justify-between items-center gap-4 mt-4 pt-3 border-t border-slate-50 dark:border-slate-850">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(-1)}
                            disabled={activePage === 1}
                            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all ${
                              activePage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold px-1">
                            第 {activePage} / {pages} 頁
                          </span>
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={activePage === pages}
                            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all ${
                              activePage === pages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

    </div>
  );
};
