import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';
import DatePicker from '../components/DatePicker';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    full_name: '', role: '', phone: '',
    cnic: '', address: '', joining_date: '', salary: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await client.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setForm({ full_name: '', role: '', phone: '', cnic: '', address: '', joining_date: '', salary: '' });
    setModalVisible(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setForm({
      full_name: emp.full_name || '',
      role: emp.role || '',
      phone: emp.phone || '',
      cnic: emp.cnic || '',
      address: emp.address || '',
      joining_date: emp.joining_date ? emp.joining_date.toString().split('T')[0] : '',
      salary: String(emp.salary || '')
    });
    setModalVisible(true);
  };

  const saveEmployee = async () => {
    if (!form.full_name) {
      Alert.alert('Error', 'Employee name is required');
      return;
    }
    try {
      if (editingEmployee) {
        await client.put(`/employees/${editingEmployee.id}`, form);
      } else {
        await client.post('/employees', form);
      }
      setModalVisible(false);
      setEditingEmployee(null);
      setForm({ full_name: '', role: '', phone: '', cnic: '', address: '', joining_date: '', salary: '' });
      fetchEmployees();
    } catch (err) {
      Alert.alert('Error', 'Could not save employee');
    }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await client.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        alert('Could not delete employee');
      }
    }
  };

  const printEmployees = () => {
    const rows = filteredEmployees.map(e =>
      `<tr>
        <td>${e.full_name}</td>
        <td>${e.role || '-'}</td>
        <td>${e.phone || '-'}</td>
        <td>${e.cnic || '-'}</td>
        <td>${e.joining_date ? e.joining_date.toString().split('T')[0] : '-'}</td>
        <td>PKR ${parseInt(e.salary || 0).toLocaleString()}</td>
        <td>${e.status}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Employees</title>
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
        <h2>✂️ Garments ERP — Employees</h2>
        <p>Total: ${filteredEmployees.length}</p>
        <table>
          <thead><tr>
            <th>Name</th><th>Role</th><th>Phone</th>
            <th>CNIC</th><th>Joining Date</th><th>Salary</th><th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.role && e.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.phone && e.phone.includes(searchQuery))
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
          <Text style={styles.addBtnText}>+ Add Employee</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printEmployees}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name, role or phone..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Role</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Phone</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Joining Date</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Salary</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredEmployees.length === 0
            ? <Text style={styles.empty}>No employees found.</Text>
            : filteredEmployees.map((emp, index) => (
              <View key={emp.id}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{emp.full_name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{emp.role || '-'}</Text>
                {isDesktop && <Text style={[styles.tableCell, { flex: 1.5 }]}>{emp.phone || '-'}</Text>}
                {isDesktop && <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {emp.joining_date ? emp.joining_date.toString().split('T')[0] : '-'}
                </Text>}
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  PKR {parseInt(emp.salary || 0).toLocaleString()}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={[styles.badge,
                    emp.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={styles.badgeText}>{emp.status}</Text>
                  </View>
                </View>
                <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => openEditModal(emp)}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEmployee(emp.id)}>
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
            <Text style={styles.modalTitle}>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Full name *"
                value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
              <TextInput style={styles.input} placeholder="Role (e.g. Tailor, Cutter)"
                value={form.role} onChangeText={(v) => setForm({ ...form, role: v })} />
              <TextInput style={styles.input} placeholder="Phone"
                value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
              <TextInput style={styles.input} placeholder="CNIC"
                value={form.cnic} onChangeText={(v) => setForm({ ...form, cnic: v })} />
              <TextInput style={styles.input} placeholder="Address"
                value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
              <DatePicker
                label="Joining Date"
                value={form.joining_date}
                onChange={(v) => setForm({ ...form, joining_date: v })}
              />
              <TextInput style={styles.input} placeholder="Basic salary (PKR)"
                value={form.salary} onChangeText={(v) => setForm({ ...form, salary: v })}
                keyboardType="numeric" />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setEditingEmployee(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEmployee}>
                <Text style={styles.saveText}>{editingEmployee ? 'Update' : 'Save'}</Text>
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
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  tableContainer: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, overflow: 'hidden', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 12, paddingHorizontal: 16 },
  tableHeaderCell: { color: '#fff', fontWeight: '600', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableCell: { fontSize: 13, color: '#374151' },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#d1fae5' },
  badgeInactive: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  actionIcon: { fontSize: 18 },
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