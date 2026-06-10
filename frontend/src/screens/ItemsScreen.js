import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

export default function ItemsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    style_no: '', description: '', color: '',
    size: '', price: '', image_url: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await client.get('/items');
      setItems(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch items');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm({ style_no: '', description: '', color: '', size: '', price: '', image_url: '' });
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      style_no: item.style_no || '',
      description: item.description || '',
      color: item.color || '',
      size: item.size || '',
      price: String(item.price || ''),
      image_url: item.image_url || ''
    });
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!form.style_no || !form.price) {
      Alert.alert('Error', 'Style number and price are required');
      return;
    }
    try {
      if (editingItem) {
        await client.put(`/items/${editingItem.id}`, form);
      } else {
        await client.post('/items', form);
      }
      setModalVisible(false);
      setEditingItem(null);
      setForm({ style_no: '', description: '', color: '', size: '', price: '', image_url: '' });
      fetchItems();
    } catch (err) {
      Alert.alert('Error', 'Could not save item');
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await client.delete(`/items/${id}`);
        fetchItems();
      } catch (err) {
        alert('Could not delete item');
      }
    }
  };

  const printItems = () => {
    const rows = filteredItems.map(i =>
      `<tr>
        <td>${i.style_no}</td>
        <td>${i.description || '-'}</td>
        <td>${i.color || '-'}</td>
        <td>${i.size || '-'}</td>
        <td>PKR ${parseInt(i.price || 0).toLocaleString()}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Items</title>
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
        <h2>✂️ Garments ERP — Items / Styles</h2>
        <p>Total: ${filteredItems.length}</p>
        <table>
          <thead><tr>
            <th>Style No</th><th>Description</th>
            <th>Color</th><th>Size</th><th>Price</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const filteredItems = items.filter(i =>
    i.style_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.color && i.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.size && i.size.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <TouchableOpacity style={styles.printBtn} onPress={printItems}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by style, color, size..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Style No</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Color</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Size</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Price</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredItems.length === 0
            ? <Text style={styles.empty}>No items found.</Text>
            : filteredItems.map((item, index) => (
              <View key={item.id}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.style_no}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.description || '-'}</Text>
                {isDesktop && <Text style={[styles.tableCell, { flex: 1 }]}>{item.color || '-'}</Text>}
                {isDesktop && <Text style={[styles.tableCell, { flex: 1 }]}>{item.size || '-'}</Text>}
                <Text style={[styles.tableCell, { flex: 1, color: '#4361ee', fontWeight: '600' }]}>
                  PKR {parseInt(item.price || 0).toLocaleString()}
                </Text>
                <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item.id)}>
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
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item / Style'}</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Style number * (e.g. ST-001)"
                value={form.style_no} onChangeText={(v) => setForm({ ...form, style_no: v })} />
              <TextInput style={styles.input} placeholder="Description"
                value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
              <TextInput style={styles.input} placeholder="Color"
                value={form.color} onChangeText={(v) => setForm({ ...form, color: v })} />
              <TextInput style={styles.input} placeholder="Size (e.g. S, M, L, XL)"
                value={form.size} onChangeText={(v) => setForm({ ...form, size: v })} />
              <TextInput style={styles.input} placeholder="Price (PKR) *"
                value={form.price} onChangeText={(v) => setForm({ ...form, price: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Image URL (optional)"
                value={form.image_url} onChangeText={(v) => setForm({ ...form, image_url: v })} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setEditingItem(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                <Text style={styles.saveText}>{editingItem ? 'Update' : 'Save'}</Text>
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