import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';
import DatePicker from '../components/DatePicker';

export default function PartyDetailScreen({ route }) {
  const { party } = route.params;
  const [activeTab, setActiveTab] = useState('Accessories');
  const [activeInvoiceTab, setActiveInvoiceTab] = useState('Air');
  const [accessories, setAccessories] = useState([]);
  const [filteredAccessories, setFilteredAccessories] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [itemFilterModalVisible, setItemFilterModalVisible] = useState(false);
  const [invoiceFilterModalVisible, setInvoiceFilterModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editPaymentVisible, setEditPaymentVisible] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount_paid: '', status: 'Pending' });
  const [categories, setCategories] = useState(['All']);
  const [newCategory, setNewCategory] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStyleNos, setSelectedStyleNos] = useState([]);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [accForm, setAccForm] = useState({
    name: '', category: 'Fabric', quantity: '', unit: '', unit_price: '', notes: ''
  });
  const [itemForm, setItemForm] = useState({
    style_no: '', description: '', color: '', size: '', price: '', image_url: ''
  });
  const [invForm, setInvForm] = useState({
    invoice_no: '', issue_date: '', due_date: '',
    advance: '0', freight_charges: '0', amount_paid: '0',
    status: 'Pending', notes: '', shipment_type: 'Air'
  });
  const [selectedInvItems, setSelectedInvItems] = useState([]);
  const [accountForm, setAccountForm] = useState({
    account_name: '', bank_name: '', account_no: ''
  });
  const [newPaymentForm, setNewPaymentForm] = useState({
    account_id: '', account_name: '', amount: '', date: '', notes: ''
  });

  useEffect(() => { fetchAll(); fetchCategories(); }, [activeTab]);

  useEffect(() => {
    let result = items;
    if (selectedSizes.length > 0) result = result.filter(i => selectedSizes.includes(i.size));
    if (selectedColors.length > 0) result = result.filter(i => selectedColors.includes(i.color));
    if (selectedStyleNos.length > 0) result = result.filter(i => selectedStyleNos.includes(i.style_no));
    setFilteredItems(result);
  }, [selectedSizes, selectedColors, selectedStyleNos, items]);

  useEffect(() => {
    if (activeFilter === 'All') setFilteredAccessories(accessories);
    else setFilteredAccessories(accessories.filter(a => a.category === activeFilter));
  }, [activeFilter, accessories]);

  useEffect(() => {
    const tabInvoices = invoices.filter(i => (i.shipment_type || 'Air') === activeInvoiceTab);
    if (selectedMonths.length === 0) setFilteredInvoices(tabInvoices);
    else setFilteredInvoices(tabInvoices.filter(i => selectedMonths.includes(getMonthYear(i.issue_date))));
  }, [selectedMonths, invoices, activeInvoiceTab]);

  useEffect(() => {
    if (activeTab !== 'Ledger') return;
    const debits = invoices.map(inv => ({
      date: inv.issue_date,
      particular: inv.invoice_no,
      bil: inv.invoice_no,
      debit: parseFloat(inv.total || 0),
      credit: 0,
      type: 'invoice'
    }));
    const credits = payments.map(pay => ({
      date: pay.date,
      particular: `Payment — ${pay.account_name}`,
      bil: '',
      debit: 0,
      credit: parseFloat(pay.amount || 0),
      type: 'payment'
    }));
    const all = [...debits, ...credits].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    const withBalance = all.map(entry => {
      balance += entry.debit - entry.credit;
      return { ...entry, balance };
    });
    setLedgerEntries(withBalance);
  }, [invoices, payments, activeTab]);

  const getMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  };

  const uniqueMonths = [...new Set(
    invoices
      .filter(i => (i.shipment_type || 'Air') === activeInvoiceTab)
      .map(i => getMonthYear(i.issue_date))
      .filter(Boolean)
  )];

  const fetchCategories = async () => {
    try {
      const res = await client.get('/categories');
      setCategories(['All', ...res.data.map(c => c.name)]);
    } catch (err) { console.log('Could not fetch categories'); }
  };

  const saveCustomCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await client.post('/categories', { name: newCategory.trim() });
      setNewCategory('');
      fetchCategories();
    } catch (err) { alert('Category already exists'); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Accessories') {
        const res = await client.get(`/accessories/party/${party.id}`);
        setAccessories(res.data);
        setFilteredAccessories(res.data);
        setActiveFilter('All');
      } else if (activeTab === 'Items') {
        const res = await client.get(`/items/party/${party.id}`);
        setItems(res.data);
        setFilteredItems(res.data);
        setSelectedSizes([]); setSelectedColors([]); setSelectedStyleNos([]);
      } else if (activeTab === 'Invoices') {
        const [invRes, itemsRes] = await Promise.all([
          client.get('/invoices'),
          client.get(`/items/party/${party.id}`)
        ]);
        const partyInvoices = invRes.data.filter(i => String(i.party_id) === String(party.id));
        setInvoices(partyInvoices);
        setFilteredInvoices(partyInvoices.filter(i => (i.shipment_type || 'Air') === 'Air'));
        setAllItems(itemsRes.data);
        setSelectedMonths([]);
      } else if (activeTab === 'Ledger') {
        const [invRes, payRes] = await Promise.all([
          client.get('/invoices'),
          client.get(`/party-payments/${party.id}`)
        ]);
        const partyInvoices = invRes.data.filter(i => String(i.party_id) === String(party.id));
        setInvoices(partyInvoices);
        setPayments(payRes.data);
      } else if (activeTab === 'Accounts') {
        const [accRes, payRes] = await Promise.all([
          client.get(`/party-accounts/${party.id}`),
          client.get(`/party-payments/${party.id}`)
        ]);
        setAccounts(accRes.data);
        setPayments(payRes.data);
      }
    } catch (err) { console.log(err.message); }
    finally { setLoading(false); }
  };

  const uniqueSizes = [...new Set(items.map(i => i.size).filter(Boolean))];
  const uniqueColors = [...new Set(items.map(i => i.color).filter(Boolean))];
  const uniqueStyleNos = [...new Set(items.map(i => i.style_no).filter(Boolean))];

  const toggleFilter = (value, selected, setSelected) => {
    if (selected.includes(value)) setSelected(selected.filter(v => v !== value));
    else setSelected([...selected, value]);
  };

  const clearItemFilters = () => { setSelectedSizes([]); setSelectedColors([]); setSelectedStyleNos([]); };
  const hasItemFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedStyleNos.length > 0;

  const invSubtotal = selectedInvItems.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
  const invAdvance = parseFloat(invForm.advance || 0);
  const invFreight = parseFloat(invForm.freight_charges || 0);
  const invTotal = invSubtotal + invFreight - invAdvance;
  const invAmountPaid = parseFloat(invForm.amount_paid || 0);
  const invRemaining = invTotal - invAmountPaid;

  const filteredTotal = filteredInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const filteredPaid = filteredInvoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
  const filteredRemaining = filteredTotal - filteredPaid;

  const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);
  const finalBalance = totalDebit - totalCredit;

  const formatDate = (d) => d ? d.toString().split('T')[0] : '-';
  const statusLabel = (status) => {
    if (status === 'Paid') return '✅ Paid';
    if (status === 'Partial') return '⚡ Partial';
    return '⏳ Pending';
  };

  const printLedger = () => {
    const rows = ledgerEntries.map(e =>
      `<tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.particular}</td>
        <td>${e.bil || '-'}</td>
        <td style="text-align:right;color:${e.debit > 0 ? '#1e1b4b' : '#ccc'}">${e.debit > 0 ? 'PKR ' + e.debit.toLocaleString() : '-'}</td>
        <td style="text-align:right;color:${e.credit > 0 ? '#ef4444' : '#ccc'}">${e.credit > 0 ? 'PKR ' + e.credit.toLocaleString() : '-'}</td>
        <td style="text-align:right;font-weight:600;color:#4361ee">PKR ${e.balance.toLocaleString()}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Ledger — ${party.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}
        h2{color:#1e1b4b;text-align:center;margin-bottom:4px}
        h3{color:#666;text-align:center;font-size:14px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        tr:nth-child(even){background:#f9fafb}
        .footer{display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b}
        .footer-item{text-align:center;flex:1}
        .footer-label{color:#666;font-size:12px;margin-bottom:4px}
        .footer-value{font-size:18px;font-weight:bold}
      </style></head>
      <body>
        <h2>${party.name}</h2>
        <h3>Ledger Account</h3>
        <table>
          <thead><tr>
            <th>Date</th><th>Particular</th><th>Bill #</th>
            <th style="text-align:right">Debit</th>
            <th style="text-align:right">Credit</th>
            <th style="text-align:right">Balance</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <div class="footer-item">
            <div class="footer-label">Total Debit</div>
            <div class="footer-value" style="color:#1e1b4b">PKR ${totalDebit.toLocaleString()}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">Total Credit</div>
            <div class="footer-value" style="color:#ef4444">PKR ${totalCredit.toLocaleString()}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">Balance</div>
            <div class="footer-value" style="color:#4361ee">PKR ${finalBalance.toLocaleString()}</div>
          </div>
        </div>
      </body></html>`);
    win.document.close(); win.print();
  };

  const printAccessories = () => {
    const data = activeFilter === 'All' ? accessories : filteredAccessories;
    const subtotalAmount = data.reduce((sum, a) => sum + (parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)), 0);
    const rows = data.map(a =>
      `<tr><td>${a.name}</td><td>${a.category}</td><td>${a.quantity} ${a.unit || ''}</td>
       <td style="text-align:right">PKR ${parseInt(a.unit_price || 0).toLocaleString()}</td>
       <td style="text-align:right">PKR ${(parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Accessories</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.sub{text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b}.sub-value{font-size:20px;font-weight:bold;color:#1e1b4b}</style></head>
      <body><h2>✂️ Garments ERP — Accessories</h2>
      <p>Party: <strong>${party.name}</strong> · Filter: ${activeFilter} · Total: ${data.length}</p>
      <table><thead><tr><th>Name</th><th>Category</th><th>Quantity</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total Price</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="sub">Subtotal: <span class="sub-value">PKR ${subtotalAmount.toLocaleString()}</span></div>
      </body></html>`);
    win.document.close(); win.print();
  };

  const printItems = () => {
    const data = filteredItems;
    const rows = data.map(i =>
      `<tr><td>${i.style_no}</td><td>${i.description || '-'}</td>
       <td>${i.color || '-'}</td><td>${i.size || '-'}</td>
       <td style="text-align:right">PKR ${parseInt(i.price || 0).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Items</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}</style></head>
      <body><h2>✂️ Garments ERP — Items / Styles</h2>
      <p>Party: <strong>${party.name}</strong> · Total: ${data.length}</p>
      <table><thead><tr><th>Style No</th><th>Description</th><th>Color</th><th>Size</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close(); win.print();
  };

  const printAllInvoices = () => {
    const data = filteredInvoices;
    const totalAmt = data.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const paidAmt = data.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
    const remainAmt = totalAmt - paidAmt;
    const rows = data.map(i => {
      const rem = parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0);
      return `<tr>
        <td>${i.invoice_no}</td>
        <td>${i.issue_date ? i.issue_date.toString().split('T')[0] : '-'}</td>
        <td style="text-align:right">PKR ${parseInt(i.subtotal || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#16a34a">PKR ${parseInt(i.freight_charges || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#ef4444">PKR ${parseInt(i.advance || 0).toLocaleString()}</td>
        <td style="text-align:right;font-weight:bold">PKR ${parseInt(i.total || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#16a34a">PKR ${parseInt(i.amount_paid || 0).toLocaleString()}</td>
        <td style="text-align:right;color:${rem > 0 ? '#ef4444' : '#16a34a'}">PKR ${rem.toLocaleString()}</td>
        <td>${statusLabel(i.status)}</td>
      </tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoices</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:1100px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1e1b4b;color:#fff;padding:8px 10px;text-align:left}td{padding:8px 10px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f9fafb}.summary{margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b;display:flex;justify-content:flex-end;gap:40px}.summary-item{text-align:right}.summary-label{font-size:12px;color:#666;margin-bottom:4px}.summary-value{font-size:16px;font-weight:bold}</style></head>
      <body><h2>✂️ Garments ERP — Invoices (Shipment by Air)</h2>
      <p>Party: <strong>${party.name}</strong> · Filter: ${selectedMonths.length > 0 ? selectedMonths.join(', ') : 'All'} · Total: ${data.length}</p>
      <table><thead><tr><th>Invoice #</th><th>Date</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Freight (+)</th><th style="text-align:right">Advance (−)</th><th style="text-align:right">Total</th><th style="text-align:right">Paid</th><th style="text-align:right">Remaining</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="summary">
        <div class="summary-item"><div class="summary-label">Total</div><div class="summary-value" style="color:#4361ee">PKR ${totalAmt.toLocaleString()}</div></div>
        <div class="summary-item"><div class="summary-label">Paid</div><div class="summary-value" style="color:#16a34a">PKR ${paidAmt.toLocaleString()}</div></div>
        <div class="summary-item"><div class="summary-label">Remaining</div><div class="summary-value" style="color:#ef4444">PKR ${remainAmt.toLocaleString()}</div></div>
      </div></body></html>`);
    win.document.close(); win.print();
  };

  const printInvoice = async (inv) => {
    try {
      const res = await client.get(`/invoices/${inv.id}`);
      const full = res.data;
      const lineItems = full.items || [];
      const rows = lineItems.map(item =>
        `<tr><td>${item.description}</td>
         <td style="text-align:center">${parseFloat(item.quantity).toLocaleString()}</td>
         <td style="text-align:right">PKR ${parseInt(item.unit_price || 0).toLocaleString()}</td>
         <td style="text-align:right">PKR ${parseInt(item.total || 0).toLocaleString()}</td></tr>`
      ).join('');
      const remaining = parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0);
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_no}</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;color:#333}
          .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1e1b4b}
          .company{font-size:20px;font-weight:bold;color:#1e1b4b}
          .company-sub{font-size:13px;color:#888;margin-top:4px}
          .inv-right{text-align:right}
          .inv-title{font-size:32px;font-weight:bold;color:#4361ee}
          .inv-status{font-size:14px;font-weight:600;margin-top:4px}
          .info-row{display:flex;margin:20px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
          .info-box{flex:1;padding:12px 16px;border-right:1px solid #e5e7eb}
          .info-box:last-child{border-right:none}
          .info-label{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px}
          .info-value{font-size:13px;font-weight:600;color:#1e1b4b}
          table{width:100%;border-collapse:collapse;margin:16px 0}
          th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
          td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
          tr:nth-child(even){background:#f9fafb}
          .totals{margin-top:8px}
          .trow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6}
          .tlabel{color:#666;font-size:13px}
          .tvalue{font-size:13px;font-weight:600;text-align:right}
          .grand{border-top:2px solid #1e1b4b;border-bottom:2px solid #1e1b4b;padding:10px 0;margin:8px 0;background:#f8faff}
          .grand .tlabel{font-size:16px;font-weight:bold;color:#1e1b4b}
          .grand .tvalue{font-size:16px;font-weight:bold;color:#4361ee}
          .freight .tvalue{color:#16a34a}
          .advance .tvalue{color:#ef4444}
          .rem .tlabel{color:#ef4444;font-weight:600}
          .rem .tvalue{color:#ef4444;font-weight:bold;font-size:15px}
        </style></head>
        <body>
          <div class="header">
            <div><div class="company">✂️ Garments ERP</div>
            <div class="company-sub">Shipment by Air — ${party.name}</div></div>
            <div class="inv-right">
              <div class="inv-title">${inv.invoice_no}</div>
              <div class="inv-status">${statusLabel(inv.status)}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-box"><div class="info-label">Party</div><div class="info-value">${party.name}</div></div>
            <div class="info-box"><div class="info-label">Issue Date</div><div class="info-value">${formatDate(inv.issue_date)}</div></div>
            <div class="info-box"><div class="info-label">Due Date</div><div class="info-value">${formatDate(inv.due_date)}</div></div>
            <div class="info-box"><div class="info-label">Status</div><div class="info-value">${statusLabel(inv.status)}</div></div>
          </div>
          <table>
            <thead><tr><th>Style / Color / Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#888">No items</td></tr>'}</tbody>
          </table>
          <div class="totals">
            <div class="trow"><span class="tlabel">Subtotal</span><span class="tvalue">PKR ${parseInt(inv.subtotal || 0).toLocaleString()}</span></div>
            <div class="trow freight"><span class="tlabel">Freight Charges (+)</span><span class="tvalue">PKR ${parseInt(inv.freight_charges || 0).toLocaleString()}</span></div>
            <div class="trow advance"><span class="tlabel">Advance (−)</span><span class="tvalue">PKR ${parseInt(inv.advance || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span class="tlabel">Total</span><span class="tvalue">PKR ${parseInt(inv.total || 0).toLocaleString()}</span></div>
            <div class="trow"><span class="tlabel">Amount Paid</span><span class="tvalue" style="color:#16a34a">PKR ${parseInt(inv.amount_paid || 0).toLocaleString()}</span></div>
            <div class="trow rem"><span class="tlabel">Remaining</span><span class="tvalue">PKR ${remaining.toLocaleString()}</span></div>
          </div>
        </body></html>`);
      win.document.close(); win.print();
    } catch (err) { alert('Could not load invoice'); }
  };

  const addAccessory = async () => {
    if (!accForm.name) { alert('Name is required'); return; }
    try {
      await client.post('/accessories', { ...accForm, party_id_owner: party.id });
      setModalVisible(false);
      setAccForm({ name: '', category: 'Fabric', quantity: '', unit: '', unit_price: '', notes: '' });
      fetchAll();
    } catch (err) { alert('Could not add accessory'); }
  };

  const deleteAccessory = async (id) => {
    if (window.confirm('Delete this accessory?')) {
      try { await client.delete(`/accessories/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({ style_no: '', description: '', color: '', size: '', price: '', image_url: '' });
    setModalVisible(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      style_no: item.style_no || '', description: item.description || '',
      color: item.color || '', size: item.size || '',
      price: String(item.price || ''), image_url: item.image_url || ''
    });
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!itemForm.style_no || !itemForm.price) { alert('Style number and price are required'); return; }
    try {
      if (editingItem) await client.put(`/items/${editingItem.id}`, itemForm);
      else await client.post('/items', { ...itemForm, party_id: party.id });
      setModalVisible(false); setEditingItem(null);
      setItemForm({ style_no: '', description: '', color: '', size: '', price: '', image_url: '' });
      fetchAll();
    } catch (err) { alert('Could not save item'); }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      try { await client.delete(`/items/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const addInvItem = (item) => {
    const existing = selectedInvItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedInvItems(selectedInvItems.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedInvItems([...selectedInvItems, {
        id: item.id, style_no: item.style_no,
        description: item.description, color: item.color,
        size: item.size, price: item.price, quantity: 1
      }]);
    }
  };

  const removeInvItem = (id) => setSelectedInvItems(selectedInvItems.filter(i => i.id !== id));

  const updateInvQty = (id, qty) => {
    if (qty < 1) return;
    setSelectedInvItems(selectedInvItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const saveInvoice = async () => {
    if (!invForm.invoice_no || !invForm.issue_date) { alert('Invoice number and date are required'); return; }
    const remaining = invTotal - invAmountPaid;
    let status = 'Pending';
    if (invAmountPaid >= invTotal && invTotal > 0) status = 'Paid';
    else if (invAmountPaid > 0) status = 'Partial';
    try {
      await client.post('/invoices', {
        ...invForm, party_id: party.id, type: 'Sale', shipment_type: 'Air',
        subtotal: invSubtotal, total: invTotal, advance: invAdvance,
        freight_charges: invFreight, amount_paid: invAmountPaid, remaining, status,
        items: selectedInvItems.map(i => ({
          description: `${i.style_no}${i.color ? ' | Color: ' + i.color : ''}${i.size ? ' | Size: ' + i.size : ''}${i.description ? ' | ' + i.description : ''}`,
          quantity: i.quantity, unit_price: i.price
        }))
      });
      setModalVisible(false);
      setInvForm({ invoice_no: '', issue_date: '', due_date: '', advance: '0', freight_charges: '0', amount_paid: '0', status: 'Pending', notes: '', shipment_type: 'Air' });
      setSelectedInvItems([]);
      fetchAll();
    } catch (err) { alert('Could not save invoice'); }
  };

  const openEditPayment = (inv) => {
    setEditingInvoice(inv);
    setPaymentForm({ amount_paid: String(inv.amount_paid || '0'), status: inv.status || 'Pending' });
    setEditPaymentVisible(true);
  };

  const savePayment = async () => {
    try {
      const paid = parseFloat(paymentForm.amount_paid || 0);
      const remaining = parseFloat(editingInvoice.total || 0) - paid;
      let status = 'Pending';
      if (paid >= parseFloat(editingInvoice.total || 0) && parseFloat(editingInvoice.total || 0) > 0) status = 'Paid';
      else if (paid > 0) status = 'Partial';
      await client.put(`/invoices/${editingInvoice.id}`, {
        invoice_no: editingInvoice.invoice_no,
        type: editingInvoice.type || 'Sale',
        party_id: editingInvoice.party_id,
        issue_date: editingInvoice.issue_date,
        due_date: editingInvoice.due_date,
        subtotal: editingInvoice.subtotal,
        discount: editingInvoice.discount || 0,
        tax: editingInvoice.tax || 0,
        total: editingInvoice.total,
        paid: paid, status, notes: editingInvoice.notes,
        amount_paid: paid, remaining,
        advance: editingInvoice.advance || 0,
        freight_charges: editingInvoice.freight_charges || 0,
        shipment_type: editingInvoice.shipment_type || 'Air'
      });
      setEditPaymentVisible(false);
      setEditingInvoice(null);
      fetchAll();
    } catch (err) { alert('Could not update payment'); }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try { await client.delete(`/invoices/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const addAccount = async () => {
    if (!accountForm.account_name || !accountForm.bank_name || !accountForm.account_no) {
      alert('All fields are required'); return;
    }
    try {
      await client.post('/party-accounts', { ...accountForm, party_id: party.id });
      setAccountModalVisible(false);
      setAccountForm({ account_name: '', bank_name: '', account_no: '' });
      fetchAll();
    } catch (err) { alert('Could not add account'); }
  };

  const deleteAccount = async (id) => {
    if (window.confirm('Delete this account?')) {
      try { await client.delete(`/party-accounts/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const addPayment = async () => {
    if (!newPaymentForm.amount || !newPaymentForm.date || !newPaymentForm.account_id) {
      alert('Account, amount and date are required'); return;
    }
    try {
      const selectedAcc = accounts.find(a => String(a.id) === String(newPaymentForm.account_id));
      await client.post('/party-payments', {
        party_id: party.id,
        account_id: newPaymentForm.account_id,
        account_name: selectedAcc ? `${selectedAcc.account_name} — ${selectedAcc.bank_name}` : newPaymentForm.account_name,
        amount: newPaymentForm.amount,
        date: newPaymentForm.date,
        notes: newPaymentForm.notes
      });
      setPaymentModalVisible(false);
      setNewPaymentForm({ account_id: '', account_name: '', amount: '', date: '', notes: '' });
      fetchAll();
    } catch (err) { alert('Could not add payment'); }
  };

  const deletePayment = async (id) => {
    if (window.confirm('Delete this payment?')) {
      try { await client.delete(`/party-payments/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const tabs = ['Accessories', 'Items', 'Invoices', 'Ledger', 'Accounts'];

  return (
    <View style={styles.container}>

      {/* Party header */}
      <View style={styles.partyHeader}>
        <Text style={styles.partyName}>{party.name}</Text>
        <View style={[styles.badge, party.type === 'Customer' ? styles.badgeCustomer : styles.badgeSupplier]}>
          <Text style={styles.badgeText}>{party.type}</Text>
        </View>
        <Text style={styles.partyContact}>{party.contact_person} · {party.phone} · {party.city}</Text>
      </View>

      {/* Tabs - scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Invoice sub-tabs - outside ScrollView to avoid gap */}
      {activeTab === 'Invoices' && (
        <View style={styles.invoiceSubTabs}>
          <TouchableOpacity
            style={[styles.invoiceSubTab, activeInvoiceTab === 'Air' && styles.invoiceSubTabActive]}
            onPress={() => { setActiveInvoiceTab('Air'); setSelectedMonths([]); }}>
            <Text style={[styles.invoiceSubTabText, activeInvoiceTab === 'Air' && styles.invoiceSubTabTextActive]}>✈️ Shipment by Air</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.invoiceSubTab, activeInvoiceTab === 'Sea' && styles.invoiceSubTabActive]}
            onPress={() => { setActiveInvoiceTab('Sea'); setSelectedMonths([]); }}>
            <Text style={[styles.invoiceSubTabText, activeInvoiceTab === 'Sea' && styles.invoiceSubTabTextActive]}>🚢 Shipment by Sea</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top actions */}
      <View style={styles.topActions}>
        {activeTab !== 'Ledger' && activeTab !== 'Invoices' && activeTab !== 'Accounts' && (
          <TouchableOpacity style={styles.addBtn}
            onPress={() => activeTab === 'Items' ? openAddItem() : setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add {activeTab === 'Items' ? 'Item' : 'Accessory'}</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'Invoices' && activeInvoiceTab === 'Air' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addBtnText}>+ New Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setInvoiceFilterModalVisible(true)}>
              <Text style={styles.filterBtnText}>🔽 Month {selectedMonths.length > 0 ? `(${selectedMonths.length})` : ''}</Text>
            </TouchableOpacity>
            {selectedMonths.length > 0 && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSelectedMonths([])}>
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.printBtn} onPress={printAllInvoices}>
              <Text style={styles.printBtnText}>🖨️ Print All</Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'Accessories' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
              <Text style={styles.filterBtnText}>🔽 {activeFilter}</Text>
            </TouchableOpacity>
            {activeFilter !== 'All' && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setActiveFilter('All')}>
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.printBtn} onPress={printAccessories}>
              <Text style={styles.printBtnText}>🖨️ Print</Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'Items' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setItemFilterModalVisible(true)}>
              <Text style={styles.filterBtnText}>🔽 Filter {hasItemFilters ? `(${selectedSizes.length + selectedColors.length + selectedStyleNos.length})` : ''}</Text>
            </TouchableOpacity>
            {hasItemFilters && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={clearItemFilters}>
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.printBtn} onPress={printItems}>
              <Text style={styles.printBtnText}>🖨️ Print</Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'Ledger' && (
          <TouchableOpacity style={styles.printBtn} onPress={printLedger}>
            <Text style={styles.printBtnText}>🖨️ Print Ledger</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'Accounts' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAccountModalVisible(true)}>
              <Text style={styles.addBtnText}>+ Add Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#16a34a' }]} onPress={() => setPaymentModalVisible(true)}>
              <Text style={styles.addBtnText}>+ Add Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4361ee" /></View>
      ) : (
        <ScrollView style={styles.content}>

          {/* ACCESSORIES TAB */}
          {activeTab === 'Accessories' && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Name</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Category</Text>
                <Text style={[styles.th, { flex: 1 }]}>Qty</Text>
                {isDesktop && <Text style={[styles.th, { flex: 1 }]}>Unit Price</Text>}
                {isDesktop && <Text style={[styles.th, { flex: 1 }]}>Total Price</Text>}
                {isDesktop && <Text style={[styles.th, { flex: 1.5 }]}>Notes</Text>}
                <Text style={[styles.th, { flex: 0.5 }]}></Text>
              </View>
              {filteredAccessories.length === 0
                ? <Text style={styles.empty}>No accessories found.</Text>
                : filteredAccessories.map((a, i) => (
                  <View key={a.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                    <Text style={[styles.td, { flex: 2 }]}>{a.name}</Text>
                    <Text style={[styles.td, { flex: 1.5 }]}>{a.category}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{a.quantity} {a.unit}</Text>
                    {isDesktop && <Text style={[styles.td, { flex: 1 }]}>PKR {parseInt(a.unit_price || 0).toLocaleString()}</Text>}
                    {isDesktop && <Text style={[styles.td, { flex: 1 }]}>PKR {(parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)).toLocaleString()}</Text>}
                    {isDesktop && <Text style={[styles.td, { flex: 1.5 }]}>{a.notes || '-'}</Text>}
                    <TouchableOpacity style={{ flex: 0.5 }} onPress={() => deleteAccessory(a.id)}>
                      <Text style={styles.del}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
              {filteredAccessories.length > 0 && (
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotal ({activeFilter}):</Text>
                  <Text style={styles.subtotalValue}>
                    PKR {filteredAccessories.reduce((sum, a) =>
                      sum + (parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)), 0
                    ).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ITEMS TAB */}
          {activeTab === 'Items' && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.5 }]}>Style No</Text>
                <Text style={[styles.th, { flex: 2 }]}>Description</Text>
                <Text style={[styles.th, { flex: 1 }]}>Color</Text>
                <Text style={[styles.th, { flex: 1 }]}>Size</Text>
                <Text style={[styles.th, { flex: 1 }]}>Price</Text>
                <Text style={[styles.th, { flex: 0.8 }]}></Text>
              </View>
              {filteredItems.length === 0
                ? <Text style={styles.empty}>No items found.</Text>
                : filteredItems.map((item, i) => (
                  <View key={item.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                    <Text style={[styles.td, { flex: 1.5 }]}>{item.style_no}</Text>
                    <Text style={[styles.td, { flex: 2 }]}>{item.description || '-'}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{item.color || '-'}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{item.size || '-'}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>PKR {parseInt(item.price || 0).toLocaleString()}</Text>
                    <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => openEditItem(item)}><Text style={styles.del}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteItem(item.id)}><Text style={styles.del}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                ))
              }
            </View>
          )}

          {/* INVOICES TAB */}
          {activeTab === 'Invoices' && (
            <View>
              {activeInvoiceTab === 'Sea' ? (
                <View style={[styles.center, { marginTop: 40 }]}>
                  <Text style={{ fontSize: 40 }}>🚢</Text>
                  <Text style={[styles.empty, { marginTop: 12 }]}>Shipment by Sea — Coming Soon!</Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1.5 }]}>Invoice #</Text>
                    {isDesktop && <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>}
                    <Text style={[styles.th, { flex: 1.2 }]}>Total</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>Paid</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>Remaining</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                    <Text style={[styles.th, { flex: 1 }]}></Text>
                  </View>
                  {filteredInvoices.length === 0
                    ? <Text style={styles.empty}>No invoices found.</Text>
                    : filteredInvoices.map((inv, i) => {
                      const remaining = parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0);
                      return (
                        <View key={inv.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                          <Text style={[styles.td, { flex: 1.5 }]}>{inv.invoice_no}</Text>
                          {isDesktop && <Text style={[styles.td, { flex: 1.2 }]}>{inv.issue_date?.toString().split('T')[0]}</Text>}
                          <Text style={[styles.td, { flex: 1.2, color: '#4361ee', fontWeight: '600' }]}>PKR {parseInt(inv.total || 0).toLocaleString()}</Text>
                          <Text style={[styles.td, { flex: 1.2, color: '#16a34a', fontWeight: '600' }]}>PKR {parseInt(inv.amount_paid || 0).toLocaleString()}</Text>
                          <Text style={[styles.td, { flex: 1.2, color: remaining > 0 ? '#ef4444' : '#16a34a', fontWeight: '600' }]}>PKR {remaining.toLocaleString()}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={[styles.badge, inv.status === 'Paid' ? styles.badgePaid : inv.status === 'Partial' ? styles.badgePartial : styles.badgeUnpaid]}>
                              <Text style={styles.badgeText}>{inv.status || 'Pending'}</Text>
                            </View>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                            <TouchableOpacity onPress={() => printInvoice(inv)}><Text style={styles.del}>🖨️</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => openEditPayment(inv)}><Text style={styles.del}>✏️</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteInvoice(inv.id)}><Text style={styles.del}>🗑️</Text></TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  }
                  {filteredInvoices.length > 0 && (
                    <View style={styles.invoiceSummaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total</Text>
                        <Text style={[styles.summaryValue, { color: '#4361ee' }]}>PKR {filteredTotal.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Paid</Text>
                        <Text style={[styles.summaryValue, { color: '#16a34a' }]}>PKR {filteredPaid.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Remaining</Text>
                        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>PKR {filteredRemaining.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* LEDGER TAB */}
          {activeTab === 'Ledger' && (
            <View>
              {ledgerEntries.length === 0
                ? <Text style={styles.empty}>No ledger entries yet. Add invoices or payments.</Text>
                : (
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
                      <Text style={[styles.th, { flex: 2.5 }]}>Particular</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Bill #</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Debit</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Credit</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Balance</Text>
                    </View>
                    {ledgerEntries.map((entry, i) => (
                      <View key={i} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                        <Text style={[styles.td, { flex: 1.2 }]}>{formatDate(entry.date)}</Text>
                        <Text style={[styles.td, { flex: 2.5 }]}>{entry.particular}</Text>
                        <Text style={[styles.td, { flex: 1 }]}>{entry.bil || '-'}</Text>
                        <Text style={[styles.td, { flex: 1.2, color: entry.debit > 0 ? '#1e1b4b' : '#ccc', fontWeight: entry.debit > 0 ? '600' : '400' }]}>
                          {entry.debit > 0 ? `PKR ${entry.debit.toLocaleString()}` : '-'}
                        </Text>
                        <Text style={[styles.td, { flex: 1.2, color: entry.credit > 0 ? '#ef4444' : '#ccc', fontWeight: entry.credit > 0 ? '600' : '400' }]}>
                          {entry.credit > 0 ? `PKR ${entry.credit.toLocaleString()}` : '-'}
                        </Text>
                        <Text style={[styles.td, { flex: 1.2, fontWeight: '600', color: '#4361ee' }]}>
                          PKR {entry.balance.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.ledgerFooter}>
                      <View style={styles.ledgerFooterItem}>
                        <Text style={styles.ledgerFooterLabel}>Total Debit</Text>
                        <Text style={[styles.ledgerFooterValue, { color: '#1e1b4b' }]}>PKR {totalDebit.toLocaleString()}</Text>
                      </View>
                      <View style={styles.ledgerFooterItem}>
                        <Text style={styles.ledgerFooterLabel}>Total Credit</Text>
                        <Text style={[styles.ledgerFooterValue, { color: '#ef4444' }]}>PKR {totalCredit.toLocaleString()}</Text>
                      </View>
                      <View style={styles.ledgerFooterItem}>
                        <Text style={styles.ledgerFooterLabel}>Balance</Text>
                        <Text style={[styles.ledgerFooterValue, { color: '#4361ee' }]}>PKR {finalBalance.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                )
              }
            </View>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === 'Accounts' && (
            <View>
              <Text style={styles.sectionTitle}>Bank Accounts</Text>
              {accounts.length === 0
                ? <Text style={styles.empty}>No accounts yet. Add one!</Text>
                : accounts.map((acc, i) => (
                  <View key={acc.id} style={[styles.accountCard, i % 2 === 0 && styles.trEven]}>
                    <View style={styles.accountLeft}>
                      <Text style={styles.accountName}>{acc.account_name}</Text>
                      <Text style={styles.accountBank}>🏦 {acc.bank_name}</Text>
                      <Text style={styles.accountNo}>Account #: {acc.account_no}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteAccount(acc.id)}>
                      <Text style={styles.del}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History</Text>
              {payments.length === 0
                ? <Text style={styles.empty}>No payments yet.</Text>
                : (
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
                      <Text style={[styles.th, { flex: 2 }]}>Account</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Amount</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Notes</Text>
                      <Text style={[styles.th, { flex: 0.5 }]}></Text>
                    </View>
                    {payments.map((pay, i) => (
                      <View key={pay.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                        <Text style={[styles.td, { flex: 1.2 }]}>{formatDate(pay.date)}</Text>
                        <Text style={[styles.td, { flex: 2 }]}>{pay.account_name}</Text>
                        <Text style={[styles.td, { flex: 1.5, color: '#ef4444', fontWeight: '600' }]}>
                          PKR {parseInt(pay.amount || 0).toLocaleString()}
                        </Text>
                        <Text style={[styles.td, { flex: 1.5 }]}>{pay.notes || '-'}</Text>
                        <TouchableOpacity style={{ flex: 0.5 }} onPress={() => deletePayment(pay.id)}>
                          <Text style={styles.del}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Total Received:</Text>
                      <Text style={[styles.subtotalValue, { color: '#ef4444' }]}>
                        PKR {payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )
              }
            </View>
          )}

        </ScrollView>
      )}

      {/* ACCESSORIES MODAL */}
      {activeTab === 'Accessories' && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
              <Text style={styles.modalTitle}>Add Accessory</Text>
              <ScrollView>
                <TextInput style={styles.input} placeholder="Name *"
                  value={accForm.name} onChangeText={(v) => setAccForm({ ...accForm, name: v })} />
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {categories.filter(c => c !== 'All').map((t) => (
                    <TouchableOpacity key={t}
                      style={[styles.catBtn, accForm.category === t && styles.catBtnActive]}
                      onPress={() => setAccForm({ ...accForm, category: t })}>
                      <Text style={[styles.catBtnText, accForm.category === t && styles.catBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.addCategoryRow}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add new category..." value={newCategory} onChangeText={setNewCategory} />
                  <TouchableOpacity style={styles.addCategoryBtn} onPress={saveCustomCategory}>
                    <Text style={styles.addCategoryBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="Quantity"
                  value={accForm.quantity} onChangeText={(v) => setAccForm({ ...accForm, quantity: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Unit (e.g. meters, kg, pcs)"
                  value={accForm.unit} onChangeText={(v) => setAccForm({ ...accForm, unit: v })} />
                <TextInput style={styles.input} placeholder="Unit price (PKR)"
                  value={accForm.unit_price} onChangeText={(v) => setAccForm({ ...accForm, unit_price: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Notes"
                  value={accForm.notes} onChangeText={(v) => setAccForm({ ...accForm, notes: v })} />
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addAccessory}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ITEMS MODAL */}
      {activeTab === 'Items' && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item / Style'}</Text>
              <ScrollView>
                <TextInput style={styles.input} placeholder="Style number * (e.g. ST-001)"
                  value={itemForm.style_no} onChangeText={(v) => setItemForm({ ...itemForm, style_no: v })} />
                <TextInput style={styles.input} placeholder="Description"
                  value={itemForm.description} onChangeText={(v) => setItemForm({ ...itemForm, description: v })} />
                <TextInput style={styles.input} placeholder="Color"
                  value={itemForm.color} onChangeText={(v) => setItemForm({ ...itemForm, color: v })} />
                <TextInput style={styles.input} placeholder="Size (e.g. S, M, L, XL)"
                  value={itemForm.size} onChangeText={(v) => setItemForm({ ...itemForm, size: v })} />
                <TextInput style={styles.input} placeholder="Price (PKR) *"
                  value={itemForm.price} onChangeText={(v) => setItemForm({ ...itemForm, price: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Image URL (optional)"
                  value={itemForm.image_url} onChangeText={(v) => setItemForm({ ...itemForm, image_url: v })} />
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEditingItem(null); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                  <Text style={styles.saveText}>{editingItem ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* INVOICE MODAL */}
      {activeTab === 'Invoices' && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
              <Text style={styles.modalTitle}>✈️ New Air Invoice — {party.name}</Text>
              <ScrollView>
                <TextInput style={styles.input} placeholder="Invoice number * (e.g. INV-001)"
                  value={invForm.invoice_no} onChangeText={(v) => setInvForm({ ...invForm, invoice_no: v })} />
                <DatePicker label="Issue Date *" value={invForm.issue_date}
                    onChange={(v) => setInvForm({ ...invForm, issue_date: v })} />
                <DatePicker label="Due Date" value={invForm.due_date}
                    onChange={(v) => setInvForm({ ...invForm, due_date: v })} />
                <Text style={styles.label}>Select Items / Styles</Text>
                {allItems.length === 0
                  ? <Text style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>No items for this party yet.</Text>
                  : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      {allItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.styleBtn} onPress={() => addInvItem(item)}>
                          <Text style={styles.styleBtnNo}>{item.style_no}</Text>
                          <Text style={styles.styleBtnColor}>{item.color || ''}{item.size ? ` · ${item.size}` : ''}</Text>
                          <Text style={styles.styleBtnPrice}>PKR {parseInt(item.price).toLocaleString()}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )
                }
                {selectedInvItems.length > 0 && (
                  <View style={styles.selectedItems}>
                    <Text style={styles.label}>Selected Items</Text>
                    {selectedInvItems.map((item) => (
                      <View key={item.id} style={styles.selectedItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectedItemName}>
                            {item.style_no}{item.color ? ` · ${item.color}` : ''}{item.size ? ` · ${item.size}` : ''}
                          </Text>
                          <Text style={styles.selectedItemPrice}>
                            PKR {parseInt(item.price).toLocaleString()} × {item.quantity} = PKR {parseInt(item.price * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateInvQty(item.id, item.quantity - 1)}>
                            <Text style={styles.qtyBtnText}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={styles.qtyInput}
                            value={String(item.quantity)}
                            onChangeText={(v) => {
                              const num = parseInt(v);
                              if (!isNaN(num) && num > 0) updateInvQty(item.id, num);
                            }}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateInvQty(item.id, item.quantity + 1)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeInvItem(item.id)}>
                            <Text style={{ color: '#ef4444', marginLeft: 8 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.totalsBox}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>PKR {invSubtotal.toLocaleString()}</Text>
                  </View>
                  <TextInput style={styles.input} placeholder="Freight Charges PKR (added to total)"
                    value={invForm.freight_charges} onChangeText={(v) => setInvForm({ ...invForm, freight_charges: v })} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Advance PKR (subtracted from total)"
                    value={invForm.advance} onChangeText={(v) => setInvForm({ ...invForm, advance: v })} keyboardType="numeric" />
                  <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, marginTop: 4 }]}>
                    <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#1e1b4b', fontSize: 15 }]}>Total</Text>
                    <Text style={[styles.totalValue, { color: '#4361ee', fontWeight: 'bold', fontSize: 16 }]}>PKR {invTotal.toLocaleString()}</Text>
                  </View>
                  <TextInput style={styles.input} placeholder="Amount Paid PKR"
                    value={invForm.amount_paid} onChangeText={(v) => setInvForm({ ...invForm, amount_paid: v })} keyboardType="numeric" />
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Remaining</Text>
                    <Text style={[styles.totalValue, { color: '#ef4444', fontWeight: 'bold' }]}>PKR {invRemaining.toLocaleString()}</Text>
                  </View>
                </View>
                <TextInput style={styles.input} placeholder="Notes"
                  value={invForm.notes} onChangeText={(v) => setInvForm({ ...invForm, notes: v })} />
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); setSelectedInvItems([]); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveInvoice}>
                  <Text style={styles.saveText}>Save Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* EDIT PAYMENT MODAL */}
      <Modal visible={editPaymentVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 400, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Edit Payment — {editingInvoice?.invoice_no}</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.infoValue}>PKR {parseInt(editingInvoice?.total || 0).toLocaleString()}</Text>
            </View>
            <TextInput style={styles.input} placeholder="Amount Paid (PKR)"
              value={paymentForm.amount_paid}
              onChangeText={(v) => setPaymentForm({ ...paymentForm, amount_paid: v })}
              keyboardType="numeric" />
            <Text style={styles.label}>Status</Text>
            <View style={styles.typeRow}>
              {['Pending', 'Partial', 'Paid'].map(s => (
                <TouchableOpacity key={s}
                  style={[styles.typeBtn, paymentForm.status === s && styles.typeBtnActive]}
                  onPress={() => setPaymentForm({ ...paymentForm, status: s })}>
                  <Text style={[styles.typeBtnText, paymentForm.status === s && styles.typeBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {paymentForm.amount_paid !== '' && (
              <View style={[styles.totalsBox, { marginTop: 8 }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Remaining</Text>
                  <Text style={[styles.totalValue, { color: '#ef4444', fontWeight: 'bold' }]}>
                    PKR {(parseFloat(editingInvoice?.total || 0) - parseFloat(paymentForm.amount_paid || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditPaymentVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePayment}>
                <Text style={styles.saveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD ACCOUNT MODAL */}
      <Modal visible={accountModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 400, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <TextInput style={styles.input} placeholder="Account name * (e.g. A.R acc)"
              value={accountForm.account_name}
              onChangeText={(v) => setAccountForm({ ...accountForm, account_name: v })} />
            <TextInput style={styles.input} placeholder="Bank name * (e.g. HBL, Meezan)"
              value={accountForm.bank_name}
              onChangeText={(v) => setAccountForm({ ...accountForm, bank_name: v })} />
            <TextInput style={styles.input} placeholder="Account number *"
              value={accountForm.account_no}
              onChangeText={(v) => setAccountForm({ ...accountForm, account_no: v })} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAccountModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addAccount}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 440, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Add Payment Received</Text>
            <Text style={styles.label}>Select Account *</Text>
            {accounts.length === 0
              ? <Text style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>No accounts yet. Add an account first.</Text>
              : accounts.map(acc => (
                <TouchableOpacity key={acc.id}
                  style={[styles.accountSelectBtn, String(newPaymentForm.account_id) === String(acc.id) && styles.accountSelectBtnActive]}
                  onPress={() => setNewPaymentForm({ ...newPaymentForm, account_id: String(acc.id), account_name: `${acc.account_name} — ${acc.bank_name}` })}>
                  <Text style={[styles.accountSelectText, String(newPaymentForm.account_id) === String(acc.id) && styles.accountSelectTextActive]}>
                    {acc.account_name} — {acc.bank_name}
                  </Text>
                </TouchableOpacity>
              ))
            }
            <TextInput style={styles.input} placeholder="Amount (PKR) *"
              value={newPaymentForm.amount}
              onChangeText={(v) => setNewPaymentForm({ ...newPaymentForm, amount: v })}
              keyboardType="numeric" />
            <DatePicker label="Payment Date *" value={newPaymentForm.date}
                onChange={(v) => setNewPaymentForm({ ...newPaymentForm, date: v })} />
            <TextInput style={styles.input} placeholder="Notes (optional)"
              value={newPaymentForm.notes}
              onChangeText={(v) => setNewPaymentForm({ ...newPaymentForm, notes: v })} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addPayment}>
                <Text style={styles.saveText}>Save Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACCESSORIES FILTER MODAL */}
      <Modal visible={filterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 360, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              {categories.map(cat => (
                <TouchableOpacity key={cat}
                  style={[styles.filterOptionBtn, activeFilter === cat && styles.filterOptionBtnActive]}
                  onPress={() => { setActiveFilter(cat); setFilterModalVisible(false); }}>
                  <Text style={[styles.filterOptionText, activeFilter === cat && styles.filterOptionTextActive]}>
                    {cat === 'All' ? '📦 All Categories' : `🏷️ ${cat}`}
                  </Text>
                  {activeFilter === cat && <Text style={{ color: '#4361ee' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ITEMS FILTER MODAL */}
      <Modal visible={itemFilterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 480, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Filter Items</Text>
            <ScrollView>
              {uniqueStyleNos.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Style Number</Text>
                  <View style={styles.filterChips}>
                    {uniqueStyleNos.map(s => (
                      <TouchableOpacity key={s}
                        style={[styles.chip, selectedStyleNos.includes(s) && styles.chipActive]}
                        onPress={() => toggleFilter(s, selectedStyleNos, setSelectedStyleNos)}>
                        <Text style={[styles.chipText, selectedStyleNos.includes(s) && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {uniqueColors.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Color</Text>
                  <View style={styles.filterChips}>
                    {uniqueColors.map(c => (
                      <TouchableOpacity key={c}
                        style={[styles.chip, selectedColors.includes(c) && styles.chipActive]}
                        onPress={() => toggleFilter(c, selectedColors, setSelectedColors)}>
                        <Text style={[styles.chipText, selectedColors.includes(c) && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {uniqueSizes.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Size</Text>
                  <View style={styles.filterChips}>
                    {uniqueSizes.map(s => (
                      <TouchableOpacity key={s}
                        style={[styles.chip, selectedSizes.includes(s) && styles.chipActive]}
                        onPress={() => toggleFilter(s, selectedSizes, setSelectedSizes)}>
                        <Text style={[styles.chipText, selectedSizes.includes(s) && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {uniqueStyleNos.length === 0 && uniqueColors.length === 0 && uniqueSizes.length === 0 && (
                <Text style={styles.empty}>No items to filter yet.</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { clearItemFilters(); setItemFilterModalVisible(false); }}>
                <Text style={styles.cancelText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setItemFilterModalVisible(false)}>
                <Text style={styles.saveText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INVOICE FILTER MODAL */}
      <Modal visible={invoiceFilterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 400, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Filter by Month</Text>
            <ScrollView>
              {uniqueMonths.length === 0
                ? <Text style={styles.empty}>No invoices yet.</Text>
                : uniqueMonths.map(month => (
                  <TouchableOpacity key={month}
                    style={[styles.filterOptionBtn, selectedMonths.includes(month) && styles.filterOptionBtnActive]}
                    onPress={() => toggleFilter(month, selectedMonths, setSelectedMonths)}>
                    <Text style={[styles.filterOptionText, selectedMonths.includes(month) && styles.filterOptionTextActive]}>
                      📅 {month}
                    </Text>
                    {selectedMonths.includes(month) && <Text style={{ color: '#4361ee' }}>✓</Text>}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSelectedMonths([]); setInvoiceFilterModalVisible(false); }}>
                <Text style={styles.cancelText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setInvoiceFilterModalVisible(false)}>
                <Text style={styles.saveText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  partyHeader: { backgroundColor: '#1e1b4b', padding: 16, paddingTop: 20 },
  partyName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  partyContact: { color: '#a5b4fc', fontSize: 12, marginTop: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  badgeCustomer: { backgroundColor: '#e0e7ff' },
  badgeSupplier: { backgroundColor: '#fef3c7' },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePartial: { backgroundColor: '#fef3c7' },
  badgeUnpaid: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tabsScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', maxHeight: 48 },
  tabs: { flexDirection: 'row' },
  tab: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4361ee' },
  tabText: { fontSize: 13, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#4361ee', fontWeight: '700' },
  invoiceSubTabs: { flexDirection: 'row', backgroundColor: '#f8faff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  invoiceSubTab: { flex: 1, padding: 10, alignItems: 'center' },
  invoiceSubTabActive: { borderBottomWidth: 2, borderBottomColor: '#4361ee', backgroundColor: '#eef2ff' },
  invoiceSubTabText: { fontSize: 13, color: '#888', fontWeight: '500' },
  invoiceSubTabTextActive: { color: '#4361ee', fontWeight: '700' },
  topActions: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, flexWrap: 'wrap' },
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, padding: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd' },
  filterBtnText: { color: '#444', fontWeight: '600', fontSize: 12 },
  clearFilterBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  clearFilterText: { color: '#ef4444', fontWeight: '600', fontSize: 12 },
  printBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd' },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 12 },
  filterOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterOptionBtnActive: { backgroundColor: '#eef2ff' },
  filterOptionText: { fontSize: 14, color: '#374151' },
  filterOptionTextActive: { color: '#4361ee', fontWeight: '600' },
  filterSection: { marginBottom: 16 },
  filterSectionTitle: { fontSize: 12, fontWeight: '700', color: '#1e1b4b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addCategoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  addCategoryBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  addCategoryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  tableContainer: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 10, paddingHorizontal: 12 },
  th: { color: '#fff', fontWeight: '600', fontSize: 12 },
  tr: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  trEven: { backgroundColor: '#f9fafb' },
  td: { fontSize: 12, color: '#374151' },
  del: { fontSize: 15, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', padding: 30 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12, borderTopWidth: 2, borderTopColor: '#1e1b4b', backgroundColor: '#f9fafb', gap: 16 },
  subtotalLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  subtotalValue: { fontSize: 16, fontWeight: 'bold', color: '#1e1b4b' },
  invoiceSummaryRow: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#1e1b4b', backgroundColor: '#f9fafb' },
  summaryItem: { flex: 1, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: 'bold' },
  ledgerFooter: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#1e1b4b', backgroundColor: '#f0f4f8' },
  ledgerFooterItem: { flex: 1, padding: 12, alignItems: 'center' },
  ledgerFooterLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  ledgerFooterValue: { fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e1b4b', marginBottom: 10, marginTop: 4 },
  accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 10, borderRadius: 10, elevation: 2 },
  accountLeft: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '600', color: '#1e1b4b' },
  accountBank: { fontSize: 13, color: '#666', marginTop: 4 },
  accountNo: { fontSize: 12, color: '#888', marginTop: 2 },
  accountSelectBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 8, backgroundColor: '#fff' },
  accountSelectBtnActive: { backgroundColor: '#eef2ff', borderColor: '#4361ee' },
  accountSelectText: { fontSize: 14, color: '#444' },
  accountSelectTextActive: { color: '#4361ee', fontWeight: '600' },
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  catBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  catBtnText: { fontSize: 13, color: '#444' },
  catBtnTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  typeBtnText: { color: '#444', fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  styleBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#4361ee', marginRight: 8, paddingHorizontal: 14, alignItems: 'center', backgroundColor: '#eef2ff', minWidth: 90 },
  styleBtnNo: { color: '#4361ee', fontWeight: '700', fontSize: 13 },
  styleBtnColor: { color: '#666', fontSize: 10, marginTop: 2 },
  styleBtnPrice: { color: '#888', fontSize: 11, marginTop: 2 },
  selectedItems: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 10 },
  selectedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  selectedItemName: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  selectedItemPrice: { fontSize: 12, color: '#666', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4361ee', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, fontWeight: '600', color: '#1e1b4b', textAlign: 'center', minWidth: 50 },
  totalsBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  infoBox: { backgroundColor: '#eef2ff', borderRadius: 8, padding: 12, marginBottom: 12 },
  infoLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#1e1b4b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '95%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 580, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});