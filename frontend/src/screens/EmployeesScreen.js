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
  const [activeTab, setActiveTab] = useState('Fixed');
  const [form, setForm] = useState({
    full_name: '', role: '', phone: '', cnic: '',
    address: '', joining_date: '', salary: '',
    employee_type: 'Fixed',
    rate_per_piece: '', rate_per_day: '', rate_per_order: ''
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
    setForm({
      full_name: '', role: '', phone: '', cnic: '',
      address: '', joining_date: '', salary: '',
      employee_type: activeTab,
      rate_per_piece: '', rate_per_day: '', rate_per_order: ''
    });
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
      salary: String(emp.salary || ''),
      employee_type: emp.employee_type || 'Fixed',
      rate_per_piece: String(emp.rate_per_piece || ''),
      rate_per_day: String(emp.rate_per_day || ''),
      rate_per_order: String(emp.rate_per_order || '')
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

  const printEmployees = (type) => {
    const data = filteredByType(type);
    const rows = data.map(e =>
      type === 'Fixed'
        ? `<tr>
            <td>${e.full_name}</td>
            <td>${e.role || '-'}</td>
            <td>${e.phone || '-'}</td>
            <td>${e.joining_date ? e.joining_date.toString().split('T')[0] : '-'}</td>
            <td>PKR ${parseInt(e.salary || 0).toLocaleString()}</td>
            <td>${e.status}</td>
          </tr>`
        : `<tr>
            <td>${e.full_name}</td>
            <td>${e.role || '-'}</td>
            <td>${e.phone || '-'}</td>
            <td>${e.joining_date ? e.joining_date.toString().split('T')[0] : '-'}</td>
            <td>PKR ${parseInt(e.rate_per_piece || 0).toLocaleString()}</td>
            <td>PKR ${parseInt(e.rate_per_day || 0).toLocaleString()}</td>
            <td>PKR ${parseInt(e.rate_per_order || 0).toLocaleString()}</td>
            <td>${e.status}</td>
          </tr>`
    ).join('');

    const headers = type === 'Fixed'
      ? '<th>Name</th><th>Role</th><th>Phone</th><th>Joining Date</th><th>Salary</th><th>Status</th>'
      : '<th>Name</th><th>Role</th><th>Phone</th><th>Joining Date</th><th>Per Piece</th><th>Per Day</th><th>Per Order</th><th>Status</th>';

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>${type} Employees</title>
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
        <h2><img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" style="width:40px;height:40px;object-fit:contain;vertical-align:middle;margin-right:8px;background:#000;border-radius:4px;padding:2px;"/> RS APPARELS</h2> — ${type} Employees</h2>
        <p>Total: ${data.length}</p>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const filteredByType = (type) => employees
    .filter(e => (e.employee_type || 'Fixed') === type)
    .filter(e =>
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.role && e.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.phone && e.phone.includes(searchQuery))
    );

  const fixedEmployees = filteredByType('Fixed');
  const contractEmployees = filteredByType('Contract');

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  const renderTable = (data, type) => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Role</Text>
        {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Phone</Text>}
        {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Joining</Text>}
        {type === 'Fixed'
          ? <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Salary</Text>
          : <>
            {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Per Piece</Text>}
            {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Per Day</Text>}
            {isDesktop && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Per Order</Text>}
          </>
        }
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}></Text>
      </View>
      <ScrollView>
        {data.length === 0
          ? <Text style={styles.empty}>No {type.toLowerCase()} employees found.</Text>
          : data.map((emp, index) => (
            <View key={emp.id}
              style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{emp.full_name}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{emp.role || '-'}</Text>
              {isDesktop && <Text style={[styles.tableCell, { flex: 1.5 }]}>{emp.phone || '-'}</Text>}
              {isDesktop && <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {emp.joining_date ? emp.joining_date.toString().split('T')[0] : '-'}
              </Text>}
              {type === 'Fixed'
                ? <Text style={[styles.tableCell, { flex: 1.2, color: '#4361ee', fontWeight: '600' }]}>
                    PKR {parseInt(emp.salary || 0).toLocaleString()}
                  </Text>
                : <>
                  {isDesktop && <Text style={[styles.tableCell, { flex: 1, color: '#16a34a', fontWeight: '600' }]}>
                    PKR {parseInt(emp.rate_per_piece || 0).toLocaleString()}
                  </Text>}
                  {isDesktop && <Text style={[styles.tableCell, { flex: 1, color: '#16a34a', fontWeight: '600' }]}>
                    PKR {parseInt(emp.rate_per_day || 0).toLocaleString()}
                  </Text>}
                  {isDesktop && <Text style={[styles.tableCell, { flex: 1, color: '#16a34a', fontWeight: '600' }]}>
                    PKR {parseInt(emp.rate_per_order || 0).toLocaleString()}
                  </Text>}
                </>
              }
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
  );

  return (
    <View style={styles.container}>

      {/* Type tabs */}
      <View style={styles.typeTabs}>
        {['Fixed', 'Contract'].map(t => (
          <TouchableOpacity key={t}
            style={[styles.typeTab, activeTab === t && styles.typeTabActive]}
            onPress={() => setActiveTab(t)}>
            <Text style={[styles.typeTabText, activeTab === t && styles.typeTabTextActive]}>
              {t === 'Fixed' ? '👔 Fixed' : '📋 Contract'}
            </Text>
            <View style={[styles.typeTabBadge,
              activeTab === t ? styles.typeTabBadgeActive : styles.typeTabBadgeInactive]}>
              <Text style={styles.typeTabBadgeText}>
                {t === 'Fixed' ? fixedEmployees.length : contractEmployees.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add {activeTab} Employee</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={() => printEmployees(activeTab)}>
          <Text style={styles.printBtnText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name, role or phone..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {activeTab === 'Fixed' ? renderTable(fixedEmployees, 'Fixed') : renderTable(contractEmployees, 'Contract')}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>
              {editingEmployee ? 'Edit Employee' : `Add ${form.employee_type} Employee`}
            </Text>
            <ScrollView>
              {/* Employee type selector - only for new */}
              {!editingEmployee && (
                <>
                  <Text style={styles.label}>Employee Type</Text>
                  <View style={styles.segmentRow}>
                    {['Fixed', 'Contract'].map(t => (
                      <TouchableOpacity key={t}
                        style={[styles.segmentBtn, form.employee_type === t && styles.segmentBtnActive]}
                        onPress={() => setForm({ ...form, employee_type: t })}>
                        <Text style={[styles.segmentBtnText, form.employee_type === t && styles.segmentBtnTextActive]}>
                          {t === 'Fixed' ? '👔 Fixed' : '📋 Contract'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

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
              <DatePicker label="Joining Date"
                value={form.joining_date}
                onChange={(v) => setForm({ ...form, joining_date: v })} />

              {form.employee_type === 'Fixed' ? (
                <TextInput style={styles.input} placeholder="Monthly salary (PKR)"
                  value={form.salary} onChangeText={(v) => setForm({ ...form, salary: v })}
                  keyboardType="numeric" />
              ) : (
                <View style={styles.ratesBox}>
                  <Text style={styles.ratesTitle}>💰 Contract Rates</Text>
                  <TextInput style={styles.input} placeholder="Rate per piece (PKR)"
                    value={form.rate_per_piece} onChangeText={(v) => setForm({ ...form, rate_per_piece: v })}
                    keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Rate per day (PKR)"
                    value={form.rate_per_day} onChangeText={(v) => setForm({ ...form, rate_per_day: v })}
                    keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Rate per order (PKR)"
                    value={form.rate_per_order} onChangeText={(v) => setForm({ ...form, rate_per_order: v })}
                    keyboardType="numeric" />
                </View>
              )}
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
  typeTabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12, elevation: 2 },
  typeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8 },
  typeTabActive: { backgroundColor: '#4361ee' },
  typeTabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  typeTabTextActive: { color: '#fff' },
  typeTabBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  typeTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  typeTabBadgeInactive: { backgroundColor: '#f3f4f6' },
  typeTabBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
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
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  segmentBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  segmentBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  segmentBtnTextActive: { color: '#fff' },
  ratesBox: { backgroundColor: '#f8faff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e0e7ff' },
  ratesTitle: { fontSize: 14, fontWeight: '600', color: '#1e1b4b', marginBottom: 10 },
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