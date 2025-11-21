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
    <div className="flex flex-col h-full bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Customer Selection */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center mb-2">
          <User size={18} className="mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Customer</span>
        </div>
        <select
          value={selectedCustomer}
          onChange={(e) => onSelectCustomer(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart size={48} className="mb-2 opacity-50" />
            <p>Cart is empty</p>
          </div>
        ) : (
          cart.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b pb-2"
            >
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.name}
                </h4>
                <div className="text-xs text-gray-500">
                  {formatCurrency(item.price, settings)} x {item.quantity}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-800">
                  {formatCurrency(item.price * item.quantity, settings)}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="bg-gray-100 hover:bg-gray-200 rounded px-2 text-xs"
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      onUpdateQuantity(index, Math.max(1, item.quantity - 1))
                    }
                    className="bg-gray-100 hover:bg-gray-200 rounded px-2 text-xs"
                  >
                    -
                  </button>
                </div>
                <button
                  onClick={() => onRemoveFromCart(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Checkout */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, settings)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>{formatCurrency(tax, settings)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 text-right border rounded px-1 py-0.5 text-sm"
            />
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
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
