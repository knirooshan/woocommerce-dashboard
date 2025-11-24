import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ENDPOINTS } from "./config/api";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "./store/slices/authSlice";
import axios from "axios";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import FirstTimeSetup from "./pages/FirstTimeSetup";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import EditQuotation from "./pages/EditQuotation";
import QuotationView from "./pages/QuotationView";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import EditInvoice from "./pages/EditInvoice";
import InvoiceView from "./pages/InvoiceView";
import POS from "./pages/POS";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Vendors from "./pages/Vendors";
import ActivityLog from "./pages/ActivityLog";
import Payments from "./pages/Payments";
import Users from "./pages/Users";

function App() {
  const [isFirstRun, setIsFirstRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const { data } = await axios.get(ENDPOINTS.FIRST_RUN_CHECK);
        setIsFirstRun(data.isFirstRun);

        // If it's first run, clear any existing auth state
        if (data.isFirstRun) {
          dispatch(logout());
        }
      } catch (error) {
        console.error("Failed to check first run status:", error);
        setIsFirstRun(false);
      } finally {
        setLoading(false);
      }
    };

    checkFirstRun();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* First-time setup route - highest priority */}
        {isFirstRun && !isAuthenticated && (
          <>
            <Route path="/first-time-setup" element={<FirstTimeSetup />} />
            <Route
              path="*"
              element={<Navigate to="/first-time-setup" replace />}
            />
          </>
        )}

        {/* Login route */}
        {!isFirstRun && !isAuthenticated && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Protected routes */}
        {isAuthenticated && (
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/quotations/create" element={<CreateQuotation />} />
              <Route path="/quotations/edit/:id" element={<EditQuotation />} />
              <Route path="/quotations/:id" element={<QuotationView />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/create" element={<CreateInvoice />} />
              <Route path="/invoices/edit/:id" element={<EditInvoice />} />
              <Route path="/invoices/:id" element={<InvoiceView />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activity-log" element={<ActivityLog />} />
            </Route>
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;
