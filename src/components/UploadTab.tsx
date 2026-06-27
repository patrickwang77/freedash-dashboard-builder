import React, { useState, useRef } from 'react';
import type { DataColumn, ColumnType } from '../types';
import { parseSpreadsheet } from '../utils/parser';
import { generateSampleData } from '../utils/sampleData';
import { Upload, FileText, CheckCircle, Database, AlertCircle } from 'lucide-react';

interface UploadTabProps {
  onDataLoaded: (columns: DataColumn[], data: any[], fileName: string) => void;
  columns: DataColumn[];
  data: any[];
  fileName: string;
  onColumnTypeChange: (columnName: string, newType: ColumnType) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  onDataLoaded,
  columns,
  data,
  fileName,
  onColumnTypeChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xls' && ext !== 'xlsx') {
      setErrorMsg('不支援的檔案格式。請上傳 *.csv, *.xls, 或 *.xlsx 檔案。');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await parseSpreadsheet(file);
      onDataLoaded(result.columns, result.data, file.name);
    } catch (err) {
      console.error(err);
      setErrorMsg('解析試算表失敗，請確認檔案格式是否正確且未損毀。');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleLoadSample = () => {
    setErrorMsg(null);
    setLoading(true);
    setTimeout(() => {
      try {
        const result = generateSampleData();
        onDataLoaded(result.columns, result.data, '3C產品銷售示範資料.xlsx');
      } catch (err) {
        console.error(err);
        setErrorMsg('載入示範資料失敗。');
      } finally {
        setLoading(false);
      }
    }, 400); // Small delay to show smooth loading
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getBadgeColor = (type: ColumnType) => {
    switch (type) {
      case 'text':
        return 'bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-900/30 dark:text-blue-350 dark:border-blue-800/40';
      case 'number':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-900/30 dark:text-emerald-350 dark:border-emerald-800/40';
      case 'date':
        return 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-900/30 dark:text-amber-350 dark:border-amber-800/40';
      case 'boolean':
        return 'bg-purple-50 text-purple-700 border-purple-150 dark:bg-purple-900/30 dark:text-purple-350 dark:border-purple-800/40';
    }
  };

  const getTypeLabel = (type: ColumnType) => {
    switch (type) {
      case 'text': return '文字 (Text)';
      case 'number': return '數值 (Number)';
      case 'date': return '日期 (Date)';
      case 'boolean': return '布林值 (Boolean)';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upload Zone & Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`md:col-span-2 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px] ${
            isDragging
              ? 'border-brand bg-brand/5 scale-[1.01] shadow-md shadow-brand/5'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand/85 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv, .xls, .xlsx"
            className="hidden"
          />
          {loading ? (
            <div className="space-y-3">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-500">正在解析資料表，請稍候...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                  將試算表拖曳到此處，或點擊此方框上傳
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  支援格式：*.csv, *.xls, *.xlsx (最大支援 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side Actions Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-brand" />
              <span>快速資料載入</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              沒有合適的檔案？點擊下方按鈕即可一鍵生成一個虛擬的 3C 產品銷售資料集（包含日期、商品、區域、銷售額與折扣等），讓您立刻體驗強大的視覺化分析。
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={triggerFileInput}
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-200"
            >
              瀏覽電腦中的檔案
            </button>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-200 shadow-sm shadow-brand/10"
            >
              載入示範資料
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-450 rounded-xl border border-rose-150 dark:border-rose-900/30 flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Success details & Column type overrides */}
      {data.length > 0 && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                    資料表解析成功
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  來源檔案：<span className="font-semibold text-slate-700 dark:text-slate-300">{fileName}</span> • 共 <span className="font-semibold text-brand">{data.length}</span> 筆資料列，系統已智慧識別 <span className="font-semibold text-brand">{columns.length}</span> 個欄位屬性。
                </p>
              </div>
            </div>

            {/* Smart Column identification grid */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                欄位屬性智能辨識列表 (點擊下拉選單可手動修正欄位屬性)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((col) => (
                  <div
                    key={col.name}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-3 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">欄位名稱</p>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate" title={col.name}>
                        {col.name}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">智慧型識別</p>
                      <select
                        value={col.type}
                        onChange={(e) => onColumnTypeChange(col.name, e.target.value as ColumnType)}
                        className={`w-full text-xs font-semibold px-2 py-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${getBadgeColor(
                          col.type
                        )}`}
                      >
                        <option value="text">🔤 {getTypeLabel('text')}</option>
                        <option value="number">🔢 {getTypeLabel('number')}</option>
                        <option value="date">📅 {getTypeLabel('date')}</option>
                        <option value="boolean">🔘 {getTypeLabel('boolean')}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Preview Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm p-6">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              <span>前 5 筆資料預覽</span>
            </h4>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.name} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-all">
                      {columns.map((col) => {
                        const val = row[col.name];
                        return (
                          <td key={col.name} className="px-4 py-2.5 text-slate-650 dark:text-slate-355 max-w-[180px] truncate">
                            {typeof val === 'boolean' ? (val ? '是' : '否') : String(val ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
