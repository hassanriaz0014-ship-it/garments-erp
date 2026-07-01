import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

import DatePicker from '../components/DatePicker';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'General'];

const DEFAULT_COST_ITEMS = [
  { id: '1', label: 'Fabric', amount: '' },
  { id: '2', label: 'Thread & Accessories', amount: '' },
  { id: '3', label: 'Button/Zippers', amount: '' },
  { id: '4', label: 'Labour', amount: '' },
  { id: '5', label: 'Packaging', amount: '' },
  { id: '6', label: 'Carton', amount: '' },
  { id: '7', label: 'Sticker', amount: '' },
  { id: '8', label: 'Tag Card Patti', amount: '' },
  { id: '9', label: 'Woven Label', amount: '' },
  { id: '10', label: 'Polly Bag', amount: '' },
  { id: '11', label: 'Buttons', amount: '' },
  { id: '12', label: 'Button Labour', amount: '' },
  { id: '13', label: 'Cropping', amount: '' },
  { id: '14', label: 'Tape/Clip', amount: '' },
];

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
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [globalAccounts, setGlobalAccounts] = useState([]);
  const [selectedGlobalAccounts, setSelectedGlobalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [itemFilterModalVisible, setItemFilterModalVisible] = useState(false);
  const [invoiceFilterModalVisible, setInvoiceFilterModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [poModalVisible, setPoModalVisible] = useState(false);
  const [viewPOModalVisible, setViewPOModalVisible] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [editingPO, setEditingPO] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editPaymentVisible, setEditPaymentVisible] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount_paid: '', status: 'Pending' });
  const [categories, setCategories] = useState(['All']);
  const [newCategory, setNewCategory] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStyleNos, setSelectedStyleNos] = useState([]);
  const [costingModalVisible, setCostingModalVisible] = useState(false);
  const [costingItem, setCostingItem] = useState(null);
  const [costingSheet, setCostingSheet] = useState([]);
  const [profitMargin, setProfitMargin] = useState('');
  const [newCostLabel, setNewCostLabel] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [accForm, setAccForm] = useState({
    name: '', category: 'Fabric', quantity: '', unit: '', unit_price: '', notes: ''
  });
  const [itemForm, setItemForm] = useState({
    style_no: '', description: '', image_url: '', fabric: ''
  });
  const [itemColors, setItemColors] = useState([]);
  const [itemSizes, setItemSizes] = useState([]);
  const [newItemColor, setNewItemColor] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
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
  const [poForm, setPoForm] = useState({
    po_number: '', po_date: '', style_no: '', description: '',
    fabric_details: '', status: 'Pending', notes: ''
  });
  const [poColorRows, setPoColorRows] = useState([{
    id: Date.now(), color: '', sizes: {}, cut_sizes: {}
  }]);
  const [poSizeNumbers, setPoSizeNumbers] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [newPoSizeNumber, setNewPoSizeNumber] = useState('');
  const [cuttingPoModalVisible, setCuttingPoModalVisible] = useState(false);
  const [cuttingPoItem, setCuttingPoItem] = useState(null);
  const [cuttingPoTarget, setCuttingPoTarget] = useState(null);

  useEffect(() => { fetchAll(); fetchCategories(); }, [activeTab]);

  useEffect(() => {
    let result = items;
    if (selectedSizes.length > 0) result = result.filter(i => i.sizes && selectedSizes.some(s => i.sizes.includes(s)));
    if (selectedColors.length > 0) result = result.filter(i => i.colors && selectedColors.some(c => i.colors.includes(c)));
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
      date: inv.issue_date, particular: inv.invoice_no,
      bil: inv.invoice_no, debit: parseFloat(inv.total || 0), credit: 0,
    }));
    const credits = payments.map(pay => ({
      date: pay.date, particular: `Payment — ${pay.account_name}`,
      bil: '', debit: 0, credit: parseFloat(pay.amount || 0),
    }));
    const all = [...debits, ...credits].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    setLedgerEntries(all.map(entry => {
      balance += entry.debit - entry.credit;
      return { ...entry, balance };
    }));
  }, [invoices, payments, activeTab]);

  const getMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  };

  const uniqueMonths = [...new Set(
    invoices.filter(i => (i.shipment_type || 'Air') === activeInvoiceTab)
      .map(i => getMonthYear(i.issue_date)).filter(Boolean)
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
        setInvoices(invRes.data.filter(i => String(i.party_id) === String(party.id)));
        setPayments(payRes.data);
      } else if (activeTab === 'Accounts') {
        const [accRes, payRes, globalRes] = await Promise.all([
          client.get(`/party-accounts/${party.id}`),
          client.get(`/party-payments/${party.id}`),
          client.get('/party-accounts/global')
        ]);
        setAccounts(accRes.data);
        setPayments(payRes.data);
        setGlobalAccounts(globalRes.data);
      } else if (activeTab === 'PO') {
        const res = await client.get(`/purchase-orders/party/${party.id}`);
        setPurchaseOrders(res.data);
      }
    } catch (err) { console.log(err.message); }
    finally { setLoading(false); }
  };

  const uniqueSizes = [...new Set(items.flatMap(i => i.sizes || []).filter(Boolean))];
  const uniqueColors = [...new Set(items.flatMap(i => i.colors || []).filter(Boolean))];
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
  const totalCost = costingSheet.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const sellingPrice = totalCost + parseFloat(profitMargin || 0);

  const formatDate = (d) => d ? d.toString().split('T')[0] : '-';
  const statusLabel = (status) => {
    if (status === 'Paid') return '✅ Paid';
    if (status === 'Partial') return '⚡ Partial';
    return '⏳ Pending';
  };

  // Costing sheet functions
  const openCostingSheet = (item) => {
    setCostingItem(item);
    const saved = item.costing_sheet;
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : (saved || []);
    if (parsed.length > 0) setCostingSheet(parsed);
    else setCostingSheet(DEFAULT_COST_ITEMS.map(i => ({ ...i, amount: '' })));
    setProfitMargin(String(item.profit_margin || ''));
    setCostingModalVisible(true);
  };

  const updateCostItem = (id, field, value) => {
    setCostingSheet(costingSheet.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addCustomCostItem = () => {
    if (!newCostLabel.trim()) return;
    setCostingSheet([...costingSheet, { id: String(Date.now()), label: newCostLabel.trim(), amount: '' }]);
    setNewCostLabel('');
  };

  const removeCostItem = (id) => setCostingSheet(costingSheet.filter(c => c.id !== id));

  const saveCostingSheet = async () => {
    try {
      await client.put(`/items/${costingItem.id}`, {
        style_no: costingItem.style_no,
        description: costingItem.description,
        colors: costingItem.colors || [],
        sizes: costingItem.sizes || [],
        image_url: costingItem.image_url || '',
        labour_price: costingItem.labour_price || 0,
        costing_sheet: costingSheet,
        profit_margin: parseFloat(profitMargin || 0),
        selling_price: sellingPrice,
        total_cost: totalCost
      });
      setCostingModalVisible(false);
      setCostingItem(null);
      fetchAll();
    } catch (err) { alert('Could not save costing sheet'); }
  };

  const printCostingSheet = () => {
    const rows = costingSheet.map(c =>
      `<tr><td>${c.label}</td><td style="text-align:right">PKR ${parseInt(c.amount || 0).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Costing Sheet — ${costingItem.style_no}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:500px;margin:0 auto}.header{background:#1e1b4b;color:#fff;padding:20px;border-radius:8px;margin-bottom:20px;text-align:center}.header h2{font-size:20px;margin-bottom:4px}.header p{font-size:13px;color:#a5b4fc}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f3f4f6;color:#374151;padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #e5e7eb}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.summary-row{display:flex;justify-content:space-between;padding:10px 12px;border-radius:6px;margin-bottom:8px}.selling-row{display:flex;justify-content:space-between;padding:16px;background:#1e1b4b;border-radius:8px;color:#fff;margin-top:8px}</style></head>
      <body>
        <div class="header"><h2> ${costingItem.style_no}</h2><p>${costingItem.description || ''} · ${party.name}</p></div>
        <table><thead><tr><th>Cost Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="summary-row" style="background:#f3f4f6"><span style="font-size:14px;font-weight:500">Total Cost</span><span style="font-size:16px;font-weight:bold;color:#1e1b4b">PKR ${totalCost.toLocaleString()}</span></div>
        <div class="summary-row" style="background:#f0fdf4"><span style="font-size:14px">Profit Margin</span><span style="font-size:15px;font-weight:600;color:#16a34a">+ PKR ${parseInt(profitMargin || 0).toLocaleString()}</span></div>
        <div class="selling-row"><div><div style="color:#a5b4fc;font-size:12px;letter-spacing:1px;margin-bottom:4px">SELLING PRICE</div></div><div style="font-size:24px;font-weight:bold">PKR ${sellingPrice.toLocaleString()}</div></div>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
  };

  // PO functions
  const addPoColorRow = () => setPoColorRows([...poColorRows, { id: Date.now() + Math.random(), color: '', sizes: {}, cut_sizes: {} }]);
  const removePoColorRow = (id) => { if (poColorRows.length === 1) return; setPoColorRows(poColorRows.filter(r => r.id !== id)); };
  const updatePoColorName = (id, value) => setPoColorRows(poColorRows.map(r => r.id === id ? { ...r, color: value } : r));
  const updatePoColorQty = (id, size, value) => {
    setPoColorRows(poColorRows.map(r => r.id === id ? { ...r, sizes: { ...r.sizes, [size]: parseInt(value) || 0 } } : r));
  };

  const addPoSizeNumber = () => {
    if (!newPoSizeNumber.trim()) return;
    if (!poSizeNumbers.includes(newPoSizeNumber.trim())) setPoSizeNumbers([...poSizeNumbers, newPoSizeNumber.trim()]);
    setNewPoSizeNumber('');
  };
  const removePoSizeNumber = (s) => setPoSizeNumbers(poSizeNumbers.filter(x => x !== s));

  const getPoRowTotal = (row) => poSizeNumbers.reduce((sum, s) => sum + (row.sizes[s] || 0), 0);
  const getPoGrandTotal = () => poColorRows.reduce((sum, r) => sum + getPoRowTotal(r), 0);
  const getPoColumnTotal = (size) => poColorRows.reduce((sum, r) => sum + (r.sizes[size] || 0), 0);

  const openCuttingPO = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      setCuttingPoTarget(full);
      const items = full.items || [];
      setCuttingPoItem(items.map(i => ({
        id: i.id,
        color: i.color || '',
        sizes: i.sizes || {},
        cut_sizes: typeof i.cut_sizes === 'string' ? JSON.parse(i.cut_sizes) : (i.cut_sizes || {})
      })));
      setCuttingPoModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const updateCuttingPoQty = (rowId, size, value) => {
    setCuttingPoItem(cuttingPoItem.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, cut_sizes: { ...row.cut_sizes, [size]: parseInt(value) || 0 } };
    }));
  };

  const saveCuttingPo = async () => {
    try {
      const items = cuttingPoItem.map(row => ({
        style_no: cuttingPoTarget.items.find(i => i.id === row.id)?.style_no || cuttingPoTarget.article_name,
        description: cuttingPoTarget.items.find(i => i.id === row.id)?.description || '',
        color: row.color,
        sizes: row.sizes,
        total_pieces: Object.values(row.sizes).reduce((s, v) => s + (v || 0), 0),
        cut_sizes: row.cut_sizes
      }));
      await client.put(`/purchase-orders/${cuttingPoTarget.id}`, {
        po_number: cuttingPoTarget.po_number,
        po_date: cuttingPoTarget.po_date ? cuttingPoTarget.po_date.toString().split('T')[0] : '',
        party_id: cuttingPoTarget.party_id,
        article_name: cuttingPoTarget.article_name,
        fabric_details: cuttingPoTarget.fabric_details,
        status: cuttingPoTarget.status,
        notes: cuttingPoTarget.notes,
        items
      });
      setCuttingPoModalVisible(false);
      fetchAll();
    } catch (err) { alert('Could not save cutting data'); }
  };

  const openEditPO = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      setEditingPO(full);
      const firstItem = (full.items && full.items[0]) || {};
      setPoForm({
        po_number: full.po_number || '',
        po_date: full.po_date ? full.po_date.toString().split('T')[0] : '',
        style_no: firstItem.style_no || full.article_name || '',
        description: firstItem.description || '',
        fabric_details: full.fabric_details || '',
        status: full.status || 'Pending',
        notes: full.notes || ''
      });
      const poItemsData = full.items || [];
      setPoColorRows(poItemsData.length > 0
        ? poItemsData.map(i => ({
            id: i.id || Date.now() + Math.random(),
            color: i.color || '',
            sizes: i.sizes || {},
            cut_sizes: typeof i.cut_sizes === 'string' ? JSON.parse(i.cut_sizes) : (i.cut_sizes || {})
          }))
        : [{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]
      );
      const allSizeNums = new Set();
      poItemsData.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(sn => allSizeNums.add(sn)); });
      setPoSizeNumbers(allSizeNums.size > 0 ? [...allSizeNums] : ['S', 'M', 'L', 'XL', 'XXL']);
      setPoModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const openViewPO = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      setViewPO(res.data);
      setViewPOModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const savePO = async () => {
    if (!poForm.po_number || !poForm.po_date) { alert('PO number and date are required'); return; }
    if (!poForm.style_no) { alert('Style number is required'); return; }
    try {
      const items = poColorRows.filter(r => r.color.trim()).map(r => ({
        style_no: poForm.style_no,
        description: poForm.description,
        color: r.color,
        sizes: r.sizes,
        total_pieces: getPoRowTotal(r),
        cut_sizes: r.cut_sizes || {}
      }));
      const payload = {
        po_number: poForm.po_number,
        po_date: poForm.po_date,
        party_id: party.id,
        article_name: poForm.style_no,
        fabric_details: poForm.fabric_details,
        status: poForm.status,
        notes: poForm.notes,
        items
      };
      if (editingPO) {
        await client.put(`/purchase-orders/${editingPO.id}`, payload);
      } else {
        await client.post('/purchase-orders', payload);
      }
      setPoModalVisible(false);
      setEditingPO(null);
      setPoForm({ po_number: '', po_date: '', style_no: '', description: '', fabric_details: '', status: 'Pending', notes: '' });
      setPoColorRows([{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]);
      setPoSizeNumbers(['S', 'M', 'L', 'XL', 'XXL']);
      fetchAll();
    } catch (err) { alert('Could not save PO'); }
  };

  const deletePO = async (id) => {
    if (window.confirm('Delete this PO?')) {
      try { await client.delete(`/purchase-orders/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete PO'); }
    }
  };

  const printPO = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      const allSizes = new Set();
      full.items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(s => allSizes.add(s)); });
      const sizes = [...allSizes];
      const rows = full.items.map(item => {
        const cutSizes = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {});
        const hasCutData = Object.values(cutSizes).some(v => v > 0);
        const orderedCells = sizes.map(s => {
          const qty = item.sizes && item.sizes[s] ? item.sizes[s] : '-';
          return `<td style="text-align:center;border:1px solid #ddd">${qty}</td>`;
        }).join('');
        const cutTotal = sizes.reduce((sum, s) => sum + (cutSizes[s] || 0), 0);
        const orderedRow = `<tr><td style="border:1px solid #ddd" rowspan="${hasCutData ? 2 : 1}">${item.color || '-'}</td><td style="border:1px solid #ddd;font-size:10px;color:#666">Ordered</td>${orderedCells}<td style="text-align:center;font-weight:bold;border:1px solid #ddd">${item.total_pieces || 0}</td></tr>`;
        if (!hasCutData) return orderedRow;
        const cutCells = sizes.map(s => {
          const qty = cutSizes[s] || 0;
          return `<td style="text-align:center;border:1px solid #ddd;background:#f0fdf4;color:#16a34a;font-weight:600">${qty}</td>`;
        }).join('');
        const cutRow = `<tr><td style="border:1px solid #ddd;font-size:10px;color:#16a34a">Cut</td>${cutCells}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#f0fdf4;color:#16a34a">${cutTotal}</td></tr>`;
        return orderedRow + cutRow;
      }).join('');
      const colTotals = sizes.map(s => {
        const total = full.items.reduce((sum, item) => sum + (item.sizes && item.sizes[s] ? item.sizes[s] : 0), 0);
        return `<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#eef2ff">${total || '-'}</td>`;
      }).join('');
      const firstItem = full.items[0] || {};
      const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
      win.document.write(`<!DOCTYPE html><html><head><title>PO — ${full.po_number}</title>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
        <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:24px;font-size:12px}.header{display:flex;align-items:center;gap:10px;margin-bottom:16px}.logo{width:40px;height:40px;object-fit:contain;background:#000;border-radius:4px;padding:2px}.header h2{font-size:18px;color:#1e1b4b}.info{margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:4px 40px}.info-row{font-size:13px}.info-row span{font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#1e1b4b;color:#fff;padding:8px;font-size:12px;border:1px solid #1e1b4b}td{padding:6px 8px;font-size:11px;border:1px solid #ddd}.total-row{margin-top:12px;text-align:right;font-size:14px;font-weight:bold;color:#1e1b4b}.notes{margin-top:8px;font-size:12px;color:#666;font-style:italic}.legend{margin-top:6px;font-size:11px;color:#666}</style></head>
        <body>
          <div class="header"><img class="logo" src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" crossorigin="anonymous"/><h2>RS APPARELS — Purchase Order</h2></div>
          <div class="info">
            <div class="info-row">PO Number: <span>${full.po_number}</span></div>
            <div class="info-row">PO Date: <span>${full.po_date ? full.po_date.toString().split('T')[0] : '-'}</span></div>
            <div class="info-row">Party: <span>${party.name}</span></div>
            <div class="info-row">Status: <span>${full.status}</span></div>
            <div class="info-row">Style No: <span>${firstItem.style_no || full.article_name || '-'}</span></div>
            <div class="info-row">Description: <span>${firstItem.description || '-'}</span></div>
            <div class="info-row">Fabric: <span>${full.fabric_details || '-'}</span></div>
          </div>
          <table>
            <thead><tr><th>Color</th><th></th>${sizes.map(s => `<th>${s}</th>`).join('')}<th>Total</th></tr></thead>
            <tbody>${rows}<tr><td colspan="2" style="font-weight:bold;background:#f3f4f6">Total Ordered</td>${colTotals}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#1e1b4b;color:#fff">${full.total_pieces || 0}</td></tr><tr><td colspan="2" style="font-weight:bold;background:#f0fdf4;color:#166534">Total Cut</td>${sizes.map(s => { const t = full.items.reduce((sum, item) => { const cs = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {}); return sum + (cs[s] || 0); }, 0); return `<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#f0fdf4;color:#16a34a">${t || '-'}</td>`; }).join('')}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#166534;color:#fff">${full.items.reduce((sum, item) => { const cs = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {}); return sum + Object.values(cs).reduce((s, v) => s + (v || 0), 0); }, 0)}</td></tr></tbody>
          </table>
          <div class="legend">Green rows show actual cut quantities (where recorded)</div>
          <div class="total-row">Total Pieces: ${full.total_pieces || 0}</div>
          ${full.notes ? `<div class="notes">Notes: ${full.notes}</div>` : ''}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 500);
            };
          </script>
        </body></html>`);
      win.document.close();
      window.focus();
    } catch (err) { alert('Could not print PO'); }
  };

  const printLedger = () => {
    const rows = ledgerEntries.map(e =>
      `<tr><td>${formatDate(e.date)}</td><td>${e.particular}</td><td>${e.bil || '-'}</td>
       <td style="text-align:right;color:${e.debit > 0 ? '#1e1b4b' : '#ccc'}">${e.debit > 0 ? 'PKR ' + e.debit.toLocaleString() : '-'}</td>
       <td style="text-align:right;color:${e.credit > 0 ? '#ef4444' : '#ccc'}">${e.credit > 0 ? 'PKR ' + e.credit.toLocaleString() : '-'}</td>
       <td style="text-align:right;font-weight:600;color:#4361ee">PKR ${e.balance.toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Ledger — ${party.name}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h2{color:#1e1b4b;text-align:center;margin-bottom:4px}h3{color:#666;text-align:center;font-size:14px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.footer{display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b}.footer-item{text-align:center;flex:1}.footer-label{color:#666;font-size:12px;margin-bottom:4px}.footer-value{font-size:18px;font-weight:bold}</style></head>
      <body><h2>${party.name}</h2><h3>Ledger Account</h3>
      <table><thead><tr><th>Date</th><th>Particular</th><th>Bill #</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">
        <div class="footer-item"><div class="footer-label">Total Debit</div><div class="footer-value" style="color:#1e1b4b">PKR ${totalDebit.toLocaleString()}</div></div>
        <div class="footer-item"><div class="footer-label">Total Credit</div><div class="footer-value" style="color:#ef4444">PKR ${totalCredit.toLocaleString()}</div></div>
        <div class="footer-item"><div class="footer-label">Balance</div><div class="footer-value" style="color:#4361ee">PKR ${finalBalance.toLocaleString()}</div></div>
      </div></body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
  };

  const printAccessories = () => {
    const data = activeFilter === 'All' ? accessories : filteredAccessories;
    const subtotalAmount = data.reduce((sum, a) => sum + (parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)), 0);
    const rows = data.map(a =>
      `<tr><td>${a.name}</td><td>${a.category}</td><td>${a.quantity} ${a.unit || ''}</td>
       <td style="text-align:right">PKR ${parseInt(a.unit_price || 0).toLocaleString()}</td>
       <td style="text-align:right">PKR ${(parseInt(a.unit_price || 0) * parseFloat(a.quantity || 0)).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Accessories</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.sub{text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b}.sub-value{font-size:20px;font-weight:bold;color:#1e1b4b}</style></head>
      <body><h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="..."/> RS APPARELS</h2> — Accessories</h2>
      <p>Party: <strong>${party.name}</strong> · Filter: ${activeFilter} · Total: ${data.length}</p>
      <table><thead><tr><th>Name</th><th>Category</th><th>Quantity</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total Price</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="sub">Subtotal: <span class="sub-value">PKR ${subtotalAmount.toLocaleString()}</span></div>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
  };

  const printItems = () => {
    const data = filteredItems;
    const rows = data.map(i =>
      `<tr><td>${i.style_no}</td><td>${i.description || '-'}</td>
       <td>${(i.colors || []).join(', ') || '-'}</td>
       <td>${(i.sizes || []).join(', ') || '-'}</td>
       <td style="text-align:right">PKR ${parseInt(i.selling_price || 0).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Items</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}</style></head>
      <body><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="..."/> RS APPARELS</h2> — Items / Styles</h2>
      <p>Party: <strong>${party.name}</strong> · Total: ${data.length}</p>
      <table><thead><tr><th>Style No</th><th>Description</th><th>Colors</th><th>Sizes</th><th style="text-align:right">Selling Price</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
  };

  const printAllInvoices = () => {
    const data = filteredInvoices;
    const totalAmt = data.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const paidAmt = data.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
    const remainAmt = totalAmt - paidAmt;
    const rows = data.map(i => {
      const rem = parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0);
      return `<tr><td>${i.invoice_no}</td><td>${i.issue_date ? i.issue_date.toString().split('T')[0] : '-'}</td>
        <td style="text-align:right">PKR ${parseInt(i.subtotal || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#16a34a">PKR ${parseInt(i.freight_charges || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#ef4444">PKR ${parseInt(i.advance || 0).toLocaleString()}</td>
        <td style="text-align:right;font-weight:bold">PKR ${parseInt(i.total || 0).toLocaleString()}</td>
        <td style="text-align:right;color:#16a34a">PKR ${parseInt(i.amount_paid || 0).toLocaleString()}</td>
        <td style="text-align:right;color:${rem > 0 ? '#ef4444' : '#16a34a'}">PKR ${rem.toLocaleString()}</td>
        <td>${statusLabel(i.status)}</td></tr>`;
    }).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoices</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:1100px;margin:0 auto}h2{color:#1e1b4b;margin-bottom:8px}p{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1e1b4b;color:#fff;padding:8px 10px;text-align:left}td{padding:8px 10px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f9fafb}.summary{margin-top:16px;padding-top:12px;border-top:2px solid #1e1b4b;display:flex;justify-content:flex-end;gap:40px}.summary-item{text-align:right}.summary-label{font-size:12px;color:#666}.summary-value{font-size:16px;font-weight:bold}</style></head>
      <body><h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="..."/> RS APPARELS</h2> — Invoices</h2>
      <p>Party: <strong>${party.name}</strong> · Total: ${data.length}</p>
      <table><thead><tr><th>Invoice #</th><th>Date</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Freight</th><th style="text-align:right">Advance</th><th style="text-align:right">Total</th><th style="text-align:right">Paid</th><th style="text-align:right">Remaining</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="summary">
        <div class="summary-item"><div class="summary-label">Total</div><div class="summary-value" style="color:#4361ee">PKR ${totalAmt.toLocaleString()}</div></div>
        <div class="summary-item"><div class="summary-label">Paid</div><div class="summary-value" style="color:#16a34a">PKR ${paidAmt.toLocaleString()}</div></div>
        <div class="summary-item"><div class="summary-label">Remaining</div><div class="summary-value" style="color:#ef4444">PKR ${remainAmt.toLocaleString()}</div></div>
      </div></body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
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
      const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_no}</title>
        <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;color:#333}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1e1b4b}.company{font-size:20px;font-weight:bold;color:#1e1b4b}.inv-title{font-size:32px;font-weight:bold;color:#4361ee}.info-row{display:flex;margin:20px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}.info-box{flex:1;padding:12px 16px;border-right:1px solid #e5e7eb}.info-box:last-child{border-right:none}.info-label{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:13px;font-weight:600;color:#1e1b4b}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.trow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6}.tlabel{color:#666;font-size:13px}.tvalue{font-size:13px;font-weight:600}.grand{border-top:2px solid #1e1b4b;border-bottom:2px solid #1e1b4b;padding:10px 0;margin:8px 0;background:#f8faff}.grand .tlabel{font-size:16px;font-weight:bold;color:#1e1b4b}.grand .tvalue{font-size:16px;font-weight:bold;color:#4361ee}</style></head>
        <body>
          <div class="header">
            <div><div class="company">RS APPARELS</div><div style="font-size:13px;color:#888;margin-top:4px">${party.name}</div></div>
            <div style="text-align:right"><div class="inv-title">${inv.invoice_no}</div><div style="font-size:14px;font-weight:600;margin-top:4px">${statusLabel(inv.status)}</div></div>
          </div>
          <div class="info-row">
            <div class="info-box"><div class="info-label">Party</div><div class="info-value">${party.name}</div></div>
            <div class="info-box"><div class="info-label">Issue Date</div><div class="info-value">${formatDate(inv.issue_date)}</div></div>
            <div class="info-box"><div class="info-label">Due Date</div><div class="info-value">${formatDate(inv.due_date)}</div></div>
            <div class="info-box"><div class="info-label">Status</div><div class="info-value">${statusLabel(inv.status)}</div></div>
          </div>
          <table>
            <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#888">No items</td></tr>'}</tbody>
          </table>
          <div>
            <div class="trow"><span class="tlabel">Subtotal</span><span class="tvalue">PKR ${parseInt(inv.subtotal || 0).toLocaleString()}</span></div>
            <div class="trow"><span class="tlabel">Freight (+)</span><span class="tvalue" style="color:#16a34a">PKR ${parseInt(inv.freight_charges || 0).toLocaleString()}</span></div>
            <div class="trow"><span class="tlabel">Advance (−)</span><span class="tvalue" style="color:#ef4444">PKR ${parseInt(inv.advance || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span class="tlabel">Total</span><span class="tvalue">PKR ${parseInt(inv.total || 0).toLocaleString()}</span></div>
            <div class="trow"><span class="tlabel">Amount Paid</span><span class="tvalue" style="color:#16a34a">PKR ${parseInt(inv.amount_paid || 0).toLocaleString()}</span></div>
            <div class="trow"><span class="tlabel" style="color:#ef4444">Remaining</span><span class="tvalue" style="color:#ef4444">PKR ${remaining.toLocaleString()}</span></div>
          </div>
        </body></html>`);
      win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100); win.print();
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
    setItemForm({ style_no: '', description: '', image_url: '', fabric: '' });
    setItemColors([]); setItemSizes([]);
    setNewItemColor(''); setNewItemSize('');
    setModalVisible(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      style_no: item.style_no || '',
      description: item.description || '',
      image_url: item.image_url || '',
      fabric: item.fabric || ''
    });
    setItemColors(item.colors || []);
    setItemSizes(item.sizes || []);
    setNewItemColor(''); setNewItemSize('');
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!itemForm.style_no) { alert('Style number is required'); return; }
    try {
      if (editingItem) {
        await client.put(`/items/${editingItem.id}`, {
          ...itemForm, colors: itemColors, sizes: itemSizes,
          fabric: itemForm.fabric || '',
          party_id: editingItem.party_id || party.id,
          costing_sheet: editingItem.costing_sheet || [],
          profit_margin: editingItem.profit_margin || 0,
          selling_price: editingItem.selling_price || 0,
          total_cost: editingItem.total_cost || 0,
          labour_price: editingItem.labour_price || 0
        });
      } else {
        await client.post('/items', {
          ...itemForm, colors: itemColors, sizes: itemSizes,
          fabric: itemForm.fabric || '',
          party_id: party.id
        });
      }
      setModalVisible(false);
      setEditingItem(null);
      fetchAll();
    } catch (err) { alert('Could not save item'); }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      try { await client.delete(`/items/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await client.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setItemForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const [pendingItem, setPendingItem] = useState(null);

const addInvItem = (item) => {
  setPendingItem({
    id: item.id,
    style_no: item.style_no,
    description: item.description,
    colors: item.colors || [],
    sizes: item.sizes || [],
    price: item.selling_price || 0,
    selectedColor: '',
    selectedSize: '',
  });
};

const confirmAddInvItem = () => {
  if (!pendingItem) return;
  const lineId = `${pendingItem.id}_${pendingItem.selectedColor}_${pendingItem.selectedSize}_${Date.now()}`;
  setSelectedInvItems([...selectedInvItems, {
    ...pendingItem,
    lineId,
    quantity: 1
  }]);
  setPendingItem(null);
};

  const removeInvItem = (lineId) => setSelectedInvItems(selectedInvItems.filter(i => i.lineId !== lineId));
  const updateInvQty = (lineId, qty) => {
    if (qty < 1) return;
    setSelectedInvItems(selectedInvItems.map(i => i.lineId === lineId ? { ...i, quantity: qty } : i));
  };
  const updateInvItemField = (lineId, field, value) => {
    setSelectedInvItems(selectedInvItems.map(i => i.lineId === lineId ? { ...i, [field]: value } : i));
  };
const saveInvoice = async () => {
  if (!invForm.invoice_no || !invForm.issue_date) { alert('Invoice number and date are required'); return; }
  const remaining = invTotal - invAmountPaid;
  let status = 'Pending';
  if (invAmountPaid >= invTotal && invTotal > 0) status = 'Paid';
  else if (invAmountPaid > 0) status = 'Partial';
  try {
    const payload = {
      ...invForm, party_id: party.id, type: 'Sale', shipment_type: 'Air',
      subtotal: invSubtotal, total: invTotal, advance: invAdvance,
      freight_charges: invFreight, amount_paid: invAmountPaid, remaining, status,
      items: selectedInvItems.map(i => ({
        description: i.selectedColor || i.selectedSize
          ? `${i.style_no}${i.selectedColor ? ' | ' + i.selectedColor : ''}${i.selectedSize ? ' | Size: ' + i.selectedSize : ''}`
          : i.style_no || i.description,
        quantity: i.quantity, unit_price: i.price
      }))
    };
    if (editingInvoice) {
      await client.put(`/invoices/${editingInvoice.id}`, {
        ...payload,
        discount: editingInvoice.discount || 0,
        tax: editingInvoice.tax || 0,
        paid: invAmountPaid,
        notes: invForm.notes
      });
    } else {
      await client.post('/invoices', payload);
    }
    setModalVisible(false);
    setEditingInvoice(null);
    setInvForm({ invoice_no: '', issue_date: '', due_date: '', advance: '0', freight_charges: '0', amount_paid: '0', status: 'Pending', notes: '', shipment_type: 'Air' });
    setSelectedInvItems([]);
    fetchAll();
  } catch (err) { alert('Could not save invoice'); }
};

  const openFullEditInvoice = async (inv) => {
  try {
    const res = await client.get(`/invoices/${inv.id}`);
    const full = res.data;
    setEditingInvoice(full);
    setInvForm({
      invoice_no: full.invoice_no || '',
      issue_date: full.issue_date ? full.issue_date.toString().split('T')[0] : '',
      due_date: full.due_date ? full.due_date.toString().split('T')[0] : '',
      advance: String(full.advance || '0'),
      freight_charges: String(full.freight_charges || '0'),
      amount_paid: String(full.amount_paid || '0'),
      status: full.status || 'Pending',
      notes: full.notes || '',
      shipment_type: full.shipment_type || 'Air'
    });
    // Load existing line items
    const lineItems = full.items || [];
    setSelectedInvItems(lineItems.map((item, idx) => ({
      lineId: `existing_${item.id}_${idx}`,
      id: idx,
      style_no: item.description || '',
      description: item.description || '',
      colors: [],
      sizes: [],
      price: parseFloat(item.unit_price || 0),
      selectedColor: '',
      selectedSize: '',
      quantity: parseFloat(item.quantity || 1)
    })));
    setModalVisible(true);
  } catch (err) {
    alert('Could not load invoice');
  }
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
        invoice_no: editingInvoice.invoice_no, type: editingInvoice.type || 'Sale',
        party_id: editingInvoice.party_id, issue_date: editingInvoice.issue_date,
        due_date: editingInvoice.due_date, subtotal: editingInvoice.subtotal,
        discount: editingInvoice.discount || 0, tax: editingInvoice.tax || 0,
        total: editingInvoice.total, paid: paid, status, notes: editingInvoice.notes,
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
      setSelectedGlobalAccounts([]);
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
        party_id: party.id, account_id: newPaymentForm.account_id,
        account_name: selectedAcc ? `${selectedAcc.account_name} — ${selectedAcc.bank_name}` : newPaymentForm.account_name,
        amount: newPaymentForm.amount, date: newPaymentForm.date, notes: newPaymentForm.notes
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

  const tabs = ['Accessories', 'Items', 'Invoices', 'Ledger', 'Accounts', 'PO'];

  return (
    <View style={styles.container}>

      <View style={styles.partyHeader}>
        <Text style={styles.partyName}>{party.name}</Text>
        <View style={[styles.badge, party.type === 'Customer' ? styles.badgeCustomer : styles.badgeSupplier]}>
          <Text style={styles.badgeText}>{party.type}</Text>
        </View>
        <Text style={styles.partyContact}>{party.contact_person} · {party.phone} · {party.city}</Text>
      </View>

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

      <View style={styles.topActions}>
        {activeTab === 'Accessories' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addBtnText}>+ Add Accessory</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.addBtn} onPress={openAddItem}>
              <Text style={styles.addBtnText}>+ Add Item</Text>
            </TouchableOpacity>
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
        {activeTab === 'PO' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => {
            setEditingPO(null);
            setPoForm({ po_number: '', po_date: '', style_no: '', description: '', fabric_details: '', status: 'Pending', notes: '' });
            setPoColorRows([{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]);
            setPoSizeNumbers(['S', 'M', 'L', 'XL', 'XXL']);
            setPoModalVisible(true);
          }}>
            <Text style={styles.addBtnText}>+ New PO</Text>
          </TouchableOpacity>
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
                {isDesktop && <Text style={[styles.th, { flex: 1.2 }]}>Supplier</Text>}
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
                    {isDesktop && <Text style={[styles.td, { flex: 1.2, color: '#666' }]}>{a.supplier_name || '-'}</Text>}
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
            <View>
              {filteredItems.length === 0
                ? <Text style={styles.empty}>No items found. Click + Add Item to create one.</Text>
                : filteredItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemCardTop}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          onClick={() => setPreviewImage(item.image_url)}
                          style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, marginRight: 12, cursor: 'pointer' }}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>👔</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.itemCardHeader}>
                          <Text style={styles.itemStyleNo}>{item.style_no}</Text>
                          {item.selling_price > 0
                            ? <View style={styles.itemPriceBadge}><Text style={styles.itemPriceBadgeText}>PKR {parseInt(item.selling_price).toLocaleString()}</Text></View>
                            : <View style={styles.itemNoPriceBadge}><Text style={styles.itemNoPriceBadgeText}>No costing yet</Text></View>
                          }
                        </View>
                        <Text style={styles.itemDesc2}>{item.description || '-'}</Text>
                        {item.fabric ? <Text style={styles.itemFabric}>🧵 {item.fabric}</Text> : null}
                        {item.colors && item.colors.length > 0 && (
                          <View style={styles.itemTagsRow}>
                            {item.colors.map((c, i) => (
                              <View key={i} style={styles.itemColorTag}><Text style={styles.itemColorTagText}>{c}</Text></View>
                            ))}
                          </View>
                        )}
                        {item.sizes && item.sizes.length > 0 && (
                          <View style={styles.itemTagsRow}>
                            {item.sizes.map((s, i) => (
                              <View key={i} style={styles.itemSizeTag}><Text style={styles.itemSizeTagText}>{s}</Text></View>
                            ))}
                          </View>
                        )}
                      </View>
                      {item.total_cost > 0 && (
                        <View style={styles.itemCostingInfo}>
                          <Text style={styles.itemCostingLabel}>Cost</Text>
                          <Text style={styles.itemCostingValue}>PKR {parseInt(item.total_cost).toLocaleString()}</Text>
                          <Text style={styles.itemCostingLabel}>Margin</Text>
                          <Text style={[styles.itemCostingValue, { color: '#16a34a' }]}>PKR {parseInt(item.profit_margin || 0).toLocaleString()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemCardActions2}>
                      <TouchableOpacity style={styles.itemCostingBtn} onPress={() => openCostingSheet(item)}>
                        <Text style={styles.itemCostingBtnText}>📊 Costing Sheet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.itemEditBtn} onPress={() => openEditItem(item)}>
                        <Text style={styles.itemEditBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.itemDelBtn} onPress={() => deleteItem(item.id)}>
                        <Text style={styles.itemDelBtnText}>🗑️</Text>
                      </TouchableOpacity>
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
                          <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.td, { fontWeight: '600' }]}>{inv.invoice_no}</Text>
                            <TouchableOpacity onPress={() => openFullEditInvoice(inv)}>
                              <Text style={{ fontSize: 14 }}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openEditPayment(inv)}>
                              <Text style={{ fontSize: 14 }}>💳</Text>
                            </TouchableOpacity>
                          </View>
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
                ? <Text style={styles.empty}>No ledger entries yet.</Text>
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
                ? <Text style={styles.empty}>No accounts yet.</Text>
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
                        <Text style={[styles.td, { flex: 1.5, color: '#ef4444', fontWeight: '600' }]}>PKR {parseInt(pay.amount || 0).toLocaleString()}</Text>
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

          {/* PO TAB */}
          {activeTab === 'PO' && (
            <View>
              {purchaseOrders.length === 0
                ? <Text style={styles.empty}>No purchase orders yet. Click + New PO to create one.</Text>
                : purchaseOrders.map((po) => (
                  <View key={po.id} style={styles.poCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.poNumber}>{po.po_number}</Text>
                      <Text style={styles.poArticle}>{po.article_name || '-'}</Text>
                      <Text style={styles.poDateText}>{po.po_date ? po.po_date.toString().split('T')[0] : '-'}</Text>
                    </View>
                    <View style={styles.poRight}>
                      <View style={[styles.poBadge,
                        po.status === 'Completed' ? styles.poCompleted :
                        po.status === 'In Progress' ? styles.poInProgress : styles.poPending]}>
                        <Text style={styles.poBadgeText}>{po.status}</Text>
                      </View>
                      <Text style={styles.poPieces}>{po.total_pieces} pcs</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <TouchableOpacity style={styles.printBtn} onPress={() => openViewPO(po)}>
                          <Text style={styles.printBtnText}>👁️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.printBtn} onPress={() => openEditPO(po)}>
                          <Text style={styles.printBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.printBtn} onPress={() => openCuttingPO(po)}>
                          <Text style={styles.printBtnText}>✂️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.printBtn} onPress={() => printPO(po)}>
                          <Text style={styles.printBtnText}>🖨️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearFilterBtn} onPress={() => deletePO(po.id)}>
                          <Text style={styles.clearFilterText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
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
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
              <ScrollView>
                <TextInput style={styles.input} placeholder="Style number * (e.g. ASM-265)"
                  value={itemForm.style_no} onChangeText={(v) => setItemForm({ ...itemForm, style_no: v })} />
                <TextInput style={styles.input} placeholder="Description"
                  value={itemForm.description} onChangeText={(v) => setItemForm({ ...itemForm, description: v })} />
                <TextInput style={styles.input} placeholder="Fabric (e.g. Wash N Wear, Khaddar)"
                  value={itemForm.fabric} onChangeText={(v) => setItemForm({ ...itemForm, fabric: v })} />

                <Text style={styles.label}>Item Image</Text>
                {itemForm.image_url ? (
                  <View style={{ marginBottom: 10 }}>
                    <img src={itemForm.image_url} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #ddd' }} />
                    <TouchableOpacity style={styles.removeImgBtn} onPress={() => setItemForm({ ...itemForm, image_url: '' })}>
                      <Text style={styles.removeImgText}>✕ Remove Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadBox}>
                    {imageUploading
                      ? <ActivityIndicator color="#4361ee" />
                      : <>
                          <Text style={styles.uploadIcon}>📷</Text>
                          <Text style={styles.uploadText}>Click to upload image</Text>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                          />
                        </>
                    }
                  </View>
                )}

                <Text style={styles.label}>Colors</Text>
                <View style={styles.itemTagsRow}>
                  {itemColors.map((c, i) => (
                    <TouchableOpacity key={i} style={styles.itemColorTag}
                      onPress={() => setItemColors(itemColors.filter((_, idx) => idx !== i))}>
                      <Text style={styles.itemColorTagText}>{c} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addTagRow}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add color (e.g. White/G)" value={newItemColor} onChangeText={setNewItemColor} />
                  <TouchableOpacity style={styles.addTagBtn}
                    onPress={() => { if (newItemColor.trim()) { setItemColors([...itemColors, newItemColor.trim()]); setNewItemColor(''); } }}>
                    <Text style={styles.addTagBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>Sizes</Text>
                <View style={styles.predefinedSizes}>
                  {['S', 'M', 'L', 'XL', 'XXL', '50', '52', '54', '56', '58', '60'].map(s => (
                    <TouchableOpacity key={s}
                      style={[styles.preSize, itemSizes.includes(s) && styles.preSizeActive]}
                      onPress={() => {
                        if (itemSizes.includes(s)) setItemSizes(itemSizes.filter(x => x !== s));
                        else setItemSizes([...itemSizes, s]);
                      }}>
                      <Text style={[styles.preSizeText, itemSizes.includes(s) && styles.preSizeTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addTagRow}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Custom size" value={newItemSize} onChangeText={setNewItemSize} />
                  <TouchableOpacity style={styles.addTagBtn}
                    onPress={() => { if (newItemSize.trim()) { setItemSizes([...itemSizes, newItemSize.trim()]); setNewItemSize(''); } }}>
                    <Text style={styles.addTagBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {itemSizes.length > 0 && (
                  <View style={[styles.itemTagsRow, { marginTop: 8 }]}>
                    {itemSizes.map((s, i) => (
                      <TouchableOpacity key={i} style={styles.itemSizeTag}
                        onPress={() => setItemSizes(itemSizes.filter((_, idx) => idx !== i))}>
                        <Text style={styles.itemSizeTagText}>{s} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>💡 After saving, open Costing Sheet to set the selling price.</Text>
                </View>
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
        <Text style={styles.modalTitle}>{editingInvoice ? '✏️ Edit Invoice' : '✈️ New Air Invoice'} — {party.name}</Text>
        <ScrollView>
          <View style={isDesktop ? { flexDirection: 'row', gap: 16, alignItems: 'flex-start' } : {}}>

            {/* LEFT — FORM */}
            <View style={isDesktop ? { flex: 1 } : {}}>

              <TextInput style={styles.input} placeholder="Invoice number *"
                value={invForm.invoice_no} onChangeText={(v) => setInvForm({ ...invForm, invoice_no: v })} />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <DatePicker label="Issue Date *" value={invForm.issue_date}
                    onChange={(v) => setInvForm({ ...invForm, issue_date: v })} />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePicker label="Due Date" value={invForm.due_date}
                    onChange={(v) => setInvForm({ ...invForm, due_date: v })} />
                </View>
              </View>

              <Text style={styles.label}>Select Items / Styles</Text>
              {allItems.length === 0
                ? <Text style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>No items for this party yet.</Text>
                : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {allItems.map((item) => (
                      <TouchableOpacity key={item.id} style={styles.styleBtn} onPress={() => addInvItem(item)}>
                        <Text style={styles.styleBtnNo}>{item.style_no}</Text>
                        <Text style={styles.styleBtnColor}>{item.description || ''}</Text>
                        <Text style={styles.styleBtnPrice}>PKR {parseInt(item.selling_price || 0).toLocaleString()}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )
              }

                            {/* PENDING ITEM PICKER */}
              {pendingItem && (
                <View style={styles.pendingItemBox}>
                  <Text style={styles.pendingItemTitle}>{pendingItem.style_no} — Select Color & Size</Text>
                  <Text style={styles.label}>Color</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {pendingItem.colors.map(c => (
                      <TouchableOpacity key={c}
                        style={[styles.invColorBtn, pendingItem.selectedColor === c && styles.invColorBtnActive]}
                        onPress={() => setPendingItem({ ...pendingItem, selectedColor: c })}>
                        <Text style={[styles.invColorBtnText, pendingItem.selectedColor === c && styles.invColorBtnTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.label}>Size</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {pendingItem.sizes.map(s => (
                      <TouchableOpacity key={s}
                        style={[styles.invSizeBtn, pendingItem.selectedSize === s && styles.invSizeBtnActive]}
                        onPress={() => setPendingItem({ ...pendingItem, selectedSize: s })}>
                        <Text style={[styles.invSizeBtnText, pendingItem.selectedSize === s && styles.invSizeBtnTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingItem(null)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={confirmAddInvItem}>
                      <Text style={styles.saveText}>+ Add Line</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* SELECTED LINE ITEMS */}
              {selectedInvItems.length > 0 && (
                <View style={styles.selectedItems}>
                  <Text style={styles.label}>Selected Items ({selectedInvItems.length} lines)</Text>
                  {selectedInvItems.map((item) => (
                    <View key={item.lineId} style={styles.selectedItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <View style={styles.lineBadge}>
                            <Text style={styles.lineBadgeText}>{item.style_no}</Text>
                          </View>
                          {item.selectedColor ? <Text style={{ fontSize: 12, color: '#4361ee' }}>{item.selectedColor}</Text> : null}
                          {item.selectedSize ? <View style={styles.sizeBadge}><Text style={styles.sizeBadgeText}>{item.selectedSize}</Text></View> : null}
                        </View>
                        <Text style={styles.selectedItemPrice}>
                          PKR {parseInt(item.price || 0).toLocaleString()} × {item.quantity} = PKR {parseInt((item.price || 0) * item.quantity).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateInvQty(item.lineId, item.quantity - 1)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.qtyInput}
                          value={String(item.quantity)}
                          onChangeText={(v) => { const num = parseInt(v); if (!isNaN(num) && num > 0) updateInvQty(item.lineId, num); }}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateInvQty(item.lineId, item.quantity + 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeInvItem(item.lineId)}>
                          <Text style={{ color: '#ef4444', marginLeft: 8 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Freight (PKR)</Text>
                  <TextInput style={styles.input} placeholder="0"
                    value={invForm.freight_charges}
                    onChangeText={(v) => setInvForm({ ...invForm, freight_charges: v })}
                    keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Advance (PKR)</Text>
                  <TextInput style={styles.input} placeholder="0"
                    value={invForm.advance}
                    onChangeText={(v) => setInvForm({ ...invForm, advance: v })}
                    keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Amount Paid (PKR)</Text>
                  <TextInput style={styles.input} placeholder="0"
                    value={invForm.amount_paid}
                    onChangeText={(v) => setInvForm({ ...invForm, amount_paid: v })}
                    keyboardType="numeric" />
                </View>
              </View>

              <TextInput style={styles.input} placeholder="Notes (optional)"
                value={invForm.notes} onChangeText={(v) => setInvForm({ ...invForm, notes: v })} />

              {/* PREVIEW on mobile — below form */}
              {!isDesktop && (
                <View style={styles.invPreviewBox}>
                  <View style={styles.invPreviewHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.invPreviewLogo}>
                        <Text style={{ color: '#d4af37', fontSize: 10, fontWeight: 'bold' }}>RS</Text>
                      </View>
                      <Text style={styles.invPreviewCompany}>RS APPARELS</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invPreviewNo}>{invForm.invoice_no || 'INV-???'}</Text>
                      <View style={[styles.invStatusBadge,
                        invAmountPaid >= invTotal && invTotal > 0 ? styles.invStatusPaid :
                        invAmountPaid > 0 ? styles.invStatusPartial : styles.invStatusPending]}>
                        <Text style={styles.invStatusText}>
                          {invAmountPaid >= invTotal && invTotal > 0 ? 'Paid' :
                           invAmountPaid > 0 ? 'Partial' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.invPreviewInfoRow}>
                    <View style={styles.invPreviewInfoBox}>
                      <Text style={styles.invPreviewInfoLabel}>PARTY</Text>
                      <Text style={styles.invPreviewInfoValue}>{party.name}</Text>
                    </View>
                    <View style={styles.invPreviewInfoBox}>
                      <Text style={styles.invPreviewInfoLabel}>DATE</Text>
                      <Text style={styles.invPreviewInfoValue}>
                        {invForm.issue_date ? invForm.issue_date.split('-').reverse().join('/') : '—'}
                      </Text>
                    </View>
                    <View style={styles.invPreviewInfoBox}>
                      <Text style={styles.invPreviewInfoLabel}>DUE</Text>
                      <Text style={styles.invPreviewInfoValue}>
                        {invForm.due_date ? invForm.due_date.split('-').reverse().join('/') : '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.invPreviewTable}>
                    <View style={styles.invPreviewTableHeader}>
                      <Text style={[styles.invPreviewTh, { flex: 2 }]}>Description</Text>
                      <Text style={[styles.invPreviewTh, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.invPreviewTh, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                    </View>
                    {selectedInvItems.length === 0
                      ? <Text style={{ textAlign: 'center', color: '#888', fontSize: 12, padding: 12 }}>No items added yet</Text>
                      : selectedInvItems.map((item, i) => (
                        <View key={item.id} style={[styles.invPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                          <Text style={[styles.invPreviewTd, { flex: 2 }]}>
                            {item.style_no}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}
                          </Text>
                          <Text style={[styles.invPreviewTd, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
                          <Text style={[styles.invPreviewTd, { flex: 1, textAlign: 'right', color: '#4361ee' }]}>
                            PKR {parseInt((item.price || 0) * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    }
                  </View>
                  <View style={styles.invPreviewSummary}>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={styles.invPreviewSummaryLabel}>Subtotal</Text>
                      <Text style={styles.invPreviewSummaryValue}>PKR {invSubtotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={[styles.invPreviewSummaryLabel, { color: '#16a34a' }]}>Freight +</Text>
                      <Text style={[styles.invPreviewSummaryValue, { color: '#16a34a' }]}>PKR {parseFloat(invForm.freight_charges || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={[styles.invPreviewSummaryLabel, { color: '#ef4444' }]}>Advance −</Text>
                      <Text style={[styles.invPreviewSummaryValue, { color: '#ef4444' }]}>PKR {parseFloat(invForm.advance || 0).toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.invPreviewTotalBox}>
                    <Text style={styles.invPreviewTotalLabel}>TOTAL</Text>
                    <Text style={styles.invPreviewTotalValue}>PKR {invTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.invPreviewPaidRow}>
                    <Text style={{ fontSize: 12, color: '#16a34a' }}>Paid: PKR {parseFloat(invForm.amount_paid || 0).toLocaleString()}</Text>
                    <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Remaining: PKR {invRemaining.toLocaleString()}</Text>
                  </View>
                  <View style={styles.invLiveBadge}>
                    <View style={styles.invLiveDot} />
                    <Text style={{ fontSize: 10, color: '#16a34a' }}>Live preview</Text>
                  </View>
                </View>
              )}

            </View>

            {/* RIGHT — PREVIEW on desktop */}
            {isDesktop && (
              <View style={{ width: 360 }}>
                <Text style={[styles.label, { marginBottom: 8 }]}>
                  <View style={styles.invLiveBadge}>
                    <View style={styles.invLiveDot} />
                    <Text style={{ fontSize: 10, color: '#16a34a' }}>Live preview</Text>
                  </View>
                </Text>
                <View style={styles.invPreviewBox}>
                  <View style={styles.invPreviewHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.invPreviewLogo}>
                        <Text style={{ color: '#d4af37', fontSize: 10, fontWeight: 'bold' }}>RS</Text>
                      </View>
                      <Text style={styles.invPreviewCompany}>RS APPARELS</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invPreviewNo}>{invForm.invoice_no || 'INV-???'}</Text>
                      <View style={[styles.invStatusBadge,
                        invAmountPaid >= invTotal && invTotal > 0 ? styles.invStatusPaid :
                        invAmountPaid > 0 ? styles.invStatusPartial : styles.invStatusPending]}>
                        <Text style={styles.invStatusText}>
                          {invAmountPaid >= invTotal && invTotal > 0 ? 'Paid' :
                           invAmountPaid > 0 ? 'Partial' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.invPreviewInfoRow}>
                    <View style={styles.invPreviewInfoBox}>
                      <Text style={styles.invPreviewInfoLabel}>PARTY</Text>
                      <Text style={styles.invPreviewInfoValue} numberOfLines={1}>{party.name}</Text>
                    </View>
                    <View style={styles.invPreviewInfoBox}>
                      <Text style={styles.invPreviewInfoLabel}>DATE</Text>
                      <Text style={styles.invPreviewInfoValue}>
                        {invForm.issue_date ? invForm.issue_date.split('-').reverse().join('/') : '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.invPreviewTable}>
                    <View style={styles.invPreviewTableHeader}>
                      <Text style={[styles.invPreviewTh, { flex: 2 }]}>Description</Text>
                      <Text style={[styles.invPreviewTh, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.invPreviewTh, { flex: 1, textAlign: 'right' }]}>Amt</Text>
                    </View>
                    {selectedInvItems.length === 0
                      ? <Text style={{ textAlign: 'center', color: '#888', fontSize: 11, padding: 10 }}>No items yet</Text>
                      : selectedInvItems.map((item, i) => (
                        <View key={item.id} style={[styles.invPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                          <Text style={[styles.invPreviewTd, { flex: 2 }]} numberOfLines={1}>
                            {item.style_no}{item.selectedColor ? ` · ${item.selectedColor}` : ''}
                          </Text>
                          <Text style={[styles.invPreviewTd, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
                          <Text style={[styles.invPreviewTd, { flex: 1, textAlign: 'right', color: '#4361ee' }]}>
                            {parseInt((item.price || 0) * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    }
                  </View>
                  <View style={styles.invPreviewSummary}>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={styles.invPreviewSummaryLabel}>Subtotal</Text>
                      <Text style={styles.invPreviewSummaryValue}>PKR {invSubtotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={[styles.invPreviewSummaryLabel, { color: '#16a34a' }]}>Freight +</Text>
                      <Text style={[styles.invPreviewSummaryValue, { color: '#16a34a' }]}>PKR {parseFloat(invForm.freight_charges || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.invPreviewSummaryRow}>
                      <Text style={[styles.invPreviewSummaryLabel, { color: '#ef4444' }]}>Advance −</Text>
                      <Text style={[styles.invPreviewSummaryValue, { color: '#ef4444' }]}>PKR {parseFloat(invForm.advance || 0).toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.invPreviewTotalBox}>
                    <Text style={styles.invPreviewTotalLabel}>TOTAL</Text>
                    <Text style={styles.invPreviewTotalValue}>PKR {invTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.invPreviewPaidRow}>
                    <Text style={{ fontSize: 11, color: '#16a34a' }}>Paid: PKR {parseFloat(invForm.amount_paid || 0).toLocaleString()}</Text>
                    <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>Left: PKR {invRemaining.toLocaleString()}</Text>
                  </View>
                  {invForm.notes ? (
                    <Text style={{ fontSize: 10, color: '#888', padding: 8, borderTopWidth: 0.5, borderTopColor: '#e5e7eb' }}>
                      {invForm.notes}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}

          </View>
        </ScrollView>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setSelectedInvItems([]); setEditingInvoice(null); }}>
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
            {globalAccounts.length > 0 && (
              <>
                <Text style={styles.label}>Quick Add from Existing Accounts</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {globalAccounts.map((acc, i) => {
                    const isSelected = selectedGlobalAccounts.some(
                      a => a.account_no === acc.account_no
                    );
                    return (
                      <TouchableOpacity key={i}
                        style={[styles.catBtn, isSelected && styles.catBtnActive]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedGlobalAccounts(selectedGlobalAccounts.filter(
                              a => a.account_no !== acc.account_no
                            ));
                          } else {
                            setSelectedGlobalAccounts([...selectedGlobalAccounts, acc]);
                          }
                        }}>
                        <Text style={[styles.catBtnText, isSelected && styles.catBtnTextActive]}>
                          {isSelected ? '✓ ' : ''}{acc.account_name}
                        </Text>
                        <Text style={{ fontSize: 10, color: isSelected ? '#fff' : '#888' }}>
                          {acc.bank_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedGlobalAccounts.length > 0 && (
                  <TouchableOpacity
                    style={[styles.saveBtn, { marginBottom: 10 }]}
                    onPress={async () => {
                      try {
                        await Promise.all(selectedGlobalAccounts.map(acc =>
                          client.post('/party-accounts', {
                            party_id: party.id,
                            account_name: acc.account_name,
                            bank_name: acc.bank_name,
                            account_no: acc.account_no
                          })
                        ));
                        setSelectedGlobalAccounts([]);
                        setAccountModalVisible(false);
                        fetchAll();
                      } catch (err) { alert('Could not add accounts'); }
                    }}>
                    <Text style={styles.saveText}>+ Add {selectedGlobalAccounts.length} Selected Account{selectedGlobalAccounts.length > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                )}
                <Text style={[styles.label, { marginTop: 4 }]}>Or Add New Account</Text>
              </>
            )}
            <TextInput style={styles.input} placeholder="Account name *"
              value={accountForm.account_name}
              onChangeText={(v) => setAccountForm({ ...accountForm, account_name: v })} />
            <TextInput style={styles.input} placeholder="Bank name *"
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
              ? <Text style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>No accounts yet.</Text>
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

      {/* COSTING SHEET MODAL */}
      <Modal visible={costingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>📊 Costing Sheet — {costingItem?.style_no}</Text>
            <Text style={styles.modalSub}>{costingItem?.description} · {party.name}</Text>
            <ScrollView>
              <View style={styles.costingTable}>
                <View style={styles.costingTableHeader}>
                  <Text style={[styles.costingTh, { flex: 2 }]}>Cost Item</Text>
                  <Text style={[styles.costingTh, { flex: 1, textAlign: 'right' }]}>Amount (PKR)</Text>
                  <Text style={[styles.costingTh, { width: 30 }]}></Text>
                </View>
                {costingSheet.map((item) => (
                  <View key={item.id} style={styles.costingRow}>
                    <TextInput style={[styles.costingLabelInput, { flex: 2 }]}
                      value={item.label} onChangeText={(v) => updateCostItem(item.id, 'label', v)}
                      placeholder="Cost item name" />
                    <TextInput style={[styles.costingAmountInput, { flex: 1 }]}
                      value={String(item.amount)} onChangeText={(v) => updateCostItem(item.id, 'amount', v)}
                      keyboardType="numeric" placeholder="0" />
                    <TouchableOpacity style={{ width: 30, alignItems: 'center' }} onPress={() => removeCostItem(item.id)}>
                      <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addTagRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Add custom cost item (e.g. Embroidery)"
                  value={newCostLabel} onChangeText={setNewCostLabel} />
                <TouchableOpacity style={styles.addTagBtn} onPress={addCustomCostItem}>
                  <Text style={styles.addTagBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.costingSummary}>
                <View style={styles.costingSummaryRow}>
                  <Text style={styles.costingSummaryLabel}>Total Cost</Text>
                  <Text style={styles.costingSummaryValue}>PKR {totalCost.toLocaleString()}</Text>
                </View>
                <View style={[styles.costingSummaryRow, { marginTop: 10 }]}>
                  <Text style={styles.costingSummaryLabel}>Profit Margin (PKR)</Text>
                  <View style={styles.profitInputRow}>
                    <Text style={styles.pKRLabel}>PKR</Text>
                    <TextInput style={styles.profitInput}
                      value={String(profitMargin)} onChangeText={setProfitMargin}
                      keyboardType="numeric" placeholder="0" />
                  </View>
                </View>
                {totalCost > 0 && parseFloat(profitMargin || 0) > 0 && (
                  <Text style={styles.marginPercent}>
                    {((parseFloat(profitMargin || 0) / totalCost) * 100).toFixed(1)}% profit margin
                  </Text>
                )}
              </View>
              <View style={styles.sellingPriceBox}>
                <View>
                  <Text style={styles.sellingPriceLabel}>SELLING PRICE</Text>
                  <Text style={styles.sellingPriceSub}>PKR {totalCost.toLocaleString()} + PKR {parseInt(profitMargin || 0).toLocaleString()}</Text>
                </View>
                <Text style={styles.sellingPriceValue}>PKR {sellingPrice.toLocaleString()}</Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCostingModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16a34a', flex: 0.6 }]} onPress={printCostingSheet}>
                <Text style={styles.saveText}>🖨️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCostingSheet}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PO MODAL */}
      <Modal visible={poModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>{editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}</Text>
            <ScrollView>
              <View style={isDesktop ? { flexDirection: 'row', gap: 16, alignItems: 'flex-start' } : {}}>

                <View style={isDesktop ? { flex: 1 } : {}}>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="PO Number * (e.g. PO-001)"
                      value={poForm.po_number} onChangeText={(v) => setPoForm({ ...poForm, po_number: v })} />
                    <View style={{ flex: 1 }}>
                      <DatePicker label="" value={poForm.po_date}
                        onChange={(v) => setPoForm({ ...poForm, po_date: v })} />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Style No * (e.g. ASM-265)"
                      value={poForm.style_no} onChangeText={(v) => setPoForm({ ...poForm, style_no: v })} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Description"
                      value={poForm.description} onChangeText={(v) => setPoForm({ ...poForm, description: v })} />
                  </View>
                  <TextInput style={styles.input} placeholder="Fabric details"
                    value={poForm.fabric_details} onChangeText={(v) => setPoForm({ ...poForm, fabric_details: v })} />

                  <Text style={styles.label}>Status</Text>
                  <View style={styles.typeRow}>
                    {['Pending', 'In Progress', 'Completed'].map(s => (
                      <TouchableOpacity key={s}
                        style={[styles.typeBtn, poForm.status === s && styles.typeBtnActive]}
                        onPress={() => setPoForm({ ...poForm, status: s })}>
                        <Text style={[styles.typeBtnText, poForm.status === s && styles.typeBtnTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { marginTop: 8 }]}>Sizes</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {poSizeNumbers.map(s => (
                      <View key={s} style={styles.sizeNumberTag}>
                        <Text style={styles.sizeNumberText}>{s}</Text>
                        <TouchableOpacity onPress={() => removePoSizeNumber(s)}>
                          <Text style={styles.sizeNumberRemove}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Add size (e.g. XXXL or 52)"
                      value={newPoSizeNumber} onChangeText={setNewPoSizeNumber} />
                    <TouchableOpacity style={styles.addCategoryBtn} onPress={addPoSizeNumber}>
                      <Text style={styles.addCategoryBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { marginTop: 8 }]}>Quantities by Color & Size</Text>
                  <View style={styles.colorGridBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#1e1b4b' }]}>
                            <Text style={styles.gridHeaderText}>Color</Text>
                          </View>
                          {poSizeNumbers.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#2d2a6e' }]}>
                              <Text style={styles.gridHeaderText}>{ss}</Text>
                            </View>
                          ))}
                          <View style={styles.gridTotalCell}>
                            <Text style={styles.gridTotalHeader}>Total</Text>
                          </View>
                          <View style={{ width: 30 }} />
                        </View>
                        {poColorRows.map((row) => (
                          <View key={row.id} style={styles.gridRow}>
                            <View style={styles.gridColorInputCell}>
                              <TextInput
                                style={styles.gridColorInput}
                                value={row.color}
                                onChangeText={(v) => updatePoColorName(row.id, v)}
                                placeholder="Color"
                              />
                            </View>
                            {poSizeNumbers.map(ss => (
                              <View key={ss} style={styles.gridCell}>
                                <TextInput
                                  style={styles.gridInput}
                                  value={row.sizes[ss] ? String(row.sizes[ss]) : ''}
                                  onChangeText={(v) => updatePoColorQty(row.id, ss, v)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            ))}
                            <View style={styles.gridTotalCell}>
                              <Text style={styles.gridTotalText}>{getPoRowTotal(row)}</Text>
                            </View>
                            <TouchableOpacity style={{ width: 30, alignItems: 'center' }} onPress={() => removePoColorRow(row.id)}>
                              <Text style={{ color: '#ef4444', fontSize: 14 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#f3f4f6' }]}>
                            <Text style={[styles.gridLabelText, { color: '#374151' }]}>Total</Text>
                          </View>
                          {poSizeNumbers.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#eef2ff' }]}>
                              <Text style={styles.gridTotalText}>{getPoColumnTotal(ss) || '-'}</Text>
                            </View>
                          ))}
                          <View style={[styles.gridTotalCell, { backgroundColor: '#1e1b4b' }]}>
                            <Text style={[styles.gridTotalText, { color: '#fff' }]}>{getPoGrandTotal()}</Text>
                          </View>
                          <View style={{ width: 30 }} />
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                  <TouchableOpacity style={styles.addColorBtn} onPress={addPoColorRow}>
                    <Text style={styles.addColorBtnText}>+ Add Color</Text>
                  </TouchableOpacity>

                  <TextInput style={styles.input} placeholder="Notes"
                    value={poForm.notes} onChangeText={(v) => setPoForm({ ...poForm, notes: v })} />

                  {!isDesktop && (
                    <View style={styles.poPreviewBox}>
                      <View style={styles.poPreviewHeader}>
                        <View style={styles.poPreviewLogo}><Text style={{ color: '#d4af37', fontSize: 10, fontWeight: 'bold' }}>RS</Text></View>
                        <Text style={styles.poPreviewTitle}>RS APPARELS — Purchase Order</Text>
                      </View>
                      <View style={styles.poPreviewInfo}>
                        <Text style={styles.poPreviewInfoText}>PO: <Text style={styles.poPreviewInfoBold}>{poForm.po_number || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Date: <Text style={styles.poPreviewInfoBold}>{poForm.po_date ? poForm.po_date.split('-').reverse().join('/') : '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Party: <Text style={styles.poPreviewInfoBold}>{party.name}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Style: <Text style={styles.poPreviewInfoBold}>{poForm.style_no || '—'}</Text></Text>
                      </View>
                      <View style={styles.poPreviewTable}>
                        <View style={styles.poPreviewTableHeader}>
                          <Text style={[styles.poPreviewTh, { flex: 1.2 }]}>Color</Text>
                          {poSizeNumbers.map(s => <Text key={s} style={[styles.poPreviewTh, { flex: 0.7, textAlign: 'center' }]}>{s}</Text>)}
                          <Text style={[styles.poPreviewTh, { flex: 0.8, textAlign: 'center' }]}>Tot</Text>
                        </View>
                        {poColorRows.filter(r => r.color).map((row, i) => (
                          <View key={row.id} style={[styles.poPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                            <Text style={[styles.poPreviewTd, { flex: 1.2 }]}>{row.color}</Text>
                            {poSizeNumbers.map(s => <Text key={s} style={[styles.poPreviewTd, { flex: 0.7, textAlign: 'center' }]}>{row.sizes[s] || '-'}</Text>)}
                            <Text style={[styles.poPreviewTd, { flex: 0.8, textAlign: 'center', color: '#4361ee', fontWeight: '600' }]}>{getPoRowTotal(row)}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.poPreviewTotalBox}>
                        <Text style={styles.poPreviewTotalLabel}>TOTAL PIECES</Text>
                        <Text style={styles.poPreviewTotalValue}>{getPoGrandTotal()}</Text>
                      </View>
                    </View>
                  )}

                </View>

                {isDesktop && (
                  <View style={{ width: 380 }}>
                    <View style={styles.invLiveBadge}>
                      <View style={styles.invLiveDot} />
                      <Text style={{ fontSize: 10, color: '#16a34a' }}>Live preview</Text>
                    </View>
                    <View style={styles.poPreviewBox}>
                      <View style={styles.poPreviewHeader}>
                        <View style={styles.poPreviewLogo}><Text style={{ color: '#d4af37', fontSize: 10, fontWeight: 'bold' }}>RS</Text></View>
                        <Text style={styles.poPreviewTitle}>RS APPARELS — Purchase Order</Text>
                      </View>
                      <View style={styles.poPreviewInfo}>
                        <Text style={styles.poPreviewInfoText}>PO: <Text style={styles.poPreviewInfoBold}>{poForm.po_number || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Date: <Text style={styles.poPreviewInfoBold}>{poForm.po_date ? poForm.po_date.split('-').reverse().join('/') : '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Party: <Text style={styles.poPreviewInfoBold}>{party.name}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Style: <Text style={styles.poPreviewInfoBold}>{poForm.style_no || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Desc: <Text style={styles.poPreviewInfoBold}>{poForm.description || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Fabric: <Text style={styles.poPreviewInfoBold}>{poForm.fabric_details || '—'}</Text></Text>
                      </View>
                      <View style={styles.poPreviewTable}>
                        <View style={styles.poPreviewTableHeader}>
                          <Text style={[styles.poPreviewTh, { flex: 1.2 }]}>Color</Text>
                          {poSizeNumbers.map(s => <Text key={s} style={[styles.poPreviewTh, { flex: 0.7, textAlign: 'center' }]}>{s}</Text>)}
                          <Text style={[styles.poPreviewTh, { flex: 0.8, textAlign: 'center' }]}>Tot</Text>
                        </View>
                        {poColorRows.filter(r => r.color).length === 0
                          ? <Text style={{ textAlign: 'center', color: '#888', fontSize: 11, padding: 10 }}>No colors added yet</Text>
                          : poColorRows.filter(r => r.color).map((row, i) => (
                            <View key={row.id} style={[styles.poPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                              <Text style={[styles.poPreviewTd, { flex: 1.2 }]}>{row.color}</Text>
                              {poSizeNumbers.map(s => <Text key={s} style={[styles.poPreviewTd, { flex: 0.7, textAlign: 'center' }]}>{row.sizes[s] || '-'}</Text>)}
                              <Text style={[styles.poPreviewTd, { flex: 0.8, textAlign: 'center', color: '#4361ee', fontWeight: '600' }]}>{getPoRowTotal(row)}</Text>
                            </View>
                          ))
                        }
                      </View>
                      <View style={styles.poPreviewTotalBox}>
                        <Text style={styles.poPreviewTotalLabel}>TOTAL PIECES</Text>
                        <Text style={styles.poPreviewTotalValue}>{getPoGrandTotal()}</Text>
                      </View>
                      {poForm.notes ? (
                        <Text style={{ fontSize: 10, color: '#888', padding: 8, borderTopWidth: 0.5, borderTopColor: '#e5e7eb' }}>{poForm.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                )}

              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPoModalVisible(false); setEditingPO(null); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePO}>
                <Text style={styles.saveText}>{editingPO ? 'Update PO' : 'Save PO'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUTTING PO MODAL */}
      <Modal visible={cuttingPoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>✂️ Cutting Status — {cuttingPoTarget?.po_number}</Text>
            <Text style={styles.modalSub}>Compare ordered quantities with actual cut quantities</Text>
            <ScrollView>
              {cuttingPoItem && cuttingPoItem.map((row) => {
                const rowSizes = Object.keys(row.sizes);
                const orderedTotal = rowSizes.reduce((s, sz) => s + (row.sizes[sz] || 0), 0);
                const cutTotal = rowSizes.reduce((s, sz) => s + (row.cut_sizes[sz] || 0), 0);
                return (
                  <View key={row.id} style={styles.cuttingColorBox}>
                    <View style={styles.cuttingColorHeader}>
                      <Text style={styles.cuttingColorName}>{row.color}</Text>
                      <Text style={[styles.cuttingColorDiff, cutTotal >= orderedTotal ? { color: '#16a34a' } : { color: '#ef4444' }]}>
                        {cutTotal} / {orderedTotal} cut
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#1e1b4b', width: 70 }]}>
                            <Text style={styles.gridHeaderText}>Size</Text>
                          </View>
                          {rowSizes.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#2d2a6e' }]}>
                              <Text style={styles.gridHeaderText}>{ss}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#eef2ff', width: 70 }]}>
                            <Text style={[styles.gridLabelText, { color: '#4361ee' }]}>Ordered</Text>
                          </View>
                          {rowSizes.map(ss => (
                            <View key={ss} style={styles.gridCell}>
                              <Text style={styles.gridValueText}>{row.sizes[ss] || 0}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#f0fdf4', width: 70 }]}>
                            <Text style={[styles.gridLabelText, { color: '#16a34a' }]}>Cut</Text>
                          </View>
                          {rowSizes.map(ss => (
                            <View key={ss} style={styles.gridCell}>
                              <TextInput
                                style={styles.gridInput}
                                value={row.cut_sizes[ss] ? String(row.cut_sizes[ss]) : ''}
                                onChangeText={(v) => updateCuttingPoQty(row.id, ss, v)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                          ))}
                        </View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#fef3c7', width: 70 }]}>
                            <Text style={[styles.gridLabelText, { color: '#92400e' }]}>Remain</Text>
                          </View>
                          {rowSizes.map(ss => {
                            const remain = (row.sizes[ss] || 0) - (row.cut_sizes[ss] || 0);
                            return (
                              <View key={ss} style={styles.gridCell}>
                                <Text style={[styles.gridValueText, { color: remain > 0 ? '#ef4444' : '#16a34a' }]}>{remain}</Text>
                              </View>
                            );
                          })}
                        </View>
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#1e1b4b', width: 70 }]}>
                            <Text style={styles.gridHeaderText}>Total</Text>
                          </View>
                          {rowSizes.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#eef2ff' }]}>
                              <Text style={styles.gridTotalText}>{row.sizes[ss] || 0}/{row.cut_sizes[ss] || 0}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </ScrollView>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, gap: 12 }}>
                      <Text style={{ fontSize: 12, color: '#4361ee', fontWeight: '600' }}>Ordered: {orderedTotal}</Text>
                      <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>Cut: {cutTotal}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCuttingPoModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCuttingPo}>
                <Text style={styles.saveText}>Save Cutting Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW PO MODAL */}
      <Modal visible={viewPOModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            {viewPO && (
              <>
                <Text style={styles.modalTitle}>📋 {viewPO.po_number}</Text>
                <ScrollView>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, backgroundColor: '#f8faff', borderRadius: 10, padding: 12 }}>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>PO DATE</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e1b4b' }}>{viewPO.po_date ? viewPO.po_date.toString().split('T')[0] : '-'}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>STATUS</Text>
                      <View style={[styles.poBadge, viewPO.status === 'Completed' ? styles.poCompleted : viewPO.status === 'In Progress' ? styles.poInProgress : styles.poPending]}>
                        <Text style={styles.poBadgeText}>{viewPO.status}</Text>
                      </View>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>ARTICLE</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e1b4b' }}>{viewPO.article_name || '-'}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>FABRIC</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e1b4b' }}>{viewPO.fabric_details || '-'}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>TOTAL PIECES</Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4361ee' }}>{viewPO.total_pieces}</Text>
                    </View>
                  </View>
                  {viewPO.items && viewPO.items.length > 0 && (() => {
                    const allSizes = new Set();
                    viewPO.items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(s => allSizes.add(s)); });
                    const vSizes = [...allSizes];
                    return (
                      <View style={{ marginBottom: 10 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View>
                            <View style={styles.gridRow}>
                              <View style={[styles.gridColorCell, { backgroundColor: '#1e1b4b' }]}>
                                <Text style={styles.gridHeaderText}>Color</Text>
                              </View>
                              {vSizes.map(ss => (
                                <View key={ss} style={[styles.gridCell, { backgroundColor: '#2d2a6e' }]}>
                                  <Text style={styles.gridHeaderText}>{ss}</Text>
                                </View>
                              ))}
                              <View style={styles.gridTotalCell}>
                                <Text style={styles.gridTotalHeader}>Total</Text>
                              </View>
                            </View>
                            {viewPO.items.map((item, idx) => (
                              <View key={idx} style={styles.gridRow}>
                                <View style={styles.gridColorCell}>
                                  <Text style={styles.gridValueText}>{item.color || '-'}</Text>
                                </View>
                                {vSizes.map(ss => (
                                  <View key={ss} style={styles.gridCell}>
                                    <Text style={styles.gridValueText}>{item.sizes && item.sizes[ss] ? item.sizes[ss] : '-'}</Text>
                                  </View>
                                ))}
                                <View style={styles.gridTotalCell}>
                                  <Text style={styles.gridTotalText}>{item.total_pieces || 0}</Text>
                                </View>
                              </View>
                            ))}
                            <View style={styles.gridRow}>
                              <View style={[styles.gridColorCell, { backgroundColor: '#f3f4f6' }]}>
                                <Text style={[styles.gridLabelText, { color: '#374151' }]}>Total</Text>
                              </View>
                              {vSizes.map(ss => {
                                const colTotal = viewPO.items.reduce((sum, item) => sum + (item.sizes && item.sizes[ss] ? item.sizes[ss] : 0), 0);
                                return (
                                  <View key={ss} style={[styles.gridCell, { backgroundColor: '#eef2ff' }]}>
                                    <Text style={styles.gridTotalText}>{colTotal || '-'}</Text>
                                  </View>
                                );
                              })}
                              <View style={[styles.gridTotalCell, { backgroundColor: '#1e1b4b' }]}>
                                <Text style={[styles.gridTotalText, { color: '#fff' }]}>{viewPO.total_pieces || 0}</Text>
                              </View>
                            </View>
                          </View>
                        </ScrollView>
                      </View>
                    );
                  })()}
                  {viewPO.notes && (
                    <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>Notes:</Text>
                      <Text style={{ fontSize: 13, color: '#92400e' }}>{viewPO.notes}</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setViewPOModalVisible(false)}>
                    <Text style={styles.cancelText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={() => printPO(viewPO)}>
                    <Text style={styles.saveText}>🖨️ Print</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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

    {/* IMAGE PREVIEW MODAL */}
      <Modal visible={!!previewImage} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setPreviewImage(null)}>
          {previewImage && (
            <img src={previewImage} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} />
          )}
          <Text style={{ color: '#fff', marginTop: 16, fontSize: 13 }}>Tap anywhere to close</Text>
        </TouchableOpacity>
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
  // Item card styles
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  itemCardTop: { flexDirection: 'row', marginBottom: 12 },
  itemCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
  itemStyleNo: { fontSize: 17, fontWeight: '700', color: '#1e1b4b' },
  itemPriceBadge: { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  itemPriceBadgeText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
  itemNoPriceBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  itemNoPriceBadgeText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  itemDesc2: { fontSize: 13, color: '#666', marginBottom: 2 },
  itemFabric: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  imagePlaceholder: { width: 70, height: 70, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  imagePlaceholderText: { fontSize: 28 },
  uploadBox: { borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 10, position: 'relative', backgroundColor: '#f8faff' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, color: '#6366f1' },
  removeImgBtn: { backgroundColor: '#fee2e2', borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 6 },
  removeImgText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  itemTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  itemColorTag: { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  itemColorTagText: { fontSize: 11, color: '#4361ee', fontWeight: '500' },
  itemSizeTag: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  itemSizeTagText: { fontSize: 11, color: '#374151', fontWeight: '500' },
  itemCostingInfo: { alignItems: 'flex-end', gap: 2, paddingLeft: 12 },
  itemCostingLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemCostingValue: { fontSize: 13, fontWeight: '600', color: '#1e1b4b' },
  itemCardActions2: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  itemCostingBtn: { backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#c7d2fe' },
  itemCostingBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  itemEditBtn: { backgroundColor: '#fef3c7', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  itemEditBtnText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
  itemDelBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  itemDelBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  // Add/edit item modal styles
  addTagRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  addTagBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  addTagBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  predefinedSizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  preSize: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  preSizeActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  preSizeText: { fontSize: 13, color: '#444', fontWeight: '500' },
  preSizeTextActive: { color: '#fff' },
  uploadBox: { borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 10, position: 'relative', backgroundColor: '#f8faff' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, color: '#6366f1' },
  removeImgBtn: { backgroundColor: '#fee2e2', borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 6 },
  removeImgText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  // Costing sheet styles
  costingTable: { backgroundColor: '#f8faff', borderRadius: 10, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  costingTableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 10, paddingHorizontal: 12 },
  costingTh: { color: '#fff', fontWeight: '600', fontSize: 12 },
  costingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  costingLabelInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8, fontSize: 13, backgroundColor: '#fff' },
  costingAmountInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8, fontSize: 13, backgroundColor: '#fff', textAlign: 'right' },
  costingSummary: { backgroundColor: '#f8faff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  costingSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costingSummaryLabel: { fontSize: 14, color: '#444', fontWeight: '500' },
  costingSummaryValue: { fontSize: 16, fontWeight: '700', color: '#1e1b4b' },
  profitInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pKRLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  profitInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14, width: 120, textAlign: 'right', backgroundColor: '#fff' },
  marginPercent: { fontSize: 12, color: '#16a34a', fontWeight: '600', textAlign: 'right', marginTop: 6 },
  sellingPriceBox: { backgroundColor: '#1e1b4b', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sellingPriceLabel: { fontSize: 13, color: '#a5b4fc', fontWeight: '600', letterSpacing: 1 },
  sellingPriceSub: { fontSize: 11, color: '#6366f1', marginTop: 3 },
  sellingPriceValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  // PO styles
  poCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  poNumber: { fontSize: 15, fontWeight: 'bold', color: '#1e1b4b' },
  poArticle: { fontSize: 12, color: '#666', marginTop: 2 },
  poDateText: { fontSize: 11, color: '#888', marginTop: 2 },
  poRight: { alignItems: 'flex-end' },
  poBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  poCompleted: { backgroundColor: '#d1fae5' },
  poInProgress: { backgroundColor: '#fef3c7' },
  poPending: { backgroundColor: '#fee2e2' },
  poBadgeText: { fontSize: 11, fontWeight: '600' },
  poPieces: { fontSize: 13, color: '#4361ee', fontWeight: '600', marginTop: 4 },
  // Invoice item styles
  styleBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#4361ee', marginRight: 8, paddingHorizontal: 14, alignItems: 'center', backgroundColor: '#eef2ff', minWidth: 90 },
  styleBtnNo: { color: '#4361ee', fontWeight: '700', fontSize: 13 },
  styleBtnColor: { color: '#666', fontSize: 10, marginTop: 2 },
  styleBtnPrice: { color: '#888', fontSize: 11, marginTop: 2 },
  selectedItems: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 10 },
  selectedItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  selectedItemName: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  selectedItemPrice: { fontSize: 12, color: '#666', marginTop: 4 },
  invColorBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 6, backgroundColor: '#fff' },
  invColorBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  invColorBtnText: { fontSize: 11, color: '#444' },
  invColorBtnTextActive: { color: '#fff', fontWeight: '600' },
  invSizeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  invSizeBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  invSizeBtnText: { fontSize: 11, color: '#444' },
  invSizeBtnTextActive: { color: '#fff', fontWeight: '600' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '98%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 960, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1e1b4b' },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  // Invoice preview styles
  invPreviewBox: { borderWidth: 1, borderColor: '#e0e7ff', borderRadius: 12, overflow: 'hidden', marginTop: 12, marginBottom: 10 },
  invPreviewHeader: { backgroundColor: '#1e1b4b', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invPreviewLogo: { width: 28, height: 28, backgroundColor: '#000', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  invPreviewCompany: { color: '#fff', fontSize: 13, fontWeight: '600' },
  invPreviewNo: { color: '#a5b4fc', fontSize: 16, fontWeight: '600' },
  invStatusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  invStatusPaid: { backgroundColor: '#065f46' },
  invStatusPartial: { backgroundColor: '#3730a3' },
  invStatusPending: { backgroundColor: '#92400e' },
  invStatusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  invPreviewInfoRow: { flexDirection: 'row', backgroundColor: '#f8faff', borderBottomWidth: 0.5, borderBottomColor: '#e0e7ff' },
  invPreviewInfoBox: { flex: 1, padding: 8, borderRightWidth: 0.5, borderRightColor: '#e0e7ff' },
  invPreviewInfoLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  invPreviewInfoValue: { fontSize: 11, fontWeight: '600', color: '#1e1b4b' },
  invPreviewTable: { backgroundColor: '#fff' },
  invPreviewTableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 6, paddingHorizontal: 10 },
  invPreviewTh: { color: '#fff', fontSize: 10, fontWeight: '600' },
  invPreviewTableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10 },
  invPreviewTd: { fontSize: 11, color: '#374151' },
  invPreviewSummary: { padding: 10, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  invPreviewSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  invPreviewSummaryLabel: { fontSize: 11, color: '#666' },
  invPreviewSummaryValue: { fontSize: 11, fontWeight: '500', color: '#374151' },
  invPreviewTotalBox: { backgroundColor: '#1e1b4b', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invPreviewTotalLabel: { color: '#a5b4fc', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  invPreviewTotalValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  invPreviewPaidRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f9fafb' },
  invLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, justifyContent: 'center', backgroundColor: '#f0fdf4' },
  invLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  pendingItemBox: { backgroundColor: '#f8faff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  pendingItemTitle: { fontSize: 14, fontWeight: '600', color: '#1e1b4b', marginBottom: 10 },
  lineBadge: { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  lineBadgeText: { fontSize: 12, fontWeight: '600', color: '#4361ee' },
  sizeBadge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sizeBadgeText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  colorGridBox: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 10, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  gridColorCell: { width: 90, padding: 4, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center', minHeight: 36 },
  gridColorInputCell: { width: 90, padding: 4, justifyContent: 'center', alignItems: 'center', minHeight: 36, backgroundColor: '#f8faff' },
  gridColorInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 4, fontSize: 11, textAlign: 'center', width: 82, backgroundColor: '#fff' },
  gridCell: { width: 48, padding: 2, alignItems: 'center', minHeight: 36, justifyContent: 'center' },
  gridTotalCell: { width: 52, padding: 4, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  gridHeaderText: { fontSize: 10, fontWeight: '600', color: '#fff', textAlign: 'center' },
  gridLabelText: { fontSize: 11, fontWeight: '600', color: '#fff', textAlign: 'center' },
  gridValueText: { fontSize: 12, color: '#374151', textAlign: 'center' },
  gridTotalHeader: { fontSize: 10, fontWeight: '600', color: '#4361ee', textAlign: 'center' },
  gridTotalText: { fontSize: 13, fontWeight: 'bold', color: '#4361ee', textAlign: 'center' },
  gridInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 3, fontSize: 11, textAlign: 'center', width: 44, backgroundColor: '#fff' },
  addColorBtn: { backgroundColor: '#eef2ff', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#4361ee' },
  addColorBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  sizeNumberTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  sizeNumberText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  sizeNumberRemove: { fontSize: 12, color: '#ef4444', fontWeight: 'bold' },
  cuttingColorBox: { backgroundColor: '#f8faff', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#e0e7ff' },
  cuttingColorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cuttingColorName: { fontSize: 14, fontWeight: '700', color: '#1e1b4b' },
  cuttingColorDiff: { fontSize: 13, fontWeight: '600' },
  poPreviewBox: { borderWidth: 1, borderColor: '#e0e7ff', borderRadius: 12, overflow: 'hidden', marginTop: 12, marginBottom: 10 },
  poPreviewHeader: { backgroundColor: '#1e1b4b', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  poPreviewLogo: { width: 26, height: 26, backgroundColor: '#000', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  poPreviewTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  poPreviewInfo: { backgroundColor: '#f8faff', padding: 10, gap: 4 },
  poPreviewInfoText: { fontSize: 11, color: '#666' },
  poPreviewInfoBold: { fontWeight: '600', color: '#1e1b4b' },
  poPreviewTable: { backgroundColor: '#fff' },
  poPreviewTableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 6, paddingHorizontal: 10 },
  poPreviewTh: { color: '#fff', fontSize: 10, fontWeight: '600' },
  poPreviewTableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10 },
  poPreviewTd: { fontSize: 11, color: '#374151' },
  poPreviewTotalBox: { backgroundColor: '#1e1b4b', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  poPreviewTotalLabel: { color: '#a5b4fc', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  poPreviewTotalValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});