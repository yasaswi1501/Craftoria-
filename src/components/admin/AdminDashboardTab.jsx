import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Clock, IndianRupee, Undo2, AlertTriangle,
  RefreshCw, DownloadCloud, CheckCircle2, XCircle
} from 'lucide-react';
import { fetchDashboardStats, fetchLowStockProducts, importStaticCatalog } from '../../services/adminCatalog';

const StatCard = ({ icon: Icon, label, value, accent = 'text-brand-plum' }) => (
  <div className="glass-card p-4 sm:p-5 rounded-2xl border border-brand-purple/15 bg-white/60 shadow-xs flex items-center gap-3.5">
    <div className={`w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/50">{label}</div>
      <div className={`text-lg font-bold ${accent}`}>{value}</div>
    </div>
  </div>
);

const AdminDashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [importState, setImportState] = useState('idle'); // 'idle' | 'running' | 'done' | 'error'
  const [importReport, setImportReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, lowStockData] = await Promise.all([
        fetchDashboardStats(),
        fetchLowStockProducts(),
      ]);
      setStats(statsData);
      setLowStock(lowStockData);
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleImport = async () => {
    setImportState('running');
    try {
      const report = await importStaticCatalog();
      setImportReport(report);
      setImportState(report.errors.length > 0 ? 'error' : 'done');
      load();
    } catch (err) {
      setImportReport({ categories: 0, products: 0, errors: [err.message] });
      setImportState('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Catalog Import */}
      <div className="glass-card p-5 rounded-[24px] border border-brand-purple/20 bg-gradient-to-br from-white via-brand-cream/40 to-brand-purple/10 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-base font-bold text-brand-dark flex items-center gap-1.5">
              <DownloadCloud className="w-4 h-4 text-brand-plum" /> Import Catalog from Site Defaults
            </h3>
            <p className="text-xs text-brand-dark/65 mt-1 max-w-xl leading-relaxed">
              Loads the 7 categories and 26 products currently built into the site into this database, so you can manage them here.
              Safe to run more than once &mdash; it updates existing rows instead of duplicating them.
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={importState === 'running'}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60"
          >
            {importState === 'running' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <DownloadCloud className="w-3.5 h-3.5" /> Run Import
              </>
            )}
          </button>
        </div>

        {importReport && importState !== 'running' && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
            importState === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {importState === 'error' ? <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <div>
              <div>{importReport.categories} categories, {importReport.products} products imported.</div>
              {importReport.errors.length > 0 && (
                <ul className="list-disc pl-4 mt-1 font-normal text-[11px] space-y-0.5">
                  {importReport.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-brand-purple/5 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total_orders} />
          <StatCard icon={Clock} label="Orders Today" value={stats.orders_today} />
          <StatCard icon={ShoppingBag} label="Pending Orders" value={stats.pending_orders} accent="text-amber-600" />
          <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`} accent="text-emerald-600" />
          <StatCard icon={IndianRupee} label="Revenue Today" value={`₹${Number(stats.revenue_today || 0).toLocaleString('en-IN')}`} accent="text-emerald-600" />
          <StatCard icon={Undo2} label="Pending Returns" value={stats.pending_returns} />
          <StatCard icon={Undo2} label="Pending Refunds" value={stats.pending_refunds} />
          <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.low_stock_count} accent={stats.low_stock_count > 0 ? 'text-rose-600' : 'text-brand-plum'} />
        </div>
      ) : null}

      {/* Low Stock List */}
      {!loading && lowStock.length > 0 && (
        <div className="glass-card p-5 rounded-[24px] border border-rose-200 bg-rose-50/40 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-rose-700 flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
          </h3>
          <div className="flex flex-col gap-2">
            {lowStock.map((item) => (
              <div key={item.variant_id} className="flex items-center justify-between text-xs bg-white/70 rounded-xl px-3 py-2 border border-rose-100">
                <span className="font-semibold text-brand-dark">{item.product_name}</span>
                <span className="font-bold text-rose-600">{item.available_quantity} left (threshold {item.low_stock_threshold})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardTab;
