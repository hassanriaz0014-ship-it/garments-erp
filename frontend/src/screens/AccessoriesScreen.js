import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';
import DatePicker from '../components/DatePicker';

export default function AccessoriesScreen() {
  const [accessories, setAccessories] = useState([]);
  const [filteredAccessories, setFilteredAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parties, setParties] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedPartyFilter, setSelectedPartyFilter] = useState('All');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'Fabric',
    quantity: '', unit: '', unit_price: '', notes: '',
    accessory_type: 'General', for_party_id: '', purchase_date: '', supplier_id: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = accessories;
    if (searchQuery) {
      result = result.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.supplier_name && a.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.for_party_name && a.for_party_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedPartyFilter !== 'All') {
      result = result.filter(a => String(a.for_party_id) === String(selectedPartyFilter));
    }
    if (selectedSupplierFilter !== 'All') {
      result = result.filter(a => String(a.supplier_id) === String(selectedSupplierFilter));
    }
    if (selectedTypeFilter !== 'All') {
      result = result.filter(a => a.accessory_type === selectedTypeFilter);
    }
    if (selectedDateFilter) {
      result = result.filter(a => a.purchase_date && a.purchase_date.toString().split('T')[0] === selectedDateFilter);
    }
    setFilteredAccessories(result);
  }, [searchQuery, selectedPartyFilter, selectedSupplierFilter, selectedTypeFilter, selectedDateFilter, accessories]);

  const fetchAll = async () => {
    try {
      const [accRes, partiesRes] = await Promise.all([
        client.get('/accessories'),
        client.get('/parties')
      ]);
      setAccessories(accRes.data);
      setFilteredAccessories(accRes.data);
      setParties(partiesRes.data.filter(p => p.type === 'Customer'));
      setSuppliers(partiesRes.data.filter(p => p.type === 'Supplier'));
    } catch (err) {
      Alert.alert('Error', 'Could not fetch accessories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAccessory(null);
    setForm({
      name: '', category: 'Fabric', quantity: '', unit: '',
      unit_price: '', notes: '', accessory_type: 'General',
      for_party_id: '', purchase_date: '', supplier_id: ''
    });
    setModalVisible(true);
  };

  const openEditModal = (acc) => {
    setEditingAccessory(acc);
    setForm({
      name: acc.name || '',
      category: acc.category || 'Fabric',
      quantity: String(acc.quantity || ''),
      unit: acc.unit || '',
      unit_price: String(acc.unit_price || ''),
      notes: acc.notes || '',
      accessory_type: acc.accessory_type || 'General',
      for_party_id: String(acc.for_party_id || ''),
      purchase_date: acc.purchase_date ? acc.purchase_date.toString().split('T')[0] : '',
      supplier_id: String(acc.supplier_id || '')
    });
    setModalVisible(true);
  };

  const saveAccessory = async () => {
    if (!form.name) { Alert.alert('Error', 'Item name is required'); return; }
    try {
      if (editingAccessory) {
        await client.put(`/accessories/${editingAccessory.id}`, {
          ...form,
          supplier_id: form.supplier_id || null,
          for_party_id: form.accessory_type === 'For Party' ? form.for_party_id : null,
          party_id_owner: form.accessory_type === 'For Party' ? form.for_party_id : null,
        });
      }
       else {
        await client.post('/accessories', {
          ...form,
          supplier_id: form.supplier_id || null,
          party_id_owner: form.accessory_type === 'For Party' ? form.for_party_id : null,
          for_party_id: form.accessory_type === 'For Party' ? form.for_party_id : null,
          accessory_type: form.accessory_type
        });
      }
      setModalVisible(false);
      setEditingAccessory(null);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', 'Could not save accessory');
    }
  };

  const deleteAccessory = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await client.delete(`/accessories/${id}`);
        fetchAll();
      } catch (err) {
        alert('Could not delete item');
      }
    }
  };

  const clearFilters = () => {
    setSelectedPartyFilter('All');
    setSelectedSupplierFilter('All');
    setSelectedTypeFilter('All');
    setSelectedDateFilter('');
  };

  const hasFilters = selectedPartyFilter !== 'All' || selectedSupplierFilter !== 'All' ||
    selectedTypeFilter !== 'All' || selectedDateFilter !== '';

  const printAccessories = () => {
    const rows = filteredAccessories.map(a =>
      `<tr>
        <td>${a.name}</td>
        <td>${a.category}</td>
        <td>${a.quantity} ${a.unit || ''}</td>
        <td>PKR ${parseInt(a.unit_price || 0).toLocaleString()}</td>
        <td>${a.supplier_name || '-'}</td>
        <td>${a.for_party_name || 'General'}</td>
        <td>${a.accessory_type || 'General'}</td>
        <td>${a.purchase_date ? a.purchase_date.toString().split('T')[0] : '-'}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Accessories</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px}
        h2{color:#1e1b4b;margin-bottom:8px}
        p{color:#666;font-size:13px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:12px}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}
        tr:nth-child(even){background:#f9fafb}
        .header-logo, h2 img { width:36px !important; height:36px !important; object-fit:contain !important; background:#000 !important; border-radius:4px !important; padding:2px !important; vertical-align:middle !important; margin-right:8px !important; }
      </style></head>
      <body>
        <h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" crossorigin="anonymous"/> RS APPARELS — Accessories & Materials</h2>
        <p>Total: ${filteredAccessories.length}</p>
        <table>
          <thead><tr>
            <th>Name</th><th>Category</th><th>Qty</th><th>Unit Price</th>
            <th>Supplier</th><th>For Party</th><th>Type</th><th>Date</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
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

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterBtnText}>🔽 Filter {hasFilters ? '●' : ''}</Text>
        </TouchableOpacity>
        {hasFilters && (
          <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.printBtn} onPress={printAccessories}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name, category, supplier or party..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Qty</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Unit Price</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Supplier</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>For Party</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredAccessories.length === 0
            ? <Text style={styles.empty}>No items found.</Text>
            : filteredAccessories.map((item, index) => (
              <View key={item.id}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{item.category}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{item.quantity} {item.unit}</Text>
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    PKR {parseInt(item.unit_price || 0).toLocaleString()}
                  </Text>
                )}
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#666' }]}>
                    {item.supplier_name || '-'}
                  </Text>
                )}
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#666' }]}>
                    {item.for_party_name || 'General'}
                  </Text>
                )}
                <View style={{ flex: 1 }}>
                  <View style={[styles.typeBadge,
                    item.accessory_type === 'For Party' ? styles.typeBadgeParty : styles.typeBadgeGeneral]}>
                    <Text style={styles.typeBadgeText}>{item.accessory_type || 'General'}</Text>
                  </View>
                </View>
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1, fontSize: 11 }]}>
                    {item.purchase_date ? item.purchase_date.toString().split('T')[0] : '-'}
                  </Text>
                )}
                <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAccessory(item.id)}>
                    <Text style={styles.actionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          }
        </ScrollView>
      </View>

      {/* ADD/EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>{editingAccessory ? 'Edit Item' : 'Add Item'}</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Item name *"
                value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {['Fabric', 'Unstitched Cloth', 'Thread', 'Button', 'Zipper', 'Lining', 'Elastic', 'Other'].map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.catBtn, form.category === t && styles.catBtnActive]}
                    onPress={() => setForm({ ...form, category: t })}>
                    <Text style={[styles.catBtnText, form.category === t && styles.catBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Supplier (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <TouchableOpacity
                  style={[styles.catBtn, form.supplier_id === '' && styles.catBtnActive]}
                  onPress={() => setForm({ ...form, supplier_id: '' })}>
                  <Text style={[styles.catBtnText, form.supplier_id === '' && styles.catBtnTextActive]}>None</Text>
                </TouchableOpacity>
                {suppliers.map(s => (
                  <TouchableOpacity key={s.id}
                    style={[styles.catBtn, String(form.supplier_id) === String(s.id) && styles.catBtnActive]}
                    onPress={() => setForm({ ...form, supplier_id: String(s.id) })}>
                    <Text style={[styles.catBtnText, String(form.supplier_id) === String(s.id) && styles.catBtnTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['General', 'For Party'].map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.typeBtn, form.accessory_type === t && styles.typeBtnActive]}
                    onPress={() => setForm({ ...form, accessory_type: t, for_party_id: '' })}>
                    <Text style={[styles.typeBtnText, form.accessory_type === t && styles.typeBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.accessory_type === 'For Party' && (
                <>
                  <Text style={styles.label}>Select Party *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {parties.map(p => (
                      <TouchableOpacity key={p.id}
                        style={[styles.catBtn, String(form.for_party_id) === String(p.id) && styles.catBtnActive]}
                        onPress={() => setForm({ ...form, for_party_id: String(p.id) })}>
                        <Text style={[styles.catBtnText, String(form.for_party_id) === String(p.id) && styles.catBtnTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <TextInput style={styles.input} placeholder="Quantity"
                value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Unit (e.g. pcs, meters, kg)"
                value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} />
              <TextInput style={styles.input} placeholder="Unit price (PKR)"
                value={form.unit_price} onChangeText={(v) => setForm({ ...form, unit_price: v })}
                keyboardType="numeric" />
              <DatePicker label="Purchase Date"
                value={form.purchase_date}
                onChange={(v) => setForm({ ...form, purchase_date: v })} />
              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setEditingAccessory(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveAccessory}>
                <Text style={styles.saveText}>{editingAccessory ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FILTER MODAL */}
      <Modal visible={filterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 480, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Filter Accessories</Text>
            <ScrollView>
              <Text style={styles.label}>By Type</Text>
              <View style={styles.typeRow}>
                {['All', 'General', 'For Party'].map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.typeBtn, selectedTypeFilter === t && styles.typeBtnActive]}
                    onPress={() => setSelectedTypeFilter(t)}>
                    <Text style={[styles.typeBtnText, selectedTypeFilter === t && styles.typeBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {suppliers.length > 0 && (
                <>
                  <Text style={styles.label}>By Supplier</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                      style={[styles.catBtn, selectedSupplierFilter === 'All' && styles.catBtnActive]}
                      onPress={() => setSelectedSupplierFilter('All')}>
                      <Text style={[styles.catBtnText, selectedSupplierFilter === 'All' && styles.catBtnTextActive]}>All</Text>
                    </TouchableOpacity>
                    {suppliers.map(s => (
                      <TouchableOpacity key={s.id}
                        style={[styles.catBtn, String(selectedSupplierFilter) === String(s.id) && styles.catBtnActive]}
                        onPress={() => setSelectedSupplierFilter(String(s.id))}>
                        <Text style={[styles.catBtnText, String(selectedSupplierFilter) === String(s.id) && styles.catBtnTextActive]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {parties.length > 0 && (
                <>
                  <Text style={styles.label}>By Party</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                      style={[styles.catBtn, selectedPartyFilter === 'All' && styles.catBtnActive]}
                      onPress={() => setSelectedPartyFilter('All')}>
                      <Text style={[styles.catBtnText, selectedPartyFilter === 'All' && styles.catBtnTextActive]}>All</Text>
                    </TouchableOpacity>
                    {parties.map(p => (
                      <TouchableOpacity key={p.id}
                        style={[styles.catBtn, String(selectedPartyFilter) === String(p.id) && styles.catBtnActive]}
                        onPress={() => setSelectedPartyFilter(String(p.id))}>
                        <Text style={[styles.catBtnText, String(selectedPartyFilter) === String(p.id) && styles.catBtnTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <DatePicker label="By Purchase Date"
                value={selectedDateFilter}
                onChange={(v) => setSelectedDateFilter(v)} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { clearFilters(); setFilterModalVisible(false); }}>
                <Text style={styles.cancelText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setFilterModalVisible(false)}>
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
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd' },
  filterBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  clearFilterBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  clearFilterText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  printBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd' },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  tableContainer: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, overflow: 'hidden', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 12, paddingHorizontal: 16 },
  tableHeaderCell: { color: '#fff', fontWeight: '600', fontSize: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableCell: { fontSize: 12, color: '#374151' },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeParty: { backgroundColor: '#e0e7ff' },
  typeBadgeGeneral: { backgroundColor: '#f3f4f6' },
  typeBadgeText: { fontSize: 10, fontWeight: '600', color: '#444' },
  actionIcon: { fontSize: 18 },
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
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 580, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});