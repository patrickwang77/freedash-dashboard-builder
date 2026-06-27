import type { DataColumn } from '../types';

export interface SampleDataResult {
  columns: DataColumn[];
  data: any[];
}

export function generateSampleData(): SampleDataResult {
  const columns: DataColumn[] = [
    { name: '日期', type: 'date', isCalculated: false },
    { name: '商品類別', type: 'text', isCalculated: false },
    { name: '商品名稱', type: 'text', isCalculated: false },
    { name: '銷售區域', type: 'text', isCalculated: false },
    { name: '銷售額', type: 'number', isCalculated: false },
    { name: '數量', type: 'number', isCalculated: false },
    { name: '單價', type: 'number', isCalculated: false },
    { name: '是否特價', type: 'boolean', isCalculated: false }
  ];

  const products = [
    { category: '智慧手機', name: 'iPhone 15 Pro', basePrice: 36900 },
    { category: '智慧手機', name: 'Galaxy S24 Ultra', basePrice: 43900 },
    { category: '智慧手機', name: 'Google Pixel 8 Pro', basePrice: 28900 },
    { category: '電腦平板', name: 'MacBook Pro M3', basePrice: 54900 },
    { category: '電腦平板', name: 'iPad Air M2', basePrice: 19900 },
    { category: '電腦平板', name: 'ASUS Zenbook 14', basePrice: 32900 },
    { category: '穿戴配件', name: 'Apple Watch Series 9', basePrice: 13500 },
    { category: '穿戴配件', name: 'AirPods Pro 2', basePrice: 7490 },
    { category: '穿戴配件', name: 'Sony WH-1000XM5', basePrice: 11900 }
  ];

  const regions = ['北部', '中部', '南部', '東部'];

  const data: any[] = [];
  const startDate = new Date('2026-03-01').getTime();
  const endDate = new Date('2026-06-25').getTime();
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

  // Generate 120 sample rows
  for (let i = 0; i < 120; i++) {
    // Random product
    const prod = products[Math.floor(Math.random() * products.length)];
    // Random date
    const randomDayOffset = Math.floor(Math.random() * daysDiff);
    const dateObj = new Date(startDate + randomDayOffset * 24 * 60 * 60 * 1000);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const date = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;

    // Random region
    const region = regions[Math.floor(Math.random() * regions.length)];

    // Random quantity (1 to 5)
    const qty = Math.floor(Math.random() * 5) + 1;

    // Special discount check (30% probability)
    const isDiscounted = Math.random() < 0.3;
    const discountMultiplier = isDiscounted ? 0.9 : 1.0; // 10% off
    const unitPrice = Math.round(prod.basePrice * discountMultiplier);
    const salesAmount = unitPrice * qty;

    data.push({
      _id: i,
      '日期': dateStr,
      '商品類別': prod.category,
      '商品名稱': prod.name,
      '銷售區域': region,
      '銷售額': salesAmount,
      '數量': qty,
      '單價': unitPrice,
      '是否特價': isDiscounted
    });
  }

  // Sort by date ascending
  data.sort((a, b) => a['日期'].localeCompare(b['日期']));

  // Re-index IDs
  data.forEach((row, i) => {
    row._id = i;
  });

  return { columns, data };
}
