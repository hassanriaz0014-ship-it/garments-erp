import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

import DatePicker from '../components/DatePicker';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'General'];

export default function PurchaseOrdersScreen({ navigation }) {
  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [editingPO, setEditingPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parties, setParties] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const emptyItem = { style_no: '', description: '', color: '', sizes: {}, total_pieces: 0 };
  const [form, setForm] = useState({
    po_number: '', po_date: '', party_id: '',
    article_name: '', fabric_details: '', status: 'Pending', notes: ''
  });
  const [items, setItems] = useState([{ ...emptyItem, id: Date.now() }]);
  const [sizeNumbers, setSizeNumbers] = useState(['50', '52', '54']);
  const [newSizeNumber, setNewSizeNumber] = useState('');

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

  const openAddModal = () => {
    setEditingPO(null);
    setForm({ po_number: '', po_date: '', party_id: '', article_name: '', fabric_details: '', status: 'Pending', notes: '' });
    setItems([{ ...emptyItem, id: Date.now() }]);
    setSizeNumbers(['50', '52', '54']);
    setModalVisible(true);
  };

  const openEditModal = async (po) => {
    try {
      const res = await client.get(`/purchase-orders/${po.id}`);
      const full = res.data;
      setEditingPO(full);
      setForm({
        po_number: full.po_number || '',
        po_date: full.po_date ? full.po_date.toString().split('T')[0] : '',
        party_id: String(full.party_id || ''),
        article_name: full.article_name || '',
        fabric_details: full.fabric_details || '',
        status: full.status || 'Pending',
        notes: full.notes || ''
      });
      const poItems = full.items || [];
      setItems(poItems.map(i => ({
        id: i.id || Date.now(),
        style_no: i.style_no || '',
        description: i.description || '',
        color: i.color || '',
        sizes: i.sizes || {},
        total_pieces: i.total_pieces || 0
      })));
      const allSizeNums = new Set();
      poItems.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(sn => allSizeNums.add(sn)); });
      if (allSizeNums.size > 0) setSizeNumbers([...allSizeNums].sort());
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

  const addItem = () => setItems([...items, { ...emptyItem, id: Date.now() }]);
  const removeItem = (id) => { if (items.length === 1) return; setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const updateSizeQty = (itemId, sizeNum, subSize, value) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const newSizes = { ...item.sizes };
      if (!newSizes[sizeNum]) newSizes[sizeNum] = {};
      newSizes[sizeNum][subSize] = parseInt(value) || 0;
      let total = 0;
      Object.values(newSizes).forEach(sn => Object.values(sn).forEach(qty => { total += qty; }));
      return { ...item, sizes: newSizes, total_pieces: total };
    }));
  };

  const getSizeQty = (item, sizeNum, subSize) => {
    if (!item.sizes || !item.sizes[sizeNum]) return '';
    return item.sizes[sizeNum][subSize] ? String(item.sizes[sizeNum][subSize]) : '';
  };

  const addSizeNumber = () => {
    if (!newSizeNumber.trim()) return;
    if (!sizeNumbers.includes(newSizeNumber.trim())) setSizeNumbers([...sizeNumbers, newSizeNumber.trim()]);
    setNewSizeNumber('');
  };

  const getTotalPieces = () => items.reduce((sum, item) => sum + (item.total_pieces || 0), 0);

  const savePO = async () => {
    if (!form.po_number || !form.po_date || !form.party_id) {
      alert('PO number, date and party are required'); return;
    }
    try {
      const payload = {
        ...form,
        items: items.map(i => ({
          style_no: i.style_no, description: i.description,
          color: i.color, sizes: i.sizes, total_pieces: i.total_pieces || 0
        }))
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
    const allSizeNums = new Set();
    po.items.forEach(i => { if (i.sizes) Object.keys(i.sizes).forEach(sn => allSizeNums.add(sn)); });
    const sizeNums = [...allSizeNums].sort((a, b) => parseInt(a) - parseInt(b));

    let sizeHeaderRow1 = '';
    let sizeHeaderRow2 = '';
    sizeNums.forEach(sn => {
      const activeSubs = SIZES.filter(ss => po.items.some(i => i.sizes && i.sizes[sn] && i.sizes[sn][ss]));
      const cols = activeSubs.length > 0 ? activeSubs : ['S', 'M'];
      sizeHeaderRow1 += `<th colspan="${cols.length}" style="text-align:center;border:1px solid #1e1b4b">${sn}</th>`;
      cols.forEach(ss => { sizeHeaderRow2 += `<th style="text-align:center;border:1px solid #ddd">${ss}</th>`; });
    });

    const rows = po.items.map((item, idx) => {
      let sizeCells = '';
      sizeNums.forEach(sn => {
        const activeSubs = SIZES.filter(ss => po.items.some(i => i.sizes && i.sizes[sn] && i.sizes[sn][ss]));
        const cols = activeSubs.length > 0 ? activeSubs : ['S', 'M'];
        cols.forEach(ss => {
          const qty = item.sizes && item.sizes[sn] && item.sizes[sn][ss] ? item.sizes[sn][ss] : '-';
          sizeCells += `<td style="text-align:center;border:1px solid #ddd">${qty}</td>`;
        });
      });
      return `<tr>
        <td style="border:1px solid #ddd">${idx + 1}</td>
        <td style="border:1px solid #ddd">${item.style_no || '-'}</td>
        <td style="border:1px solid #ddd">${item.description || '-'}</td>
        <td style="border:1px solid #ddd">${item.color || '-'}</td>
        ${sizeCells}
        <td style="text-align:center;font-weight:bold;border:1px solid #ddd">${item.total_pieces || 0}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>PO — ${po.po_number}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px;font-size:12px}
        .info{margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:4px 40px}
        .info-row{font-size:13px}.info-row span{font-weight:bold}
        h2{color:#1e1b4b;margin-bottom:12px;font-size:16px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th{background:#1e1b4b;color:#fff;padding:6px 8px;font-size:11px;border:1px solid #1e1b4b}
        td{padding:6px 8px;font-size:11px;border:1px solid #ddd}
        tr:nth-child(even){background:#f9fafb}
        .total-row{margin-top:12px;text-align:right;font-size:14px;font-weight:bold;color:#1e1b4b}
        .notes{margin-top:8px;font-size:12px;color:#666;font-style:italic}
      </style></head>
      <body>
        <h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="..."/> RS APPARELS</h2> — Purchase Order</h2>
        <div class="info">
          <div class="info-row">PO Number: <span>${po.po_number}</span></div>
          <div class="info-row">PO Date: <span>${po.po_date ? po.po_date.toString().split('T')[0] : '-'}</span></div>
          <div class="info-row">Party: <span>${po.party_name || '-'}</span></div>
          <div class="info-row">Status: <span>${po.status}</span></div>
          <div class="info-row">Article: <span>${po.article_name || '-'}</span></div>
          <div class="info-row">Fabric: <span>${po.fabric_details || '-'}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="border:1px solid #1e1b4b">Sr#</th>
              <th rowspan="2" style="border:1px solid #1e1b4b">Style</th>
              <th rowspan="2" style="border:1px solid #1e1b4b">Item</th>
              <th rowspan="2" style="border:1px solid #1e1b4b">Colours</th>
              ${sizeHeaderRow1}
              <th rowspan="2" style="text-align:center;border:1px solid #1e1b4b">Total<br/>Pcs</th>
            </tr>
            <tr>${sizeHeaderRow2}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total-row">Total Pieces: ${po.total_pieces || 0}</div>
        ${po.notes ? `<div class="notes">Notes: ${po.notes}</div>` : ''}
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const statusColor = (status) => {
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'In Progress') return styles.statusInProgress;
    return styles.statusPending;
  };

  const renderSizeGrid = (item, isView = false) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View>
        {/* Header */}
        <View style={styles.gridRow}>
          <View style={styles.gridLabelCell}>
            <Text style={styles.gridHeaderText}>Size</Text>
          </View>
          {SIZES.map(ss => (
            <View key={ss} style={[styles.gridCell, { backgroundColor: '#2d2a6e' }]}>
              <Text style={styles.gridHeaderText}>{ss}</Text>
            </View>
          ))}
          <View style={styles.gridTotalCell}>
            <Text style={styles.gridTotalHeader}>Total</Text>
          </View>
        </View>
        {/* Rows */}
        {sizeNumbers.map(sn => {
          const rowTotal = SIZES.reduce((sum, ss) => {
            return sum + (item.sizes && item.sizes[sn] && item.sizes[sn][ss] ? item.sizes[sn][ss] : 0);
          }, 0);
          return (
            <View key={sn} style={styles.gridRow}>
              <View style={styles.gridLabelCell}>
                <Text style={styles.gridLabelText}>{sn}</Text>
              </View>
              {SIZES.map(ss => (
                <View key={ss} style={styles.gridCell}>
                  {isView ? (
                    <Text style={styles.gridValueText}>
                      {item.sizes && item.sizes[sn] && item.sizes[sn][ss] ? item.sizes[sn][ss] : '-'}
                    </Text>
                  ) : (
                    <TextInput
                      style={styles.gridInput}
                      value={getSizeQty(item, sn, ss)}
                      onChangeText={(v) => updateSizeQty(item.id, sn, ss, v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  )}
                </View>
              ))}
              <View style={styles.gridTotalCell}>
                <Text style={styles.gridTotalText}>{rowTotal}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

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
        placeholder="🔍 Search by PO number, party or article..."
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
              <TextInput style={styles.input} placeholder="PO Number * (e.g. PO-001)"
                value={form.po_number} onChangeText={(v) => setForm({ ...form, po_number: v })} />
              <DatePicker label="PO Date *" value={form.po_date}
                onChange={(v) => setForm({ ...form, po_date: v })} />

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

              <TextInput style={styles.input} placeholder="Article name"
                value={form.article_name} onChangeText={(v) => setForm({ ...form, article_name: v })} />
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

              {/* Size Numbers */}
              <Text style={styles.label}>Size Numbers</Text>
              <View style={styles.sizeNumbersRow}>
                {sizeNumbers.map(sn => (
                  <View key={sn} style={styles.sizeNumberTag}>
                    <Text style={styles.sizeNumberText}>{sn}</Text>
                    <TouchableOpacity onPress={() => setSizeNumbers(sizeNumbers.filter(s => s !== sn))}>
                      <Text style={styles.sizeNumberRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addSizeRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Add size number (e.g. 56)"
                  value={newSizeNumber} onChangeText={setNewSizeNumber}
                  keyboardType="numeric" />
                <TouchableOpacity style={styles.addSizeBtn} onPress={addSizeNumber}>
                  <Text style={styles.addSizeBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Items */}
              <Text style={[styles.label, { marginTop: 12 }]}>Items</Text>
              {items.map((item, itemIdx) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemCardTitle}>Item {itemIdx + 1}</Text>
                    {items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Text style={{ color: '#ef4444', fontSize: 13 }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput style={styles.input} placeholder="Style No (e.g. ASM-265)"
                    value={item.style_no} onChangeText={(v) => updateItem(item.id, 'style_no', v)} />
                  <TextInput style={styles.input} placeholder="Description (e.g. Mens Jubba)"
                    value={item.description} onChangeText={(v) => updateItem(item.id, 'description', v)} />
                  <TextInput style={styles.input} placeholder="Color (e.g. White/G)"
                    value={item.color} onChangeText={(v) => updateItem(item.id, 'color', v)} />

                  <Text style={styles.label}>Quantities by Size</Text>
                  {renderSizeGrid(item, false)}
                  <Text style={styles.itemTotal}>Total pieces: {item.total_pieces || 0}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Text style={styles.addItemBtnText}>+ Add Another Color/Item</Text>
              </TouchableOpacity>

              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalText}>Grand Total: {getTotalPieces()} pieces</Text>
              </View>

              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
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
                      <Text style={styles.viewLabel}>Article</Text>
                      <Text style={styles.viewValue}>{selectedPO.article_name || '-'}</Text>
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

                  {selectedPO.items && selectedPO.items.map((item, idx) => {
                    const allSizeNums = item.sizes ? Object.keys(item.sizes).sort() : [];
                    return (
                      <View key={idx} style={styles.viewItemCard}>
                        <Text style={styles.viewItemTitle}>
                          {item.style_no} — {item.description} — {item.color}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View>
                            <View style={styles.gridRow}>
                              <View style={styles.gridLabelCell}>
                                <Text style={styles.gridHeaderText}>Size</Text>
                              </View>
                              {SIZES.map(ss => (
                                <View key={ss} style={styles.gridCell}>
                                  <Text style={styles.gridHeaderText}>{ss}</Text>
                                </View>
                              ))}
                              <View style={styles.gridTotalCell}>
                                <Text style={styles.gridTotalHeader}>Total</Text>
                              </View>
                            </View>
                            {allSizeNums.map(sn => {
                              const rowTotal = SIZES.reduce((sum, ss) =>
                                sum + (item.sizes[sn] && item.sizes[sn][ss] ? item.sizes[sn][ss] : 0), 0);
                              return (
                                <View key={sn} style={styles.gridRow}>
                                  <View style={styles.gridLabelCell}>
                                    <Text style={styles.gridLabelText}>{sn}</Text>
                                  </View>
                                  {SIZES.map(ss => (
                                    <View key={ss} style={styles.gridCell}>
                                      <Text style={styles.gridValueText}>
                                        {item.sizes[sn] && item.sizes[sn][ss] ? item.sizes[sn][ss] : '-'}
                                      </Text>
                                    </View>
                                  ))}
                                  <View style={styles.gridTotalCell}>
                                    <Text style={styles.gridTotalText}>{rowTotal}</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>
                        <Text style={styles.itemTotal}>Total: {item.total_pieces} pcs</Text>
                      </View>
                    );
                  })}

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
  sizeNumbersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  sizeNumberTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  sizeNumberText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  sizeNumberRemove: { fontSize: 12, color: '#ef4444', fontWeight: 'bold' },
  addSizeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  addSizeBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  addSizeBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  itemCard: { backgroundColor: '#f8faff', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemCardTitle: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  // Size grid styles
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  gridLabelCell: { width: 44, padding: 4, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center', minHeight: 32 },
  gridCell: { width: 48, padding: 2, alignItems: 'center', minHeight: 32, justifyContent: 'center' },
  gridTotalCell: { width: 52, padding: 4, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', minHeight: 32 },
  gridHeaderText: { fontSize: 10, fontWeight: '600', color: '#fff', textAlign: 'center' },
  gridLabelText: { fontSize: 11, fontWeight: '600', color: '#fff', textAlign: 'center' },
  gridValueText: { fontSize: 12, color: '#374151', textAlign: 'center' },
  gridTotalHeader: { fontSize: 10, fontWeight: '600', color: '#4361ee', textAlign: 'center' },
  gridTotalText: { fontSize: 13, fontWeight: 'bold', color: '#4361ee', textAlign: 'center' },
  gridInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 3, fontSize: 11, textAlign: 'center', width: 44, backgroundColor: '#fff' },
  itemTotal: { fontSize: 13, fontWeight: '600', color: '#4361ee', marginTop: 8, textAlign: 'right' },
  addItemBtn: { backgroundColor: '#eef2ff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#4361ee' },
  addItemBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  grandTotal: { backgroundColor: '#1e1b4b', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center' },
  grandTotalText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  viewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  viewItem: { width: '45%' },
  viewLabel: { fontSize: 11, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  viewValue: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  viewItemCard: { backgroundColor: '#f8faff', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e0e7ff' },
  viewItemTitle: { fontSize: 13, fontWeight: '600', color: '#1e1b4b', marginBottom: 8 },
  notesBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginTop: 8 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#92400e' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '95%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 760, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});