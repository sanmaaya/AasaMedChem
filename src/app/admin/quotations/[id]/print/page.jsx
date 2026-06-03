import React from 'react';
import { db } from '@/lib/db.js';
import { quotations } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';

export const revalidate = 0;

export default async function PrintInvoicePage({ params }) {
  const { id } = await params;

  const quotation = await db.query.quotations.findFirst({
    where: eq(quotations.id, id),
    with: {
      seller: { columns: { name: true, email: true } },
      buyer:  { columns: { name: true, email: true } },
      items:  { with: { product: { columns: { name: true, sku: true, category: true, unit: true } } } }
    }
  });

  if (!quotation) return <div className="p-10 text-red-600">Quotation not found.</div>;

  const statusColor = { approved: '#059669', rejected: '#dc2626', pending: '#d97706' }[quotation.status] || '#6b7280';

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>Invoice – {quotation.id.toUpperCase().slice(0, 10)}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #f8f7f4; color: #1a1a1a; }
          .page { max-width: 860px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.12); }
          .header { background: linear-gradient(135deg, #094f44, #0d6b5c); padding: 36px 40px; color: white; }
          .header h1 { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
          .header .sub { font-size: 13px; opacity: 0.75; margin-top: 4px; }
          .header .id { font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-top: 16px; opacity: 0.7; text-transform: uppercase; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #f0ede8; }
          .meta-card { padding: 24px 40px; }
          .meta-card:first-child { border-right: 1px solid #f0ede8; }
          .meta-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .meta-name { font-size: 15px; font-weight: 800; color: #1a1a1a; }
          .meta-email { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .table-section { padding: 24px 40px; }
          .table-section h3 { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f9f8f6; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; padding: 10px 14px; text-align: left; border-bottom: 1px solid #f0ede8; }
          td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f9f8f6; color: #1a1a1a; }
          tr:last-child td { border-bottom: none; }
          .td-name { font-weight: 700; }
          .td-sku { font-size: 11px; color: #9ca3af; font-family: monospace; }
          .td-right { text-align: right; }
          .td-amount { font-weight: 900; }
          .total-row { background: #f9f8f6; }
          .total-row td { font-size: 14px; font-weight: 900; color: #094f44; }
          .footer { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; background: #fafaf9; border-top: 1px solid #f0ede8; }
          .footer-note { font-size: 11px; color: #9ca3af; }
          .status-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 999px; color: white; background: ${statusColor}; }
          .watermark { text-align: center; padding: 12px; font-size: 10px; color: #d1cdc7; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
          @media print {
            body { background: white; }
            .page { margin: 0; box-shadow: none; border-radius: 0; }
            .no-print { display: none; }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ textAlign: 'center', padding: '20px 0 4px', fontFamily: 'Inter, sans-serif' }}>
          <button
            onClick="window.print()"
            style={{ background: '#094f44', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            🖨️ Print / Save PDF
          </button>
          <script dangerouslySetInnerHTML={{ __html: `document.querySelector('button').addEventListener('click', () => window.print())` }} />
        </div>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>AasaMedChem</h1>
                <div className="sub">Pharmaceutical Intermediates &amp; Lab Chemicals</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: '900' }}>INVOICE</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{new Date(quotation.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ marginTop: '8px' }}><span className="status-badge">{quotation.status}</span></div>
              </div>
            </div>
            <div className="id">Quotation Ref: {quotation.id.toUpperCase()}</div>
          </div>

          {/* Seller & Buyer */}
          <div className="meta">
            <div className="meta-card">
              <div className="meta-label">Prepared By (Seller)</div>
              <div className="meta-name">{quotation.seller?.name}</div>
              <div className="meta-email">{quotation.seller?.email}</div>
            </div>
            <div className="meta-card">
              <div className="meta-label">Prepared For (Buyer)</div>
              <div className="meta-name">{quotation.buyer?.name}</div>
              <div className="meta-email">{quotation.buyer?.email}</div>
            </div>
          </div>

          {/* Line Items */}
          <div className="table-section">
            <h3>Ordered Items</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th className="td-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div className="td-name">{item.product?.name}</div>
                      <div className="td-sku">SKU: {item.product?.sku || '—'}</div>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{item.product?.category || '—'}</td>
                    <td>{parseFloat(item.orderedQuantity).toFixed(2)} {getUnitLabel(item.orderedUnit)}</td>
                    <td style={{ color: '#6b7280' }}>{formatCurrency(item.unitPriceAtOrder)}</td>
                    <td className="td-right td-amount">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="5" style={{ textAlign: 'right', fontSize: 13 }}>Total Amount (INR)</td>
                  <td className="td-right" style={{ fontSize: 16, color: '#094f44' }}>{formatCurrency(quotation.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div style={{ padding: '0 40px 24px', fontSize: 12, color: '#6b7280', background: '#fafaf9', borderTop: '1px solid #f0ede8', paddingTop: 16 }}>
              <strong style={{ color: '#1a1a1a' }}>Notes / Terms:</strong> {quotation.notes}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div className="footer-note">This invoice is system-generated and valid without a signature.<br />Generated by AasaMedChem Platform.</div>
            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#1a1a1a' }}>AasaMedChem Pvt. Ltd.</div>
              <div>support@aasamedchem.com</div>
            </div>
          </div>
          <div className="watermark">AasaMedChem • Confidential Document</div>
        </div>
      </body>
    </html>
  );
}
