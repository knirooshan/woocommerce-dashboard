import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatCurrency } from "../utils/currency";
import { formatDate } from "../utils/date";
import { renderHtmlToPdf } from "../utils/pdfUtils.jsx";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#2563EB", // Blue accent
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563EB", // Blue accent
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: "#4B5563",
    marginTop: 2,
    textAlign: "right",
  },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoSection: {
    width: "45%",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    color: "#1F2937",
    marginBottom: 3,
    lineHeight: 1.4,
  },
  table: {
    display: "table",
    width: "auto",
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  colItem: {
    width: "35%",
    paddingLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  colImage: { width: "10%", paddingLeft: 4 },
  colPrice: { width: "20%", textAlign: "right" },
  colQty: { width: "15%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right", paddingRight: 4 },
  productImage: {
    width: 30,
    height: 30,
    objectFit: "contain",
    marginRight: 8,
  },
  imagePlaceholder: {
    width: 30,
    height: 30,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    marginRight: 8,
  },

  tableCellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4B5563",
    textTransform: "uppercase",
  },
  tableCell: {
    fontSize: 10,
    color: "#1F2937",
  },
  tableCellSub: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
  },
  totals: {
    marginTop: 10,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 4,
    justifyContent: "flex-end",
  },
  totalLabel: {
    width: 100,
    fontSize: 10,
    color: "#6B7280",
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    width: 100,
    fontSize: 10,
    color: "#111827",
    textAlign: "right",
    fontWeight: "medium",
  },
  grandTotal: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#2563EB",
  },
  grandTotalLabel: {
    width: 100,
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "right",
    marginRight: 10,
  },
  grandTotalValue: {
    width: 100,
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563EB",
    textAlign: "right",
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 15,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 8,
  },
});

const InvoicePDF = ({ invoice, settings }) => {
  const amountPaid = invoice.amountPaid || 0;
  const balanceDue =
    invoice.balanceDue !== undefined
      ? invoice.balanceDue
      : invoice.total - amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subTitle}>#{invoice.invoiceNumber}</Text>
            <View style={styles.statusBadge}>
              <Text>{invoice.status.replace("_", " ").toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", maxWidth: "50%" }}>
            {settings?.logo && (
              <Image style={styles.logo} src={settings.logo} />
            )}
            <Text
              style={[styles.companyInfo, { fontWeight: "bold", fontSize: 11 }]}
            >
              {settings?.storeName}
            </Text>
            {settings?.address?.street && (
              <Text style={styles.companyInfo}>{settings.address.street}</Text>
            )}
            {(settings?.address?.city || settings?.address?.zip) && (
              <Text style={styles.companyInfo}>
                {settings?.address?.city}
                {settings?.address?.city && settings?.address?.zip && ", "}
                {settings?.address?.zip}
              </Text>
            )}
            {settings?.contact?.phone && (
              <Text style={styles.companyInfo}>
                Phone: {settings.contact.phone}
              </Text>
            )}
            {settings?.contact?.email && (
              <Text style={styles.companyInfo}>{settings.contact.email}</Text>
            )}
          </View>
        </View>

        {/* Info Group */}
        <View style={styles.infoGroup}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={[styles.text, { fontWeight: "bold" }]}>
              {invoice.customer?.salutation
                ? `${invoice.customer.salutation} `
                : ""}
              {invoice.customer?.firstName} {invoice.customer?.lastName}
            </Text>
            {invoice.customer?.billing?.company && (
              <Text style={styles.text}>
                {invoice.customer.billing.company}
              </Text>
            )}
            {invoice.customer?.billing?.address_1 && (
              <Text style={styles.text}>
                {invoice.customer.billing.address_1}
              </Text>
            )}
            {(invoice.customer?.billing?.city ||
              invoice.customer?.billing?.postcode) && (
              <Text style={styles.text}>
                {invoice.customer?.billing?.city}
                {invoice.customer?.billing?.city &&
                  invoice.customer?.billing?.postcode &&
                  ", "}
                {invoice.customer?.billing?.postcode}
              </Text>
            )}
            {invoice.customer?.email && (
              <Text style={styles.text}>{invoice.customer.email}</Text>
            )}
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={styles.text}>Date Issued:</Text>
              <Text style={[styles.text, { fontWeight: "bold" }]}>
                {formatDate(invoice.createdAt, settings)}
              </Text>
            </View>
            {invoice.dueDate && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.text}>Due Date:</Text>
                <Text style={[styles.text, { fontWeight: "bold" }]}>
                  {formatDate(invoice.dueDate, settings)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colImage}>
              <Text style={styles.tableCellHeader}>Image</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.tableCellHeader}>Item Description</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.tableCellHeader}>Price</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.colImage}>
                {item.image ? (
                  <Image
                    style={styles.productImage}
                    src={item.image}
                    cache={false}
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>
              <View style={styles.colItem}>
                <View>
                  <Text style={styles.tableCell}>{item.name}</Text>
                  {(item.description || item.product?.shortDescription) && (
                    <View style={{ marginTop: 2 }}>
                      {renderHtmlToPdf(
                        item.description || item.product.shortDescription,
                        styles.tableCellSub
                      )}
                    </View>
                  )}
                  {item.discount > 0 && (
                    <Text style={[styles.tableCellSub, { color: "#EF4444" }]}>
                      Discount: -{formatCurrency(item.discount, settings)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.tableCell}>
                  {formatCurrency(item.price, settings)}
                </Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                  {formatCurrency(item.total, settings)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal, settings)}
            </Text>
          </View>
          {invoice.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {settings?.tax?.label || "Tax"}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.tax, settings)}
              </Text>
            </View>
          )}
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: "#EF4444" }]}>
                -{formatCurrency(invoice.discount, settings)}
              </Text>
            </View>
          )}
          {invoice.deliveryCharge > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Charge</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.deliveryCharge, settings)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total, settings)}
            </Text>
          </View>
          {(amountPaid > 0 || invoice.status === "paid") && (
            <>
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(amountPaid, settings)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                  Balance Due
                </Text>
                <Text style={[styles.totalValue, { fontWeight: "bold" }]}>
                  {formatCurrency(balanceDue, settings)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms || invoice.deliveryNote) && (
          <View style={styles.notes}>
            {invoice.notes && (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  Notes
                </Text>
                <View>{renderHtmlToPdf(invoice.notes)}</View>
              </View>
            )}
            {invoice.terms && (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  Terms & Conditions
                </Text>
                <View>{renderHtmlToPdf(invoice.terms)}</View>
              </View>
            )}
            {invoice.deliveryNote && (
              <View>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  Delivery Note
                </Text>
                <View>{renderHtmlToPdf(invoice.deliveryNote)}</View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          {settings?.bank?.accountName && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>
                Bank Details:
              </Text>
              <Text>
                {settings.bank.bankName}
                {settings.bank.branch ? `, ${settings.bank.branch}` : ""}
              </Text>
              <Text>
                Account Name: {settings.bank.accountName} | Account No:{" "}
                {settings.bank.accountNumber}
              </Text>
              {settings.bank.swiftCode && (
                <Text>Swift Code: {settings.bank.swiftCode}</Text>
              )}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
