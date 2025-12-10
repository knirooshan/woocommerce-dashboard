import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  text: {
    fontSize: 10,
    color: "#1F2937",
    lineHeight: 1.5,
  },
});

// Strip HTML tags and return plain text for PDF rendering
const stripHtml = (html) => {
  if (!html) return "";
  
  // Replace common HTML entities
  let text = html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Replace <br>, <br/>, <br /> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  
  // Replace </p> and </div> with double newlines for paragraph separation
  text = text.replace(/<\/(p|div)>/gi, "\n\n");
  
  // Replace list items with bullet points
  text = text.replace(/<li[^>]*>/gi, "\n• ");
  text = text.replace(/<\/li>/gi, "");
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  
  // Clean up extra whitespace and newlines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  
  return text;
};

export const renderHtmlToPdf = (html, customStyles = {}) => {
  if (!html) return null;
  
  const plainText = stripHtml(html);
  
  if (!plainText) return null;
  
  return (
    <Text style={[styles.text, customStyles]}>
      {plainText}
    </Text>
  );
};
