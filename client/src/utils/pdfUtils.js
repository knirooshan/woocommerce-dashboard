import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import parse from "html-react-parser";

const styles = StyleSheet.create({
  p: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  ul: {
    marginBottom: 4,
  },
  li: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  liContent: {
    flex: 1,
    fontSize: 10,
  },
  h1: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  h2: { fontSize: 12, fontWeight: "bold", marginBottom: 5 },
});

export const renderHtmlToPdf = (html) => {
  if (!html) return null;

  const options = {
    replace: (domNode) => {
      if (domNode.type === "tag") {
        if (domNode.name === "p") {
          return (
            <Text style={styles.p}>
              {domToReact(domNode.children, options)}
            </Text>
          );
        }
        if (domNode.name === "strong" || domNode.name === "b") {
          return (
            <Text style={styles.strong}>
              {domToReact(domNode.children, options)}
            </Text>
          );
        }
        if (domNode.name === "em" || domNode.name === "i") {
          return (
            <Text style={styles.em}>
              {domToReact(domNode.children, options)}
            </Text>
          );
        }
        if (domNode.name === "ul" || domNode.name === "ol") {
          return (
            <View style={styles.ul}>
              {domToReact(domNode.children, options)}
            </View>
          );
        }
        if (domNode.name === "li") {
          return (
            <View style={styles.li}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.liContent}>
                {domToReact(domNode.children, options)}
              </Text>
            </View>
          );
        }
        if (domNode.name === "br") {
          return <Text>{"\n"}</Text>;
        }
        if (domNode.name === "h1") {
          return (
            <Text style={styles.h1}>
              {domToReact(domNode.children, options)}
            </Text>
          );
        }
        if (domNode.name === "h2") {
          return (
            <Text style={styles.h2}>
              {domToReact(domNode.children, options)}
            </Text>
          );
        }
      }
      if (domNode.type === "text") {
        return domNode.data;
      }
    },
  };

  // We need a helper to emulate domToReact behaviors recursively
  const domToReact = (children, opts) => {
    if (!children) return null;
    return children.map((child, index) => {
      const result = opts.replace(child);
      if (result) return React.cloneElement(result, { key: index });
      if (child.type === "text") return child.data;

      // Fallback for unhandled tags - verify if it has children
      if (child.children) {
        return domToReact(child.children, opts);
      }
      return null;
    });
  };

  // NOTE: html-react-parser typically returns React elements, but we need @react-pdf elements.
  // The official html-react-parser might try to return standard HTML tags if we don't intercept everything.
  // A simpler approach for PDF is often to use a specialized library or regex if structure is simple.
  // However, since we are using react-quill, the HTML is relatively predictable.

  // Let's implement a simplified traversal because `html-react-parser` returns React elements which we can't easily inspect/transform to PDF primitives recursively without a custom reconciler.
  // actually `html-react-parser`'s `replace` option allows identifying nodes.

  // Wait, `domToReact` from `html-react-parser` is for React DOM. We need to return PDF primitives.

  // Let's rewrite this to use a standard DOM parser or simple recursion if possible, OR just trust `replace` does the job.
  // BUT `html-react-parser` is designed for web.

  // Re-thinking: A better approach for PDF is `react-html-renderer` or just mapping manually.
  // Since we don't have those libraries installed, I will use `html-react-parser`'s parse method and loop through the result arrays if possible, but `replace` is the standard way.
  // The issue is `domToReact` returns web elements (div, span).

  // Correct implementation using `html-react-parser`'s library `domToReact` imports:
  const { domToReact: originalDomToReact } = require("html-react-parser");

  // We can't easily mix PDF primitives with `originalDomToReact` because it might create web spans.
  // So we must handle ALL tags we expect.

  return parse(html, options);
};

// Fixing the import for domToReact inside the function context or top level
import { domToReact } from "html-react-parser";
