/**
 * pdfGenerator.ts - PDF generation utility using @react-pdf/renderer
 * Generates professional PDFs for quotations and invoices
 */

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatCurrency, getUnitLabel } from './units.js';
import Decimal from 'decimal.js';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '1 solid #000',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    textAlign: 'right',
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    fontSize: 10,
  },
  label: {
    width: '35%',
    fontWeight: '600',
    color: '#374151',
  },
  value: {
    width: '65%',
    color: '#1f2937',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  totals: {
    marginLeft: 'auto',
    width: '40%',
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    fontSize: 11,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: 'bold',
    borderTopWidth: 2,
    borderTopColor: '#000',
    marginTop: 10,
  },
  footer: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1 solid #e5e7eb',
  },
});

/**
 * Generate quotation PDF
 */
export async function generateQuotationPDF(quotationData) {
  const {
    quotationId,
    createdAt,
    expiresAt,
    sellerName,
    sellerCompany,
    sellerEmail,
    buyerName,
    buyerCompany,
    buyerEmail,
    items = [],
    notes = '',
    status = 'pending',
    totalAmount = 0,
  } = quotationData;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>AasaMedChem</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
              Professional Pharmaceutical Supplier
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Quotation #{quotationId.substring(0, 8).toUpperCase()}</Text>
            <Text>Status: {status.toUpperCase()}</Text>
            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>
              {new Date(createdAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Seller & Buyer Info */}
        <View style={{ flexDirection: 'row', gap: 40, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>FROM (Seller)</Text>
            <View style={styles.row}>
              <Text style={styles.value}>{sellerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{sellerCompany}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{sellerEmail}</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>TO (Buyer)</Text>
            <View style={styles.row}>
              <Text style={styles.value}>{buyerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{buyerCompany}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{buyerEmail}</Text>
            </View>
          </View>
        </View>

        {/* Quotation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quotation Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{new Date(createdAt).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expires:</Text>
            <Text style={styles.value}>
              {expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN') : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <Text style={styles.sectionTitle}>Quoted Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCell, width: '40%' }}>Product</Text>
            <Text style={{ ...styles.tableCell, textAlign: 'center', width: '15%' }}>Qty</Text>
            <Text style={{ ...styles.tableCell, textAlign: 'right', width: '20%' }}>Unit Price</Text>
            <Text style={{ ...styles.tableCellRight, width: '25%' }}>Total</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={{ width: '40%' }}>
                <Text>{item.productName}</Text>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>SKU: {item.sku}</Text>
              </View>
              <Text style={{ width: '15%', textAlign: 'center' }}>
                {item.orderedQuantity} {getUnitLabel(item.orderedUnit)}
              </Text>
              <Text style={{ width: '20%', textAlign: 'right' }}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={{ width: '25%', textAlign: 'right', fontWeight: 'bold' }}>
                {formatCurrency(item.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRowBold}>
            <Text>TOTAL AMOUNT:</Text>
            <Text>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.5 }}>
              {notes}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This is an auto-generated document from AasaMedChem Platform. Please verify the accuracy of this quotation before proceeding.
        </Text>
      </Page>
    </Document>
  );

  return doc;
}

/**
 * Generate Invoice PDF (similar structure)
 */
export async function generateInvoicePDF(invoiceData) {
  // Similar to generateQuotationPDF but with invoice-specific fields
  return generateQuotationPDF({
    ...invoiceData,
    quotationId: invoiceData.invoiceId || invoiceData.id,
  });
}

/**
 * Render and download PDF
 */
export async function renderAndDownloadPDF(doc, filename) {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(doc).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    return false;
  }
}
