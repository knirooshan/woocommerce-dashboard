import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { useSelector } from "react-redux";
import POSProductGrid from "../components/POSProductGrid";
import POSCart from "../components/POSCart";
import CustomerForm from "../components/CustomerForm";

const POS = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [prodRes, custRes] = await Promise.all([
          axios.get(ENDPOINTS.PRODUCTS, config),
          axios.get(ENDPOINTS.CUSTOMERS, config),
        ]);
        setProducts(prodRes.data);
        setCustomers(custRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex(
      (item) => item.product === product._id
    );
    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateQuantity = (index, quantity) => {
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = settings?.tax?.rate || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const { subtotal, tax, total } = calculateTotals();

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Check if walk-in customer is selected
      const isWalkIn =
        !selectedCustomer || selectedCustomer === "0000-0000-0001";
      const customerId = isWalkIn ? "walk-in" : selectedCustomer;
      const selectedCustomerData = !isWalkIn
        ? customers.find((c) => c._id === customerId)
        : null;

      const orderData = {
        orderNumber: `POS-${Date.now()}`,
        customer: customerId,
        customerInfo: {
          firstName: selectedCustomerData?.firstName || "Walk-in",
          lastName: selectedCustomerData?.lastName || "Customer",
          email: selectedCustomerData?.email || "",
          phone: selectedCustomerData?.billing?.phone || "",
        },
        items: cart.map((item) => ({
          productId: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        tax,
        discount,
        total,
        status: "completed",
        paymentMethod: "Cash",
        paymentMethodTitle: "Cash Payment",
        dateCreated: new Date(),
        datePaid: new Date(),
        dateCompleted: new Date(),
      };

      // Create order first (this will handle walk-in customer creation)
      const orderRes = await axios.post(ENDPOINTS.ORDERS, orderData, config);

      // Use the customer from the created order for the invoice
      const invoiceData = {
        customer: orderRes.data.customer._id || orderRes.data.customer,
        items: cart.map((item) => ({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal,
        tax,
        discount,
        total,
        status: "paid",
        paymentMethod: "Cash",
        dueDate: new Date(),
      };

      // Create invoice with the actual customer ID
      const invoiceRes = await axios.post(ENDPOINTS.INVOICES, invoiceData, config);

      // Link invoice to order
      if (orderRes.data._id && invoiceRes.data._id) {
        await axios.put(
          `${ENDPOINTS.ORDERS}/${orderRes.data._id}`,
          { invoice: invoiceRes.data._id },
          config
        );
      }

      alert("Order completed successfully!");
      setCart([]);
      setDiscount(0);
      setSelectedCustomer("0000-0000-0001");
    } catch (error) {
      console.error("Error processing checkout:", error);
      alert("Error processing checkout");
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post(
        ENDPOINTS.CUSTOMERS,
        customerData,
        config
      );
      setCustomers([...customers, data]);
      setSelectedCustomer(data._id);
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error creating customer");
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  if (loading) return <div className="text-white">Loading POS...</div>;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Left Side: Product Grid */}
      <div className="flex-1 overflow-hidden">
        <POSProductGrid products={products} onAddToCart={addToCart} />
      </div>
      {/* Right Side: Cart */}
      <div className="w-96">
        <POSCart
          cart={cart}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onCheckout={handleCheckout}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onAddCustomer={() => setShowCustomerModal(true)}
          total={total}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          setDiscount={setDiscount}
          settings={settings}
        />
      </div>

      {showCustomerModal && (
        <CustomerForm
          onClose={() => setShowCustomerModal(false)}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
};

export default POS;
