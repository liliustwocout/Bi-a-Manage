
export type TableStatus = 'EMPTY' | 'PLAYING' | 'BOOKED' | 'MAINTENANCE';
export type TableType = 'Pool' | 'Carom' | 'Snooker' | 'VIP';

export interface TableRates {
  Pool: number;
  Carom: number;
  Snooker: number;
  VIP: number;
  billingBlock: number; // in minutes, e.g., 1, 15, 30
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  type: TableType;
  startTime?: string; // ISO String để lưu vào JSON
  orders: OrderItem[]; // Danh sách món đã gọi của bàn này
  currentFee?: number;
  customerName?: string;
  bookedTime?: string;
  phone?: string;
  prepaidAmount?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Drink' | 'Food' | 'Other';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  tableName: string;
  startTime: string;
  endTime: string;
  duration: string;
  tableFee: number;
  serviceFee: number;
  orders: OrderItem[];
  total: number;
  status: 'Paid' | 'Cancelled' | 'Pending';
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Cashier' | 'Server';
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar: string;
  joinDate: string;
}
