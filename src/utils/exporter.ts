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
    earthy: { primary: '#2e7d32', primaryHover: '#1b5e20', gradientStart: '#2e7d32', gradientEnd: '#a3cfbb' },
    vibrant: { primary: '#2563eb', primaryHover: '#1d4ed8', gradientStart: '#2563eb', gradientEnd: '#f87171' },
    highcontrast: { primary: '#0f172a', primaryHover: '#020617', gradientStart: '#0f172a', gradientEnd: '#f59e0b' },
    trust: { primary: '#1e40af', primaryHover: '#1e3a8a', gradientStart: '#1e40af', gradientEnd: '#34d399' },
    blackwhite: { primary: '#334155', primaryHover: '#1e293b', gradientStart: '#334155', gradientEnd: '#94a3b8' },
    neon: { primary: '#7e22ce', primaryHover: '#6b21a8', gradientStart: '#7e22ce', gradientEnd: '#06b6d4' },
    pastel: { primary: '#db2777', primaryHover: '#be185d', gradientStart: '#db2777', gradientEnd: '#5eead4' }
  };

  const palette = theme.name === 'custom'
    ? {
        primary: theme.customPrimary || '#1e40af',
        primaryHover: theme.customPrimary || '#1e3a8a',
        gradientStart: theme.customPrimary || '#1e40af',
        gradientEnd: theme.customSecondary || '#34d399'
      }
    : (colorPalettes[theme.name] || colorPalettes.trust);

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
    const activeTheme = window.__DASHBOARD_THEME__ || { name: 'trust', mode: 'light' };
    const slicerFields = window.__DASHBOARD_SLICERS__ || [];
    const calculatedColumns = window.__DASHBOARD_CALCULATED_COLUMNS__ || [];

    // Filter selections: fieldName -> Set of checked values
    const filterState = {};
    slicerFields.forEach(f => {
      filterState[f] = new Set();
    });

    // Paging status for Data cards
    const tablePagingState = {}; // cardId -> { currentPage, searchTerm, sortBy, sortDesc, expandedPaths }
    cards.forEach(card => {
      if (card.type === 'data') {
        tablePagingState[card.id] = { currentPage: 1, searchTerm: '', sortBy: null, sortDesc: false, expandedPaths: {} };
      }
    });

    // Helper to calculate grouped pivot data, search, sort, and subtotal for Table Cards
    function processTableData(config, filteredRecords, paging) {
      const groupByFields = config.groupByFields || (config.groupBy && config.groupBy !== 'raw_data' ? [config.groupBy] : []);
      const isGrouped = groupByFields.length > 0;
      const groupIntervals = config.groupIntervals || (config.groupBy && config.groupBy !== 'raw_data' ? { [config.groupBy]: config.groupInterval || 'none' } : {});
      const aggTypeMap = config.aggTypeMap || {};
      
      // Get checked fields in user's custom sort order
      let checkedCols = config.fields && config.fields.length > 0 ? config.fields : columns.map(c => c.name);
      
      let tableCols = [];
      if (!isGrouped) {
        tableCols = checkedCols;
      } else {
        const filteredChecked = checkedCols.filter(f => !groupByFields.includes(f));
        tableCols = [...groupByFields, ...filteredChecked];
      }

      // 1. Search Filter
      let searchMatched = filteredRecords;
      if (paging.searchTerm.trim() !== '') {
        const query = paging.searchTerm.toLowerCase();
        searchMatched = searchMatched.filter(row => {
          return columns.some(col => {
            const val = String(row[col.name] !== undefined && row[col.name] !== null ? row[col.name] : '');
            return val.toLowerCase().includes(query);
          });
        });
      }

      // 2. Grouping
      let processedRows = [];
      let subtotalRow = null;

      if (isGrouped) {
        // Compute numeric bands for intervals
        let numericBandsMap = {};
        groupByFields.forEach(gField => {
          const gColDef = columns.find(c => c.name === gField);
          const gColType = gColDef ? gColDef.type : 'text';
          const gInterval = groupIntervals[gField] || 'none';
          
          if (gColType === 'number' && gInterval === 'range') {
            const nums = searchMatched.map(r => Number(r[gField])).filter(n => !isNaN(n));
            if (nums.length > 0) {
              const minVal = Math.min(...nums);
              const maxVal = Math.max(...nums);
              const step = (maxVal - minVal) / 5;
              numericBandsMap[gField] = Array.from({ length: 5 }, (_, idx) => {
                const start = minVal + idx * step;
                const end = idx === 4 ? maxVal : minVal + (idx + 1) * step;
                return {
                  min: start,
                  max: end,
                  label: Math.round(start).toLocaleString() + ' - ' + Math.round(end).toLocaleString()
                };
              });
            }
          }
        });

        const buildTreeGroups = (records, level, parentPath) => {
          if (level >= groupByFields.length) return [];
          const fieldName = groupByFields[level];
          const cDef = columns.find(c => c.name === fieldName);
          const colType = cDef ? cDef.type : 'text';
          const interval = groupIntervals[fieldName] || 'none';

          const getGroupKey = (val) => {
            if (val === undefined || val === null || val === '') return '(空白)';
            
            if (colType === 'date' || val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
              const d = new Date(val);
              if (!isNaN(d.getTime())) {
                if (interval === 'year') return d.getFullYear() + '年';
                if (interval === 'month') {
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  return d.getFullYear() + '年' + m + '月';
                }
                if (interval === 'week') {
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(d.setDate(diff));
                  const mm = String(monday.getMonth() + 1).padStart(2, '0');
                  const dd = String(monday.getDate()).padStart(2, '0');
                  return monday.getFullYear() + '/' + mm + '/' + dd + ' 週';
                }
              }
            }
            
            if (colType === 'number') {
              const bands = numericBandsMap[fieldName];
              if (interval === 'range' && bands && bands.length > 0) {
                const num = Number(val);
                const band = bands.find(b => num >= b.min && num <= b.max);
                if (band) return band.label;
              }
            }
            
            return String(val);
          };

          const groups = {};
          records.forEach(row => {
            const rawVal = row[fieldName];
            const key = getGroupKey(rawVal);
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          });

          return Object.keys(groups).sort().map(key => {
            const groupRows = groups[key];
            const currentPath = parentPath ? parentPath + ' | ' + key : key;
            return {
              key,
              field: fieldName,
              level,
              path: currentPath,
              rows: groupRows,
              children: buildTreeGroups(groupRows, level + 1, currentPath)
            };
          });
        };

        let treeData = buildTreeGroups(searchMatched, 0, '');

        const getAggregatedValue = (node, col) => {
          if (groupByFields.includes(col)) {
            return col === node.field ? node.key : '';
          }
          const cDef = columns.find(c => c.name === col);
          const isNumeric = cDef ? cDef.type === 'number' : false;
          const aggType = aggTypeMap[col] || (isNumeric ? 'sum' : 'none');
          
          if (aggType === 'sum') {
            return node.rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
          } else if (aggType === 'count') {
            return node.rows.length;
          } else if (aggType === 'avg') {
            const nums = node.rows.map(r => Number(r[col])).filter(n => !isNaN(n));
            return nums.length > 0 ? nums.reduce((acc, n) => acc + n, 0) / nums.length : 0;
          } else {
            const uniqueVals = Array.from(new Set(node.rows.map(r => String(r[col] !== undefined && r[col] !== null ? r[col] : '')).filter(Boolean)));
            return uniqueVals.join(', ');
          }
        };

        const sortTreeNodes = (nodes, sortByField, desc) => {
          const sorted = [...nodes].sort((a, b) => {
            const valA = getAggregatedValue(a, sortByField);
            const valB = getAggregatedValue(b, sortByField);
            
            if (valA === valB) return 0;
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            
            if (typeof valA === 'number' && typeof valB === 'number') {
              return desc ? valB - valA : valA - valB;
            }
            return desc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
          });
          
          sorted.forEach(node => {
            if (node.children.length > 0) {
              node.children = sortTreeNodes(node.children, sortByField, desc);
            }
          });
          
          return sorted;
        };

        if (paging.sortBy) {
          treeData = sortTreeNodes(treeData, paging.sortBy, paging.sortDesc);
        }

        const flattenTree = (nodes) => {
          const flat = [];
          const recurse = (node, isVisible) => {
            if (isVisible) {
              flat.push(node);
            }
            const isExpanded = paging.expandedPaths[node.path] !== false; // default expanded
            
            node.children.forEach(child => {
              recurse(child, isVisible && isExpanded);
            });
          };
          nodes.forEach(node => recurse(node, true));
          return flat;
        };

        processedRows = flattenTree(treeData);

        // Subtotal row
        subtotalRow = { [groupByFields[0]]: '小計 (Total)' };
        groupByFields.slice(1).forEach(gf => {
          subtotalRow[gf] = '';
        });
        
        tableCols.forEach(col => {
          if (groupByFields.includes(col)) return;
          const cDef = columns.find(c => c.name === col);
          const isNumeric = cDef ? cDef.type === 'number' : false;
          const aggType = aggTypeMap[col] || (isNumeric ? 'sum' : 'none');
          
          if (aggType === 'sum') {
            subtotalRow[col] = searchMatched.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
          } else if (aggType === 'avg') {
            const nums = searchMatched.map(r => Number(r[col])).filter(n => !isNaN(n));
            subtotalRow[col] = nums.length > 0 ? nums.reduce((acc, n) => acc + n, 0) / nums.length : 0;
          } else if (aggType === 'count') {
            subtotalRow[col] = searchMatched.length;
          } else {
            subtotalRow[col] = '';
          }
        });

      } else {
        // Raw mode sorting
        processedRows = searchMatched;
        if (paging.sortBy) {
          const sortByField = paging.sortBy;
          const desc = paging.sortDesc;
          processedRows = [...processedRows].sort((a, b) => {
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
      }

      return {
        tableCols,
        rows: processedRows,
        subtotalRow
      };
    }

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
          cardWrapper.classList.add('justify-between');
          const config = card.config;
          const body = document.createElement('div');
          
          let chartH = 'h-60';
          if (card.h === 'lg') chartH = 'h-96';
          else if (card.h === 'sm') chartH = 'h-28';
          body.className = 'relative flex items-center justify-center w-full ' + chartH;
          
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
        text: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
        grid: document.documentElement.classList.contains('dark') ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)'
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
        earthy: ['#2e7d32', '#4b7c59', '#78909c', '#607d8b', '#8d6e63', '#a1887f', '#d7ccc8', '#c5e1a5', '#e6ee9c', '#fff9c4'],
        vibrant: ['#2563eb', '#3b82f6', '#ef4444', '#f57c00', '#fbc02d', '#059669', '#10b981', '#7c3aed', '#ec4899', '#06b6d4'],
        highcontrast: ['#0f172a', '#1e293b', '#334155', '#fbbf24', '#d97706', '#92400e', '#7c3aed', '#5b21b6', '#0f766e', '#0d9488'],
        trust: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#34d399', '#a7f3d0', '#0d9488', '#14b8a6'],
        blackwhite: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#94a3b8'],
        neon: ['#a21caf', '#d946ef', '#06b6d4', '#22d3ee', '#f43f5e', '#fb7185', '#ec4899', '#f472b6', '#7c3aed', '#a78bfa'],
        pastel: ['#fbcfe8', '#e9d5ff', '#ccfbf1', '#c084fc', '#f472b6', '#2dd4bf', '#fed7aa', '#fef08a', '#bfdbfe', '#a7f3d0']
      };

      const activePieColors = activeTheme.name === 'custom'
        ? [activeTheme.customPrimary || '#1e40af', activeTheme.customSecondary || '#34d399', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#f43f5e', '#a7f3d0', '#60a5fa']
        : (pieThemeColors[activeTheme.name] || pieThemeColors.trust);

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
            labels: { color: themeColors.text, font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } }
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
            ticks: { color: themeColors.text, font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } }
          }
        };

      } else {
        const backgroundColors = chartType === 'pie'
          ? activePieColors
          : chartType === 'area'
            ? hexToRgba(themeColors.primary, 0.15)
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
            ticks: { color: themeColors.text, font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text, font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } }
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
      
      // Process table grouping, search, sorting and subtotal using the helper
      const { tableCols, rows: processedRows, subtotalRow } = processTableData(config, filteredRecords, paging);

      const totalItems = processedRows.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / config.pageSize));
      if (paging.currentPage > totalPages) {
        paging.currentPage = totalPages;
      }

      const startIdx = (paging.currentPage - 1) * config.pageSize;
      const paginatedData = processedRows.slice(startIdx, startIdx + config.pageSize);

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
        updateTableSubComponents(cardId, cardWrapper, filteredRecords, config);
      });

      const infoText = document.createElement('span');
      infoText.className = 'text-xs text-slate-400 dark:text-slate-500 font-medium';
      infoText.innerText = '顯示 ' + (totalItems === 0 ? 0 : startIdx + 1) + ' - ' + Math.min(startIdx + config.pageSize, totalItems) + ' 筆，共 ' + totalItems + ' 筆資料';

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
      drawTableContents(cardId, paginatedData, tableCols, tableWrapper, filteredRecords, config, cardWrapper, subtotalRow);
      drawPaginationControls(cardId, paging.currentPage, totalPages, filteredRecords, config, paginator);
    }

    // Redraw table rows without full layout structure rebuild
    function updateTableSubComponents(cardId, cardWrapper, filteredRecords, config) {
      const paging = tablePagingState[cardId];
      
      const { tableCols, rows: processedRows, subtotalRow } = processTableData(config, filteredRecords, paging);

      const totalItems = processedRows.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / config.pageSize));
      if (paging.currentPage > totalPages) {
        paging.currentPage = totalPages;
      }
      const startIdx = (paging.currentPage - 1) * config.pageSize;
      const paginatedData = processedRows.slice(startIdx, startIdx + config.pageSize);

      // Update Toolbar summary
      const summarySpan = cardWrapper.querySelector('span.text-xs');
      if (summarySpan) {
        summarySpan.innerText = '顯示 ' + (totalItems === 0 ? 0 : startIdx + 1) + ' - ' + Math.min(startIdx + config.pageSize, totalItems) + ' 筆，共 ' + totalItems + ' 筆資料';
      }

      const tableWrap = cardWrapper.querySelector("#table-wrap-" + cardId);
      const pagerWrap = cardWrapper.querySelector("#pager-wrap-" + card    function drawTableContents(cardId, rows, fields, targetWrapper, filteredRecords, config, cardWrapper, subtotalRow) {
      const wrapper = targetWrapper || document.getElementById("table-wrap-" + cardId);
      if (!wrapper) return;
      wrapper.innerHTML = '';

      if (rows.length === 0) {
        wrapper.innerHTML = '<div class="text-slate-400 dark:text-slate-500 text-center py-10 text-sm font-medium">沒有符合篩選條件的資料</div>';
        return;
      }

      const groupByFields = config.groupByFields || (config.groupBy && config.groupBy !== 'raw_data' ? [config.groupBy] : []);
      const isGrouped = groupByFields.length > 0;
      const aggTypeMap = config.aggTypeMap || {};

      const table = document.createElement('table');
      table.className = 'w-full text-sm text-left border-collapse';

      const thead = document.createElement('thead');
      thead.className = 'bg-slate-50/80 dark:bg-slate-900/50 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-105 dark:border-slate-700/50';
      const headerRow = document.createElement('tr');

      fields.forEach(f => {
        const th = document.createElement('th');
        th.className = 'px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/60 select-none';
        
        const paging = tablePagingState[cardId];
        const isSorted = paging.sortBy === f;
        const isDesc = paging.sortDesc;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center gap-1';
        
        const textSpan = document.createElement('span');
        textSpan.innerText = f;
        headerDiv.appendChild(textSpan);
        
        const indicatorSpan = document.createElement('span');
        indicatorSpan.style.color = isSorted ? '#6366f1' : '#cbd5e1';
        indicatorSpan.style.fontSize = '10px';
        indicatorSpan.innerText = isSorted ? (isDesc ? ' ▼' : ' ▲') : ' ↕';
        headerDiv.appendChild(indicatorSpan);
        
        th.appendChild(headerDiv);

        th.addEventListener('click', () => {
          const isCurrent = paging.sortBy === f;
          const nextDesc = isCurrent ? !paging.sortDesc : false;
          const nextSortBy = isCurrent && paging.sortDesc ? null : f;

          paging.sortBy = nextSortBy;
          paging.sortDesc = nextSortBy ? nextDesc : false;
          paging.currentPage = 1;

          updateTableSubComponents(cardId, cardWrapper, filteredRecords, config);
        });

        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      tbody.className = 'divide-y divide-slate-100 dark:divide-slate-800';

      rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-100 dark:border-slate-800';

        if (isGrouped) {
          // row is a GroupNode
          tr.setAttribute('data-path', row.path);
          tr.setAttribute('data-level', row.level);
          
          const paging = tablePagingState[cardId];
          const isExpanded = paging.expandedPaths[row.path] !== false;
          tr.setAttribute('data-expanded', isExpanded ? 'true' : 'false');

          fields.forEach(f => {
            const td = document.createElement('td');
            
            const isGrpCol = groupByFields.includes(f);
            if (isGrpCol) {
              if (f === row.field) {
                td.className = 'px-4 py-3 text-slate-750 dark:text-slate-200 font-semibold truncate';
                td.style.paddingLeft = (16 + row.level * 16) + 'px';

                const cellDiv = document.createElement('div');
                cellDiv.className = 'flex items-center gap-1.5';

                const hasKids = row.children && row.children.length > 0;
                if (hasKids) {
                  const btn = document.createElement('button');
                  btn.className = 'w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-400 font-bold select-none cursor-pointer shrink-0';
                  btn.innerText = isExpanded ? '▼' : '▶';
                  btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    paging.expandedPaths[row.path] = !isExpanded;
                    updateTableSubComponents(cardId, cardWrapper, filteredRecords, config);
                  });
                  cellDiv.appendChild(btn);
                } else {
                  const spacer = document.createElement('span');
                  spacer.className = 'w-4 h-4 shrink-0';
                  cellDiv.appendChild(spacer);
                }

                const labelSpan = document.createElement('span');
                labelSpan.innerText = row.key;
                cellDiv.appendChild(labelSpan);
                td.appendChild(cellDiv);

              } else {
                td.className = 'px-4 py-3 text-slate-350 dark:text-slate-655 italic';
                td.innerText = '-';
              }
            } else {
              // Aggregate value for this node
              td.className = 'px-4 py-3 text-slate-650 dark:text-slate-355 max-w-[200px] truncate';
              
              const cDef = columns.find(c => c.name === f);
              const isNumeric = cDef ? cDef.type === 'number' : false;
              const aggType = aggTypeMap[f] || (isNumeric ? 'sum' : 'none');
              let cellVal = '';

              if (aggType === 'sum') {
                cellVal = row.rows.reduce((acc, r) => acc + (Number(r[f]) || 0), 0);
              } else if (aggType === 'count') {
                cellVal = row.rows.length;
              } else if (aggType === 'avg') {
                const nums = row.rows.map(r => Number(r[f])).filter(n => !isNaN(n));
                cellVal = nums.length > 0 ? nums.reduce((acc, n) => acc + n, 0) / nums.length : 0;
              } else {
                const uniqueVals = Array.from(new Set(row.rows.map(r => String(r[f] !== undefined && r[f] !== null ? r[f] : '')).filter(Boolean)));
                if (uniqueVals.length === 0) cellVal = '';
                else if (uniqueVals.length <= 3) cellVal = uniqueVals.join(', ');
                else cellVal = uniqueVals.slice(0, 3).join(', ') + ' 等 ' + uniqueVals.length + ' 項';
              }

              if (typeof cellVal === 'number') {
                td.innerText = cellVal.toLocaleString();
                td.classList.add('font-mono');
              } else {
                td.innerText = cellVal;
              }
            }
            tr.appendChild(td);
          });

        } else {
          // Raw mode
          fields.forEach(f => {
            const td = document.createElement('td');
            td.className = 'px-4 py-3 text-slate-655 dark:text-slate-355 max-w-[200px] truncate';
            
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
        }

        tbody.appendChild(tr);
      });

      // Append subtotal row
      if (subtotalRow) {
        const tr = document.createElement('tr');
        tr.className = 'bg-slate-50/70 dark:bg-slate-900/40 font-extrabold border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200';
        fields.forEach(f => {
          const td = document.createElement('td');
          td.className = 'px-4 py-2.5 font-bold text-brand dark:text-brand-light';
          const rawVal = subtotalRow[f];
          if (typeof rawVal === 'number') {
            td.innerText = rawVal.toLocaleString();
            td.classList.add('font-mono');
          } else {
            td.innerText = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }

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
