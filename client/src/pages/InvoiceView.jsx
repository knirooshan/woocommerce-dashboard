import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowLeft, Download, Truck, Mail } from "lucide-react";
import { useSelector } from "react-redux";
import InvoicePDF from "../components/InvoicePDF";
import DeliveryReceiptPDF from "../components/DeliveryReceiptPDF";
import { formatCurrency } from "../utils/currency";
import { urlToBase64 } from "../utils/imageUtils";

const InvoiceView = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [invRes, settingsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/invoices/${id}`, config),
          axios.get("http://localhost:5000/api/settings", config),
        ]);
        setInvoice(invRes.data);
        setSettings(settingsRes.data);

        // Convert logo URL to base64 for PDF
        if (settingsRes.data?.logo) {
          const base64Logo = await urlToBase64(settingsRes.data.logo, token);
          setLogoBase64(base64Logo);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user.token]);

  const handleSendEmail = async () => {
    if (!window.confirm("Send this invoice to the customer via email?")) return;
    setSendingEmail(true);
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `http://localhost:5000/api/email/send-invoice/${id}`,
        {},
        config
      );
      alert("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please check SMTP settings.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          to="/invoices"
          className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Invoices
        </Link>
        <div className="flex gap-4">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Mail className="mr-2 h-5 w-5" />
            {sendingEmail ? "Sending..." : "Send Email"}
          </button>
          <PDFDownloadLink
            document={
              <InvoicePDF
                invoice={invoice}
                settings={{ ...settings, logo: logoBase64 }}
              />
            }
            fileName={`${invoice.invoiceNumber}.pdf`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                "Generating PDF..."
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" /> Invoice
                </>
              )
            }
          </PDFDownloadLink>
          <PDFDownloadLink
            document={
              <DeliveryReceiptPDF
                invoice={invoice}
                settings={{ ...settings, logo: logoBase64 }}
              />
            }
            fileName={`DR-${invoice.invoiceNumber}.pdf`}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                "Generating DR..."
              ) : (
                <>
                  <Truck className="mr-2 h-5 w-5" /> Delivery Receipt
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-slate-900 shadow rounded-lg p-8 border border-slate-800">
        {/* Header */}
        <div className="flex justify-between border-b border-slate-800 pb-8 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">INVOICE</h1>
            <p className="text-slate-400">#{invoice.invoiceNumber}</p>
            <p className="text-slate-400">
              Date: {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            <p className="text-slate-400">
              Due Date:{" "}
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : "-"}
            </p>
            <p className="text-slate-400">
              Status:{" "}
              <span
                className={`font-semibold uppercase ${
                  invoice.status === "paid"
                    ? "text-green-600"
                    : invoice.status === "overdue"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {invoice.status}
              </span>
            </p>
          </div>
          <div className="text-right">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt={settings.storeName}
                className="h-12 mb-4 ml-auto object-contain"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <h2 className="text-xl font-bold text-white">
              {settings?.storeName}
            </h2>
            <p className="text-slate-400">{settings?.address?.street}</p>
            <p className="text-slate-400">{settings?.address?.city}</p>
            <p className="text-slate-400">{settings?.contact?.email}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8">
          <h3 className="text-slate-400 font-semibold mb-2">Bill To:</h3>
          <p className="text-white font-medium">
            {invoice.customer?.firstName} {invoice.customer?.lastName}
          </p>
          <p className="text-slate-400">{invoice.customer?.email}</p>
          <p className="text-slate-400">
            {invoice.customer?.billing?.address_1}
          </p>
          <p className="text-slate-400">
            {invoice.customer?.billing?.city},{" "}
            {invoice.customer?.billing?.postcode}
          </p>
        </div>

        {/* Items */}
        <table className="min-w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="text-left py-3 text-slate-400">Item</th>
              <th className="text-right py-3 text-slate-400">Price</th>
              <th className="text-right py-3 text-slate-400">Qty</th>
              <th className="text-right py-3 text-slate-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-800">
                <td className="py-3 text-white">{item.name}</td>
                <td className="text-right py-3 text-slate-400">
                  {formatCurrency(item.price, settings)}
                </td>
                <td className="text-right py-3 text-slate-400">
                  {item.quantity}
                </td>
                <td className="text-right py-3 text-white font-medium">
                  {formatCurrency(item.total, settings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col items-end space-y-2">
          <div className="flex justify-between w-64">
            <span className="text-slate-400">Subtotal:</span>
            <span className="text-white">
              {formatCurrency(invoice.subtotal, settings)}
            </span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-400">
                {settings?.tax?.label || "Tax"}:
              </span>
              <span className="text-white">
                {formatCurrency(invoice.tax, settings)}
              </span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-400">Discount:</span>
              <span className="text-white">
                -{formatCurrency(invoice.discount, settings)}
              </span>
            </div>
          )}
          <div className="flex justify-between w-64 text-xl font-bold pt-4 border-t border-slate-800">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, settings)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-slate-400 font-semibold mb-2">Notes:</h3>
            <p className="text-slate-400">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
