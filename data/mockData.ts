
import { Table, MenuItem, Staff, Transaction } from '../types';

export const INITIAL_TABLES: Table[] = Array.from({ length: 16 }, (_, i) => {
  const id = (i + 1).toString().padStart(2, '0');
  let status: Table['status'] = 'EMPTY';
  if (i < 3) status = 'PLAYING';
  if (i === 4) status = 'BOOKED';
  if (i === 14) status = 'MAINTENANCE';

  // Fix: Added missing 'orders' property and converted startTime to ISO string to match Table interface
  return {
    id,
    name: `Bàn ${id}`,
    status,
    type: i % 4 === 0 ? 'Pool' : i % 4 === 1 ? 'Carom' : i % 4 === 2 ? 'Snooker' : 'VIP',
    startTime: status === 'PLAYING' ? new Date(Date.now() - Math.random() * 7200000).toISOString() : undefined,
    orders: [],
    currentFee: status === 'PLAYING' ? Math.floor(Math.random() * 500000) : 0,
    customerName: status === 'BOOKED' ? 'Nguyễn Văn A' : undefined,
    bookedTime: status === 'BOOKED' ? '19:30' : undefined,
    phone: status === 'BOOKED' ? '0987xxx888' : undefined
  };
});

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Cà phê sữa đá', price: 25000, category: 'Drink', status: 'In Stock', image: 'https://picsum.photos/seed/coffee/400/300' },
  { id: '2', name: 'Cam vắt', price: 35000, category: 'Drink', status: 'In Stock', image: 'https://picsum.photos/seed/orange/400/300' },
  { id: '3', name: 'Burger Bò Đặc Biệt', price: 65000, category: 'Food', status: 'In Stock', image: 'https://picsum.photos/seed/burger/400/300' },
  { id: '4', name: 'Salad Cá Ngừ', price: 55000, category: 'Food', status: 'Out of Stock', image: 'https://picsum.photos/seed/salad/400/300' },
  { id: '5', name: 'Mì Bò Trứng', price: 45000, category: 'Food', status: 'In Stock', image: 'https://picsum.photos/seed/noodles/400/300' },
  { id: '6', name: 'Thuốc lá 555', price: 30000, category: 'Other', status: 'In Stock', image: 'https://picsum.photos/seed/cigs/400/300' },
  { id: '7', name: 'Redbull', price: 20000, category: 'Drink', status: 'In Stock', image: 'https://picsum.photos/seed/energy/400/300' },
  { id: '8', name: 'Sandwich Kẹp Thịt', price: 35000, category: 'Food', status: 'Low Stock', image: 'https://picsum.photos/seed/sandwich/400/300' },
];

export const STAFF_LIST: Staff[] = [
  { id: '1', name: 'Nguyễn Văn A', email: 'nguyen.a@probilliards.vn', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1', joinDate: '12/05/2023' },
  { id: '2', name: 'Trần Thị B', email: 'tran.b@probilliards.vn', role: 'Cashier', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2', joinDate: '01/01/2024' },
  { id: '3', name: 'Phạm Văn C', email: 'pham.c@probilliards.vn', role: 'Server', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=3', joinDate: '15/08/2023' },
  { id: '4', name: 'Lê Thị D', email: 'le.d@probilliards.vn', role: 'Server', status: 'On Leave', avatar: 'https://i.pravatar.cc/150?u=4', joinDate: '20/02/2024' },
];

// Fix: Completed Transaction objects with required properties: endTime, tableFee, and serviceFee
export const RECENT_TRANSACTIONS: Transaction[] = [
  { 
    id: '#ORD-2023-089', 
    tableName: 'Bàn 05 (Lỗ)', 
    startTime: '2023-08-01T14:30:00Z', 
    endTime: '2023-08-01T16:45:00Z',
    duration: '2h 15m', 
    tableFee: 300000,
    serviceFee: 150000,
    total: 450000, 
    status: 'Paid' 
  },
  { 
    id: '#ORD-2023-090', 
    tableName: 'Bàn 02 (Phăng)', 
    startTime: '2023-08-01T15:00:00Z', 
    endTime: '2023-08-01T16:00:00Z',
    duration: '1h 00m', 
    tableFee: 100000,
    serviceFee: 20000,
    total: 120000, 
    status: 'Paid' 
  },
  { 
    id: '#ORD-2023-091', 
    tableName: 'Bàn 08 (Lỗ)', 
    startTime: '2023-08-01T16:15:00Z', 
    endTime: '', 
    duration: '--', 
    tableFee: 0,
    serviceFee: 0,
    total: 0, 
    status: 'Pending' 
  },
];
