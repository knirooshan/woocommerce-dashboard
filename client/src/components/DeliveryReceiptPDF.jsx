import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 10,
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  companyInfo: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
  },
  customerInfo: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  text: {
    fontSize: 10,
    color: "#555",
    marginBottom: 2,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "15%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#F3F4F6",
    padding: 5,
  },
  tableColHeaderDesc: {
    width: "70%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#F3F4F6",
    padding: 5,
  },
  tableCol: {
    width: "15%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColDesc: {
    width: "70%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    margin: "auto",
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  tableCell: {
    margin: "auto",
    fontSize: 10,
    color: "#4B5563",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 5,
    alignItems: "center",
  },
});

const DeliveryReceiptPDF = ({ invoice, settings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {settings?.logo && <Image style={styles.logo} src={settings.logo} />}
          <Text style={styles.companyInfo}>{settings?.storeName}</Text>
          <Text style={styles.companyInfo}>{settings?.address?.street}</Text>
          <Text style={styles.companyInfo}>
            {settings?.address?.city}, {settings?.address?.zip}
          </Text>
          <Text style={styles.companyInfo}>{settings?.contact?.phone}</Text>
          <Text style={styles.companyInfo}>{settings?.contact?.email}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.title}>DELIVERY RECEIPT</Text>
          <Text style={styles.text}>Ref: {invoice.invoiceNumber}</Text>
          <Text style={styles.text}>
            Date: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Text style={styles.sectionTitle}>Deliver To:</Text>
        <Text style={styles.text}>
          {invoice.customer?.firstName} {invoice.customer?.lastName}
        </Text>
        <Text style={styles.text}>{invoice.customer?.email}</Text>
        <Text style={styles.text}>
          {invoice.customer?.shipping?.address_1 ||
            invoice.customer?.billing?.address_1}
        </Text>
        <Text style={styles.text}>
          {invoice.customer?.shipping?.city || invoice.customer?.billing?.city},{" "}
          {invoice.customer?.shipping?.postcode ||
            invoice.customer?.billing?.postcode}
        </Text>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeaderDesc}>
            <Text style={styles.tableCellHeader}>Item Description</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Qty</Text>
          </View>
        </View>
        {invoice.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableColDesc}>
              <Text style={styles.tableCell}>{item.name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.quantity}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Received By (Signature)</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Date Received</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Please check all items upon delivery.</Text>
      </View>
    </Page>
  </Document>
);

export default DeliveryReceiptPDF;
