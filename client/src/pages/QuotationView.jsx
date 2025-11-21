import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useSelector } from "react-redux";
import QuotationPDF from "../components/QuotationPDF";
import { formatCurrency } from "../utils/currency";
import { urlToBase64 } from "../utils/imageUtils";

const QuotationView = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [quotation, setQuotation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(true);

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

      <div className="bg-slate-900 shadow rounded-lg p-8 border border-slate-800">
        {/* Header */}
        <div className="flex justify-between border-b border-slate-800 pb-8 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">QUOTATION</h1>
            <p className="text-slate-400">#{quotation.quotationNumber}</p>
            <p className="text-slate-400">
              Date: {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
            <p className="text-slate-400">
              Status:{" "}
              <span className="font-semibold uppercase text-blue-400">
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
            {quotation.customer?.firstName} {quotation.customer?.lastName}
          </p>
          <p className="text-slate-400">{quotation.customer?.email}</p>
          <p className="text-slate-400">
            {quotation.customer?.billing?.address_1}
          </p>
          <p className="text-slate-400">
            {quotation.customer?.billing?.city},{" "}
            {quotation.customer?.billing?.postcode}
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
            {quotation.items.map((item, index) => (
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
            <span className="font-medium text-white">
              {formatCurrency(quotation.subtotal, settings)}
            </span>
          </div>
          {quotation.tax > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-400">
                {settings?.tax?.label || "Tax"}:
              </span>
              <span className="font-medium text-white">
                {formatCurrency(quotation.tax, settings)}
              </span>
            </div>
          )}
          {quotation.discount > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-slate-400">Discount:</span>
              <span className="font-medium text-white">
                -{formatCurrency(quotation.discount, settings)}
              </span>
            </div>
          )}
          <div className="flex justify-between w-64 text-xl font-bold pt-4 border-t border-slate-800 text-white">
            <span>Total:</span>
            <span>{formatCurrency(quotation.total, settings)}</span>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-slate-400 font-semibold mb-2">Notes:</h3>
            <p className="text-slate-400">{quotation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationView;
