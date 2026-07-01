import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';
import DatePicker from '../components/DatePicker';

const LOGO_URL = 'https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png';

export default function PurchaseOrdersScreen({ navigation }) {
  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [cuttingModalVisible, setCuttingModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [editingPO, setEditingPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parties, setParties] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [form, setForm] = useState({
    po_number: '', po_date: '', party_id: '',
    style_no: '', description: '', fabric_details: '', status: 'Pending', notes: ''
  });
  const [colorRows, setColorRows] = useState([{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]);
  const [poSizes, setPoSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [newSize, setNewSize] = useState('');
  const [cuttingItem, setCuttingItem] = useState(null);
  const [cuttingPO, setCuttingPO] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = pos;
    if (searchQuery) {
      result = result.filter(p =>
        (p.po_number && p.po_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.party_name && p.party_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.article_name && p.article_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (filterStatus !== 'All') result = result.filter(p => p.status === filterStatus);
    setFilteredPos(result);
  }, [searchQuery, filterStatus, pos]);

  const fetchAll = async () => {
    try {
      const [poRes, partiesRes] = await Promise.all([
        client.get('/purchase-orders'),
        client.get('/parties')
      ]);
      setPos(poRes.data);
      setFilteredPos(poRes.data);
      setParties(partiesRes.data.filter(p => p.type === 'Customer'));
    } catch (err) {
      console.log('Could not fetch POs');
    } finally {
      setLoading(false);
    }
  };

  const addPoSize = () => {
    if (!newSize.trim()) return;
    if (!poSizes.includes(newSize.trim())) setPoSizes([...poSizes, newSize.trim()]);
    setNewSize('');
  };
  const removePoSize = (s) => setPoSizes(poSizes.filter(x => x !== s));

  const openAddModal = () => {
    setEditingPO(null);
    setForm({ po_number: '', po_date: '', party_id: '', style_no: '', description: '', fabric_details: '', status: 'Pending', notes: '' });
    setColorRows([{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]);
    setPoSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setModalVisible(true);
  };

  const openEditModal = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      setEditingPO(full);
      const firstItem = (full.items && full.items[0]) || {};
      setForm({
        po_number: full.po_number || '',
        po_date: full.po_date ? full.po_date.toString().split('T')[0] : '',
        party_id: String(full.party_id || ''),
        style_no: firstItem.style_no || full.article_name || '',
        description: firstItem.description || '',
        fabric_details: full.fabric_details || '',
        status: full.status || 'Pending',
        notes: full.notes || ''
      });
      const items = full.items || [];
      setColorRows(items.length > 0
        ? items.map(i => ({
            id: i.id || Date.now() + Math.random(),
            color: i.color || '',
            sizes: i.sizes || {},
            cut_sizes: typeof i.cut_sizes === 'string' ? JSON.parse(i.cut_sizes) : (i.cut_sizes || {})
          }))
        : [{ id: Date.now(), color: '', sizes: {}, cut_sizes: {} }]
      );
      const allSizeKeys = new Set();
      items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(k => allSizeKeys.add(k)); });
      setPoSizes(allSizeKeys.size > 0 ? [...allSizeKeys] : ['S', 'M', 'L', 'XL', 'XXL']);
      setModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const openViewModal = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      setSelectedPO(res.data);
      setViewModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const openCuttingModal = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      setCuttingPO(full);
      const items = full.items || [];
      setCuttingItem(items.map(i => ({
        id: i.id,
        color: i.color || '',
        sizes: i.sizes || {},
        cut_sizes: typeof i.cut_sizes === 'string' ? JSON.parse(i.cut_sizes) : (i.cut_sizes || {})
      })));
      setCuttingModalVisible(true);
    } catch (err) { alert('Could not load PO'); }
  };

  const updateCuttingQty = (rowId, size, value) => {
    setCuttingItem(cuttingItem.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, cut_sizes: { ...row.cut_sizes, [size]: parseInt(value) || 0 } };
    }));
  };

  const saveCutting = async () => {
    try {
      const items = cuttingItem.map(row => ({
        style_no: cuttingPO.items.find(i => i.id === row.id)?.style_no || cuttingPO.article_name,
        description: cuttingPO.items.find(i => i.id === row.id)?.description || '',
        color: row.color,
        sizes: row.sizes,
        total_pieces: Object.values(row.sizes).reduce((s, v) => s + (v || 0), 0),
        cut_sizes: row.cut_sizes
      }));
      await client.put(`/purchase-orders/${cuttingPO.id}`, {
        po_number: cuttingPO.po_number,
        po_date: cuttingPO.po_date ? cuttingPO.po_date.toString().split('T')[0] : '',
        party_id: cuttingPO.party_id,
        article_name: cuttingPO.article_name,
        fabric_details: cuttingPO.fabric_details,
        status: cuttingPO.status,
        notes: cuttingPO.notes,
        items
      });
      setCuttingModalVisible(false);
      fetchAll();
    } catch (err) { alert('Could not save cutting data'); }
  };

  const addColorRow = () => setColorRows([...colorRows, { id: Date.now() + Math.random(), color: '', sizes: {}, cut_sizes: {} }]);
  const removeColorRow = (id) => { if (colorRows.length === 1) return; setColorRows(colorRows.filter(r => r.id !== id)); };
  const updateColorName = (id, value) => setColorRows(colorRows.map(r => r.id === id ? { ...r, color: value } : r));
  const updateColorQty = (id, size, value) => {
    setColorRows(colorRows.map(r => r.id === id ? { ...r, sizes: { ...r.sizes, [size]: parseInt(value) || 0 } } : r));
  };

  const getRowTotal = (row) => poSizes.reduce((sum, s) => sum + (row.sizes[s] || 0), 0);
  const getGrandTotal = () => colorRows.reduce((sum, r) => sum + getRowTotal(r), 0);
  const getColumnTotal = (size) => colorRows.reduce((sum, r) => sum + (r.sizes[size] || 0), 0);

  const savePO = async () => {
    if (!form.po_number || !form.po_date || !form.party_id) {
      alert('PO number, date and party are required'); return;
    }
    if (!form.style_no) { alert('Style number is required'); return; }
    try {
      const items = colorRows.filter(r => r.color.trim()).map(r => ({
        style_no: form.style_no,
        description: form.description,
        color: r.color,
        sizes: r.sizes,
        total_pieces: getRowTotal(r),
        cut_sizes: r.cut_sizes || {}
      }));
      const payload = {
        po_number: form.po_number,
        po_date: form.po_date,
        party_id: form.party_id,
        article_name: form.style_no,
        fabric_details: form.fabric_details,
        status: form.status,
        notes: form.notes,
        items
      };
      if (editingPO) {
        await client.put(`/purchase-orders/${editingPO.id}`, payload);
      } else {
        await client.post('/purchase-orders', payload);
      }
      setModalVisible(false);
      setEditingPO(null);
      fetchAll();
    } catch (err) { alert('Could not save PO'); }
  };

  const deletePO = async (id) => {
    if (window.confirm('Delete this purchase order?')) {
      try { await client.delete(`/purchase-orders/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete PO'); }
    }
  };

  const printPO = (po) => {
    if (!po || !po.items) return;
    const allSizes = new Set();
    po.items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(s => allSizes.add(s)); });
    const sizes = [...allSizes];

    const rows = po.items.map(item => {
      const cutSizes = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {});
      const hasCutData = Object.values(cutSizes).some(v => v > 0);
      const orderedCells = sizes.map(s => {
        const qty = item.sizes && item.sizes[s] ? item.sizes[s] : '-';
        return `<td style="text-align:center;border:1px solid #ddd">${qty}</td>`;
      }).join('');
      const orderedRow = `<tr><td style="border:1px solid #ddd;font-weight:bold;vertical-align:middle" rowspan="${hasCutData ? 2 : 1}">${item.color || '-'}</td><td style="border:1px solid #ddd;font-size:10px;color:#666">Ordered</td>${orderedCells}<td style="text-align:center;font-weight:bold;border:1px solid #ddd">${item.total_pieces || 0}</td></tr>`;
      if (!hasCutData) return orderedRow;
      const cutTotal = sizes.reduce((sum, s) => sum + (cutSizes[s] || 0), 0);
      const cutCells = sizes.map(s => {
        const qty = cutSizes[s] || 0;
        return `<td style="text-align:center;border:1px solid #ddd;background:#f0fdf4;color:#16a34a;font-weight:600">${qty}</td>`;
      }).join('');
      const cutRow = `<tr><td style="border:1px solid #ddd;font-size:10px;color:#16a34a;">Cut</td>${cutCells}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#f0fdf4;color:#16a34a;">${cutTotal}</td></tr>`;
      return orderedRow + cutRow;
    }).join('');

    const colTotals = sizes.map(s => {
      const total = po.items.reduce((sum, item) => sum + (item.sizes && item.sizes[s] ? item.sizes[s] : 0), 0);
      return `<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#eef2ff">${total || '-'}</td>`;
    }).join('');

    const firstItem = po.items[0] || {};

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>PO — ${po.po_number}</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px;font-size:12px}
        .header{display:flex;align-items:center;gap:10px;margin-bottom:16px}
        .logo{width:40px;height:40px;object-fit:contain;background:#000;border-radius:4px;padding:2px}
        .header h2{font-size:18px;color:#1e1b4b}
        .info{margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:4px 40px}
        .info-row{font-size:13px}.info-row span{font-weight:bold}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th{background:#1e1b4b;color:#fff;padding:8px;font-size:12px;border:1px solid #1e1b4b}
        td{padding:6px 8px;font-size:11px;border:1px solid #ddd}
        .total-row{margin-top:12px;text-align:right;font-size:14px;font-weight:bold;color:#1e1b4b}
        .notes{margin-top:8px;font-size:12px;color:#666;font-style:italic}
        .legend{margin-top:6px;font-size:11px;color:#666}
      </style></head>
      <body>
        <div class="header"><img class="logo" src="${LOGO_URL}" crossorigin="anonymous"/><h2>RS APPARELS — Purchase Order</h2></div>
        <div class="info">
          <div class="info-row">PO Number: <span>${po.po_number}</span></div>
          <div class="info-row">PO Date: <span>${po.po_date ? po.po_date.toString().split('T')[0] : '-'}</span></div>
          <div class="info-row">Party: <span>${po.party_name || '-'}</span></div>
          <div class="info-row">Status: <span>${po.status}</span></div>
          <div class="info-row">Style No: <span>${firstItem.style_no || po.article_name || '-'}</span></div>
          <div class="info-row">Description: <span>${firstItem.description || '-'}</span></div>
          <div class="info-row">Fabric: <span>${po.fabric_details || '-'}</span></div>
        </div>
        <table>
          <thead><tr><th>Color</th><th></th>${sizes.map(s => `<th>${s}</th>`).join('')}<th>Total</th></tr></thead>
          <tbody>${rows}<tr><td colspan="2" style="font-weight:bold;background:#f3f4f6">Total Ordered</td>${colTotals}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#1e1b4b;color:#fff">${po.total_pieces || 0}</td></tr><tr><td colspan="2" style="font-weight:bold;background:#f0fdf4;color:#166534">Total Cut</td>${sizes.map(s => { const t = po.items.reduce((sum, item) => { const cs = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {}); return sum + (cs[s] || 0); }, 0); return `<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#f0fdf4;color:#16a34a">${t || '-'}</td>`; }).join('')}<td style="text-align:center;font-weight:bold;border:1px solid #ddd;background:#166534;color:#fff">${po.items.reduce((sum, item) => { const cs = typeof item.cut_sizes === 'string' ? JSON.parse(item.cut_sizes) : (item.cut_sizes || {}); return sum + Object.values(cs).reduce((s, v) => s + (v || 0), 0); }, 0)}</td></tr></tbody>
        </table>
        <div class="legend">Green rows show actual cut quantities (where recorded)</div>
        <div class="total-row">Total Pieces: ${po.total_pieces || 0}</div>
        ${po.notes ? `<div class="notes">Notes: ${po.notes}</div>` : ''}
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
  };

  const statusColor = (status) => {
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'In Progress') return styles.statusInProgress;
    return styles.statusPending;
  };

  const selectedPartyName = parties.find(p => String(p.id) === String(form.party_id))?.name || '';

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ New PO</Text>
        </TouchableOpacity>
        <View style={styles.statusFilters}>
          {['All', 'Pending', 'In Progress', 'Completed'].map(s => (
            <TouchableOpacity key={s}
              style={[styles.statusFilter, filterStatus === s && styles.statusFilterActive]}
              onPress={() => setFilterStatus(s)}>
              <Text style={[styles.statusFilterText, filterStatus === s && styles.statusFilterTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by PO number, party or style..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView>
        {filteredPos.length === 0
          ? <Text style={styles.empty}>No purchase orders found.</Text>
          : filteredPos.map((po) => (
            <View key={po.id} style={styles.poCard}>
              <View style={styles.poCardTop}>
                <View style={styles.poCardLeft}>
                  <Text style={styles.poNumber}>{po.po_number}</Text>
                  <Text style={styles.poParty}>🏪 {po.party_name || '-'}</Text>
                  <Text style={styles.poArticle}>{po.article_name || '-'}</Text>
                </View>
                <View style={styles.poCardRight}>
                  <View style={[styles.statusBadge, statusColor(po.status)]}>
                    <Text style={styles.statusBadgeText}>{po.status}</Text>
                  </View>
                  <Text style={styles.poDate}>{po.po_date ? po.po_date.toString().split('T')[0] : '-'}</Text>
                  <Text style={styles.poPieces}>Total: {po.total_pieces} pcs</Text>
                </View>
              </View>
              <View style={styles.poCardActions}>
                <TouchableOpacity style={styles.viewBtn} onPress={() => openViewModal(po)}>
                  <Text style={styles.viewBtnText}>👁️ View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(po)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cuttingBtn} onPress={() => openCuttingModal(po)}>
                  <Text style={styles.cuttingBtnText}>✂️ Cutting</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.printBtn} onPress={async () => {
                  const res = await client.get(`/purchase-orders/${po.id}`);
                  printPO(res.data);
                }}>
                  <Text style={styles.printBtnText}>🖨️ Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => deletePO(po.id)}>
                  <Text style={styles.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
      </ScrollView>

      {/* ADD/EDIT PO MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>{editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}</Text>
            <ScrollView>
              <View style={isDesktop ? { flexDirection: 'row', gap: 16, alignItems: 'flex-start' } : {}}>

                <View style={isDesktop ? { flex: 1 } : {}}>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="PO Number * (e.g. PO-001)"
                      value={form.po_number} onChangeText={(v) => setForm({ ...form, po_number: v })} />
                    <View style={{ flex: 1 }}>
                      <DatePicker label="" value={form.po_date}
                        onChange={(v) => setForm({ ...form, po_date: v })} />
                    </View>
                  </View>

                  <Text style={styles.label}>Select Party *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {parties.map(p => (
                      <TouchableOpacity key={p.id}
                        style={[styles.catBtn, String(form.party_id) === String(p.id) && styles.catBtnActive]}
                        onPress={() => setForm({ ...form, party_id: String(p.id) })}>
                        <Text style={[styles.catBtnText, String(form.party_id) === String(p.id) && styles.catBtnTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Style No * (e.g. ASM-265)"
                      value={form.style_no} onChangeText={(v) => setForm({ ...form, style_no: v })} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Description"
                      value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
                  </View>
                  <TextInput style={styles.input} placeholder="Fabric details"
                    value={form.fabric_details} onChangeText={(v) => setForm({ ...form, fabric_details: v })} />

                  <Text style={styles.label}>Status</Text>
                  <View style={styles.typeRow}>
                    {['Pending', 'In Progress', 'Completed'].map(s => (
                      <TouchableOpacity key={s}
                        style={[styles.typeBtn, form.status === s && styles.typeBtnActive]}
                        onPress={() => setForm({ ...form, status: s })}>
                        <Text style={[styles.typeBtnText, form.status === s && styles.typeBtnTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { marginTop: 8 }]}>Sizes</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {poSizes.map(s => (
                      <View key={s} style={styles.sizeNumberTag}>
                        <Text style={styles.sizeNumberText}>{s}</Text>
                        <TouchableOpacity onPress={() => removePoSize(s)}>
                          <Text style={styles.sizeNumberRemove}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Add size (e.g. XXXL or 52)"
                      value={newSize} onChangeText={setNewSize} />
                    <TouchableOpacity style={styles.addSizeBtn} onPress={addPoSize}>
                      <Text style={styles.addSizeBtnText}>+ Add</Text>
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
                          {poSizes.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#2d2a6e' }]}>
                              <Text style={styles.gridHeaderText}>{ss}</Text>
                            </View>
                          ))}
                          <View style={styles.gridTotalCell}>
                            <Text style={styles.gridTotalHeader}>Total</Text>
                          </View>
                          <View style={{ width: 30 }} />
                        </View>
                        {colorRows.map((row) => (
                          <View key={row.id} style={styles.gridRow}>
                            <View style={styles.gridColorInputCell}>
                              <TextInput
                                style={styles.gridColorInput}
                                value={row.color}
                                onChangeText={(v) => updateColorName(row.id, v)}
                                placeholder="Color"
                              />
                            </View>
                            {poSizes.map(ss => (
                              <View key={ss} style={styles.gridCell}>
                                <TextInput
                                  style={styles.gridInput}
                                  value={row.sizes[ss] ? String(row.sizes[ss]) : ''}
                                  onChangeText={(v) => updateColorQty(row.id, ss, v)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            ))}
                            <View style={styles.gridTotalCell}>
                              <Text style={styles.gridTotalText}>{getRowTotal(row)}</Text>
                            </View>
                            <TouchableOpacity style={{ width: 30, alignItems: 'center' }} onPress={() => removeColorRow(row.id)}>
                              <Text style={{ color: '#ef4444', fontSize: 14 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        <View style={styles.gridRow}>
                          <View style={[styles.gridColorCell, { backgroundColor: '#f3f4f6' }]}>
                            <Text style={[styles.gridLabelText, { color: '#374151' }]}>Total</Text>
                          </View>
                          {poSizes.map(ss => (
                            <View key={ss} style={[styles.gridCell, { backgroundColor: '#eef2ff' }]}>
                              <Text style={styles.gridTotalText}>{getColumnTotal(ss) || '-'}</Text>
                            </View>
                          ))}
                          <View style={[styles.gridTotalCell, { backgroundColor: '#1e1b4b' }]}>
                            <Text style={[styles.gridTotalText, { color: '#fff' }]}>{getGrandTotal()}</Text>
                          </View>
                          <View style={{ width: 30 }} />
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                  <TouchableOpacity style={styles.addColorBtn} onPress={addColorRow}>
                    <Text style={styles.addColorBtnText}>+ Add Color</Text>
                  </TouchableOpacity>

                  <TextInput style={styles.input} placeholder="Notes"
                    value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />

                  {!isDesktop && (
                    <View style={styles.poPreviewBox}>
                      <View style={styles.poPreviewHeader}>
                        <View style={styles.poPreviewLogo}><Text style={{ color: '#d4af37', fontSize: 10, fontWeight: 'bold' }}>RS</Text></View>
                        <Text style={styles.poPreviewTitle}>RS APPARELS — Purchase Order</Text>
                      </View>
                      <View style={styles.poPreviewInfo}>
                        <Text style={styles.poPreviewInfoText}>PO: <Text style={styles.poPreviewInfoBold}>{form.po_number || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Date: <Text style={styles.poPreviewInfoBold}>{form.po_date ? form.po_date.split('-').reverse().join('/') : '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Party: <Text style={styles.poPreviewInfoBold}>{selectedPartyName || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Style: <Text style={styles.poPreviewInfoBold}>{form.style_no || '—'}</Text></Text>
                      </View>
                      <View style={styles.poPreviewTable}>
                        <View style={styles.poPreviewTableHeader}>
                          <Text style={[styles.poPreviewTh, { flex: 1.2 }]}>Color</Text>
                          {poSizes.map(s => <Text key={s} style={[styles.poPreviewTh, { flex: 0.7, textAlign: 'center' }]}>{s}</Text>)}
                          <Text style={[styles.poPreviewTh, { flex: 0.8, textAlign: 'center' }]}>Tot</Text>
                        </View>
                        {colorRows.filter(r => r.color).map((row, i) => (
                          <View key={row.id} style={[styles.poPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                            <Text style={[styles.poPreviewTd, { flex: 1.2 }]}>{row.color}</Text>
                            {poSizes.map(s => <Text key={s} style={[styles.poPreviewTd, { flex: 0.7, textAlign: 'center' }]}>{row.sizes[s] || '-'}</Text>)}
                            <Text style={[styles.poPreviewTd, { flex: 0.8, textAlign: 'center', color: '#4361ee', fontWeight: '600' }]}>{getRowTotal(row)}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.poPreviewTotalBox}>
                        <Text style={styles.poPreviewTotalLabel}>TOTAL PIECES</Text>
                        <Text style={styles.poPreviewTotalValue}>{getGrandTotal()}</Text>
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
                        <Text style={styles.poPreviewInfoText}>PO: <Text style={styles.poPreviewInfoBold}>{form.po_number || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Date: <Text style={styles.poPreviewInfoBold}>{form.po_date ? form.po_date.split('-').reverse().join('/') : '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Party: <Text style={styles.poPreviewInfoBold}>{selectedPartyName || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Style: <Text style={styles.poPreviewInfoBold}>{form.style_no || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Desc: <Text style={styles.poPreviewInfoBold}>{form.description || '—'}</Text></Text>
                        <Text style={styles.poPreviewInfoText}>Fabric: <Text style={styles.poPreviewInfoBold}>{form.fabric_details || '—'}</Text></Text>
                      </View>
                      <View style={styles.poPreviewTable}>
                        <View style={styles.poPreviewTableHeader}>
                          <Text style={[styles.poPreviewTh, { flex: 1.2 }]}>Color</Text>
                          {poSizes.map(s => <Text key={s} style={[styles.poPreviewTh, { flex: 0.7, textAlign: 'center' }]}>{s}</Text>)}
                          <Text style={[styles.poPreviewTh, { flex: 0.8, textAlign: 'center' }]}>Tot</Text>
                        </View>
                        {colorRows.filter(r => r.color).length === 0
                          ? <Text style={{ textAlign: 'center', color: '#888', fontSize: 11, padding: 10 }}>No colors added yet</Text>
                          : colorRows.filter(r => r.color).map((row, i) => (
                            <View key={row.id} style={[styles.poPreviewTableRow, i % 2 === 0 && { backgroundColor: '#f9fafb' }]}>
                              <Text style={[styles.poPreviewTd, { flex: 1.2 }]}>{row.color}</Text>
                              {poSizes.map(s => <Text key={s} style={[styles.poPreviewTd, { flex: 0.7, textAlign: 'center' }]}>{row.sizes[s] || '-'}</Text>)}
                              <Text style={[styles.poPreviewTd, { flex: 0.8, textAlign: 'center', color: '#4361ee', fontWeight: '600' }]}>{getRowTotal(row)}</Text>
                            </View>
                          ))
                        }
                      </View>
                      <View style={styles.poPreviewTotalBox}>
                        <Text style={styles.poPreviewTotalLabel}>TOTAL PIECES</Text>
                        <Text style={styles.poPreviewTotalValue}>{getGrandTotal()}</Text>
                      </View>
                      {form.notes ? (
                        <Text style={{ fontSize: 10, color: '#888', padding: 8, borderTopWidth: 0.5, borderTopColor: '#e5e7eb' }}>{form.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                )}

              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEditingPO(null); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePO}>
                <Text style={styles.saveText}>{editingPO ? 'Update PO' : 'Save PO'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUTTING COMPARISON MODAL */}
      <Modal visible={cuttingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>✂️ Cutting Status — {cuttingPO?.po_number}</Text>
            <Text style={styles.modalSub}>Compare ordered quantities with actual cut quantities</Text>
            {cuttingItem && (() => {
              const grandOrdered = cuttingItem.reduce((sum, row) => sum + Object.values(row.sizes).reduce((s, v) => s + (v || 0), 0), 0);
              const grandCut = cuttingItem.reduce((sum, row) => sum + Object.values(row.cut_sizes).reduce((s, v) => s + (v || 0), 0), 0);
              return (
                <View style={styles.cuttingSummaryBox}>
                  <View style={styles.cuttingSummaryItem}>
                    <Text style={styles.cuttingSummaryLabel}>Total Ordered</Text>
                    <Text style={[styles.cuttingSummaryValue, { color: '#4361ee' }]}>{grandOrdered}</Text>
                  </View>
                  <View style={styles.cuttingSummaryItem}>
                    <Text style={styles.cuttingSummaryLabel}>Total Cut</Text>
                    <Text style={[styles.cuttingSummaryValue, { color: '#16a34a' }]}>{grandCut}</Text>
                  </View>
                  <View style={styles.cuttingSummaryItem}>
                    <Text style={styles.cuttingSummaryLabel}>Remaining</Text>
                    <Text style={[styles.cuttingSummaryValue, { color: grandOrdered - grandCut > 0 ? '#ef4444' : '#16a34a' }]}>{grandOrdered - grandCut}</Text>
                  </View>
                </View>
              );
            })()}
            <ScrollView>
              {cuttingItem && cuttingItem.map((row) => {
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
                                onChangeText={(v) => updateCuttingQty(row.id, ss, v)}
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCuttingModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCutting}>
                <Text style={styles.saveText}>Save Cutting Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW PO MODAL */}
      <Modal visible={viewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            {selectedPO && (
              <>
                <Text style={styles.modalTitle}>PO — {selectedPO.po_number}</Text>
                <ScrollView>
                  <View style={styles.viewGrid}>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Party</Text>
                      <Text style={styles.viewValue}>{selectedPO.party_name}</Text>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Date</Text>
                      <Text style={styles.viewValue}>{selectedPO.po_date ? selectedPO.po_date.toString().split('T')[0] : '-'}</Text>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Style No</Text>
                      <Text style={styles.viewValue}>{(selectedPO.items && selectedPO.items[0]?.style_no) || selectedPO.article_name || '-'}</Text>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Description</Text>
                      <Text style={styles.viewValue}>{(selectedPO.items && selectedPO.items[0]?.description) || '-'}</Text>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Fabric</Text>
                      <Text style={styles.viewValue}>{selectedPO.fabric_details || '-'}</Text>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Status</Text>
                      <View style={[styles.statusBadge, statusColor(selectedPO.status)]}>
                        <Text style={styles.statusBadgeText}>{selectedPO.status}</Text>
                      </View>
                    </View>
                    <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Total Pieces</Text>
                      <Text style={[styles.viewValue, { color: '#4361ee', fontWeight: 'bold' }]}>{selectedPO.total_pieces}</Text>
                    </View>
                  </View>

                  <Text style={[styles.label, { marginBottom: 8 }]}>Colors & Sizes</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                      {selectedPO.items && selectedPO.items.length > 0 && (() => {
                        const viewSizes = new Set();
                        selectedPO.items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(k => viewSizes.add(k)); });
                        const vSizes = [...viewSizes];
                        return (
                          <>
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
                            {selectedPO.items.map((item, idx) => (
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
                          </>
                        );
                      })()}
                    </View>
                  </ScrollView>

                  {selectedPO.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{selectedPO.notes}</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setViewModalVisible(false)}>
                    <Text style={styles.cancelText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={() => printPO(selectedPO)}>
                    <Text style={styles.saveText}>🖨️ Print</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statusFilters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusFilter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  statusFilterActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  statusFilterText: { fontSize: 12, color: '#444', fontWeight: '500' },
  statusFilterTextActive: { color: '#fff' },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  poCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, elevation: 2 },
  poCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  poCardLeft: { flex: 1 },
  poNumber: { fontSize: 16, fontWeight: 'bold', color: '#1e1b4b' },
  poParty: { fontSize: 13, color: '#666', marginTop: 2 },
  poArticle: { fontSize: 12, color: '#888', marginTop: 2 },
  poCardRight: { alignItems: 'flex-end', gap: 4 },
  poDate: { fontSize: 12, color: '#888', marginTop: 4 },
  poPieces: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  poCardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  viewBtn: { backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  viewBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 12 },
  editBtn: { backgroundColor: '#fef3c7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  editBtnText: { color: '#92400e', fontWeight: '600', fontSize: 12 },
  cuttingBtn: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  cuttingBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 12 },
  printBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 12 },
  delBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  delBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 12 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  statusCompleted: { backgroundColor: '#d1fae5' },
  statusInProgress: { backgroundColor: '#fef3c7' },
  statusPending: { backgroundColor: '#fee2e2' },
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  catBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  catBtnText: { fontSize: 13, color: '#444' },
  catBtnTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  typeBtnText: { color: '#444', fontWeight: '500', fontSize: 12 },
  typeBtnTextActive: { color: '#fff' },
  sizeNumberTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  sizeNumberText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  sizeNumberRemove: { fontSize: 12, color: '#ef4444', fontWeight: 'bold' },
  addSizeBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  addSizeBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
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
  cuttingColorBox: { backgroundColor: '#f8faff', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#e0e7ff' },
  cuttingColorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cuttingColorName: { fontSize: 14, fontWeight: '700', color: '#1e1b4b' },
  cuttingColorDiff: { fontSize: 13, fontWeight: '600' },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  cuttingSummaryBox: { flexDirection: 'row', backgroundColor: '#1e1b4b', borderRadius: 10, padding: 12, marginBottom: 12, gap: 8 },
  cuttingSummaryItem: { flex: 1, alignItems: 'center' },
  cuttingSummaryLabel: { fontSize: 10, color: '#a5b4fc', marginBottom: 4 },
  cuttingSummaryValue: { fontSize: 18, fontWeight: 'bold' },
  viewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  viewItem: { width: '45%' },
  viewLabel: { fontSize: 11, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  viewValue: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  notesBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginTop: 8 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#92400e' },
  invLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, justifyContent: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 8 },
  invLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '98%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 960, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});