import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, MessageSquare, MapPin, Package } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '../../services/adminCatalog';

const STATUS_OPTIONS = [
  'pending_payment', 'confirmed', 'processing', 'packed', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded',
];

const STATUS_COLORS = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  return_requested: 'bg-amber-100 text-amber-700',
  returned: 'bg-gray-200 text-gray-600',
  refunded: 'bg-gray-200 text-gray-600',
};

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// Builds the same human-readable summary the customer's WhatsApp message
// would show, purely from the persisted order record -- so an admin can
// verify exactly what a customer saw/sent without needing raw DB access or
// any credentials.
const buildOrderSummaryText = (order) => {
  let text = `Order ${order.order_number}\n`;
  (order.order_items || []).forEach((item, i) => {
    text += `${i + 1}. ${item.product_name} (Qty: ${item.quantity}) - ${formatINR(item.total)}\n`;
    const sel = item.customization_snapshot;
    if (sel?.personalization_text) text += `   Personalization: ${sel.personalization_text}\n`;
    if (sel?.selections?.length) {
      sel.selections.forEach((s) => {
        text += `   ${s.group}: ${s.option}${s.price_delta ? ` (${s.price_delta > 0 ? '+' : ''}${formatINR(s.price_delta)})` : ''}\n`;
      });
    }
    if (sel?.notes) text += `   Notes: ${sel.notes}\n`;
  });
  text += `\nSubtotal: ${formatINR(order.subtotal)}\nDelivery: ${order.shipping_charge > 0 ? formatINR(order.shipping_charge) : 'FREE'}\nTotal: ${formatINR(order.total_amount)}`;
  return text;
};

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchAdminOrders());
    } catch (err) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (order, status) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      load();
    } catch (err) {
      setError(err.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-lg font-bold">Orders ({orders.length})</h2>
        <p className="text-[11px] text-brand-dark/55 mt-0.5">
          Every order placed through the site's checkout, with the same trusted, database-computed pricing used in the customer's WhatsApp message.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-brand-purple/5 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-brand-purple/10">
          <Package className="w-8 h-8 text-brand-plum/40 mx-auto mb-2" />
          <p className="text-xs font-semibold text-brand-dark/60">No orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const address = order.shipping_address_snapshot || {};
            return (
              <div key={order.id} className="glass-card rounded-2xl border border-brand-purple/15 bg-white/60 overflow-hidden">
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="w-full p-3.5 sm:p-4 flex items-center gap-3.5 text-left cursor-pointer"
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-plum">{order.order_number}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-dark/50 mt-0.5">
                      {new Date(order.created_at).toLocaleString('en-IN')} &bull; {order.order_items?.length || 0} item(s) &bull; <span className="font-bold text-brand-dark">{formatINR(order.total_amount)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-plum flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-brand-plum flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-3.5 sm:px-4 pb-4 border-t border-brand-purple/10 pt-3.5 space-y-4">
                    {/* Status control */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-brand-dark/60 uppercase tracking-wider">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        disabled={updatingId === order.id}
                        className="text-xs px-2.5 py-1.5 rounded-full border border-brand-purple/20 bg-white cursor-pointer focus:outline-none disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                      {updatingId === order.id && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-plum" />}
                    </div>

                    {/* Shipping address */}
                    <div className="text-xs text-brand-dark/75 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-plum flex-shrink-0 mt-0.5" />
                      <span>
                        {address.fullName}, {address.building}, {address.street}, {address.city} - {address.pinCode} &bull; {address.phone}
                      </span>
                    </div>

                    {/* Order items */}
                    <div className="flex flex-col gap-2">
                      {(order.order_items || []).map((item) => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-white/70 border border-brand-purple/10 text-xs">
                          <div className="flex justify-between font-semibold text-brand-dark">
                            <span>{item.product_name} &times; {item.quantity}</span>
                            <span>{formatINR(item.total)}</span>
                          </div>
                          {item.customization_snapshot?.personalization_text && (
                            <div className="text-[10px] text-brand-dark/60 mt-1">Personalization: "{item.customization_snapshot.personalization_text}"</div>
                          )}
                          {item.customization_snapshot?.selections?.map((s, i) => (
                            <div key={i} className="text-[10px] text-brand-dark/60">{s.group}: {s.option}{s.price_delta ? ` (${s.price_delta > 0 ? '+' : ''}${formatINR(s.price_delta)})` : ''}</div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Human-readable order/WhatsApp summary, no credentials */}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-bold text-brand-plum flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> View order summary (as sent via WhatsApp)
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-brand-dark/5 text-[10px] whitespace-pre-wrap font-mono text-brand-dark/80">
                        {buildOrderSummaryText(order)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTab;
