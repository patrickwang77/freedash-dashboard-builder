import type { DashboardCard, DataColumn, ThemeConfig, CalculatedColumn } from '../types';

export async function exportDashboardHTML(params: {
  columns: DataColumn[];
  data: any[];
  cards: DashboardCard[];
  theme: ThemeConfig;
  slicers: string[]; // columns chosen as slicers
  calculatedColumns: CalculatedColumn[];
}): Promise<string> {
  const { columns, data, cards, theme, slicers, calculatedColumns } = params;

  // Attempt to fetch Tailwind and ChartJS for 100% offline self-containment
  let tailwindSource = '';
  let chartJsSource = '';
  let fetchedTailwind = false;
  let fetchedChart = false;

  try {
    const twRes = await fetch('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4');
    if (twRes.ok) {
      tailwindSource = await twRes.text();
      fetchedTailwind = true;
    }
  } catch (e) {
    console.warn('Failed to fetch Tailwind CDN source code offline. Will fallback to script link.', e);
  }

  try {
    const chartRes = await fetch('https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js');
    if (chartRes.ok) {
      chartJsSource = await chartRes.text();
      fetchedChart = true;
    }
  } catch (e) {
    console.warn('Failed to fetch Chart.js CDN source code offline. Will fallback to script link.', e);
  }

  // Define Theme Color mappings for Tailwind v4 Custom Theme Variables
  const colorPalettes: Record<string, { primary: string; primaryHover: string; gradientStart: string; gradientEnd: string }> = {
    indigo: { primary: '#4f46e5', primaryHover: '#4338ca', gradientStart: '#4f46e5', gradientEnd: '#818cf8' },
    emerald: { primary: '#059669', primaryHover: '#047857', gradientStart: '#059669', gradientEnd: '#34d399' },
    rose: { primary: '#e11d48', primaryHover: '#be123c', gradientStart: '#e11d48', gradientEnd: '#fb7185' },
    amber: { primary: '#d97706', primaryHover: '#b45309', gradientStart: '#d97706', gradientEnd: '#fbbf24' },
    slate: { primary: '#475569', primaryHover: '#334155', gradientStart: '#475569', gradientEnd: '#94a3b8' },
    violet: { primary: '#7c3aed', primaryHover: '#6d28d9', gradientStart: '#7c3aed', gradientEnd: '#a78bfa' },
    space: { primary: '#38bdf8', primaryHover: '#0ea5e9', gradientStart: '#38bdf8', gradientEnd: '#818cf8' }
  };

  const palette = theme.name === 'custom'
    ? {
        primary: theme.customPrimary || '#4f46e5',
        primaryHover: theme.customPrimary || '#4338ca',
        gradientStart: theme.customPrimary || '#4f46e5',
        gradientEnd: theme.customSecondary || '#818cf8'
      }
    : (colorPalettes[theme.name] || colorPalettes.indigo);

  // Build the script tags. Inlining the source if successfully fetched, else loading via CDN link.
  const tailwindScriptTag = fetchedTailwind
    ? `<script>\n${tailwindSource}\n</script>`
    : `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`;

  const chartJsScriptTag = fetchedChart
    ? `<script>\n${chartJsSource}\n</script>`
    : `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>`;

  // Generate the Self-Contained HTML Template
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW" class="${theme.mode === 'dark' ? 'dark' : theme.mode === 'system' ? '' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FreeDash 數據視覺化儀表板</title>
  
  <!-- Tailwind CSS Engine -->
  ${tailwindScriptTag}

  <!-- ChartJS Engine -->
  ${chartJsScriptTag}

  <!-- Custom Theme Configurations & Dark Mode class selector support -->
  <style type="text/tailwindcss">
    @import "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));

    @theme {
      --color-brand: ${palette.primary};
      --color-brand-hover: ${palette.primaryHover};
      --color-brand-light: ${palette.gradientEnd};
    }
  </style>

  <style>
    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.5);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.8);
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-200">

  <!-- Header Banner -->
  <header class="bg-gradient-to-r from-brand to-brand-light text-white shadow-md">
    <div class="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">FreeDash 數據視覺化分析看板</h1>
        <p class="text-sm opacity-90 mt-1">獨立運行 • 隱私安全 • 高效能互動分析</p>
      </div>
      <div class="flex items-center gap-3">
        <button id="themeToggleBtn" class="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all">
          <span id="themeToggleText">切換主題</span>
        </button>
        <span class="text-xs bg-white/20 px-3 py-1.5 rounded-full border border-white/10">100% 離線版</span>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <!-- Left Sidebar: Slicers (Filters) -->
      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-105 dark:border-slate-700/50">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <h2 class="font-bold text-lg flex items-center gap-2">
              <span>📊 篩選過濾器</span>
            </h2>
            <button id="resetFiltersBtn" class="text-xs text-brand hover:text-brand-hover font-semibold">清除全部</button>
          </div>
          <div id="slicersContainer" class="space-y-6">
            <!-- Dynamic Slicers will be injected here -->
          </div>
        </div>
      </aside>

      <!-- Right Main Dashboard Layout -->
      <main class="lg:col-span-3 space-y-6">
        <!-- Dashboard Grid of Cards (6 Columns Canvas) -->
        <div id="dashboardGrid" class="grid grid-cols-1 md:grid-cols-6 gap-3">
          <!-- Dynamic Dashboard Cards will be injected here -->
        </div>
      </main>

    </div>
  </div>

  <!-- Injected JSON Payload -->
  <script>
    window.__DASHBOARD_DATA__ = ${JSON.stringify(data)};
    window.__DASHBOARD_COLUMNS__ = ${JSON.stringify(columns)};
    window.__DASHBOARD_CARDS__ = ${JSON.stringify(cards)};
    window.__DASHBOARD_THEME__ = ${JSON.stringify(theme)};
    window.__DASHBOARD_SLICERS__ = ${JSON.stringify(slicers)};
    window.__DASHBOARD_CALCULATED_COLUMNS__ = ${JSON.stringify(calculatedColumns)};
  </script>

  <!-- Dashboard Runtime Logic -->
  <script>
    // ----------------------------------------------------
    // State management
    // ----------------------------------------------------
    let rawData = window.__DASHBOARD_DATA__ || [];
    const columns = window.__DASHBOARD_COLUMNS__ || [];
    const cards = window.__DASHBOARD_CARDS__ || [];
    const activeTheme = window.__DASHBOARD_THEME__ || { name: 'indigo', mode: 'light' };
    const slicerFields = window.__DASHBOARD_SLICERS__ || [];
    const calculatedColumns = window.__DASHBOARD_CALCULATED_COLUMNS__ || [];

    // Filter selections: fieldName -> Set of checked values
    const filterState = {};
    slicerFields.forEach(f => {
      filterState[f] = new Set();
    });

    // Paging status for Data cards
    const tablePagingState = {}; // cardId -> { currentPage, searchTerm }
    cards.forEach(card => {
      if (card.type === 'data') {
        tablePagingState[card.id] = { currentPage: 1, searchTerm: '' };
      }
    });

    // Chart.js instances lookup: cardId -> Chart Object
    const chartInstances = {};

    // ----------------------------------------------------
    // Calculations Engine
    // ----------------------------------------------------
    function evaluateCalculatedColumns(records) {
      return records.map(row => {
        const newRow = { ...row };
        calculatedColumns.forEach(cc => {
          const leftVal = Number(newRow[cc.leftField]) || 0;
          let rightVal = 0;
          if (cc.isConstant) {
            rightVal = Number(cc.rightField) || 0;
          } else {
            rightVal = Number(newRow[cc.rightField]) || 0;
          }

          let result = 0;
          if (cc.operator === '+') result = leftVal + rightVal;
          else if (cc.operator === '-') result = leftVal - rightVal;
          else if (cc.operator === '*') result = leftVal * rightVal;
          else if (cc.operator === '/') result = rightVal !== 0 ? leftVal / rightVal : 0;

          newRow[cc.name] = result;
        });
        return newRow;
      });
    }

    // ----------------------------------------------------
    // Filtering Logic
    // ----------------------------------------------------
    function getProcessedData() {
      // 1. Evaluate calculated columns first on raw data
      const dataWithCalculated = evaluateCalculatedColumns(rawData);

      // 2. Filter by slicers
      return dataWithCalculated.filter(row => {
        for (const [field, selectedSet] of Object.entries(filterState)) {
          if (selectedSet.size > 0) {
            const val = String(row[field] !== undefined ? row[field] : '');
            if (!selectedSet.has(val)) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // ----------------------------------------------------
    // Data Aggregation
    // ----------------------------------------------------
    function aggregateValue(records, field, aggType) {
      if (records.length === 0) return 0;
      
      const values = records.map(r => Number(r[field]) || 0);
      
      switch (aggType) {
        case 'sum':
          return values.reduce((sum, v) => sum + v, 0);
        case 'avg':
          return values.reduce((sum, v) => sum + v, 0) / values.length;
        case 'min':
          return Math.min(...values);
        case 'max':
          return Math.max(...values);
        case 'count':
          return records.length;
        default:
          return 0;
      }
    }

    // Grouping for Charts
    function getChartDatasets(records, xAxis, yAxis, aggType) {
      const groups = {};
      records.forEach(r => {
        const key = String(r[xAxis] !== undefined ? r[xAxis] : '(空白)');
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });

      const labels = Object.keys(groups).sort();
      const dataset = labels.map(label => aggregateValue(groups[label], yAxis, aggType));
      return { labels, dataset };
    }

    // ----------------------------------------------------
    // Slicer UI Renderer
    // ----------------------------------------------------
    function renderSlicers() {
      const container = document.getElementById('slicersContainer');
      container.innerHTML = '';

      if (slicerFields.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">無啟用的篩選器</p>';
        return;
      }

      // Pre-evaluate calculated columns for filters
      const dataset = evaluateCalculatedColumns(rawData);

      slicerFields.forEach(field => {
        // Find unique values
        const uniqueVals = Array.from(new Set(dataset.map(r => String(r[field] !== undefined ? r[field] : ''))))
          .filter(v => v !== '')
          .sort();

        const filterGroup = document.createElement('div');
        filterGroup.className = 'space-y-2 border-b border-slate-100 dark:border-slate-700/50 pb-4 last:border-b-0 last:pb-0';
        
        const label = document.createElement('h3');
        label.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2';
        label.innerText = field;
        filterGroup.appendChild(label);

        const listContainer = document.createElement('div');
        listContainer.className = 'max-h-40 overflow-y-auto space-y-1.5 pr-1';

        uniqueVals.forEach(val => {
          const itemLabel = document.createElement('label');
          itemLabel.className = 'flex items-center gap-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 py-1 px-1.5 rounded transition-all';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'rounded border-slate-300 text-brand focus:ring-brand w-4 h-4';
          checkbox.checked = filterState[field].has(val);

          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              filterState[field].add(val);
            } else {
              filterState[field].delete(val);
            }
            updateDashboard();
          });

          const span = document.createElement('span');
          span.className = 'truncate text-slate-600 dark:text-slate-300';
          span.innerText = val === 'true' ? '是' : val === 'false' ? '否' : val;

          itemLabel.appendChild(checkbox);
          itemLabel.appendChild(span);
          listContainer.appendChild(itemLabel);
        });

        filterGroup.appendChild(listContainer);
        container.appendChild(filterGroup);
      });
    }

    // ----------------------------------------------------
    // Dashboard Cards Renderer
    // ----------------------------------------------------
    function renderDashboard() {
      const grid = document.getElementById('dashboardGrid');
      grid.innerHTML = '';

      const filteredRecords = getProcessedData();

      cards.forEach(card => {
        const cardWrapper = document.createElement('div');
        
        // Dynamic Column Span Mapping
        const widthClass = 'col-span-1 md:col-span-' + card.w;

        // Dynamic Height Mapping
        let heightClass = 'min-h-[290px]';
        if (card.h === 'auto') heightClass = 'h-fit min-h-[140px]';
        else if (card.h === 'sm') heightClass = 'min-h-[140px] justify-between';
        else if (card.h === 'lg') heightClass = 'min-h-[420px]';

        cardWrapper.className = widthClass + ' ' + heightClass + ' bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-105 dark:border-slate-700/50 flex flex-col transition-all';

        // Card Header
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        const title = document.createElement('h3');
        title.className = 'font-bold text-slate-700 dark:text-slate-200 text-base';
        title.innerText = card.title;
        header.appendChild(title);
        cardWrapper.appendChild(header);

        // Card Body based on type
        if (card.type === 'indicator') {
          const config = card.config;
          const result = aggregateValue(filteredRecords, config.field, config.agg);
          
          let displayVal = '';
          if (config.agg === 'count') {
            displayVal = result.toLocaleString();
          } else {
            // Decimals formatting for average
            displayVal = config.agg === 'avg' 
              ? result.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
              : Math.round(result).toLocaleString();
          }

          const body = document.createElement('div');
          body.className = 'flex items-baseline gap-1 py-4';
          
          if (config.prefix) {
            const prefixSpan = document.createElement('span');
            prefixSpan.className = 'text-lg font-medium text-slate-400 dark:text-slate-500';
            prefixSpan.innerText = config.prefix;
            body.appendChild(prefixSpan);
          }

          const valueSpan = document.createElement('span');
          valueSpan.className = 'text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white';
          valueSpan.innerText = displayVal;
          body.appendChild(valueSpan);

          if (config.suffix) {
            const suffixSpan = document.createElement('span');
            suffixSpan.className = 'text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1';
            suffixSpan.innerText = config.suffix;
            body.appendChild(suffixSpan);
          }

          cardWrapper.appendChild(body);

          const footer = document.createElement('div');
          footer.className = 'text-xs text-slate-400 mt-2 border-t border-slate-50 dark:border-slate-700/40 pt-2';
          footer.innerText = '運算欄位: ' + config.field + ' (' + getAggLabel(config.agg) + ')';
          cardWrapper.appendChild(footer);

        } else if (card.type === 'chart') {
          const config = card.config;
          const body = document.createElement('div');
          
          let chartH = 'h-60';
          if (card.h === 'lg') chartH = 'h-96';
          else if (card.h === 'sm') chartH = 'h-28';
          body.className = 'flex-1 relative flex items-center justify-center w-full ' + chartH;
          
          const canvas = document.createElement('canvas');
          canvas.id = "chart-" + card.id;
          body.appendChild(canvas);
          cardWrapper.appendChild(body);

          // Render Chart.js in setTimeout to ensure layout is ready
          setTimeout(() => {
            renderChart(card.id, canvas, filteredRecords, config, card.h);
          }, 0);

        } else if (card.type === 'data') {
          const config = card.config;
          renderTableCard(card.id, cardWrapper, filteredRecords, config);
        }

        grid.appendChild(cardWrapper);
      });
    }

    // Helper translation
    function getAggLabel(agg) {
      const map = { sum: '加總', avg: '平均', min: '最小', max: '最大', count: '筆數' };
      return map[agg] || agg;
    }

    // ----------------------------------------------------
    // Chart Drawing Engine
    // ----------------------------------------------------
    function renderChart(cardId, canvas, records, config, heightLvl) {
      if (chartInstances[cardId]) {
        chartInstances[cardId].destroy();
      }

      const ctx = canvas.getContext('2d');
      
      const themeColors = {
        primary: getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() || '#4f46e5',
        primaryLight: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-light').trim() || '#a78bfa',
        text: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569',
        grid: document.documentElement.classList.contains('dark') ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
      };

      const chartType = config.type;
      
      // Calculate group datasets
      const groups = {};
      records.forEach(r => {
        const key = String(r[config.xAxis] !== undefined ? r[config.xAxis] : '(空白)');
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });
      const labels = Object.keys(groups).sort();
      const actualValues = labels.map(label => aggregateValue(groups[label], config.yAxis, config.agg));

      const isPie = chartType === 'pie';
      const isProgress = chartType === 'progress-ring';
      const isOverlap = chartType === 'bar-overlap';
      const isHorizontal = chartType === 'line-horizontal';

      function hexToRgba(hex, opacity) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
          hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
      }

      const pieThemeColors = {
        indigo: ['#4f46e5', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#94a3b8', '#38bdf8', '#f43f5e', '#a7f3d0'],
        emerald: ['#059669', '#60a5fa', '#fbbf24', '#34d399', '#0d9488', '#c084fc', '#fb923c', '#475569', '#fda4af', '#fef08a'],
        rose: ['#e11d48', '#fda4af', '#a78bfa', '#f59e0b', '#64748b', '#0f766e', '#f97316', '#94a3b8', '#a7f3d0', '#fbbf24'],
        amber: ['#d97706', '#f97316', '#475569', '#0d9488', '#8b5cf6', '#fb7185', '#38bdf8', '#86efac', '#fef08a', '#78350f'],
        slate: ['#475569', '#94a3b8', '#0d9488', '#4f46e5', '#8b5cf6', '#10b981', '#60a5fa', '#fb923c', '#f43f5e', '#fbbf24'],
        violet: ['#7c3aed', '#c084fc', '#10b981', '#f43f5e', '#4f46e5', '#64748b', '#fbbf24', '#3b82f6', '#db2777', '#a7f3d0'],
        space: ['#38bdf8', '#818cf8', '#3b82f6', '#4f46e5', '#a78bfa', '#34d399', '#60a5fa', '#fb923c', '#f43f5e', '#fbbf24']
      };

      const activePieColors = activeTheme.name === 'custom'
        ? [activeTheme.customPrimary || '#4f46e5', activeTheme.customSecondary || '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#f43f5e', '#a7f3d0', '#60a5fa']
        : (pieThemeColors[activeTheme.name] || pieThemeColors.indigo);

      let chartJsType = 'bar';
      if (isPie || isProgress) chartJsType = 'doughnut';
      else if (chartType === 'line' || chartType === 'area') chartJsType = 'line';

      let datasets = [];
      let options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isPie || isOverlap,
            labels: { color: themeColors.text, font: { size: 10 } }
          }
        }
      };

      if (isProgress) {
        const actual = aggregateValue(records, config.yAxis, config.agg);
        const plan = config.isPlanStatic
          ? (config.staticPlanValue || 100)
          : aggregateValue(records, config.planField || config.yAxis, config.agg);
        const pct = plan > 0 ? (actual / plan) * 100 : 0;

        let ringColor = themeColors.primary;
        if (config.hasThreshold && config.thresholds && config.thresholds.length > 0) {
          const sorted = [...config.thresholds].sort((a, b) => a.value - b.value);
          ringColor = sorted[0].color;
          for (let i = 0; i < sorted.length; i++) {
            if (pct >= sorted[i].value) ringColor = sorted[i].color;
          }
        }

        datasets = [{
          data: [actual, Math.max(0, plan - actual)],
          backgroundColor: [
            ringColor,
            document.documentElement.classList.contains('dark') ? 'rgba(51, 65, 85, 0.35)' : 'rgba(226, 232, 240, 0.65)'
          ],
          borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
          borderWidth: 1.5,
          cutout: '80%'
        }];

        options.circumference = config.ringType === 'half' ? 180 : 360;
        options.rotation = config.ringType === 'half' ? 270 : 0;
        options.plugins.tooltip = { enabled: false };

        // Create overlay text element
        let overlay = canvas.parentElement.querySelector('.progress-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'progress-overlay absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2';
          canvas.parentElement.appendChild(overlay);
        }
        overlay.innerHTML = '<span class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">' + pct.toFixed(1) + '%</span>' +
          '<span class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">實際: ' + Math.round(actual).toLocaleString() + ' / 目標: ' + Math.round(plan).toLocaleString() + '</span>';

      } else if (isOverlap) {
        const planValues = labels.map(label => {
          if (config.isPlanStatic) return config.staticPlanValue || 0;
          return aggregateValue(groups[label], config.planField || config.yAxis, config.agg);
        });

        const actColors = actualValues.map((act, idx) => {
          const plan = planValues[idx] || 1;
          const pct = (act / plan) * 100;
          if (config.hasThreshold && config.thresholds && config.thresholds.length > 0) {
            const sorted = [...config.thresholds].sort((a, b) => a.value - b.value);
            let matchColor = sorted[0].color;
            for (let i = 0; i < sorted.length; i++) {
              if (pct >= sorted[i].value) matchColor = sorted[i].color;
            }
            return matchColor;
          }
          return themeColors.primaryLight;
        });

        datasets = [
          {
            label: '目標值 (Plan)',
            data: planValues,
            backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.35)' : 'rgba(226, 232, 240, 0.75)',
            borderColor: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.7)',
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
        ];

        options.plugins.bulletBands = {
          hasThreshold: config.hasThreshold,
          thresholds: config.thresholds
        };

        options.scales = {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10 } }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10 } }
          }
        };

      } else {
        const backgroundColors = chartType === 'pie'
          ? activePieColors
          : chartType === 'area'
            ? hexToRgba(themeColors.primary, 0.2)
            : themeColors.primary;

        const borderColors = chartType === 'pie'
          ? (document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff')
          : themeColors.primary;

        datasets = [{
          label: config.yAxis + ' (' + getAggLabel(config.agg) + ')',
          data: actualValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          fill: chartType === 'area',
          tension: chartType === 'line' || chartType === 'area' ? 0.35 : 0
        }];

        options.indexAxis = isHorizontal ? 'y' : 'x';
        options.scales = isPie ? {} : {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10 } }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10 } }
          }
        };

        // Remove overlay text if standard chart redraws
        const overlay = canvas.parentElement.querySelector('.progress-overlay');
        if (overlay) overlay.remove();
      }

      // Local plugin definition inside generated page
      const bulletBandsPlugin = {
        id: 'bulletBands',
        beforeDraw: (chart) => {
          const { ctx, chartArea: { left, right, top }, scales: { y } } = chart;
          const opts = chart.options;
          const thresholds = opts.plugins?.bulletBands?.thresholds;
          const hasThreshold = opts.plugins?.bulletBands?.hasThreshold;
          if (!hasThreshold || !thresholds || thresholds.length === 0) return;

          ctx.save();
          const sorted = [...thresholds].sort((a, b) => a.value - b.value);
          const yZero = y.getPixelForValue(0);
          let prevY = yZero;

          const toLowOpacity = (hex) => {
            const cleanHex = hex.replace('#', '');
            const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
            const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
            const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
            return 'rgba(' + r + ', ' + g + ', ' + b + ', 0.11)';
          };

          sorted.forEach((th) => {
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

      chartInstances[cardId] = new Chart(ctx, {
        type: chartJsType,
        data: {
          labels: labels,
          datasets: datasets
        },
        options: options,
        plugins: isOverlap ? [bulletBandsPlugin] : []
      });
    }

    // ----------------------------------------------------
    // Paginated Table Component Renderer
    // ----------------------------------------------------
    function renderTableCard(cardId, cardWrapper, filteredRecords, config) {
      const paging = tablePagingState[cardId];
      
      // Perform search filtering
      let tableData = filteredRecords;
      if (paging.searchTerm.trim() !== '') {
        const query = paging.searchTerm.toLowerCase();
        tableData = tableData.filter(row => {
          return config.fields.some(f => {
            const val = String(row[f] !== undefined ? row[f] : '');
            return val.toLowerCase().includes(query);
          });
        });
      }

      const totalItems = tableData.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / config.pageSize));
      if (paging.currentPage > totalPages) {
        paging.currentPage = totalPages;
      }

      const startIdx = (paging.currentPage - 1) * config.pageSize;
      const paginatedData = tableData.slice(startIdx, startIdx + config.pageSize);

      // Search & Info Bar
      const toolbar = document.createElement('div');
      toolbar.className = 'flex flex-col sm:flex-row justify-between items-center gap-3 mb-4';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = '搜尋此表格資料...';
      searchInput.value = paging.searchTerm;
      searchInput.className = 'w-full sm:w-64 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand focus:border-brand outline-none';
      searchInput.addEventListener('input', (e) => {
        paging.searchTerm = e.target.value;
        paging.currentPage = 1;
        // Just redraw the card elements
        updateTableSubComponents(cardId, cardWrapper, filteredRecords, config);
      });

      const infoText = document.createElement('span');
      infoText.className = 'text-xs text-slate-400 dark:text-slate-500 font-medium';
      infoText.innerText = '顯示 ' + (startIdx + 1) + ' - ' + Math.min(startIdx + config.pageSize, totalItems) + ' 筆，共 ' + totalItems + ' 筆資料';

      toolbar.appendChild(searchInput);
      toolbar.appendChild(infoText);
      cardWrapper.appendChild(toolbar);

      // Create Table Containers
      const tableWrapper = document.createElement('div');
      tableWrapper.id = "table-wrap-" + cardId;
      tableWrapper.className = 'flex-1 overflow-x-auto border border-slate-105 dark:border-slate-800 rounded-xl';
      cardWrapper.appendChild(tableWrapper);

      // Pagination Controls Container
      const paginator = document.createElement('div');
      paginator.id = "pager-wrap-" + cardId;
      paginator.className = 'flex justify-between items-center gap-4 mt-4 pt-3 border-t border-slate-50 dark:border-slate-850';
      cardWrapper.appendChild(paginator);

      // Draw active content
      drawTableContents(cardId, paginatedData, config.fields, tableWrapper);
      drawPaginationControls(cardId, paging.currentPage, totalPages, filteredRecords, config, paginator);
    }

    // Redraw table rows without full layout structure rebuild
    function updateTableSubComponents(cardId, cardWrapper, filteredRecords, config) {
      const paging = tablePagingState[cardId];
      
      let tableData = filteredRecords;
      if (paging.searchTerm.trim() !== '') {
        const query = paging.searchTerm.toLowerCase();
        tableData = tableData.filter(row => {
          return config.fields.some(f => {
            const val = String(row[f] !== undefined ? row[f] : '');
            return val.toLowerCase().includes(query);
          });
        });
      }

      const totalItems = tableData.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / config.pageSize));
      if (paging.currentPage > totalPages) {
        paging.currentPage = totalPages;
      }
      const startIdx = (paging.currentPage - 1) * config.pageSize;
      const paginatedData = tableData.slice(startIdx, startIdx + config.pageSize);

      // Update Toolbar summary
      const summarySpan = cardWrapper.querySelector('span.text-xs');
      if (summarySpan) {
        summarySpan.innerText = '顯示 ' + (totalItems === 0 ? 0 : startIdx + 1) + ' - ' + Math.min(startIdx + config.pageSize, totalItems) + ' 筆，共 ' + totalItems + ' 筆資料';
      }

      const tableWrap = cardWrapper.querySelector("#table-wrap-" + cardId);
      const pagerWrap = cardWrapper.querySelector("#pager-wrap-" + cardId);
      drawTableContents(cardId, paginatedData, config.fields, tableWrap);
      drawPaginationControls(cardId, paging.currentPage, totalPages, filteredRecords, config, pagerWrap);
    }

    function drawTableContents(cardId, rows, fields, targetWrapper) {
      const wrapper = targetWrapper || document.getElementById("table-wrap-" + cardId);
      if (!wrapper) return;
      wrapper.innerHTML = '';

      if (rows.length === 0) {
        wrapper.innerHTML = '<div class="text-slate-400 dark:text-slate-500 text-center py-10 text-sm font-medium">沒有符合篩選條件的資料</div>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'w-full text-sm text-left border-collapse';

      const thead = document.createElement('thead');
      thead.className = 'bg-slate-50/80 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-105 dark:border-slate-700/50';
      const headerRow = document.createElement('tr');

      fields.forEach(f => {
        const th = document.createElement('th');
        th.className = 'px-4 py-3 font-semibold text-slate-600 dark:text-slate-300';
        th.innerText = f;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      tbody.className = 'divide-y divide-slate-100 dark:divide-slate-800';

      rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all';
        fields.forEach(f => {
          const td = document.createElement('td');
          td.className = 'px-4 py-3 text-slate-650 dark:text-slate-355 max-w-[200px] truncate';
          
          const rawVal = row[f];
          if (typeof rawVal === 'number') {
            td.innerText = rawVal.toLocaleString();
            td.classList.add('font-mono');
          } else if (typeof rawVal === 'boolean') {
            td.innerHTML = rawVal 
              ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-800/30">是</span>'
              : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400 border border-slate-200 dark:border-slate-750">否</span>';
          } else {
            td.innerText = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrapper.appendChild(table);
    }

    // Pagination
    function drawPaginationControls(cardId, currentPage, totalPages, filteredRecords, config, targetContainer) {
      const container = targetContainer || document.getElementById("pager-wrap-" + cardId);
      if (!container) return;
      container.innerHTML = '';

      const leftGroup = document.createElement('div');
      leftGroup.className = 'flex items-center gap-1.5';

      // Prev Button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all ' + (currentPage === 1 ? 'text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300');
      prevBtn.innerText = '上一頁';
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          tablePagingState[cardId].currentPage--;
          const wrap = document.getElementById("table-wrap-" + cardId).parentElement;
          updateTableSubComponents(cardId, wrap, filteredRecords, config);
        }
      });
      leftGroup.appendChild(prevBtn);

      const pageText = document.createElement('span');
      pageText.className = 'text-xs text-slate-500 dark:text-slate-450 font-medium px-2';
      pageText.innerText = '第 ' + currentPage + ' / ' + totalPages + ' 頁';
      leftGroup.appendChild(pageText);

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all ' + (currentPage === totalPages ? 'text-slate-300 dark:text-slate-600 border-slate-105 dark:border-slate-800 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300');
      nextBtn.innerText = '下一頁';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          tablePagingState[cardId].currentPage++;
          const wrap = document.getElementById("table-wrap-" + cardId).parentElement;
          updateTableSubComponents(cardId, wrap, filteredRecords, config);
        }
      });
      leftGroup.appendChild(nextBtn);

      container.appendChild(leftGroup);
    }

    // ----------------------------------------------------
    // Theme Switcher & Init
    // ----------------------------------------------------
    function initTheme() {
      const toggleBtn = document.getElementById('themeToggleBtn');
      const toggleText = document.getElementById('themeToggleText');

      // Sync active state
      if (activeTheme.mode === 'dark') {
        document.documentElement.classList.add('dark');
        toggleText.innerText = '☀️ 切換為淺色';
      } else {
        document.documentElement.classList.remove('dark');
        toggleText.innerText = '🌙 切換為深色';
      }

      toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          activeTheme.mode = 'light';
          toggleText.innerText = '🌙 切換為深色';
        } else {
          document.documentElement.classList.add('dark');
          activeTheme.mode = 'dark';
          toggleText.innerText = '☀️ 切換為淺色';
        }
        updateDashboard(); // Redraw chart grids with dark colors
      });
    }

    // Reset Slicer Selections
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
      slicerFields.forEach(f => {
        filterState[f].clear();
      });
      renderSlicers();
      updateDashboard();
    });

    // Main Update Function
    function updateDashboard() {
      renderDashboard();
    }

    // App Bootstrapper
    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
      renderSlicers();
      updateDashboard();
    });
  </script>
</body>
</html>
`;
  return htmlContent;
}
