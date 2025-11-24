import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { RefreshCw, Search, Plus, Edit, Trash } from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";
import ProductForm from "../components/ProductForm";

const Products = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(ENDPOINTS.PRODUCTS, config);
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(ENDPOINTS.PRODUCTS_SYNC, {}, config);
      await fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error syncing products:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(ENDPOINTS.PRODUCT_BY_ID(id), config);
        setProducts(products.filter((p) => p._id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product");
      }
    }
  };

  const handleSave = async (productData) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingProduct) {
        const { data } = await axios.put(
          ENDPOINTS.PRODUCT_BY_ID(editingProduct._id),
          productData,
          config
        );
        setProducts(
          products.map((p) => (p._id === editingProduct._id ? data : p))
        );
      } else {
        const { data } = await axios.post(
          ENDPOINTS.PRODUCTS,
          productData,
          config
        );
        setProducts([...products, data]);
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-white">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync from WooCommerce"}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-900 p-4 rounded-lg shadow flex items-center border border-slate-800">
        <Search className="text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none bg-transparent text-white placeholder-slate-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-slate-800 rounded flex items-center justify-center text-slate-500"></div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-400">
                      {product.sku || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {formatCurrency(product.price || 0, settings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-400">
                      {formatCurrency(product.costPrice || 0, settings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "publish"
                          ? "bg-green-900/50 text-green-400 border border-green-800"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {product.status.charAt(0).toUpperCase() +
                        product.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No products found. Try syncing from WooCommerce or adding a new
            product.
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Products;
