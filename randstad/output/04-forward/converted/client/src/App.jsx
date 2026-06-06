import { useState, useEffect, useCallback } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { COPILOT_RUNTIME_URL, api } from './config';
import Sidebar from './components/Sidebar';
import UserMenu from './components/UserMenu';
import { CartProvider, useCart } from './cart/CartContext';
import Login from './pages/Login';
import Storefront from './pages/Storefront';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Health from './pages/Health';
import Knowledge from './pages/Knowledge';

function AppContent({ authUser, onLogout, aiEnabled }) {
  const [currentPage, setCurrentPage] = useState('storefront');
  const [darkMode, setDarkMode] = useState(false);
  const { count: cartCount } = useCart();

  const toggleDark = useCallback(() => {
    setDarkMode((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'storefront': return <Storefront />;
      case 'cart': return <Cart onNavigate={setCurrentPage} />;
      case 'checkout': return <Checkout onNavigate={setCurrentPage} />;
      case 'orders': return <Orders />;
      case 'knowledge': return <Knowledge />;
      case 'health': return <Health userRole={authUser?.role} />;
      default: return <Storefront />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        userRole={authUser?.role}
        cartCount={cartCount}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
          <h1 className="text-lg font-semibold text-randstad-blue capitalize">{currentPage}</h1>
          <UserMenu user={authUser} onLogout={onLogout} />
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">{renderPage()}</main>
      </div>
      {aiEnabled && (
        <CopilotSidebar
          labels={{
            title: 'ShopiClaw',
            initial: "Hi! I'm ShopiClaw. Ask me about products, your orders, or even how this app works.",
            placeholder: 'Ask ShopiClaw...',
          }}
          defaultOpen={false}
        />
      )}
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    api('/auth/me').then((d) => { if (d.user) setAuthUser(d.user); })
      .catch(() => {}).finally(() => setAuthChecked(true));
    fetch('/api/copilotkit-health').then((r) => r.json())
      .then((d) => setAiEnabled(!!d.ok)).catch(() => {});
  }, []);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!authUser) return <Login onLogin={setAuthUser} />;

  return (
    <CopilotKit runtimeUrl={COPILOT_RUNTIME_URL} showDevConsole={false}>
      <CartProvider>
        <AppContent
          authUser={authUser}
          aiEnabled={aiEnabled}
          onLogout={async () => { await api('/auth/logout', { method: 'POST' }); setAuthUser(null); }}
        />
      </CartProvider>
    </CopilotKit>
  );
}
