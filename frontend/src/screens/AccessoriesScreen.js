import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

export default function AccessoriesScreen() {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'Fabric',
    quantity: '', unit: '', unit_price: '', notes: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchAccessories(); }, []);

  const fetchAccessories = async () => {
    try {
      const res = await client.get('/accessories');
      setAccessories(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch accessories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAccessory(null);
    setForm({ name: '', category: 'Fabric', quantity: '', unit: '', unit_price: '', notes: '' });
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
      notes: acc.notes || ''
    });
    setModalVisible(true);
  };

  const saveAccessory = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Item name is required');
      return;
    }
    try {
      if (editingAccessory) {
        await client.put(`/accessories/${editingAccessory.id}`, form);
      } else {
        await client.post('/accessories', form);
      }
      setModalVisible(false);
      setEditingAccessory(null);
      setForm({ name: '', category: 'Fabric', quantity: '', unit: '', unit_price: '', notes: '' });
      fetchAccessories();
    } catch (err) {
      Alert.alert('Error', 'Could not save accessory');
    }
  };

  const deleteAccessory = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await client.delete(`/accessories/${id}`);
        fetchAccessories();
      } catch (err) {
        alert('Could not delete item');
      }
    }
  };

  const printAccessories = () => {
    const rows = filteredAccessories.map(a =>
      `<tr>
        <td>${a.name}</td>
        <td>${a.category}</td>
        <td>${a.quantity} ${a.unit || ''}</td>
        <td>PKR ${parseInt(a.unit_price || 0).toLocaleString()}</td>
        <td>${a.notes || '-'}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Accessories</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px}
        h2{color:#1e1b4b;margin-bottom:8px}
        p{color:#666;font-size:13px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        tr:nth-child(even){background:#f9fafb}
      </style></head>
      <body>
        <h2>✂️ Garments ERP — Accessories & Materials</h2>
        <p>Total items: ${filteredAccessories.length}</p>
        <table>
          <thead><tr>
            <th>Name</th><th>Category</th><th>Quantity</th><th>Unit Price</th><th>Notes</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const filteredAccessories = accessories.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printAccessories}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name or category..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Quantity</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Unit Price</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Notes</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredAccessories.length === 0
            ? <Text style={styles.empty}>No items found.</Text>
            : filteredAccessories.map((item, index) => (
              <View key={item.id}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.category}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.quantity} {item.unit}
                </Text>
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    PKR {parseInt(item.unit_price || 0).toLocaleString()}
                  </Text>
                )}
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.notes || '-'}</Text>
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
                    <Text style={[styles.catBtnText, form.category === t && styles.catBtnTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={styles.input} placeholder="Quantity"
                value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Unit (e.g. pcs, meters, kg)"
                value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} />
              <TextInput style={styles.input} placeholder="Unit price (PKR)"
                value={form.unit_price} onChangeText={(v) => setForm({ ...form, unit_price: v })}
                keyboardType="numeric" />
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addBtn: {
    backgroundColor: '#4361ee', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  tableContainer: {
    backgroundColor: '#fff', borderRadius: 10,
    elevation: 2, overflow: 'hidden', flex: 1
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#1e1b4b',
    paddingVertical: 12, paddingHorizontal: 16
  },
  tableHeaderCell: { color: '#fff', fontWeight: '600', fontSize: 13 },
  tableRow: {
    flexDirection: 'row', paddingVertical: 12,
    paddingHorizontal: 16, alignItems: 'center'
  },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableCell: { fontSize: 13, color: '#374151' },
  actionIcon: { fontSize: 18 },
  label: { fontSize: 13, color: '#444', marginBottom: 6 },
  catBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#ddd', marginRight: 8
  },
  catBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  catBtnText: { fontSize: 13, color: '#444' },
  catBtnTextActive: { color: '#fff' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end', alignItems: 'center'
  },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24,
    maxHeight: '90%', width: '100%'
  },
  modalDesktop: { borderRadius: 16, width: 480, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 11, fontSize: 14, marginBottom: 10
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center'
  },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: '#4361ee', alignItems: 'center'
  },
  saveText: { color: '#fff', fontWeight: '600' }
});