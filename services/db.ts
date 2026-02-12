
import { Table, TableRates, MenuItem, Transaction } from '../types';

// Vite sẽ inject biến môi trường ở runtime, nhưng để tránh lỗi type khi thiếu định nghĩa ImportMetaEnv,
// ta truy cập thông qua window.__CUEMASTER_API_BASE__ fallback sang biến môi trường Vite và cuối cùng là localhost.
declare global {
  interface Window {
    __CUEMASTER_API_BASE__?: string;
  }
}

const API_BASE =
  (typeof window !== 'undefined' && window.__CUEMASTER_API_BASE__) ||
  // @ts-ignore: VITE_API_BASE sẽ được Vite inject nếu được cấu hình
  (import.meta as any).env?.VITE_API_BASE ||
  '/api';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPut<TBody = unknown>(path: string, body: TBody): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} failed with status ${res.status}`);
  }
}

async function apiPost<TBody = unknown>(path: string, body?: TBody): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed with status ${res.status}`);
  }
}

export const DB = {
  async init() {
    // Gọi backend để đảm bảo đã có bảng và dữ liệu seed
    try {
      await apiPost('/init');
    } catch (err) {
      console.error('DB.init error', err);
    }
  },

  async getTables(): Promise<Table[]> {
    return apiGet<Table[]>('/tables');
  },

  async saveTables(tables: Table[]): Promise<void> {
    await apiPut('/tables', tables);
  },

  async updateTable(tableId: string, updates: Partial<Table>): Promise<Table[]> {
    const tables = await this.getTables();
    const index = tables.findIndex((t) => t.id === tableId);
    if (index !== -1) {
      tables[index] = { ...tables[index], ...updates };
      await this.saveTables(tables);
    }
    return tables;
  },

  async getRates(): Promise<TableRates> {
    return apiGet<TableRates>('/rates');
  },

  async saveRates(rates: TableRates): Promise<void> {
    await apiPut('/rates', rates);
  },

  async getMenu(): Promise<MenuItem[]> {
    return apiGet<MenuItem[]>('/menu');
  },

  async saveMenu(menu: MenuItem[]): Promise<void> {
    await apiPut('/menu', menu);
  },

  async getTransactions(): Promise<Transaction[]> {
    return apiGet<Transaction[]>('/transactions');
  },

  async addTransaction(tx: Transaction): Promise<void> {
    await apiPost('/transactions', tx);
  },

  async clearAll(): Promise<void> {
    if (confirm('Xóa toàn bộ dữ liệu và reset hệ thống?')) {
      await apiPost('/reset');
      window.location.reload();
    }
  },
};

