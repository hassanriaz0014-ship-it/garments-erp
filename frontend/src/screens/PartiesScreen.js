import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';


export default function PartiesScreen({ navigation }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '', type: 'Customer', contact_person: '',
    phone: '', email: '', address: '', city: '', notes: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchParties(); }, []);

  const fetchParties = async () => {
    try {
      const res = await client.get('/parties');
      setParties(res.data.filter(p => p.type === 'Customer'));
    } catch (err) {
      Alert.alert('Error', 'Could not fetch parties');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingParty(null);
    setForm({
      name: '', type: 'Customer', contact_person: '',
      phone: '', email: '', address: '', city: '', notes: ''
    });
    setModalVisible(true);
  };

  const openEditModal = (party) => {
    setEditingParty(party);
    setForm({
      name: party.name || '',
      type: party.type || 'Customer',
      contact_person: party.contact_person || '',
      phone: party.phone || '',
      email: party.email || '',
      address: party.address || '',
      city: party.city || '',
      notes: party.notes || ''
    });
    setModalVisible(true);
  };

  const saveParty = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Party name is required');
      return;
    }
    try {
      if (editingParty) {
        await client.put(`/parties/${editingParty.id}`, form);
      } else {
        await client.post('/parties', form);
      }
      setModalVisible(false);
      setEditingParty(null);
      setForm({
        name: '', type: 'Customer', contact_person: '',
        phone: '', email: '', address: '', city: '', notes: ''
      });
      fetchParties();
    } catch (err) {
      Alert.alert('Error', 'Could not save party');
    }
  };

  const deleteParty = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await client.delete(`/parties/${id}`);
        fetchParties();
      } catch (err) {
        alert('Could not delete party');
      }
    }
  };

  const printParties = () => {
    const rows = filteredParties.map(p =>
      `<tr>
        <td>${p.name}</td>
        <td>${p.type}</td>
        <td>${p.contact_person || '-'}</td>
        <td>${p.phone || '-'}</td>
        <td>${p.city || '-'}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Brands / Parties</title>
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
        <h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="width:40px;height:40px;object-fit:contain;vertical-align:middle;margin-right:8px;background:#000;border-radius:4px;padding:2px;"/> RS APPARELS</h2> — Brands / Parties</h2>
        <p>Total: ${filteredParties.length}</p>
        <table>
          <thead><tr>
            <th>Name</th><th>Type</th><th>Contact</th><th>Phone</th><th>City</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.contact_person && p.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Text style={styles.addBtnText}>+ Add Party</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printParties}>
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
        {filteredParties.length === 0
          ? <Text style={styles.empty}>No parties found.</Text>
          : filteredParties.map((party) => (
            <View key={party.id} style={styles.partyCard}>
              <View style={styles.partyLeft}>
                <Text style={styles.partyName}>{party.name}</Text>
                <Text style={styles.partySub}>
                  {party.contact_person} · {party.phone} · {party.city}
                </Text>
                <View style={[styles.badge,
                  party.type === 'Customer' ? styles.badgeCustomer : styles.badgeSupplier]}>
                  <Text style={styles.badgeText}>{party.type}</Text>
                </View>
              </View>
              <View style={styles.partyRight}>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => navigation.navigate('PartyDetail', { party })}>
                  <Text style={styles.openBtnText}>Open ›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(party)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delBtn}
                  onPress={() => deleteParty(party.id)}>
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
              {editingParty ? 'Edit Party' : 'Add Party'}
            </Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Name *"
                value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
              <View style={styles.typeRow}>
                {['Customer'].map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                    onPress={() => setForm({ ...form, type: t })}>
                    <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                setEditingParty(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveParty}>
                <Text style={styles.saveText}>
                  {editingParty ? 'Update' : 'Save'}
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
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  partyCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 16, marginBottom: 10, elevation: 2,
    flexDirection: 'row', alignItems: 'center'
  },
  partyLeft: { flex: 1 },
  partyName: { fontSize: 15, fontWeight: '600', color: '#1e1b4b' },
  partySub: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, marginTop: 6
  },
  badgeCustomer: { backgroundColor: '#e0e7ff' },
  badgeSupplier: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  partyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openBtn: {
    backgroundColor: '#eef2ff', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12
  },
  openBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  editBtn: {
    padding: 6, borderRadius: 8,
    backgroundColor: '#fef3c7'
  },
  editBtnText: { fontSize: 16 },
  delBtn: {
    padding: 6, borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  delBtnText: { fontSize: 16 },
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center'
  },
  typeBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  typeBtnText: { color: '#444', fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
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