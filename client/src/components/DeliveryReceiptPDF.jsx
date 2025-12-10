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
    borderBottomColor: "#10B981", // Green accent for Delivery
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981", // Green accent
    letterSpacing: 1,
    textTransform: "uppercase",
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
    paddingVertical: 12,
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
  tableColDescription: { width: "80%", paddingLeft: 4 },
  colItem: { width: "80%", paddingLeft: 4 },
  colQty: { width: "20%", textAlign: "center" },

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
  signatureSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#111827",
    paddingTop: 8,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "bold",
    marginTop: 4,
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
  billToText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  billToSubText: {
    fontSize: 10,
    color: "#1F2937",
    marginBottom: 2,
  },
});

const DeliveryReceiptPDF = ({ invoice, settings }) => {
  const amountPaid = invoice.amountPaid || 0;
  const balanceDue =
    invoice.balanceDue !== undefined
      ? invoice.balanceDue
      : invoice.total - amountPaid;

  let paymentStatusText = "NOT PAID";
  let statusColor = "#DC2626"; // Red

  if (invoice.status === "paid" || balanceDue <= 0) {
    paymentStatusText = "PAID";
    statusColor = "#059669"; // Green
  } else if (amountPaid > 0) {
    paymentStatusText = "PARTIALLY PAID";
    statusColor = "#D97706"; // Amber
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Delivery Receipt</Text>
            <Text style={styles.subTitle}>Ref: {invoice.invoiceNumber}</Text>
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
            <Text style={styles.sectionTitle}>Deliver To</Text>
            <Text style={styles.billToText}>
              {invoice.customer?.salutation
                ? `${invoice.customer.salutation} `
                : ""}
              {invoice.customer?.firstName} {invoice.customer?.lastName}
            </Text>
            {invoice.customer?.billing?.company && (
              <Text style={styles.billToText}>
                {invoice.customer.billing.company}
              </Text>
            )}
            {invoice.customer?.billing?.address_1 && (
              <Text style={styles.billToSubText}>
                {invoice.customer.billing.address_1}
              </Text>
            )}
            {(invoice.customer?.billing?.city ||
              invoice.customer?.billing?.postcode) && (
              <Text style={styles.billToSubText}>
                {invoice.customer?.billing?.city}
                {invoice.customer?.billing?.city &&
                  invoice.customer?.billing?.postcode &&
                  ", "}
                {invoice.customer?.billing?.postcode}
              </Text>
            )}
            {invoice.customer?.email && (
              <Text style={styles.billToSubText}>{invoice.customer.email}</Text>
            )}
            {invoice.customer?.billing?.phone && (
              <Text style={styles.billToSubText}>
                {invoice.customer.billing.phone}
              </Text>
            )}
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={styles.text}>Date:</Text>
              <Text style={[styles.text, { fontWeight: "bold" }]}>
                {formatDate(new Date(), settings)}
              </Text>
            </View>

            <View
              style={{
                marginTop: 12,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={styles.text}>Payment Status:</Text>
                <Text
                  style={[
                    styles.text,
                    { fontWeight: "bold", color: statusColor },
                  ]}
                >
                  {paymentStatusText}
                </Text>
              </View>

              {/* Price Breakdown */}
              <View
                style={{
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <Text style={styles.text}>Subtotal:</Text>
                  <Text style={styles.text}>
                    {formatCurrency(invoice.subtotal, settings)}
                  </Text>
                </View>

                {invoice.tax > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <Text style={styles.text}>
                      {settings?.tax?.label || "Tax"}:
                    </Text>
                    <Text style={styles.text}>
                      {formatCurrency(invoice.tax, settings)}
                    </Text>
                  </View>
                )}

                {invoice.discount > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <Text style={styles.text}>Discount:</Text>
                    <Text style={styles.text}>
                      -{formatCurrency(invoice.discount, settings)}
                    </Text>
                  </View>
                )}

                {invoice.deliveryCharge > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <Text style={styles.text}>Delivery Charge:</Text>
                    <Text style={styles.text}>
                      {formatCurrency(invoice.deliveryCharge, settings)}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 6,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={[styles.text, { fontWeight: "bold", fontSize: 11 }]}
                  >
                    Total Amount:
                  </Text>
                  <Text
                    style={[styles.text, { fontWeight: "bold", fontSize: 11 }]}
                  >
                    {formatCurrency(invoice.total, settings)}
                  </Text>
                </View>

                {paymentStatusText !== "PAID" && (
                  <>
                    {amountPaid > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 3,
                        }}
                      >
                        <Text style={styles.text}>Amount Paid:</Text>
                        <Text style={styles.text}>
                          {formatCurrency(amountPaid, settings)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 3,
                      }}
                    >
                      <Text
                        style={[
                          styles.text,
                          { fontWeight: "bold", color: "#DC2626" },
                        ]}
                      >
                        Balance Due:
                      </Text>
                      <Text
                        style={[
                          styles.text,
                          { fontWeight: "bold", color: "#DC2626" },
                        ]}
                      >
                        {formatCurrency(balanceDue, settings)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colItem}>
              <Text style={styles.tableCellHeader}>Item Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
          </View>
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableColDescription}>
                <Text style={styles.tableCell}>{item.name}</Text>
                {item.product?.shortDescription && (
                  <Text
                    style={{
                      ...styles.tableCell,
                      fontSize: 8,
                      color: "#6B7280",
                    }}
                  >
                    {item.product.shortDescription}
                  </Text>
                )}
              </View>
              <View style={styles.colQty}>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: "bold", textAlign: "center" },
                  ]}
                >
                  {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Received By (Signature)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Date Received</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {settings?.terms?.deliveryReceipt ? (
            renderHtmlToPdf(settings.terms.deliveryReceipt, {
              fontSize: 8,
              color: "#9CA3AF",
            })
          ) : (
            <Text>Please check all items upon delivery.</Text>
          )}
          {settings?.contact?.phone && (
            <Text style={{ marginTop: 4 }}>
              For any issues, please contact us at {settings.contact.phone}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default DeliveryReceiptPDF;
