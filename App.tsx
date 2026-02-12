
import React, { useState, useEffect, useMemo } from 'react';
import { Table, MenuItem, Staff, OrderItem, TableStatus, TableRates, Transaction, TableType } from './types';
import { DB } from './services/db';

// --- Utils ---
const calculateDuration = (startTimeStr: string) => {
  const start = new Date(startTimeStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  const hrs = Math.floor(diffHrs);
  return { hrs, mins, decimal: diffHrs };
};

// --- Components ---

const Dashboard = ({ tables, onTableClick }: { tables: Table[], rates: TableRates, onTableClick: (t: Table) => void }) => {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'PLAYING': return 'bg-primary border-primary text-white shadow-lg shadow-primary/20';
      case 'BOOKED': return 'bg-yellow-500 border-yellow-500 text-black';
      case 'MAINTENANCE': return 'bg-red-500 border-red-500 text-white';
      default: return 'bg-surface-dark border-white/5 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">SƠ ĐỒ BÀN</h2>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold bg-primary/20 px-3 py-1 rounded-full text-primary">
            {tables.filter(t => t.status === 'PLAYING').length} BẬN
          </span>
          <span className="text-[10px] font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">
            {tables.filter(t => t.status === 'EMPTY').length} TRỐNG
          </span>
        </div>
      </div>

      {/* Grid compact: 3 cột trên mobile nhỏ, 4 cột trên mobile thường */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {tables.map(table => (
          <div
            key={table.id}
            onClick={() => onTableClick(table)}
            className={`
              flex flex-col items-center justify-center 
              aspect-square rounded-2xl border transition-all 
              active:scale-90 tap-highlight-transparent
              ${getStatusColor(table.status)}
            `}
          >
            <span className="text-base font-black truncate px-1">{table.id}</span>
            <div className={`mt-1 w-1 h-1 rounded-full ${table.status === 'PLAYING' ? 'bg-white animate-pulse' : 'bg-transparent'}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsView = ({ tables, menu, rates, onUpdate }: {
  tables: Table[], menu: MenuItem[], rates: TableRates, onUpdate: () => void
}) => {
  const [tab, setTab] = useState<'tables' | 'menu' | 'rates'>('tables');
  const [localMenu, setLocalMenu] = useState<MenuItem[]>(menu);
  const [localRates, setLocalRates] = useState<TableRates>(rates);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalMenu(menu);
  }, [menu]);

  useEffect(() => {
    setLocalRates(rates);
  }, [rates]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (tab === 'menu') {
        await DB.saveMenu(localMenu);
      } else if (tab === 'rates') {
        await DB.saveRates(localRates);
      }
      onUpdate();
    } catch (e) {
      alert("Lỗi khi lưu dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  // CRUD Tables
  const addTable = async () => {
    const nextId = (tables.length + 1).toString().padStart(2, '0');
    const newTable: Table = {
      id: nextId,
      name: `Bàn ${nextId}`,
      status: 'EMPTY',
      type: 'Pool',
      orders: []
    };
    await DB.saveTables([...tables, newTable]);
    onUpdate();
  };

  const deleteTable = async (id: string) => {
    if (confirm("Xóa bàn này?")) {
      await DB.saveTables(tables.filter(t => t.id !== id));
      onUpdate();
    }
  };

  // CRUD Menu
  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: 'Món mới',
      price: 0,
      category: 'Drink',
      status: 'In Stock',
      image: 'https://picsum.photos/seed/food/200'
    };
    setLocalMenu([...localMenu, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setLocalMenu(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMenuItem = (id: string) => {
    if (confirm("Xóa món này?")) {
      setLocalMenu(prev => prev.filter(m => m.id !== id));
    }
  };

  // Update Rates
  const updateRate = (type: keyof TableRates, val: string) => {
    setLocalRates(prev => ({ ...prev, [type]: parseInt(val) || 0 }));
  };

  return (
    <div className="p-4 h-full overflow-y-auto pb-32 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">QUẢN LÝ HỆ THỐNG</h2>
          {(tab === 'menu' || tab === 'rates') && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${isSaving ? 'bg-slate-800 text-slate-500' : 'bg-accent-emerald text-white shadow-lg shadow-emerald-900/20'}`}
            >
              {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
            </button>
          )}
        </div>
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setTab('tables')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tab === 'tables' ? 'bg-primary text-white' : 'text-slate-500'}`}>BÀN</button>
          <button onClick={() => setTab('menu')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tab === 'menu' ? 'bg-primary text-white' : 'text-slate-500'}`}>THỰC ĐƠN</button>
          <button onClick={() => setTab('rates')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tab === 'rates' ? 'bg-primary text-white' : 'text-slate-500'}`}>GIÁ GIỜ</button>
        </div>
      </div>

      {tab === 'tables' && (
        <div className="space-y-3">
          {tables.map(t => (
            <div key={t.id} className="bg-surface-dark p-4 rounded-3xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-black">Bàn {t.id}</p>
                <select
                  value={t.type}
                  onChange={async (e) => {
                    const newTables = tables.map(tbl => tbl.id === t.id ? { ...tbl, type: e.target.value as TableType } : tbl);
                    await DB.saveTables(newTables);
                    onUpdate();
                  }}
                  className="bg-transparent border-none text-[10px] font-bold text-primary p-0 focus:ring-0"
                >
                  <option value="Pool">Bida Lỗ (Pool)</option>
                  <option value="Carom">Bida Phăng (Carom)</option>
                  <option value="VIP">Bàn VIP</option>
                  <option value="Snooker">Snooker</option>
                </select>
              </div>
              <button onClick={() => deleteTable(t.id)} className="text-accent-red p-2"><span className="material-icons-round">delete</span></button>
            </div>
          ))}
          <button onClick={addTable} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold text-xs">+ THÊM BÀN MỚI</button>
        </div>
      )}

      {tab === 'menu' && (localMenu || []).length > 0 && (
        <div className="space-y-3">
          {localMenu.map(m => (
            <div key={m.id} className="bg-surface-dark p-4 rounded-3xl border border-white/5 flex gap-4 items-center">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                <span className="material-icons-round text-slate-500 text-xl">
                  {m.category === 'Drink' ? 'local_drink' : m.category === 'Food' ? 'restaurant' : 'inventory_2'}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={m.name}
                  onChange={(e) => updateMenuItem(m.id, { name: e.target.value })}
                  className="bg-transparent border-none p-0 font-black text-sm w-full focus:ring-0"
                  placeholder="Tên món"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={m.price}
                    onChange={(e) => updateMenuItem(m.id, { price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900 border border-white/10 rounded-lg p-1.5 font-bold text-xs text-primary w-24 focus:ring-1 focus:ring-primary"
                    placeholder="Giá"
                  />
                  <select
                    value={m.category}
                    onChange={(e) => updateMenuItem(m.id, { category: e.target.value as 'Drink' | 'Food' | 'Other' })}
                    className="bg-slate-900 border border-white/10 rounded-lg p-1.5 font-bold text-xs text-white text-[10px] focus:ring-1 focus:ring-primary"
                  >
                    <option value="Drink">Đồ uống</option>
                    <option value="Food">Đồ ăn</option>
                    <option value="Other">Khác</option>
                  </select>
                  <select
                    value={m.status}
                    onChange={(e) => updateMenuItem(m.id, { status: e.target.value as 'In Stock' | 'Low Stock' | 'Out of Stock' })}
                    className={`border rounded-lg p-1.5 font-bold text-xs text-[10px] focus:ring-1 ${m.status === 'In Stock' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                      m.status === 'Low Stock' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                        'bg-red-500/20 border-red-500/30 text-red-400'
                      }`}
                  >
                    <option value="In Stock">Còn hàng</option>
                    <option value="Low Stock">Sắp hết</option>
                    <option value="Out of Stock">Hết hàng</option>
                  </select>
                </div>
              </div>
              <button onClick={() => deleteMenuItem(m.id)} className="text-slate-600 p-2 hover:text-red-400 transition-colors"><span className="material-icons-round">delete</span></button>
            </div>
          ))}
          <button onClick={addMenuItem} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold text-xs hover:border-primary/50 hover:text-primary transition-colors">+ THÊM MÓN MỚI</button>
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20 space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Làm tròn theo Block (Phút)</label>
            <div className="flex items-center gap-3">
              <select
                value={localRates.billingBlock || 1}
                onChange={(e) => updateRate('billingBlock', e.target.value)}
                className="flex-1 bg-slate-900 border-none rounded-xl p-3 font-black text-white focus:ring-primary"
              >
                <option value="1">Không làm tròn (1 phút)</option>
                <option value="5">Mỗi 5 phút</option>
                <option value="15">Mỗi 15 phút (Block 15p)</option>
                <option value="30">Mỗi 30 phút (Block 30p)</option>
                <option value="60">Mỗi 60 phút (Block 1h)</option>
              </select>
            </div>
          </div>

          {(['Pool', 'Carom', 'Snooker', 'VIP'] as Array<keyof TableRates>).map(type => (
            <div key={type} className="bg-surface-dark p-5 rounded-3xl border border-white/5 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá giờ {type}</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localRates[type]}
                  onChange={(e) => updateRate(type, e.target.value)}
                  className="flex-1 bg-slate-900 border-none rounded-xl p-3 font-mono font-black text-primary focus:ring-primary"
                />
                <span className="font-bold text-slate-500">đ/h</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TableModal = ({ table, rates, menu, onClose, onUpdate, onCheckoutSuccess }: {
  table: Table, rates: TableRates, menu: MenuItem[], onClose: () => void, onUpdate: () => void, onCheckoutSuccess: () => void
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'All' | 'Drink' | 'Food' | 'Other'>('All');
  const [bookingData, setBookingData] = useState({ customerName: '', phone: '', bookedTime: '' });

  const startTime = table.startTime ? new Date(table.startTime) : null;
  const now = new Date();
  const diffMs = startTime ? now.getTime() - startTime.getTime() : 0;
  const diffMins = Math.max(0, diffMs / (1000 * 60));

  // Tính tiền theo Block (User request: 1s tính luôn block đầu, qua 1s tính block tiếp)
  const blockSize = rates.billingBlock || 15;
  const blocks = Math.max(1, Math.ceil(diffMins / blockSize));
  const hourlyRate = rates[table.type] || 0;
  const feePerBlock = hourlyRate / (60 / blockSize);
  const tableFee = table.status === 'PLAYING' ? Math.round(blocks * feePerBlock) : 0;

  const duration = table.startTime ? calculateDuration(table.startTime) : { hrs: 0, mins: 0, decimal: 0 };
  const serviceFee = table.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
  const total = tableFee + serviceFee;

  const filteredMenu = menuCategoryFilter === 'All'
    ? menu
    : menu.filter(item => item.category === menuCategoryFilter);

  const handleStart = async () => {
    onClose(); // Close instantly for better UX
    await DB.updateTable(table.id, { status: 'PLAYING', startTime: new Date().toISOString() });
    onUpdate();
  };

  const handleBookTable = async () => {
    if (!bookingData.customerName || !bookingData.phone || !bookingData.bookedTime) {
      alert('Vui lòng điền đầy đủ thông tin đặt bàn');
      return;
    }
    await DB.updateTable(table.id, {
      status: 'BOOKED',
      customerName: bookingData.customerName,
      phone: bookingData.phone,
      bookedTime: bookingData.bookedTime
    });
    setShowBookingForm(false);
    setBookingData({ customerName: '', phone: '', bookedTime: '' });
    onUpdate();
  };

  const handleSetMaintenance = async () => {
    await DB.updateTable(table.id, { status: 'MAINTENANCE' });
    setShowMaintenanceConfirm(false);
    onUpdate();
  };

  const handleRemoveMaintenance = async () => {
    await DB.updateTable(table.id, { status: 'EMPTY' });
    onUpdate();
  };

  const handleAddItem = async (item: MenuItem) => {
    const existing = table.orders.find(o => o.itemId === item.id);
    let newOrders = [...table.orders];
    if (existing) {
      newOrders = newOrders.map(o => o.itemId === item.id ? { ...o, quantity: o.quantity + 1 } : o);
    } else {
      newOrders.push({ id: Date.now().toString(), itemId: item.id, name: item.name, quantity: 1, price: item.price });
    }
    await DB.updateTable(table.id, { orders: newOrders });
    onUpdate();
  };

  const handleUpdateOrderQuantity = async (orderId: string, delta: number) => {
    const newOrders = table.orders.map(o => {
      if (o.id === orderId) {
        const newQuantity = Math.max(0, o.quantity + delta);
        return { ...o, quantity: newQuantity };
      }
      return o;
    }).filter(o => o.quantity > 0);
    await DB.updateTable(table.id, { orders: newOrders });
    onUpdate();
  };

  const handleRemoveOrderItem = async (orderId: string) => {
    const newOrders = table.orders.filter(o => o.id !== orderId);
    await DB.updateTable(table.id, { orders: newOrders });
    onUpdate();
  };

  const handleCheckout = async () => {
    // 1. Optimistic Update (Thực hiện hành động ngay lập tức trên UI)
    const tx: Transaction = {
      id: `TX${Date.now().toString().slice(-6)}`,
      tableName: table.id,
      startTime: table.startTime || '',
      endTime: new Date().toISOString(),
      duration: `${duration.hrs}h ${duration.mins}m`,
      tableFee,
      serviceFee,
      orders: [...table.orders],
      total,
      status: 'Paid'
    };

    // Close modal and go to dashboard instantly
    onClose();
    onCheckoutSuccess();

    // 2. Background Sync
    try {
      await DB.addTransaction(tx);
      await DB.updateTable(table.id, {
        status: 'EMPTY',
        startTime: undefined,
        orders: [],
        customerName: undefined,
        phone: undefined,
        bookedTime: undefined
      });
      onUpdate();
    } catch (e) {
      alert("Lỗi khi lưu giao dịch. Dữ liệu có thể chưa được cập nhật chính xác.");
      console.error(e);
    }
  };

  const handleStartFromBooking = async () => {
    onClose(); // Đóng ngay để mượt
    await DB.updateTable(table.id, {
      status: 'PLAYING',
      startTime: new Date().toISOString(),
      customerName: undefined,
      phone: undefined,
      bookedTime: undefined
    });
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="pt-14 px-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400"><span className="material-icons-round text-3xl">close</span></button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase">BÀN {table.id}</h1>
          <p className="text-[10px] font-bold text-slate-500">{table.type} • {rates[table.type]?.toLocaleString()}đ/h</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {table.status === 'EMPTY' ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-5xl text-primary">play_arrow</span>
            </div>
            <div>
              <h3 className="text-xl font-black">BÀN ĐANG TRỐNG</h3>
              <p className="text-slate-500 text-sm mt-1">Bấm nút bên dưới để bắt đầu tính giờ</p>
            </div>
            <div className="w-full space-y-3">
              <button onClick={handleStart} className="w-full py-5 bg-primary rounded-3xl font-black text-lg shadow-xl">MỞ BÀN NGAY</button>
              <button onClick={() => setShowBookingForm(true)} className="w-full py-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-3xl font-black text-sm">ĐẶT BÀN TRƯỚC</button>
              <button onClick={() => setShowMaintenanceConfirm(true)} className="w-full py-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-3xl font-black text-sm">ĐẶT BẢO TRÌ</button>
            </div>
          </div>
        ) : table.status === 'BOOKED' ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-5xl text-yellow-400">event_available</span>
            </div>
            <div>
              <h3 className="text-xl font-black">BÀN ĐÃ ĐƯỢC ĐẶT</h3>
              <div className="mt-4 space-y-2 text-left bg-white/5 p-4 rounded-2xl">
                <p className="text-sm"><span className="text-slate-500">Khách hàng:</span> <span className="font-black">{table.customerName}</span></p>
                <p className="text-sm"><span className="text-slate-500">SĐT:</span> <span className="font-black">{table.phone}</span></p>
                <p className="text-sm"><span className="text-slate-500">Giờ đặt:</span> <span className="font-black text-yellow-400">{table.bookedTime}</span></p>
              </div>
            </div>
            <div className="w-full space-y-3">
              <button onClick={handleStartFromBooking} className="w-full py-5 bg-primary rounded-3xl font-black text-lg shadow-xl">BẮT ĐẦU CHƠI</button>
              <button onClick={async () => { await DB.updateTable(table.id, { status: 'EMPTY', customerName: undefined, phone: undefined, bookedTime: undefined }); onUpdate(); }} className="w-full py-4 bg-slate-800 text-slate-400 rounded-3xl font-black text-sm">HỦY ĐẶT BÀN</button>
            </div>
          </div>
        ) : table.status === 'MAINTENANCE' ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-5xl text-red-400">build</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-red-400">BÀN ĐANG BẢO TRÌ</h3>
              <p className="text-slate-500 text-sm mt-1">Bàn này đang được bảo trì và không thể sử dụng</p>
            </div>
            <button onClick={handleRemoveMaintenance} className="w-full py-5 bg-primary rounded-3xl font-black text-lg shadow-xl">HOÀN TẤT BẢO TRÌ</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-bold text-slate-500 uppercase">GIỜ CHƠI</p>
                <p className="text-2xl font-black font-mono text-primary">{duration.hrs.toString().padStart(2, '0')}:{duration.mins.toString().padStart(2, '0')}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-bold text-slate-500 uppercase">TIỀN BÀN</p>
                <p className="text-2xl font-black font-mono">{tableFee.toLocaleString()}đ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-3xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-icons-round text-primary text-xl">restaurant_menu</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">DỊCH VỤ</h3>
                    <p className="text-[10px] font-bold text-primary mt-1">{table.orders.length} món đã gọi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMenu(true)}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-icons-round text-lg">add</span>
                  THÊM MÓN
                </button>
              </div>

              <div className="space-y-2">
                {table.orders.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 text-xs italic">Chưa gọi dịch vụ</p>
                ) : (
                  table.orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex-1">
                        <p className="text-sm font-bold">{order.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">SL: {order.quantity} x {order.price.toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl">
                          <button
                            onClick={() => handleUpdateOrderQuantity(order.id, -1)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <span className="material-icons-round text-sm">remove</span>
                          </button>
                          <span className="text-sm font-black min-w-[20px] text-center">{order.quantity}</span>
                          <button
                            onClick={() => handleUpdateOrderQuantity(order.id, 1)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <span className="material-icons-round text-sm">add</span>
                          </button>
                        </div>
                        <p className="font-mono font-black min-w-[80px] text-right">{(order.price * order.quantity).toLocaleString()}đ</p>
                        <button
                          onClick={() => handleRemoveOrderItem(order.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {table.status === 'PLAYING' && (
        <div className="p-6 pb-12 bg-surface-dark border-t border-white/10 space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TỔNG THANH TOÁN</span>
            <span className="text-4xl font-black text-white font-mono">{total.toLocaleString()}₫</span>
          </div>
          <button onClick={handleCheckout} className="w-full py-5 bg-accent-red rounded-3xl font-black text-lg shadow-xl shadow-red-900/20">THANH TOÁN & KẾT THÚC</button>
        </div>
      )}

      {showAddMenu && (
        <div className="absolute inset-0 bg-background-dark z-[110] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="pt-14 px-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <button onClick={() => setShowAddMenu(false)} className="text-slate-400 p-2"><span className="material-icons-round text-3xl">arrow_back</span></button>
            <h2 className="font-black">CHỌN MÓN</h2>
            <div className="w-10"></div>
          </div>
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-2 overflow-x-auto">
              {(['All', 'Drink', 'Food', 'Other'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setMenuCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${menuCategoryFilter === cat
                    ? 'bg-primary text-white'
                    : 'bg-slate-900 text-slate-400'
                    }`}
                >
                  {cat === 'All' ? 'TẤT CẢ' : cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredMenu.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <span className="material-icons-round text-6xl block mb-4 opacity-20">search_off</span>
                <p className="text-sm italic font-bold">Không tìm thấy món nào</p>
              </div>
            ) : (
              filteredMenu.map(item => (
                <div
                  key={item.id}
                  onClick={() => { if (item.status !== 'Out of Stock') { handleAddItem(item); setShowAddMenu(false); } }}
                  className={`
                    bg-surface-dark-lighter p-4 rounded-3xl border-2 transition-all 
                    active:scale-95 shadow-lg flex items-center justify-between
                    ${item.status === 'Out of Stock'
                      ? 'border-red-500/10 opacity-50'
                      : 'border-white/5 border-l-primary/40'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.status === 'Out of Stock' ? 'bg-slate-800' : 'bg-primary/10 text-primary'
                      }`}>
                      <span className="material-icons-round text-2xl">
                        {item.category === 'Drink' ? 'local_drink' : item.category === 'Food' ? 'restaurant' : 'inventory_2'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-100">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-primary font-black text-xs font-mono">{item.price.toLocaleString()}đ</p>
                        {item.status === 'Low Stock' && <span className="text-[8px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase">Sắp hết</span>}
                      </div>
                    </div>
                  </div>

                  {item.status === 'Out of Stock' ? (
                    <span className="text-[10px] font-black text-red-500 uppercase">Hết hàng</span>
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <span className="material-icons-round">add</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showBookingForm && (
        <div className="absolute inset-0 bg-background-dark z-[110] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="pt-14 px-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <button onClick={() => { setShowBookingForm(false); setBookingData({ customerName: '', phone: '', bookedTime: '' }); }} className="text-slate-400 p-2"><span className="material-icons-round text-3xl">arrow_back</span></button>
            <h2 className="font-black">ĐẶT BÀN TRƯỚC</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Tên khách hàng</label>
              <input
                type="text"
                value={bookingData.customerName}
                onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 font-black text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Số điện thoại</label>
              <input
                type="tel"
                value={bookingData.phone}
                onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 font-black text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Giờ đặt</label>
              <input
                type="time"
                value={bookingData.bookedTime}
                onChange={(e) => setBookingData({ ...bookingData, bookedTime: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 font-black text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={handleBookTable}
              className="w-full py-5 bg-yellow-500 rounded-3xl font-black text-lg shadow-xl mt-6"
            >
              XÁC NHẬN ĐẶT BÀN
            </button>
          </div>
        </div>
      )}

      {showMaintenanceConfirm && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-surface-dark rounded-3xl p-6 border border-white/10 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-3xl text-red-400">build</span>
              </div>
              <h3 className="text-lg font-black mb-2">ĐẶT BÀN VÀO CHẾ ĐỘ BẢO TRÌ?</h3>
              <p className="text-sm text-slate-500">Bàn này sẽ không thể sử dụng cho đến khi hoàn tất bảo trì</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMaintenanceConfirm(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black"
              >
                HỦY
              </button>
              <button
                onClick={handleSetMaintenance}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black"
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsView = ({ transactions, tables, menu }: { transactions: Transaction[], tables: Table[], menu: MenuItem[] }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(tx => tx.endTime && tx.endTime.startsWith(today));

  const totalRevenue = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalTablesPlayed = todayTransactions.length;
  const avgRevenuePerTable = totalTablesPlayed > 0 ? Math.round(totalRevenue / totalTablesPlayed) : 0;

  // Top món bán chạy (từ orders trong transactions)
  const itemSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
  transactions.forEach(tx => {
    const table = tables.find(t => t.name === tx.tableName);
    if (table && table.orders) {
      table.orders.forEach(order => {
        if (!itemSales[order.itemId]) {
          const menuItem = menu.find(m => m.id === order.itemId);
          itemSales[order.itemId] = {
            name: menuItem?.name || order.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemSales[order.itemId].quantity += order.quantity;
        itemSales[order.itemId].revenue += order.price * order.quantity;
      });
    }
  });

  const topItems = Object.values(itemSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="p-4 h-full overflow-y-auto pb-32 space-y-6">
      <h2 className="text-2xl font-black">THỐNG KÊ HÔM NAY</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 border border-primary/30 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-primary uppercase mb-1">DOANH THU</p>
          <p className="text-2xl font-black text-white">{totalRevenue.toLocaleString()}đ</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">SỐ BÀN</p>
          <p className="text-2xl font-black text-white">{totalTablesPlayed}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-yellow-400 uppercase mb-1">TB/BÀN</p>
          <p className="text-2xl font-black text-white">{avgRevenuePerTable.toLocaleString()}đ</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">ĐANG CHƠI</p>
          <p className="text-2xl font-black text-white">{tables.filter(t => t.status === 'PLAYING').length}</p>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="bg-surface-dark rounded-3xl p-4 border border-white/5">
          <h3 className="text-sm font-black mb-3">TOP MÓN BÁN CHẠY</h3>
          <div className="space-y-2">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-primary w-6">{idx + 1}.</span>
                  <span className="text-sm font-bold">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{item.quantity} đơn</p>
                  <p className="text-[10px] text-slate-500">{item.revenue.toLocaleString()}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'settings' | 'reports'>('dashboard');
  const [tables, setTables] = useState<Table[]>([]);
  const [rates, setRates] = useState<TableRates>({ Pool: 0, Carom: 0, Snooker: 0, VIP: 0, billingBlock: 15 });
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const refresh = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [tablesData, ratesData, menuData, txData] = await Promise.all([
        DB.getTables(),
        DB.getRates(),
        DB.getMenu(),
        DB.getTransactions()
      ]);
      setTables(tablesData);
      setRates(ratesData);
      setMenu(menuData);
      setTransactions(txData);

      // Sử dụng functional update để tránh bị stale closure (lỗi tự mở lại bàn sau khi đóng)
      setSelectedTable(prev => {
        if (!prev) return null;
        const updated = tablesData.find(t => t.id === prev.id);
        return updated || null;
      });
    } catch (err) {
      console.error('Refresh error', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    let interval: number | null = null;

    (async () => {
      await DB.init();
      await refresh(true);
      interval = window.setInterval(async () => {
        setTick(t => t + 1);
        await refresh();
      }, 30000); // Refresh mỗi 30 giây
    })();

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter theo thời gian
    const now = new Date();
    if (transactionFilter === 'today') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter(tx => tx.endTime && tx.endTime.startsWith(today));
    } else if (transactionFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(tx => tx.endTime && new Date(tx.endTime) >= weekAgo);
    } else if (transactionFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(tx => tx.endTime && new Date(tx.endTime) >= monthAgo);
    }

    // Search
    if (transactionSearch) {
      const searchLower = transactionSearch.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.tableName.toLowerCase().includes(searchLower) ||
        tx.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [transactions, transactionFilter, transactionSearch]);

  return (
    <div className="flex h-screen bg-background-dark text-slate-100 font-display overflow-hidden flex-col">
      <header className="pt-14 pb-4 px-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-md flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <span className="material-icons-round text-primary text-2xl">sports_esports</span>
          <h1 className="font-black text-base uppercase tracking-tighter italic">CueMaster Pro</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-accent-emerald bg-emerald-500/10 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse"></div>
          LIVE
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {loading && currentView === 'dashboard' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 font-bold">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
        {!loading && currentView === 'dashboard' && <Dashboard tables={tables} rates={rates} onTableClick={setSelectedTable} />}
        {currentView === 'history' && (
          <div className="p-4 h-full overflow-y-auto pb-32 space-y-6">
            <h2 className="text-2xl font-black">LỊCH SỬ GIAO DỊCH</h2>

            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'today', 'week', 'month'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTransactionFilter(filter)}
                    className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${transactionFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-slate-900 text-slate-400'
                      }`}
                  >
                    {filter === 'all' ? 'TẤT CẢ' : filter === 'today' ? 'HÔM NAY' : filter === 'week' ? 'TUẦN NÀY' : 'THÁNG NÀY'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên bàn hoặc mã giao dịch..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 font-bold text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {filteredTransactions.length === 0 ? (
              <p className="text-slate-600 italic text-center py-8">Không có giao dịch nào</p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="bg-surface-dark p-4 rounded-3xl border border-white/5 flex justify-between items-center active:scale-95 transition-all tap-highlight-transparent"
                  >
                    <div>
                      <p className="font-black text-sm">Bàn {tx.tableName}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{tx.duration} • {tx.endTime ? new Date(tx.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      <p className="text-[8px] text-slate-600 mt-1">{tx.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary font-mono">{tx.total.toLocaleString()}đ</p>
                      <p className="text-[8px] font-bold text-accent-emerald uppercase tracking-tighter">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {currentView === 'reports' && <ReportsView transactions={transactions} tables={tables} menu={menu} />}
        {currentView === 'settings' && <SettingsView tables={tables} menu={menu} rates={rates} onUpdate={refresh} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 pb-8 pt-2 z-50">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-600'}`}>
          <span className="material-icons-round text-2xl">grid_view</span>
          <span className="text-[8px] font-black uppercase">SƠ ĐỒ</span>
        </button>
        <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'history' ? 'text-primary' : 'text-slate-600'}`}>
          <span className="material-icons-round text-2xl">history</span>
          <span className="text-[8px] font-black uppercase">LỊCH SỬ</span>
        </button>
        <button onClick={() => setCurrentView('reports')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'reports' ? 'text-primary' : 'text-slate-600'}`}>
          <span className="material-icons-round text-2xl">bar_chart</span>
          <span className="text-[8px] font-black uppercase">THỐNG KÊ</span>
        </button>
        <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'settings' ? 'text-primary' : 'text-slate-600'}`}>
          <span className="material-icons-round text-2xl">settings</span>
          <span className="text-[8px] font-black uppercase">QUẢN LÝ</span>
        </button>
      </nav>

      {selectedTable && (
        <TableModal
          table={selectedTable}
          rates={rates}
          menu={menu}
          onClose={() => setSelectedTable(null)}
          onUpdate={refresh}
          onCheckoutSuccess={() => setShowSuccess(true)}
        />
      )}

      {showSuccess && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="bg-surface-dark border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl shadow-primary/20 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-accent-emerald/10 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-5xl text-accent-emerald animate-bounce">check_circle</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">THANH TOÁN XONG!</h2>
              <p className="text-slate-400 text-sm font-bold mt-2 italic">Giao dịch đã được lưu vào lịch sử</p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              TIẾP TỤC
            </button>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="pt-14 px-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <button onClick={() => setSelectedTransaction(null)} className="p-2 -ml-2 text-slate-400"><span className="material-icons-round text-3xl">close</span></button>
            <div className="text-center">
              <h1 className="text-lg font-black uppercase">CHI TIẾT HÓA ĐƠN</h1>
              <p className="text-[10px] font-bold text-slate-500">{selectedTransaction.id}</p>
            </div>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Mã hóa đơn</span>
                <span className="font-black text-xs uppercase">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Bàn</span>
                <span className="font-black text-xs uppercase">Bàn {selectedTransaction.tableName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Thời gian bắt đầu</span>
                <span className="font-black text-xs">{new Date(selectedTransaction.startTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Thời gian kết thúc</span>
                <span className="font-black text-xs">{new Date(selectedTransaction.endTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Thời lượng</span>
                <span className="font-black text-xs text-primary">{selectedTransaction.duration}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CHI TIẾT DỊCH VỤ</h3>
              <div className="bg-white/5 rounded-3xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase">
                  <span>Tên món / Tiền bàn</span>
                  <span>Thành tiền</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Tiền bàn ({selectedTransaction.duration})</span>
                  <span className="text-xs font-black">{selectedTransaction.tableFee.toLocaleString()}đ</span>
                </div>
                {selectedTransaction.orders && selectedTransaction.orders.map((o, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-slate-300">{o.name} <span className="text-slate-500 text-[10px]">x{o.quantity}</span></span>
                    <span className="text-xs font-black">{(o.price * o.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-primary">TỔNG CỘNG</span>
              <span className="text-2xl font-black text-primary font-mono">{selectedTransaction.total.toLocaleString()}đ</span>
            </div>
          </div>
          <div className="p-6 pb-12">
            <button onClick={() => setSelectedTransaction(null)} className="w-full py-4 bg-slate-800 rounded-2xl font-black text-sm text-white">ĐÓNG</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
