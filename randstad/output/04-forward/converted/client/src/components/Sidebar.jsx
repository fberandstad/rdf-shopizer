import { useState } from 'react';
import { Store, BookOpen, Activity, Moon, Sun, Menu, ShoppingBag, ShoppingCart, Package, User, Shield } from 'lucide-react';

const NAV = [
  { id: 'storefront', label: 'Storefront', icon: Store },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'account', label: 'Account', icon: User },
  { id: 'admin', label: 'Admin', icon: Shield, adminOnly: true },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'health', label: 'Health & Metrics', icon: Activity, adminOnly: true },
];

export default function Sidebar({ currentPage, onNavigate, darkMode, onToggleDark, userRole, cartCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = NAV.filter((n) => !n.adminOnly || userRole === 'admin');

  return (
    <aside
      id="sidebar"
      className={`bg-randstad-dark text-white flex flex-col w-60 ${collapsed ? 'collapsed' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
        <ShoppingBag className="shrink-0" size={24} />
        <span className="nav-logo-text font-bold text-lg">ShopiClaw</span>
        <button className="ml-auto text-white/70 hover:text-white" onClick={() => setCollapsed((c) => !c)}>
          <Menu size={18} />
        </button>
      </div>
      <nav className="flex-1 py-3">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
              ${currentPage === id ? 'bg-randstad-blue text-white' : 'text-white/80 hover:bg-white/10'}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="nav-label">{label}</span>
            {id === 'cart' && cartCount > 0 && (
              <span className="ml-auto nav-label text-xs bg-randstad-cyan text-randstad-dark font-bold rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-white/10 rounded"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="nav-label">{darkMode ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  );
}
