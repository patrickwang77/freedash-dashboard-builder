export type ColumnType = 'text' | 'number' | 'date' | 'boolean';

export interface DataColumn {
  name: string;
  type: ColumnType;
  isCalculated?: boolean;
}

export interface CalculatedColumn {
  name: string;
  leftField: string;
  operator: '+' | '-' | '*' | '/';
  rightField: string; // Can be a field name, or a numeric string (constant)
  isConstant: boolean; // True if rightField is a constant number
}

export type CardType = 'indicator' | 'chart' | 'data';

export interface IndicatorConfig {
  field: string;
  agg: 'sum' | 'avg' | 'min' | 'max' | 'count';
  prefix: string;
  suffix: string;
}

export interface ThresholdItem {
  value: number;
  color: string;
  label: string;
}

export interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'line-horizontal' | 'area' | 'bar-overlap' | 'progress-ring';
  xAxis: string;
  yAxis: string;
  agg: 'sum' | 'avg' | 'min' | 'max' | 'count';
  planField?: string;       // Column name for Plan value
  isPlanStatic?: boolean;   // If true, plan is a static number
  staticPlanValue?: number; // Static plan target value
  hasThreshold?: boolean;   // Enable threshold bands/colors
  thresholds?: ThresholdItem[];
  ringType?: 'full' | 'half'; // Full or half circle progress ring
}

export interface DataConfig {
  pageSize: number;
  fields: string[]; // List of column names to display (reorderable)
  groupBy?: string; // Column to group by (deprecated/fallback)
  groupByFields?: string[]; // Multiple columns to group by hierarchically
  aggFields?: string[]; // Columns to aggregate (sum) when grouped (deprecated)
  groupInterval?: 'none' | 'week' | 'month' | 'year' | 'range'; // Default interval (deprecated/fallback)
  groupIntervals?: Record<string, 'none' | 'week' | 'month' | 'year' | 'range'>; // Interval mapping for each group-by field
  aggTypeMap?: Record<string, 'sum' | 'count' | 'avg' | 'none'>; // Map of fieldName -> aggregation type
}

export interface DashboardCard {
  id: string;
  type: CardType;
  title: string;
  w: 1 | 2 | 3 | 4 | 5 | 6; // grid column width: 1 to 6 cols
  h: 'auto' | 'sm' | 'md' | 'lg'; // height: auto, sm, md, lg
  config: IndicatorConfig | ChartConfig | DataConfig;
}

export type ThemeName = 'earthy' | 'vibrant' | 'highcontrast' | 'trust' | 'blackwhite' | 'neon' | 'pastel' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  name: ThemeName;
  mode: ThemeMode;
  customPrimary?: string;
  customSecondary?: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  cards: DashboardCard[];
  slicers?: string[];
  isUserCustom?: boolean;
}
