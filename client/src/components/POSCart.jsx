import { Trash, ShoppingCart, User } from "lucide-react";
import { formatCurrency } from "../utils/currency";

const POSCart = ({
  cart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  customers,
  selectedCustomer,
  onSelectCustomer,
  total,
  subtotal,
  tax,
  discount,
  setDiscount,
  settings,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 shadow-lg rounded-lg overflow-hidden border border-slate-800">
      {/* Customer Selection */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center mb-2">
          <User size={18} className="mr-2 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Customer</span>
        </div>
        <select
          value={selectedCustomer}
          onChange={(e) => onSelectCustomer(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="0000-0000-0001">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ShoppingCart size={48} className="mb-2 opacity-50" />
            <p>Cart is empty</p>
          </div>
        ) : (
          cart.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-slate-800 pb-2"
            >
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white line-clamp-1">
                  {item.name}
                </h4>
                <div className="text-xs text-slate-400">
                  {formatCurrency(item.price, settings)} x {item.quantity}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-medium text-white">
                  {formatCurrency(item.price * item.quantity, settings)}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 text-xs"
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      onUpdateQuantity(index, Math.max(1, item.quantity - 1))
                    }
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 text-xs"
                  >
                    -
                  </button>
                </div>
                <button
                  onClick={() => onRemoveFromCart(index)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Checkout */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, settings)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>
              {settings?.tax?.label || "Tax"}{" "}
              {settings?.tax?.rate > 0 && `(${settings.tax.rate}%)`}
            </span>
            <span>{formatCurrency(tax, settings)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 text-right bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-800">
            <span>Total</span>
            <span>{formatCurrency(total, settings)}</span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default POSCart;
