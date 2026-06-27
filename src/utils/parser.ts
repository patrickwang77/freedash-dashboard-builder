import * as XLSX from 'xlsx';
import type { DataColumn, ColumnType } from '../types';

export function parseSpreadsheet(file: File): Promise<{ columns: DataColumn[]; data: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result;
        if (!ab) {
          reject(new Error('檔案讀取失敗。'));
          return;
        }
        // Read workbook, parsing dates into actual Date objects
        const workbook = XLSX.read(ab, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to JSON rows
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (rawData.length === 0) {
          resolve({ columns: [], data: [] });
          return;
        }

        // Get all unique column names
        const columnsSet = new Set<string>();
        rawData.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (key.trim() !== '') {
              columnsSet.add(key);
            }
          });
        });
        const columnNames = Array.from(columnsSet);

        // Identify column types
        const columns: DataColumn[] = columnNames.map((name) => {
          const type = detectColumnType(rawData, name);
          return { name, type, isCalculated: false };
        });

        // Normalize values
        const data = rawData.map((row, index) => {
          const normalizedRow: any = { _id: index };
          columns.forEach((col) => {
            const rawVal = row[col.name];
            normalizedRow[col.name] = normalizeValue(rawVal, col.type);
          });
          return normalizedRow;
        });

        resolve({ columns, data });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('讀取檔案時發生錯誤。'));
    reader.readAsArrayBuffer(file);
  });
}

function detectColumnType(data: any[], colName: string): ColumnType {
  const sampleValues: any[] = [];
  for (let i = 0; i < data.length; i++) {
    const val = data[i][colName];
    if (val !== undefined && val !== null && val !== '') {
      sampleValues.push(val);
      if (sampleValues.length >= 100) break;
    }
  }

  if (sampleValues.length === 0) {
    return 'text';
  }

  // 1. Check Date
  let isDate = true;
  for (const val of sampleValues) {
    if (val instanceof Date) continue;
    if (typeof val === 'string') {
      const parsedDate = Date.parse(val);
      const isNumber = !isNaN(Number(val));
      // Date patterns like YYYY/MM/DD, YYYY-MM-DD, MM/DD/YYYY, etc.
      const dateRegex = /^\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2}/;
      const hasDatePattern = dateRegex.test(val.trim());
      if (isNaN(parsedDate) || isNumber || !hasDatePattern) {
        isDate = false;
        break;
      }
    } else {
      isDate = false;
      break;
    }
  }
  if (isDate) return 'date';

  // 2. Check Boolean
  let isBool = true;
  for (const val of sampleValues) {
    if (typeof val === 'boolean') continue;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (s === 'true' || s === 'false' || s === '是' || s === '否' || s === 'yes' || s === 'no' || s === '1' || s === '0') {
        continue;
      }
    }
    if (typeof val === 'number') {
      if (val === 0 || val === 1) continue;
    }
    isBool = false;
    break;
  }
  if (isBool) return 'boolean';

  // 3. Check Numeric
  let isNumeric = true;
  for (const val of sampleValues) {
    if (typeof val === 'number' && !isNaN(val)) continue;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[\$,%]/g, '').trim();
      if (cleaned === '' || isNaN(Number(cleaned))) {
        isNumeric = false;
        break;
      }
    } else {
      isNumeric = false;
      break;
    }
  }
  if (isNumeric) return 'number';

  return 'text';
}

export function normalizeValue(val: any, type: ColumnType): any {
  if (val === undefined || val === null || val === '') {
    if (type === 'number') return 0;
    if (type === 'boolean') return false;
    if (type === 'date') return '';
    return '';
  }

  if (type === 'number') {
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[\$,%]/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }

  if (type === 'boolean') {
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    return s === 'true' || s === '是' || s === 'yes' || s === '1';
  }

  if (type === 'date') {
    if (val instanceof Date) {
      // Local date parsing to avoid timezone shift
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const date = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    }
    const parsed = Date.parse(String(val));
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    }
    return '';
  }

  return String(val);
}
