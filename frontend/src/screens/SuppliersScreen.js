import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';


export default function SuppliersScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '', contact_person: '',
    phone: '', email: '', address: '', city: '', notes: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await client.get('/parties');
      setSuppliers(res.data.filter(p => p.type === 'Supplier'));
    } catch (err) {
      Alert.alert('Error', 'Could not fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({ name: '', contact_person: '', phone: '', email: '', address: '', city: '', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      notes: supplier.notes || ''
    });
    setModalVisible(true);
  };

  const saveSupplier = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Supplier name is required');
      return;
    }
    try {
      if (editingSupplier) {
        await client.put(`/parties/${editingSupplier.id}`, { ...form, type: 'Supplier' });
      } else {
        await client.post('/parties', { ...form, type: 'Supplier' });
      }
      setModalVisible(false);
      setEditingSupplier(null);
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '', city: '', notes: '' });
      fetchSuppliers();
    } catch (err) {
      Alert.alert('Error', 'Could not save supplier');
    }
  };

  const deleteSupplier = async (id) => {
    if (window.confirm('Delete this supplier?')) {
      try {
        await client.delete(`/parties/${id}`);
        fetchSuppliers();
      } catch (err) {
        alert('Could not delete supplier');
      }
    }
  };

  const printSuppliers = () => {
    const rows = filteredSuppliers.map(s =>
      `<tr>
        <td>${s.name}</td>
        <td>${s.contact_person || '-'}</td>
        <td>${s.phone || '-'}</td>
        <td>${s.city || '-'}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Suppliers</title>
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
        <h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="..."/> RS APPARELS</h2> — Suppliers</h2>
        <p>Total: ${filteredSuppliers.length}</p>
        <table>
          <thead><tr>
            <th>Name</th><th>Contact</th><th>Phone</th><th>City</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Text style={styles.addBtnText}>+ Add Supplier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printSuppliers}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name, contact or city..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView>
        {filteredSuppliers.length === 0
          ? <Text style={styles.empty}>No suppliers found.</Text>
          : filteredSuppliers.map((supplier) => (
            <View key={supplier.id} style={styles.supplierCard}>
              <View style={styles.supplierLeft}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierSub}>
                  {supplier.contact_person} · {supplier.phone} · {supplier.city}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🏭 Supplier</Text>
                </View>
              </View>
              <View style={styles.supplierRight}>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => navigation.navigate('SupplierDetail', { supplier })}>
                  <Text style={styles.openBtnText}>Open ›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(supplier)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delBtn}
                  onPress={() => deleteSupplier(supplier.id)}>
                  <Text style={styles.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Supplier name *"
                value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
              <TextInput style={styles.input} placeholder="Contact person"
                value={form.contact_person} onChangeText={(v) => setForm({ ...form, contact_person: v })} />
              <TextInput style={styles.input} placeholder="Phone"
                value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
              <TextInput style={styles.input} placeholder="Email"
                value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
              <TextInput style={styles.input} placeholder="City"
                value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setEditingSupplier(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSupplier}>
                <Text style={styles.saveText}>
                  {editingSupplier ? 'Update' : 'Save'}
                </Text>
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
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  printBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd' },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  supplierCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  supplierLeft: { flex: 1 },
  supplierName: { fontSize: 15, fontWeight: '600', color: '#1e1b4b' },
  supplierSub: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  supplierRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openBtn: { backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  openBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  editBtn: { padding: 6, borderRadius: 8, backgroundColor: '#fef3c7' },
  editBtnText: { fontSize: 16 },
  delBtn: { padding: 6, borderRadius: 8, backgroundColor: '#fee2e2' },
  delBtnText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 480, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});