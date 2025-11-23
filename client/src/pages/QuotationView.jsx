import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowLeft, Download, Printer, FileText, Mail } from "lucide-react";
import { useSelector } from "react-redux";
import QuotationPDF from "../components/QuotationPDF";
import { formatCurrency } from "../utils/currency";
import { urlToBase64 } from "../utils/imageUtils";

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [quotation, setQuotation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [quoteRes, settingsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/quotations/${id}`, config),
          axios.get("http://localhost:5000/api/settings", config),
        ]);
        setQuotation(quoteRes.data);
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

  const handleConvertToInvoice = () => {
    navigate("/invoices/create", {
      state: { quotationData: quotation },
    });
  };

  const handleSendEmail = async () => {
    // Check if customer has email
    if (!quotation.customer?.email) {
      alert(
        "This customer does not have an email address. Please add an email to the customer profile first."
      );
      return;
    }

    if (!window.confirm("Send this quotation to the customer via email?"))
      return;
    setSendingEmail(true);
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `http://localhost:5000/api/email/send-quotation/${id}`,
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
  if (!quotation) return <div>Quotation not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          to="/quotations"
          className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Quotations
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
          <button
            onClick={handleConvertToInvoice}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <FileText className="mr-2 h-5 w-5" /> Convert to Invoice
          </button>
          <PDFDownloadLink
            document={
              <QuotationPDF
                quotation={quotation}
                settings={{ ...settings, logo: logoBase64 }}
              />
            }
            fileName={`${quotation.quotationNumber}.pdf`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                "Generating PDF..."
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-8 border border-slate-200">
        {/* Header */}
        <div className="flex justify-between border-b border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              QUOTATION
            </h1>
            <p className="text-slate-600">#{quotation.quotationNumber}</p>
            <p className="text-slate-600">
              Date: {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
            <p className="text-slate-600">
              Status:{" "}
              <span className="font-semibold uppercase text-blue-600">
                {quotation.status}
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
            <h2 className="text-xl font-bold text-slate-900">
              {settings?.storeName}
            </h2>
            <p className="text-slate-600">{settings?.address?.street}</p>
            <p className="text-slate-600">{settings?.address?.city}</p>
            <p className="text-slate-600">{settings?.contact?.email}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8">
          <h3 className="text-slate-600 font-semibold mb-2">Bill To:</h3>
          <p className="text-slate-900 font-medium">
            {quotation.customer?.salutation
              ? `${quotation.customer.salutation} `
              : ""}
            {quotation.customer?.firstName} {quotation.customer?.lastName}
          </p>
          <p className="text-slate-600">{quotation.customer?.email}</p>
          <p className="text-slate-600">
            {quotation.customer?.billing?.address_1}
          </p>
          <p className="text-slate-600">
            <p className="text-slate-600">
              {quotation.customer?.billing?.city}
              {quotation.customer?.billing?.city &&
                quotation.customer?.billing?.postcode &&
                ", "}
              {quotation.customer?.billing?.postcode}
            </p>
          </p>
        </div>

        {/* Items */}
        <table className="min-w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-slate-600">Item</th>
              <th className="text-right py-3 text-slate-600">Price</th>
              <th className="text-right py-3 text-slate-600">Qty</th>
              <th className="text-right py-3 text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-3 text-slate-900">{item.name}</td>
                <td className="text-right py-3 text-slate-600">
                  {formatCurrency(item.price, settings)}
                </td>
                <td className="text-right py-3 text-slate-600">
                  {item.quantity}
                </td>
                <td className="text-right py-3 text-slate-900 font-medium">
                  {formatCurrency(item.total, settings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col items-end space-y-2">
          <div className="flex justify-between w-64">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(quotation.subtotal, settings)}
            </span>
          </div>
          {quotation.tax > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-600">
                {settings?.tax?.label || "Tax"}:
              </span>
              <span className="font-medium text-slate-900">
                {formatCurrency(quotation.tax, settings)}
              </span>
            </div>
          )}
          {quotation.discount > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-600">Discount:</span>
              <span className="font-medium text-slate-900">
                -{formatCurrency(quotation.discount, settings)}
              </span>
            </div>
          )}
          <div className="flex justify-between w-64 text-xl font-bold pt-4 border-t border-slate-200 text-slate-900">
            <span>Total:</span>
            <span>{formatCurrency(quotation.total, settings)}</span>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-slate-600 font-semibold mb-2">Notes:</h3>
            <p className="text-slate-600">{quotation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationView;
