import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';


export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await client.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.log('Could not fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await client.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (err) {
        alert('Could not delete invoice');
      }
    }
  };

  const printInvoices = () => {
    const rows = filteredInvoices.map(i => {
      const remaining = parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0);
      return `<tr>
        <td>${i.invoice_no}</td>
        <td>${i.party_name || '-'}</td>
        <td>${i.issue_date ? i.issue_date.toString().split('T')[0] : '-'}</td>
        <td style="text-align:right">PKR ${parseInt(i.total || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#16a34a">PKR ${parseInt(i.amount_paid || 0).toLocaleString()}</td>
        <td style="text-align:right;color:${remaining > 0 ? '#ef4444' : '#16a34a'}">PKR ${remaining.toLocaleString()}</td>
        <td>${i.status || 'Pending'}</td>
      </tr>`;
    }).join('');
    const totalAmount = filteredInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const totalPaid = filteredInvoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
    const totalRemaining = totalAmount - totalPaid;
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>All Invoices</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px}
        h2{color:#1e1b4b;margin-bottom:8px}
        p{color:#666;font-size:13px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        tr:nth-child(even){background:#f9fafb}
        .summary{margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b;display:flex;justify-content:flex-end;gap:40px}
        .summary-item{text-align:right}
        .summary-label{font-size:12px;color:#666;margin-bottom:4px}
        .summary-value{font-size:16px;font-weight:bold}
      </style></head>
      <body>
        <h2><img src="data:image/png;base64,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" style="width:40px;height:40px;object-fit:contain;vertical-align:middle;margin-right:8px;background:#000;border-radius:4px;padding:2px;"/> RS APPARELS</h2> — All Invoices</h2>
        <p>Total: ${filteredInvoices.length} invoices</p>
        <table>
          <thead><tr>
            <th>Invoice #</th><th>Party</th><th>Date</th>
            <th style="text-align:right">Total</th>
            <th style="text-align:right">Paid</th>
            <th style="text-align:right">Remaining</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value" style="color:#4361ee">PKR ${totalAmount.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Paid</div>
            <div class="summary-value" style="color:#16a34a">PKR ${totalPaid.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Remaining</div>
            <div class="summary-value" style="color:#ef4444">PKR ${totalRemaining.toLocaleString()}</div>
          </div>
        </div>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const filteredInvoices = invoices.filter(i =>
    (i.invoice_no && i.invoice_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.party_name && i.party_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.status && i.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = filteredInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
  const totalRemaining = totalAmount - totalPaid;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.printBtn} onPress={printInvoices}>
          <Text style={styles.printBtnText}>🖨️ Print All</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by invoice #, party or status..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={[styles.summaryValue, { color: '#4361ee' }]}>
            PKR {totalAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
            PKR {totalPaid.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
            PKR {totalRemaining.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Invoice #</Text>
          {isDesktop && <Text style={[styles.th, { flex: 1.5 }]}>Party</Text>}
          {isDesktop && <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>}
          <Text style={[styles.th, { flex: 1.2 }]}>Total</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Paid</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Remaining</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          <Text style={[styles.th, { flex: 0.5 }]}></Text>
        </View>
        <ScrollView>
          {filteredInvoices.length === 0
            ? <Text style={styles.empty}>No invoices found.</Text>
            : filteredInvoices.map((inv, index) => {
              const remaining = parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0);
              return (
                <View key={inv.id}
                  style={[styles.tr, index % 2 === 0 && styles.trEven]}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{inv.invoice_no}</Text>
                  {isDesktop && <Text style={[styles.td, { flex: 1.5 }]}>{inv.party_name || '-'}</Text>}
                  {isDesktop && <Text style={[styles.td, { flex: 1.2 }]}>{inv.issue_date?.toString().split('T')[0]}</Text>}
                  <Text style={[styles.td, { flex: 1.2, color: '#4361ee', fontWeight: '600' }]}>
                    PKR {parseInt(inv.total || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2, color: '#16a34a', fontWeight: '600' }]}>
                    PKR {parseInt(inv.amount_paid || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2, color: remaining > 0 ? '#ef4444' : '#16a34a', fontWeight: '600' }]}>
                    PKR {remaining.toLocaleString()}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.badge,
                      inv.status === 'Paid' ? styles.badgePaid :
                      inv.status === 'Partial' ? styles.badgePartial : styles.badgeUnpaid]}>
                      <Text style={styles.badgeText}>{inv.status || 'Pending'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ flex: 0.5 }} onPress={() => deleteInvoice(inv.id)}>
                    <Text style={styles.del}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          }
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  printBtn: {
    backgroundColor: '#fff', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#ddd'
  },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 8,
    padding: 11, fontSize: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#ddd'
  },
  summaryBar: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  summaryDivider: {
    width: 1, height: 36,
    backgroundColor: '#e5e7eb', marginHorizontal: 8
  },
  tableContainer: {
    backgroundColor: '#fff', borderRadius: 10,
    overflow: 'hidden', flex: 1, elevation: 2
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#1e1b4b',
    paddingVertical: 10, paddingHorizontal: 12
  },
  th: { color: '#fff', fontWeight: '600', fontSize: 12 },
  tr: {
    flexDirection: 'row', paddingVertical: 10,
    paddingHorizontal: 12, alignItems: 'center'
  },
  trEven: { backgroundColor: '#f9fafb' },
  td: { fontSize: 12, color: '#374151' },
  del: { fontSize: 15, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  badge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3
  },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePartial: { backgroundColor: '#fef3c7' },
  badgeUnpaid: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '600' }
});