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
  colItem: { width: "45%", paddingLeft: 4 },
  colPrice: { width: "20%", textAlign: "right" },
  colQty: { width: "15%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right", paddingRight: 4 },

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

const InvoicePDF = ({ invoice, settings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subTitle}>#{invoice.invoiceNumber}</Text>
          <View style={styles.statusBadge}>
            <Text>{invoice.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", maxWidth: "50%" }}>
          {settings?.logo && <Image style={styles.logo} src={settings.logo} />}
          <Text
            style={[styles.companyInfo, { fontWeight: "bold", fontSize: 11 }]}
          >
            {settings?.storeName}
          </Text>
          <Text style={styles.companyInfo}>{settings?.address?.street}</Text>
          <Text style={styles.companyInfo}>
            {settings?.address?.city}, {settings?.address?.zip}
          </Text>
          <Text style={styles.companyInfo}>{settings?.contact?.phone}</Text>
          <Text style={styles.companyInfo}>{settings?.contact?.email}</Text>
        </View>
      </View>

      {/* Info Group */}
      <View style={styles.infoGroup}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={[styles.text, { fontWeight: "bold" }]}>
            {invoice.customer?.firstName} {invoice.customer?.lastName}
          </Text>
          <Text style={styles.text}>{invoice.customer?.email}</Text>
          <Text style={styles.text}>
            {invoice.customer?.billing?.address_1}
          </Text>
          <Text style={styles.text}>
            {invoice.customer?.billing?.city},{" "}
            {invoice.customer?.billing?.postcode}
          </Text>
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
              {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {invoice.dueDate && (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.text}>Due Date:</Text>
              <Text style={[styles.text, { fontWeight: "bold" }]}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
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
            <View style={styles.colItem}>
              <Text style={styles.tableCell}>{item.name}</Text>
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
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(invoice.total, settings)}
          </Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Notes</Text>
          <Text style={[styles.text, { fontStyle: "italic" }]}>
            {invoice.notes}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        {settings?.bank?.accountName && (
          <Text style={{ marginTop: 4 }}>
            {settings.bank.bankName} • {settings.bank.accountNumber} •{" "}
            {settings.bank.accountName}
          </Text>
        )}
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
