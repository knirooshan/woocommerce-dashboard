import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const Users = () => {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(ENDPOINTS.USERS, config);
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await axios.put(
          ENDPOINTS.USER_BY_ID(editingUser._id),
          updateData,
          config
        );
        setSuccess("User updated successfully!");
      } else {
        // Create new user
        await axios.post(ENDPOINTS.USERS, formData, config);
        setSuccess("User created successfully!");
      }

      setFormData({ name: "", email: "", password: "", role: "staff" });
      setEditingUser(null);
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          `Failed to ${editingUser ? "update" : "create"} user`
      );
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(ENDPOINTS.USER_BY_ID(id), config);
      setSuccess("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", role: "staff" });
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 rounded-lg shadow border border-slate-800 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{u.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.role === "admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : u.role === "manager"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {u.role !== "admin" && (
                    <>
                      <button
                        onClick={() => handleEdit(u)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="text-red-400 hover:text-red-300 ml-4"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "staff",
                  });
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      role: "staff",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
