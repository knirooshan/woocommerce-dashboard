import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { Plus, Edit, Trash2 } from "lucide-react";
import CustomerForm from "../components/CustomerForm";
import SearchBar from "../components/SearchBar";

const Customers = () => {
  const { user } = useSelector((state) => state.auth);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const params = new URLSearchParams();
      if (search && search.length >= 3) params.append("search", search);

      const { data } = await axios.get(
        `${ENDPOINTS.CUSTOMERS}?${params.toString()}`,
        config
      );
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setLoading(false);
    }
  };

  const openModal = (customer = null) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingCustomer) {
        // Update
        await axios.put(
          ENDPOINTS.CUSTOMER_BY_ID(editingCustomer._id),
          formData,
          config
        );
      } else {
        // Create
        await axios.post(ENDPOINTS.CUSTOMERS, formData, config);
      }

      closeModal();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(error.response?.data?.message || "Error saving customer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(ENDPOINTS.CUSTOMER_BY_ID(id), config);
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error deleting customer");
    }
  };

  if (loading) return <div className="text-white">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search customers by name, email, or phone..."
      />

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {customer.billing?.company || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {customer.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {customer.billing?.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {[
                      customer.billing?.address_1,
                      customer.billing?.city,
                      customer.billing?.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(customer)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No customers found. Add one to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CustomerForm
          customer={editingCustomer}
          onClose={closeModal}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
};

export default Customers;
