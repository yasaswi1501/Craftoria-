import { useState } from 'react';
import { LayoutDashboard, Tags, Package, ShieldAlert, ArrowLeft, Sliders, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import AdminDashboardTab from './AdminDashboardTab';
import AdminCategoriesTab from './AdminCategoriesTab';
import AdminProductsTab from './AdminProductsTab';
import AdminCustomizationsTab from './AdminCustomizationsTab';
import AdminOrdersTab from './AdminOrdersTab';
import AdminSettingsTab from './AdminSettingsTab';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customizations', label: 'Customizations', icon: Sliders },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminPanel = () => {
  const { isLoggedIn, isAdmin, user } = useAuth();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 text-brand-dark">
        <div className="max-w-md w-full glass-card rounded-[32px] p-8 text-center border border-brand-purple/20 shadow-md">
          <ShieldAlert className="w-10 h-10 text-brand-plum mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold mb-2">Admin Sign-In Required</h1>
          <p className="text-xs text-brand-dark/70 leading-relaxed mb-6">
            Please sign in with an admin account to access the Craftoria admin panel.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 text-brand-dark">
        <div className="max-w-md w-full glass-card rounded-[32px] p-8 text-center border border-rose-200 shadow-md">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-xs text-brand-dark/70 leading-relaxed mb-1">
            {user?.email} does not have admin access.
          </p>
          <p className="text-[11px] text-brand-dark/50 leading-relaxed mb-6">
            If this should be an admin account, promote its role in the Supabase SQL Editor, then sign out and back in.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      <div className="mb-6 sm:mb-8">
        <a href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Site
        </a>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum font-mono">Craftoria</span>
        <h1 className="font-serif text-2.5xl sm:text-4xl font-bold mt-1">Admin Panel</h1>
        <p className="text-xs sm:text-sm text-brand-dark/60 mt-1">Signed in as {user?.email}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto no-scrollbar border-b border-brand-purple/10 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'text-brand-plum border-brand-plum bg-brand-purple/5'
                  : 'text-brand-dark/55 border-transparent hover:text-brand-plum hover:bg-brand-purple/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && <AdminDashboardTab />}
      {activeTab === 'categories' && <AdminCategoriesTab />}
      {activeTab === 'products' && <AdminProductsTab />}
      {activeTab === 'customizations' && <AdminCustomizationsTab />}
      {activeTab === 'orders' && <AdminOrdersTab />}
      {activeTab === 'settings' && <AdminSettingsTab />}
    </div>
  );
};

export default AdminPanel;
