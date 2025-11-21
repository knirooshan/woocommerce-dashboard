import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import POSProductGrid from "../components/POSProductGrid";
import POSCart from "../components/POSCart";

const POS = () => {
  const { user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [prodRes, custRes, settingsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/products", config),
          axios.get("http://localhost:5000/api/customers", config),
          axios.get("http://localhost:5000/api/settings", config),
        ]);
        setProducts(prodRes.data);
        setCustomers(custRes.data);
        setSettings(settingsRes.data);
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
    const invoiceData = {
      customer: selectedCustomer || customers[0]?._id,
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
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        "http://localhost:5000/api/invoices",
        invoiceData,
        config
      );
      alert("Order completed successfully!");
      setCart([]);
      setDiscount(0);
      setSelectedCustomer("");
    } catch (error) {
      console.error("Error processing checkout:", error);
      alert("Error processing checkout");
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  if (loading) return <div>Loading POS...</div>;

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
          total={total}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          setDiscount={setDiscount}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default POS;
