import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';
import DatePicker from '../components/DatePicker';

export default function PayrollsScreen() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    employee_id: '', month: '', basic_salary: '',
    bonus: '', overtime: '', deductions: '', notes: ''
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [payrollRes, empRes] = await Promise.all([
        client.get('/payrolls'),
        client.get('/employees')
      ]);
      setPayrolls(payrollRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPayroll(null);
    setForm({ employee_id: '', month: '', basic_salary: '', bonus: '', overtime: '', deductions: '', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (pay) => {
    setEditingPayroll(pay);
    setForm({
      employee_id: String(pay.employee_id || ''),
      month: pay.month || '',
      basic_salary: String(pay.basic_salary || ''),
      bonus: String(pay.bonus || ''),
      overtime: String(pay.overtime || ''),
      deductions: String(pay.deductions || ''),
      notes: pay.notes || ''
    });
    setModalVisible(true);
  };

  const savePayroll = async () => {
    if (!form.employee_id || !form.month) {
      Alert.alert('Error', 'Employee and month are required');
      return;
    }
    try {
      if (editingPayroll) {
        await client.put(`/payrolls/${editingPayroll.id}`, form);
      } else {
        await client.post('/payrolls', form);
      }
      setModalVisible(false);
      setEditingPayroll(null);
      setForm({ employee_id: '', month: '', basic_salary: '', bonus: '', overtime: '', deductions: '', notes: '' });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Could not save payroll');
    }
  };

  const deletePayroll = async (id) => {
    if (window.confirm('Delete this payroll?')) {
      try {
        await client.delete(`/payrolls/${id}`);
        fetchData();
      } catch (err) {
        alert('Could not delete payroll');
      }
    }
  };

  const printPayrolls = () => {
    const rows = filteredPayrolls.map(p =>
      `<tr>
        <td>${p.full_name}</td>
        <td>${p.month}</td>
        <td>PKR ${parseInt(p.basic_salary || 0).toLocaleString()}</td>
        <td>PKR ${parseInt(p.bonus || 0).toLocaleString()}</td>
        <td>PKR ${parseInt(p.overtime || 0).toLocaleString()}</td>
        <td>PKR ${parseInt(p.deductions || 0).toLocaleString()}</td>
        <td><strong>PKR ${parseInt(p.net_salary || 0).toLocaleString()}</strong></td>
        <td>${p.status}</td>
      </tr>`
    ).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Payrolls</title>
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
        <h2>✂️ Garments ERP — Payrolls</h2>
        <p>Total entries: ${filteredPayrolls.length}</p>
        <table>
          <thead><tr>
            <th>Employee</th><th>Month</th><th>Basic</th>
            <th>Bonus</th><th>Overtime</th><th>Deductions</th>
            <th>Net Salary</th><th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const filteredPayrolls = payrolls.filter(p =>
    (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.month && p.month.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Text style={styles.addBtnText}>+ Add Payroll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printPayrolls}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by employee name or month..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Employee</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Month</Text>
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Basic</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Bonus</Text>}
          {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Deductions</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Net Salary</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredPayrolls.length === 0
            ? <Text style={styles.empty}>No payrolls found.</Text>
            : filteredPayrolls.map((pay, index) => (
              <View key={pay.id}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{pay.full_name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{pay.month}</Text>
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    PKR {parseInt(pay.basic_salary || 0).toLocaleString()}
                  </Text>
                )}
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    PKR {parseInt(pay.bonus || 0).toLocaleString()}
                  </Text>
                )}
                {isDesktop && (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    PKR {parseInt(pay.deductions || 0).toLocaleString()}
                  </Text>
                )}
                <Text style={[styles.tableCell, styles.netSalary, { flex: 1.5 }]}>
                  PKR {parseInt(pay.net_salary || 0).toLocaleString()}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={[styles.badge,
                    pay.status === 'Paid' ? styles.badgePaid : styles.badgePending]}>
                    <Text style={styles.badgeText}>{pay.status}</Text>
                  </View>
                </View>
                <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => openEditModal(pay)}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deletePayroll(pay.id)}>
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
            <Text style={styles.modalTitle}>{editingPayroll ? 'Edit Payroll' : 'Add Payroll'}</Text>
            <ScrollView>
              <Text style={styles.label}>Select Employee *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {employees.map((emp) => (
                  <TouchableOpacity key={emp.id}
                    style={[styles.empBtn,
                      form.employee_id === String(emp.id) && styles.empBtnActive]}
                    onPress={() => setForm({ ...form, employee_id: String(emp.id) })}>
                    <Text style={[styles.empBtnText,
                      form.employee_id === String(emp.id) && styles.empBtnTextActive]}>
                      {emp.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <DatePicker
                label="Month *"
                value={form.month}
                onChange={(v) => setForm({ ...form, month: v })}
                type="month"
              />
              <TextInput style={styles.input} placeholder="Basic salary (PKR)"
                value={form.basic_salary} onChangeText={(v) => setForm({ ...form, basic_salary: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Bonus (PKR)"
                value={form.bonus} onChangeText={(v) => setForm({ ...form, bonus: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Overtime (PKR)"
                value={form.overtime} onChangeText={(v) => setForm({ ...form, overtime: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Deductions (PKR)"
                value={form.deductions} onChangeText={(v) => setForm({ ...form, deductions: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setEditingPayroll(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePayroll}>
                <Text style={styles.saveText}>{editingPayroll ? 'Update' : 'Save'}</Text>
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
  netSalary: { color: '#4361ee', fontWeight: '600' },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  actionIcon: { fontSize: 18 },
  label: { fontSize: 13, color: '#444', marginBottom: 6 },
  empBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8, paddingHorizontal: 14 },
  empBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  empBtnText: { color: '#444', fontWeight: '500' },
  empBtnTextActive: { color: '#fff' },
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