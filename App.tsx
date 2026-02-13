
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, MenuItem, Staff, OrderItem, TableStatus, TableRates, Transaction, TableType } from './types';
import { DB } from './services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

const Dashboard = ({ tables, rates, onTableClick }: { tables: Table[], rates: TableRates, onTableClick: (t: Table) => void }) => {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'PLAYING': return 'bg-primary border-primary text-white shadow-lg shadow-primary/20';
      case 'MAINTENANCE': return 'bg-red-500 border-red-500 text-white';
      default: return 'bg-slate-50 border-slate-200 text-slate-500';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">SƠ ĐỒ BÀN</h2>
        <div className="flex gap-2">
          <span className="text-xs font-black bg-primary/10 px-3 py-1.5 rounded-full text-primary uppercase tracking-tighter">
            {tables.filter(t => t.status === 'PLAYING').length} BẬN
          </span>
          <span className="text-xs font-black bg-slate-100 px-3 py-1.5 rounded-full text-slate-500 uppercase tracking-tighter">
            {tables.filter(t => t.status === 'EMPTY').length} TRỐNG
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {tables.map(table => {
          const startTime = table.startTime ? new Date(table.startTime) : null;
          const diffMs = startTime ? new Date().getTime() - startTime.getTime() : 0;
          const hourlyRate = rates[table.type] || 0;
          const remainingSeconds = table.prepaidAmount && hourlyRate > 0
            ? Math.max(0, Math.floor((table.prepaidAmount / hourlyRate) * 3600 - (diffMs / 1000)))
            : null;

          return (
            <div
              key={table.id}
              onClick={() => onTableClick(table)}
              className={`
                flex flex-col items-center justify-center 
                aspect-square rounded-3xl border transition-all relative overflow-hidden
                active:scale-95 tap-highlight-transparent
                ${getStatusColor(table.status)}
              `}
            >
              <span className="text-4xl font-black tracking-tighter">{table.id}</span>

              {table.status === 'PLAYING' && (
                <div className="mt-1 flex flex-col items-center">
                  {remainingSeconds !== null ? (
                    <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${remainingSeconds < 300 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                      {Math.floor(remainingSeconds / 60)}m
                    </span>
                  ) : (
                    <span className="text-[10px] font-black opacity-80 uppercase">
                      {new Date(table.startTime!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
              {table.status === 'MAINTENANCE' && <span className="text-[8px] font-black uppercase opacity-60">Bảo trì</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SettingsView = ({ tables, menu, rates, webhookUrl, onUpdate, onWebhookChange }: {
  tables: Table[], menu: MenuItem[], rates: TableRates, webhookUrl: string, onUpdate: () => void, onWebhookChange: (url: string) => void
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
          <h2 className="text-3xl font-black">QUẢN LÝ</h2>
          {(tab === 'menu' || tab === 'rates') && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${isSaving ? 'bg-slate-800 text-slate-500' : 'bg-accent-emerald text-white shadow-lg shadow-emerald-900/20 active:scale-95'}`}
            >
              {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
            </button>
          )}
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setTab('tables')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${tab === 'tables' ? 'bg-primary text-white scale-105 shadow-lg' : 'text-slate-500'}`}>BÀN</button>
          <button onClick={() => setTab('menu')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${tab === 'menu' ? 'bg-primary text-white scale-105 shadow-lg' : 'text-slate-500'}`}>MÓN</button>
          <button onClick={() => setTab('rates')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${tab === 'rates' ? 'bg-primary text-white scale-105 shadow-lg' : 'text-slate-500'}`}>GIÁ</button>
        </div>
      </div>

      {tab === 'tables' && (
        <div className="space-y-3">
          {tables.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-black text-xl mb-1">Bàn {t.id}</p>
                <select
                  value={t.type}
                  onChange={async (e) => {
                    const newTables = tables.map(tbl => tbl.id === t.id ? { ...tbl, type: e.target.value as TableType } : tbl);
                    await DB.saveTables(newTables);
                    onUpdate();
                  }}
                  className="bg-transparent border-none text-xs font-black text-primary p-0 focus:ring-0 uppercase tracking-tighter"
                >
                  <option value="Pool">Bida Lỗ (Pool)</option>
                  <option value="Carom">Bida Phăng (Carom)</option>
                  <option value="VIP">Bàn VIP</option>
                  <option value="Snooker">Snooker</option>
                </select>
              </div>
              <button onClick={() => deleteTable(t.id)} className="text-accent-red p-3 active:scale-95"><span className="material-icons-round text-2xl">delete</span></button>
            </div>
          ))}
          <button onClick={addTable} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-base active:bg-slate-50 transition-colors">+ THÊM BÀN MỚI</button>
        </div>
      )}

      {tab === 'menu' && (localMenu || []).length > 0 && (
        <div className="space-y-3">
          {localMenu.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 flex gap-4 items-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-slate-500 text-3xl">
                  {m.category === 'Drink' ? 'local_drink' : m.category === 'Food' ? 'restaurant' : 'inventory_2'}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <input
                  value={m.name}
                  onChange={(e) => updateMenuItem(m.id, { name: e.target.value })}
                  className="bg-transparent border-none p-0 font-black text-xl w-full focus:ring-0 text-white"
                  placeholder="Tên món"
                />
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <input
                    type="number"
                    value={m.price}
                    onChange={(e) => updateMenuItem(m.id, { price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-sm text-primary w-28 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Giá"
                  />
                  <select
                    value={m.category}
                    onChange={(e) => updateMenuItem(m.id, { category: e.target.value as 'Drink' | 'Food' | 'Other' })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-xs text-slate-900 focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Drink">Đồ uống</option>
                    <option value="Food">Đồ ăn</option>
                    <option value="Other">Khác</option>
                  </select>
                  <select
                    value={m.status}
                    onChange={(e) => updateMenuItem(m.id, { status: e.target.value as 'In Stock' | 'Low Stock' | 'Out of Stock' })}
                    className={`border rounded-xl p-2 font-black text-[10px] focus:ring-1 ${m.status === 'In Stock' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
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
                className="flex-1 bg-white border-none rounded-xl p-3 font-black text-primary focus:ring-primary shadow-sm"
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
            <div key={type} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá giờ {type}</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localRates[type]}
                  onChange={(e) => updateRate(type, e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-mono font-black text-primary focus:ring-primary shadow-sm"
                />
                <span className="font-bold text-slate-500">đ/h</span>
              </div>
            </div>
          ))}

          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discord Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => onWebhookChange(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-600 focus:ring-primary shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TableModal = ({ table, rates, menu, webhookUrl, onClose, onUpdate, onCheckoutSuccess }: {
  table: Table, rates: TableRates, menu: MenuItem[], webhookUrl: string, onClose: () => void, onUpdate: () => void, onCheckoutSuccess: () => void
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPrepaidStartForm, setShowPrepaidStartForm] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'All' | 'Drink' | 'Food' | 'Other'>('All');
  const [localOrders, setLocalOrders] = useState<OrderItem[]>(table.orders);
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const [hasSentPrepaidAlert, setHasSentPrepaidAlert] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [prepaidAmountInput, setPrepaidAmountInput] = useState('');

  useEffect(() => {
    setLocalOrders(table.orders);
  }, [table.id]); // Re-sync only when switching tables

  useEffect(() => {
    const hasChanges = JSON.stringify(localOrders) !== JSON.stringify(table.orders);
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setIsSavingOrders(true);
      try {
        await DB.updateTable(table.id, { orders: localOrders });
        onUpdate();
      } finally {
        setIsSavingOrders(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [localOrders, table.id, onUpdate, table.orders]);

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
  const serviceFee = localOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
  const total = tableFee + serviceFee;

  // Tính thời gian còn lại nếu có trả trước
  const remainingSeconds = table.prepaidAmount && hourlyRate > 0
    ? Math.max(0, Math.floor((table.prepaidAmount / hourlyRate) * 3600 - (diffMs / 1000)))
    : 0;

  const remainingTimeStr = (() => {
    const s = remainingSeconds;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  })();


  const filteredMenu = menuCategoryFilter === 'All'
    ? menu
    : menu.filter(item => item.category === menuCategoryFilter);

  const handleStart = async () => {
    onClose();
    await DB.updateTable(table.id, {
      status: 'PLAYING',
      startTime: new Date().toISOString(),
      prepaidAmount: undefined // Reset trạng thái trả trước cho phiên chơi mới
    });
    onUpdate();
  };

  const handlePrepaidStart = async () => {
    const amount = parseInt(prepaidAmountInput.replace(/\D/g, ''));
    if (!amount) {
      alert('Vui lòng nhập số tiền trả trước');
      return;
    }
    onClose();
    await DB.updateTable(table.id, {
      status: 'PLAYING',
      startTime: new Date().toISOString(),
      prepaidAmount: amount
    });
    onUpdate();
    setPrepaidAmountInput('');
    setShowPrepaidStartForm(false);
  };

  const handleSetMaintenance = async () => {
    await DB.updateTable(table.id, {
      status: 'MAINTENANCE',
      startTime: undefined,
      orders: [],
      prepaidAmount: undefined
    });
    setShowMaintenanceConfirm(false);
    onUpdate();
  };

  const handleRemoveMaintenance = async () => {
    await DB.updateTable(table.id, {
      status: 'EMPTY',
      startTime: undefined,
      orders: [],
      prepaidAmount: undefined
    });
    onUpdate();
  };

  const handleAddItem = (item: MenuItem) => {
    const existing = localOrders.find(o => o.itemId === item.id);
    let newOrders = [...localOrders];
    if (existing) {
      newOrders = newOrders.map(o => o.itemId === item.id ? { ...o, quantity: o.quantity + 1 } : o);
    } else {
      newOrders.push({ id: Date.now().toString(), itemId: item.id, name: item.name, quantity: 1, price: item.price });
    }
    setLocalOrders(newOrders);
  };

  const handleUpdateOrderQuantity = (orderId: string, delta: number) => {
    const newOrders = localOrders.map(o => {
      if (o.id === orderId) {
        const newQuantity = Math.max(0, o.quantity + delta);
        return { ...o, quantity: newQuantity };
      }
      return o;
    }).filter(o => o.quantity > 0);
    setLocalOrders(newOrders);
  };

  const handleRemoveOrderItem = (orderId: string) => {
    const newOrders = localOrders.filter(o => o.id !== orderId);
    setLocalOrders(newOrders);
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
      orders: [...localOrders],
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
        bookedTime: undefined,
        prepaidAmount: undefined // Reset số tiền trả trước khi thanh toán
      });
      onUpdate();
    } catch (e) {
      alert("Lỗi khi lưu giao dịch. Dữ liệu có thể chưa được cập nhật chính xác.");
      console.error(e);
    }
  };


  const handleUpdateTime = async () => {
    if (!newStartTime || !table.startTime) return;
    const [hrs, mins] = newStartTime.split(':');
    const updatedDate = new Date(table.startTime);
    updatedDate.setHours(parseInt(hrs), parseInt(mins));
    await DB.updateTable(table.id, { startTime: updatedDate.toISOString() });
    setShowTimeEdit(false);
    onUpdate();
  };


  const sendDiscordNotification = async () => {
    if (!webhookUrl) return alert("Vui lòng cấu hình Webhook URL trong Cài đặt");
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎱 **THÔNG BÁO TỪ BÀN ${table.id}**\n- Khách hàng: ${table.customerName || 'Khách vãng lai'}\n- Bắt đầu: ${new Date(table.startTime || '').toLocaleString()}\n- Trả trước: ${table.prepaidAmount ? table.prepaidAmount.toLocaleString() + 'đ' : 'Không'}\n- Trạng thái: Đang chơi`
        })
      });
      alert("Đã gửi thông báo đến Discord!");
    } catch (e) {
      alert("Lỗi khi gửi thông báo: " + e);
    }
  };


  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="pt-14 px-6 pb-4 border-b border-slate-200 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400"><span className="material-icons-round text-3xl">close</span></button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black uppercase">BÀN {table.id}</h1>
            {table.prepaidAmount && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${remainingSeconds <= 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                {remainingSeconds <= 0 ? 'HẾT GIỜ' : 'TRẢ TRƯỚC'}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500">{table.type} • {rates[table.type]?.toLocaleString()}đ/h</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {table.status === 'EMPTY' ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div
              onClick={handleStart}
              className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer border border-primary/20 shadow-lg shadow-primary/10"
            >
              <span className="material-icons-round text-6xl text-primary">play_arrow</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">BÀN ĐANG TRỐNG</h3>
              <p className="text-slate-400 text-sm mt-1 font-bold">Bấm nút bên dưới để bắt đầu tính giờ</p>
            </div>
            <div className="w-full space-y-3">
              <button onClick={handleStart} className="w-full py-6 bg-primary rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-transform text-white">MỞ BÀN NGAY</button>
              <button onClick={() => setShowPrepaidStartForm(true)} className="w-full py-5 bg-amber-50 text-amber-600 border border-amber-200 rounded-3xl font-black text-base active:scale-95 transition-transform">TRẢ TIỀN TRƯỚC & MỞ BÀN</button>
              <button onClick={() => setShowMaintenanceConfirm(true)} className="w-full py-5 bg-red-50 text-red-600 border border-red-200 rounded-3xl font-black text-base active:scale-95 transition-transform">ĐẶT BẢO TRÌ</button>
            </div>
          </div>
        ) : table.status === 'MAINTENANCE' ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-5xl text-red-400">build</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-red-600">BÀN ĐANG BẢO TRÌ</h3>
              <p className="text-slate-500 text-sm mt-1 font-bold">Bàn này đang được bảo trì và không thể sử dụng</p>
            </div>
            <button onClick={handleRemoveMaintenance} className="w-full py-5 bg-primary rounded-3xl font-black text-lg shadow-xl text-white">HOÀN TẤT BẢO TRÌ</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div
                className="bg-slate-50 p-3 rounded-3xl border border-slate-200 text-center relative group active:bg-slate-100 transition-colors"
                onClick={() => {
                  if (!showTimeEdit && table.startTime) {
                    const date = new Date(table.startTime);
                    setNewStartTime(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
                    setShowTimeEdit(true);
                  }
                }}
              >
                <p className="text-xs font-black text-slate-500 uppercase flex items-center justify-center gap-1">
                  MỞ BÀN <span className="material-icons-round text-[10px]">edit</span>
                </p>
                {showTimeEdit ? (
                  <div className="mt-1 flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={e => setNewStartTime(e.target.value)}
                      className="bg-white border-none rounded-lg text-sm font-black text-emerald-600 p-1 w-full text-center outline-none ring-1 ring-emerald-200"
                    />
                    <div className="flex gap-1 w-full">
                      <button onClick={handleUpdateTime} className="flex-1 bg-emerald-500 text-black rounded-lg p-1 transition-all active:scale-95">
                        <span className="material-icons-round text-sm">check</span>
                      </button>
                      <button onClick={() => setShowTimeEdit(false)} className="flex-1 bg-slate-700 text-white rounded-lg p-1 transition-all active:scale-95">
                        <span className="material-icons-round text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-black font-mono text-emerald-600">
                    {table.startTime ? new Date(table.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                )}
              </div>
              <div className="bg-slate-50 p-3 rounded-3xl border border-slate-200 text-center">
                <p className="text-xs font-black text-slate-500 uppercase">GIỜ CHƠI</p>
                <p className="text-2xl font-black font-mono text-primary">{duration.hrs.toString().padStart(2, '0')}:{duration.mins.toString().padStart(2, '0')}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-3xl border border-slate-200 text-center">
                <p className="text-xs font-black text-slate-500 uppercase">TIỀN BÀN</p>
                <p className="text-2xl font-black font-mono text-slate-900">{tableFee.toLocaleString()}đ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <span className="material-icons-round text-primary text-xl">restaurant_menu</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-400 uppercase tracking-widest leading-none">DỊCH VỤ</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-primary">{localOrders.length} món đã gọi</p>
                      {JSON.stringify(localOrders) !== JSON.stringify(table.orders) && (
                        <span className="text-[9px] font-black text-amber-600 animate-pulse">● ĐANG ĐỢI...</span>
                      )}
                      {isSavingOrders && (
                        <span className="text-[9px] font-black text-emerald-600 animate-pulse uppercase tracking-tighter">● ĐÃ LƯU</span>
                      )}
                    </div>
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
                {localOrders.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 text-xs italic">Chưa gọi dịch vụ</p>
                ) : (
                  localOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-lg font-black text-slate-900">{order.name}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase">SL: {order.quantity} x {order.price.toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-200/50 rounded-xl">
                          <button
                            onClick={() => handleUpdateOrderQuantity(order.id, -1)}
                            className="p-2 text-slate-500 hover:text-black transition-colors"
                          >
                            <span className="material-icons-round text-sm">remove</span>
                          </button>
                          <span className="text-sm font-black min-w-[20px] text-center text-slate-900">{order.quantity}</span>
                          <button
                            onClick={() => handleUpdateOrderQuantity(order.id, 1)}
                            className="p-2 text-slate-500 hover:text-black transition-colors"
                          >
                            <span className="material-icons-round text-sm">add</span>
                          </button>
                        </div>
                        <p className="font-mono font-black min-w-[80px] text-right text-slate-900">{(order.price * order.quantity).toLocaleString()}đ</p>
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
        <div className="p-6 pb-12 bg-white border-t border-slate-200 space-y-6 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-end">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">TỔNG THANH TOÁN</span>
            <span className="text-5xl font-black text-slate-900 font-mono">{total.toLocaleString()}₫</span>
          </div>
          <button onClick={handleCheckout} className="w-full py-6 bg-accent-red rounded-3xl font-black text-xl shadow-xl shadow-red-100 active:scale-95 transition-transform text-white">THANH TOÁN & KẾT THÚC</button>
        </div>
      )}

      {showAddMenu && (
        <div className="absolute inset-0 bg-white z-[110] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="pt-14 px-6 pb-4 border-b border-slate-200 flex items-center justify-between">
            <button onClick={() => setShowAddMenu(false)} className="text-slate-400 p-2"><span className="material-icons-round text-4xl">arrow_back</span></button>
            <h2 className="text-xl font-black text-slate-900">CHỌN MÓN DỊCH VỤ</h2>
            <div className="w-10"></div>
          </div>
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-2 overflow-x-auto">
              {(['All', 'Drink', 'Food', 'Other'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setMenuCategoryFilter(cat)}
                  className={`px-6 py-3 rounded-full text-sm font-black whitespace-nowrap transition-all ${menuCategoryFilter === cat
                    ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20'
                    : 'bg-slate-100 text-slate-500'
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
                    bg-white p-4 rounded-3xl border-2 transition-all 
                    active:scale-95 shadow-sm flex items-center justify-between
                    ${item.status === 'Out of Stock'
                      ? 'border-red-100 opacity-50'
                      : 'border-slate-100 border-l-primary/40'}
                  `}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center ${item.status === 'Out of Stock' ? 'bg-slate-800' : 'bg-primary/10 text-primary'
                      }`}>
                      <span className="material-icons-round text-3xl">
                        {item.category === 'Drink' ? 'local_drink' : item.category === 'Food' ? 'restaurant' : 'inventory_2'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 mb-1">{item.name}</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-primary font-black text-lg font-mono">{item.price.toLocaleString()}đ</p>
                        {item.status === 'Low Stock' && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Sắp hết</span>}
                      </div>
                    </div>
                  </div>

                  {item.status === 'Out of Stock' ? (
                    <span className="text-xs font-black text-red-500 uppercase bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">Hết hàng</span>
                  ) : (
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 active:scale-90 transition-transform">
                      <span className="material-icons-round text-2xl font-black">add</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showPrepaidStartForm && (
        <div className="absolute inset-0 bg-white z-[110] flex flex-col animate-in fade-in zoom-in duration-200 px-6">
          <div className="pt-14 pb-4 border-b border-slate-100 flex items-center justify-between">
            <button onClick={() => { setShowPrepaidStartForm(false); setPrepaidAmountInput(''); }} className="text-slate-400 p-2"><span className="material-icons-round text-3xl">arrow_back</span></button>
            <h2 className="text-xl font-black uppercase">TRẢ TIỀN TRƯỚC</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-4xl text-primary">payments</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">NHẬP SỐ TIỀN TRẢ TRƯỚC</h3>
              <p className="text-slate-500 text-sm font-bold">Hệ thống sẽ tự động thông báo khi hết thời gian tương ứng</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <input
                  type="number"
                  autoFocus
                  placeholder="Ví dụ: 50,000"
                  value={prepaidAmountInput}
                  onChange={(e) => setPrepaidAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-3xl font-black text-center text-primary focus:border-primary focus:ring-0 outline-none transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">VNĐ</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[10000, 20000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    onClick={() => setPrepaidAmountInput(val.toString())}
                    className="py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    {val.toLocaleString()}đ
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePrepaidStart}
              disabled={!prepaidAmountInput}
              className="w-full py-6 bg-primary text-white rounded-3xl font-black text-xl shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span className="material-icons-round">play_circle</span>
              BẮT ĐẦU CHƠI
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

  // Calculate revenue breakdown
  const tableRevenue = todayTransactions.reduce((sum, tx) => sum + tx.tableFee, 0);
  const serviceRevenue = todayTransactions.reduce((sum, tx) => sum + tx.serviceFee, 0);

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

  // 7 Days Revenue Chart
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const revenue = transactions
      .filter(tx => tx.endTime && tx.endTime.startsWith(date))
      .reduce((sum, tx) => sum + tx.total, 0);
    return { name: date.split('-').slice(1).join('/'), revenue };
  });

  const [showRevenueDetail, setShowRevenueDetail] = useState(false);

  return (
    <div className="p-4 h-full overflow-y-auto pb-32 space-y-6">
      <h2 className="text-3xl font-black">THỐNG KÊ DOANH THU</h2>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-64">
        <h3 className="text-sm font-black text-slate-500 uppercase mb-4">DOANH THU 7 NGÀY GẦN NHẤT</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000)}k`} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
            />
            <Bar dataKey="revenue" fill="#3c83f6" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-10 gap-3">
        <div
          onClick={() => setShowRevenueDetail(true)}
          className="col-span-8 bg-blue-50 border border-blue-100 rounded-3xl p-4 active:scale-95 transition-transform cursor-pointer relative group overflow-hidden"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-icons-round text-blue-400 text-sm">open_in_new</span>
          </div>
          <p className="text-sm font-black text-blue-600 uppercase mb-1">TỔNG DOANH THU</p>
          <p className="text-4xl font-black text-slate-900">{totalRevenue.toLocaleString()}đ</p>
          <div className="flex justify-between items-center mt-2 border-t border-blue-200 pt-2 text-[10px] uppercase font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Tiền bàn</span>
            <span className="text-slate-900">{tableRevenue.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between items-center mt-1 text-[10px] uppercase font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Dịch vụ</span>
            <span className="text-slate-900">{serviceRevenue.toLocaleString()}đ</span>
          </div>
        </div>

        <div className="col-span-2 bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 leading-none">SỐ BÀN</p>
          <p className="text-xl font-black text-slate-900 leading-none">{totalTablesPlayed}</p>
        </div>

        <div className="col-span-8 bg-amber-50 border border-amber-100 rounded-3xl p-4">
          <p className="text-sm font-black text-amber-600 uppercase mb-1">TRUNG BÌNH / BÀN</p>
          <p className="text-2xl font-black text-slate-900">{avgRevenuePerTable.toLocaleString()}đ</p>
        </div>

        <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1 leading-none">ĐANG CHƠI</p>
          <p className="text-xl font-black text-slate-900 leading-none">{tables.filter(t => t.status === 'PLAYING').length}</p>
        </div>
      </div>

      {
        topItems.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black mb-4 uppercase tracking-tighter">MÓN BÁN CHẠY</h3>
            <div className="space-y-4">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-base font-black text-primary w-6">{idx + 1}.</span>
                    <span className="text-lg font-bold text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">{item.quantity} đơn</p>
                    <p className="text-[10px] text-slate-500 font-bold">{item.revenue.toLocaleString()}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      {showRevenueDetail && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="pt-14 px-6 pb-4 border-b border-slate-200 flex items-center justify-between">
            <button onClick={() => setShowRevenueDetail(false)} className="p-2 -ml-2 text-slate-400"><span className="material-icons-round text-3xl">close</span></button>
            <div className="text-center">
              <h1 className="text-lg font-black uppercase text-slate-900">CHI TIẾT DOANH THU</h1>
              <p className="text-[10px] font-bold text-slate-500">{new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TIỀN BÀN</p>
                <p className="text-2xl font-black text-slate-900">{tableRevenue.toLocaleString()}đ</p>
                <p className="text-xs font-bold text-slate-400 mt-1">{totalRevenue > 0 ? ((tableRevenue / totalRevenue) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">DỊCH VỤ</p>
                <p className="text-2xl font-black text-primary">{serviceRevenue.toLocaleString()}đ</p>
                <p className="text-xs font-bold text-primary/60 mt-1">{totalRevenue > 0 ? ((serviceRevenue / totalRevenue) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">DOANH THU MÓN ĂN</h3>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-black text-slate-400 uppercase text-[10px]">Tên món</th>
                      <th className="p-4 font-black text-slate-400 uppercase text-[10px] text-right">SL</th>
                      <th className="p-4 font-black text-slate-400 uppercase text-[10px] text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-900">{item.name}</td>
                        <td className="p-4 font-bold text-slate-500 text-right">{item.quantity}</td>
                        <td className="p-4 font-black text-slate-900 text-right">{item.revenue.toLocaleString()}đ</td>
                      </tr>
                    ))}
                    {Object.keys(itemSales).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400 italic font-bold">Chưa có dữ liệu món ăn hôm nay</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
  const [loading, setLoading] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Hydrate from localStorage for instant boot
  useEffect(() => {
    try {
      const c1 = localStorage.getItem('lilius_tables');
      const c2 = localStorage.getItem('lilius_rates');
      const c3 = localStorage.getItem('lilius_menu');
      const c4 = localStorage.getItem('lilius_tx');
      const c5 = localStorage.getItem('lilius_webhook');
      if (c1) setTables(JSON.parse(c1));
      if (c2) setRates(JSON.parse(c2));
      if (c3) setMenu(JSON.parse(c3));
      if (c4) setTransactions(JSON.parse(c4));
      if (c5) setWebhookUrl(c5);
    } catch (e) { console.error('Cache hydration failed', e); }
  }, []);

  const notifiedRef = useRef<Set<string>>(new Set());

  // Background monitor for prepaid tables
  useEffect(() => {
    tables.forEach(table => {
      if (table.status === 'PLAYING' && table.prepaidAmount && table.startTime && webhookUrl) {
        const notificationKey = `${table.id}-${table.startTime}`;
        if (notifiedRef.current.has(notificationKey)) return;

        const startTime = new Date(table.startTime);
        const diffMs = new Date().getTime() - startTime.getTime();
        const hourlyRate = rates[table.type] || 0;
        const remainingSeconds = hourlyRate > 0 ? (table.prepaidAmount / hourlyRate) * 3600 - (diffMs / 1000) : 1;

        if (remainingSeconds <= 0) {
          notifiedRef.current.add(notificationKey);
          const sendAlert = async () => {
            try {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `⚠️ **HẾT GIỜ CHƠI TẠI BÀN ${table.id}**\n- Số tiền trả trước: ${table.prepaidAmount?.toLocaleString()}đ\n- Loại bàn: ${table.type}\n\n@here Vui lòng kiểm tra bàn!`
                })
              });
            } catch (e) {
              console.error("Global alert failed", e);
            }
          };
          sendAlert();
        }
      }
    });

    // Cleanup keys for tables no longer active
    const activeKeys = new Set(tables.filter(t => t.status === 'PLAYING' && t.startTime).map(t => `${t.id}-${t.startTime}`));
    notifiedRef.current.forEach(key => {
      if (!activeKeys.has(key)) notifiedRef.current.delete(key);
    });
  }, [tables, tick, webhookUrl, rates]);

  const refresh = async (isInitial = false) => {
    // Only show loading if we have absolutely no data cached on first load
    if (isInitial && tables.length === 0) setLoading(true);

    const taskTables = DB.getTables().then(data => {
      setTables(data);
      localStorage.setItem('lilius_tables', JSON.stringify(data));
      setSelectedTable(prev => prev ? (data.find(t => t.id === prev.id) || null) : null);
    });

    const taskRates = DB.getRates().then(data => {
      setRates(data);
      localStorage.setItem('lilius_rates', JSON.stringify(data));
    });

    const taskMenu = DB.getMenu().then(data => {
      setMenu(data);
      localStorage.setItem('lilius_menu', JSON.stringify(data));
    });

    const taskTx = DB.getTransactions().then(data => {
      setTransactions(data);
      localStorage.setItem('lilius_tx', JSON.stringify(data));
    });

    try {
      // Fire all but don't hold the UI hostage for all of them
      await Promise.allSettled([taskTables, taskRates, taskMenu, taskTx]);
    } catch (err) {
      console.error('Refresh failed', err);
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
    <div className="flex h-screen bg-white text-slate-900 font-display overflow-hidden flex-col pb-14">
      <header className="pt-2 pb-2 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <span className="material-icons-round text-primary text-2xl">sports_esports</span>
          <h1 className="font-black text-base uppercase tracking-tighter italic">Lilius</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
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
            <h2 className="text-3xl font-black">LỊCH SỬ GIAO DỊCH</h2>

            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'today', 'week', 'month'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTransactionFilter(filter)}
                    className={`px-6 py-3 rounded-full text-sm font-black whitespace-nowrap transition-all ${transactionFilter === filter
                      ? 'bg-primary text-white scale-105 shadow-md'
                      : 'bg-slate-100 text-slate-500'
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
                placeholder="Tìm kiếm bàn hoặc mã giao dịch..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-base text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm"
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
                    className="bg-white p-4 rounded-3xl border border-slate-200 flex justify-between items-center active:scale-95 transition-all tap-highlight-transparent shadow-sm"
                  >
                    <div>
                      <p className="font-black text-xl mb-0.5">Bàn {tx.tableName}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{tx.duration} • {tx.endTime ? new Date(tx.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{tx.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-2xl text-primary font-mono">{tx.total.toLocaleString()}đ</p>
                      <p className="text-[10px] font-black text-accent-emerald uppercase tracking-widest">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {currentView === 'reports' && <ReportsView transactions={transactions} tables={tables} menu={menu} />}
        {currentView === 'settings' && (
          <SettingsView
            tables={tables}
            menu={menu}
            rates={rates}
            webhookUrl={webhookUrl}
            onUpdate={refresh}
            onWebhookChange={(url) => {
              setWebhookUrl(url);
              localStorage.setItem('lilius_webhook', url);
            }}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-200 flex items-center justify-around px-2 pb-8 pt-2 z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-icons-round text-2xl">grid_view</span>
          <span className="text-[11px] font-black uppercase">SƠ ĐỒ</span>
        </button>
        <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'history' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-icons-round text-2xl">history</span>
          <span className="text-[11px] font-black uppercase">LỊCH SỬ</span>
        </button>
        <button onClick={() => setCurrentView('reports')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'reports' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-icons-round text-2xl">bar_chart</span>
          <span className="text-[11px] font-black uppercase">THỐNG KÊ</span>
        </button>
        <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'settings' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-icons-round text-2xl">settings</span>
          <span className="text-[11px] font-black uppercase">QUẢN LÝ</span>
        </button>
      </nav>

      {selectedTable && (
        <TableModal
          table={selectedTable}
          rates={rates}
          menu={menu}
          webhookUrl={webhookUrl}
          onClose={() => setSelectedTable(null)}
          onUpdate={refresh}
          onCheckoutSuccess={() => setShowSuccess(true)}
        />
      )}

      {showSuccess && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl shadow-slate-200 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300"
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
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="pt-14 px-6 pb-4 border-b border-slate-200 flex items-center justify-between">
            <button onClick={() => setSelectedTransaction(null)} className="p-2 -ml-2 text-slate-400"><span className="material-icons-round text-3xl">close</span></button>
            <div className="text-center">
              <h1 className="text-lg font-black uppercase text-slate-900">CHI TIẾT HÓA ĐƠN</h1>
              <p className="text-[10px] font-bold text-slate-500">{selectedTransaction.id}</p>
            </div>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold">Mã hóa đơn</span>
                <span className="font-black text-xs uppercase text-slate-900">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold">Bàn</span>
                <span className="font-black text-xs uppercase text-slate-900">Bàn {selectedTransaction.tableName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold">Thời gian bắt đầu</span>
                <span className="font-black text-xs text-slate-900">{new Date(selectedTransaction.startTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold">Thời gian kết thúc</span>
                <span className="font-black text-xs text-slate-900">{new Date(selectedTransaction.endTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold">Thời lượng</span>
                <span className="font-black text-xs text-primary">{selectedTransaction.duration}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CHI TIẾT DỊCH VỤ</h3>
              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Tên món / Tiền bàn</span>
                  <span>Thành tiền</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Tiền bàn ({selectedTransaction.duration})</span>
                  <span className="text-xs font-black text-slate-900">{selectedTransaction.tableFee.toLocaleString()}đ</span>
                </div>
                {selectedTransaction.orders && selectedTransaction.orders.map((o, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-medium">{o.name} <span className="text-slate-400 text-[10px]">x{o.quantity}</span></span>
                    <span className="text-xs font-black text-slate-900">{(o.price * o.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-primary">TỔNG CỘNG</span>
              <span className="text-2xl font-black text-primary font-mono">{selectedTransaction.total.toLocaleString()}đ</span>
            </div>
          </div>
          <div className="p-6 pb-12">
            <button onClick={() => setSelectedTransaction(null)} className="w-full py-4 bg-slate-100 rounded-2xl font-black text-sm text-slate-600 active:bg-slate-200 transition-colors">ĐÓNG</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
