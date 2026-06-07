import { useState } from 'react';
import {
  Store, BookOpen, Activity, Moon, Sun, ShoppingCart, Package, User, Shield,
  ChevronDown, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

const SHOP_ITEMS = [
  { id: 'storefront', label: 'Storefront', icon: Store },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'account', label: 'Account', icon: User },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
];

const ADMIN_ITEMS = [
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'health', label: 'Health & Metrics', icon: Activity },
];

function NavSection({ title, items, currentPage, onNavigate, collapsed, open, onToggle, cartCount }) {
  return (
    <div className="mb-1">
      {!collapsed && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span>{title}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
        </button>
      )}
      {(collapsed || open) && items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${currentPage === id
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'}`}
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="nav-label">{label}</span>
          {id === 'cart' && cartCount > 0 && (
            <span className="ml-auto nav-label text-xs bg-randstad-blue text-white font-bold rounded-full px-2 py-0.5">
              {cartCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar({ currentPage, onNavigate, darkMode, onToggleDark, userRole, cartCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({ shop: true, admin: true });
  const toggle = (key) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  const isAdmin = userRole === 'admin';

  const ctrlCls = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors';

  return (
    <div
      id="sidebar"
      className={`${collapsed ? 'collapsed' : ''} flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-screen sticky top-0`}
      style={{ width: collapsed ? '4rem' : '15rem', minWidth: collapsed ? '4rem' : '15rem' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#0053A5' }}>
          SC
        </div>
        <span className="nav-logo-text font-bold text-gray-900 dark:text-white text-sm">ShopiClaw</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <NavSection
          title="Shop" items={SHOP_ITEMS} currentPage={currentPage} onNavigate={onNavigate}
          collapsed={collapsed} open={openSections.shop} onToggle={() => toggle('shop')} cartCount={cartCount}
        />
        {isAdmin && (
          <NavSection
            title="Admin" items={ADMIN_ITEMS} currentPage={currentPage} onNavigate={onNavigate}
            collapsed={collapsed} open={openSections.admin} onToggle={() => toggle('admin')}
          />
        )}
      </nav>

      {/* Bottom controls */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-slate-700 space-y-1">
        <button onClick={onToggleDark} className={ctrlCls}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="nav-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={() => setCollapsed((c) => !c)} className={ctrlCls}>
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          <span className="nav-label">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>
    </div>
  );
}
