import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

import DatePicker from '../components/DatePicker';

export default function PayrollsScreen() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Fixed');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [form, setForm] = useState({
    employee_id: '', employee_name: '',
    payroll_type: 'Monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    week_start: '', week_end: '',
    basic_salary: '',
    bonus: '0', deductions: '0', advance: '0',
    notes: ''
  });
  const [payrollItems, setPayrollItems] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = payrolls.filter(p => (p.employee_type || 'Fixed') === activeTab);
    if (searchQuery) {
      result = result.filter(p =>
        (p.employee_name || p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPayrolls(result);
  }, [payrolls, activeTab, searchQuery]);

  const fetchAll = async () => {
    try {
      const [payRes, empRes, itemsRes] = await Promise.all([
        client.get('/payrolls'),
        client.get('/employees'),
        client.get('/items')
      ]);
      setPayrolls(payRes.data);
      setEmployees(empRes.data);
      setAllItems(itemsRes.data);
    } catch (err) {
      console.log('Could not fetch payrolls');
    } finally {
      setLoading(false);
    }
  };

  const fixedEmployees = employees.filter(e => (e.employee_type || 'Fixed') === 'Fixed');
  const contractEmployees = employees.filter(e => e.employee_type === 'Contract');

  const openAddModal = () => {
    setEditingPayroll(null);
    setForm({
      employee_id: '', employee_name: '',
      payroll_type: activeTab === 'Fixed' ? 'Monthly' : 'Weekly',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      week_start: '', week_end: '',
      basic_salary: '',
      bonus: '0', deductions: '0', advance: '0',
      notes: ''
    });
    setPayrollItems([]);
    setItemSearchQuery('');
    setModalVisible(true);
  };

  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setForm({
      employee_id: String(payroll.employee_id || ''),
      employee_name: payroll.employee_name || payroll.full_name || '',
      payroll_type: payroll.payroll_type || 'Monthly',
      month: payroll.month || new Date().getMonth() + 1,
      year: payroll.year || new Date().getFullYear(),
      week_start: payroll.week_start ? payroll.week_start.toString().split('T')[0] : '',
      week_end: payroll.week_end ? payroll.week_end.toString().split('T')[0] : '',
      basic_salary: String(payroll.basic_salary || ''),
      bonus: String(payroll.bonus || '0'),
      deductions: String(payroll.deductions || '0'),
      advance: String(payroll.advance || '0'),
      notes: payroll.notes || ''
    });
    // Load saved payroll items
    const savedItems = payroll.payroll_items || [];
    setPayrollItems(typeof savedItems === 'string' ? JSON.parse(savedItems) : savedItems);
    setItemSearchQuery('');
    setModalVisible(true);
  };

  const selectEmployee = (emp) => {
    setForm({
      ...form,
      employee_id: String(emp.id),
      employee_name: emp.full_name,
      payroll_type: emp.employee_type === 'Contract' ? 'Weekly' : 'Monthly',
      basic_salary: emp.employee_type === 'Contract' ? '' : String(emp.salary || '')
    });
    setPayrollItems([]);
  };

  const selectedEmp = employees.find(e => String(e.id) === String(form.employee_id));

  // Add item to payroll
  const addPayrollItem = (item) => {
    const existing = payrollItems.find(i => i.item_id === item.id);
    if (existing) {
      alert(`${item.style_no} already added!`);
      return;
    }
    setPayrollItems([...payrollItems, {
      item_id: item.id,
      style_no: item.style_no,
      description: item.description || '',
      color: item.color || '',
      party_name: item.party_name || '',
      labour_price: String(item.labour_price || '0'),
      pieces: '0',
      total: 0
    }]);
    setItemSearchQuery('');
  };

  const removePayrollItem = (item_id) => {
    setPayrollItems(payrollItems.filter(i => i.item_id !== item_id));
  };

  const updatePayrollItem = (item_id, field, value) => {
    setPayrollItems(payrollItems.map(i => {
      if (i.item_id !== item_id) return i;
      const updated = { ...i, [field]: value };
      // Recalculate total
      updated.total = parseFloat(updated.pieces || 0) * parseFloat(updated.labour_price || 0);
      return updated;
    }));
  };

  const filteredItems = allItems.filter(item =>
    itemSearchQuery.length > 0 && (
      item.style_no.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(itemSearchQuery.toLowerCase())) ||
      (item.party_name && item.party_name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
    )
  );

  // Calculations
  const grossFromItems = payrollItems.reduce((sum, i) => sum + (parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)), 0);
  const totalPieces = payrollItems.reduce((sum, i) => sum + parseFloat(i.pieces || 0), 0);
  const calcGross = () => {
    if (form.payroll_type === 'Monthly') return parseFloat(form.basic_salary || 0);
    return grossFromItems;
  };
  const calcNetPay = () => {
    const gross = calcGross();
    return gross + parseFloat(form.bonus || 0) - parseFloat(form.deductions || 0) - parseFloat(form.advance || 0);
  };

  const gross = calcGross();
  const net = calcNetPay();

  const savePayroll = async () => {
    if (!form.employee_id) { alert('Please select an employee'); return; }
    try {
      const payload = {
        ...form,
        pieces_count: totalPieces,
        net_pay: net,
        total_pay: net,
        status: 'Paid',
        payroll_items: payrollItems
      };
      if (editingPayroll) {
        await client.put(`/payrolls/${editingPayroll.id}`, payload);
      } else {
        await client.post('/payrolls', payload);
      }
      setModalVisible(false);
      setEditingPayroll(null);
      fetchAll();
    } catch (err) { alert('Could not save payroll'); }
  };

  const deletePayroll = async (id) => {
    if (window.confirm('Delete this payroll record?')) {
      try { await client.delete(`/payrolls/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const printPayroll = (p) => {
    const emp = employees.find(e => String(e.id) === String(p.employee_id));
    const isContract = p.payroll_type === 'Weekly';
    const savedItems = p.payroll_items || [];
    const pItems = typeof savedItems === 'string' ? JSON.parse(savedItems) : savedItems;
    const gross = isContract
      ? pItems.reduce((sum, i) => sum + (parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)), 0)
      : parseFloat(p.basic_salary || 0);
    const net = parseFloat(p.net_pay || p.total_pay || 0);

    const itemRows = pItems.map(i =>
      `<div class="earning-row">
        <span class="earning-label">
          <strong>${i.style_no}</strong>
          ${i.color ? ` · ${i.color}` : ''}
          ${i.party_name ? ` · ${i.party_name}` : ''}
          <br/><small style="color:#888">${parseFloat(i.pieces || 0).toLocaleString()} pcs × PKR ${parseInt(i.labour_price || 0).toLocaleString()}/pc</small>
        </span>
        <span class="earning-value blue">PKR ${(parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)).toLocaleString()}</span>
      </div>`
    ).join('');

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Payroll Slip — ${p.employee_name || p.full_name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;background:#f0f4f8;display:flex;justify-content:center;padding:40px 20px}
        .slip{background:#fff;width:460px;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
        .header{background:#1e1b4b;padding:24px;text-align:center}
        .header-logo{display:none;}
        .header-title{color:#fff;font-size:20px;font-weight:bold;letter-spacing:1px}
        .header-sub{color:#a5b4fc;font-size:13px;margin-top:4px}
        .badge{display:inline-block;background:#4361ee;color:#fff;font-size:11px;font-weight:bold;padding:3px 12px;border-radius:20px;margin-top:8px;letter-spacing:1px}
        .info-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb}
        .info-row{display:flex;justify-content:space-between;margin-bottom:6px}
        .info-label{color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
        .info-value{color:#1e1b4b;font-size:13px;font-weight:600;text-align:right}
        .earnings-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb}
        .section-title{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
        .earning-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f3f4f6}
        .earning-row:last-child{border-bottom:none}
        .earning-label{color:#374151;font-size:13px;flex:1}
        .earning-value{font-size:13px;font-weight:600;white-space:nowrap;margin-left:12px}
        .earning-value.green{color:#16a34a}
        .earning-value.red{color:#ef4444}
        .earning-value.blue{color:#4361ee}
        .gross-row{display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #e5e7eb;margin-top:4px}
        .gross-label{color:#1e1b4b;font-size:14px;font-weight:700}
        .gross-value{color:#4361ee;font-size:14px;font-weight:700}
        .deductions-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb;background:#fafafa}
        .net-section{background:#1e1b4b;padding:20px;display:flex;justify-content:space-between;align-items:center}
        .net-label{color:#a5b4fc;font-size:14px;font-weight:600;letter-spacing:1px}
        .net-value{color:#fff;font-size:28px;font-weight:bold}
        .footer{padding:16px 20px;text-align:center;background:#f8faff}
        .footer-text{color:#888;font-size:11px}
        .stamp{display:inline-block;border:2px solid #16a34a;color:#16a34a;font-size:12px;font-weight:bold;padding:4px 16px;border-radius:4px;margin-top:8px;letter-spacing:2px;transform:rotate(-5deg)}
        .summary-box{background:#eef2ff;border-radius:8px;padding:10px 16px;margin:12px 0;display:flex;justify-content:space-between}
        .summary-item{text-align:center}
        .summary-label{font-size:10px;color:#666;text-transform:uppercase}
        .summary-value{font-size:15px;font-weight:bold;color:#4361ee}
        @media print{body{background:#fff;padding:0}.slip{box-shadow:none;border-radius:0;width:100%}}
      </style></head>
      <body>
        <div class="slip">
          <div class="header">
            <img class="header-logo" src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" />
            <div class="header-title">RS APPARELS</div>
            <div class="header-sub">${isContract ? 'WEEKLY CONTRACT PAYROLL' : 'MONTHLY SALARY SLIP'}</div>
            <div class="badge">${isContract ? '📋 CONTRACT' : '👔 FIXED'}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Employee</span>
              <span class="info-value">${p.employee_name || p.full_name || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-value">${emp?.role || '-'}</span>
            </div>
            ${isContract ? `
            <div class="info-row">
              <span class="info-label">Week</span>
              <span class="info-value">${p.week_start ? p.week_start.toString().split('T')[0] : '-'} → ${p.week_end ? p.week_end.toString().split('T')[0] : '-'}</span>
            </div>
            ` : `
            <div class="info-row">
              <span class="info-label">Period</span>
              <span class="info-value">${months[(parseInt(p.month) - 1)] || '-'} ${p.year || ''}</span>
            </div>
            `}
          </div>

          ${isContract && pItems.length > 0 ? `
          <div class="earnings-section">
            <div class="section-title">🧵 Styles Worked On</div>
            ${itemRows}
            <div class="summary-box">
              <div class="summary-item">
                <div class="summary-label">Total Pieces</div>
                <div class="summary-value">${pItems.reduce((s, i) => s + parseFloat(i.pieces || 0), 0).toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Styles</div>
                <div class="summary-value">${pItems.length}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Gross Pay</div>
                <div class="summary-value">PKR ${gross.toLocaleString()}</div>
              </div>
            </div>
          </div>
          ` : `
          <div class="earnings-section">
            <div class="section-title">💼 Earnings</div>
            <div class="earning-row">
              <span class="earning-label">Basic Salary</span>
              <span class="earning-value blue">PKR ${parseInt(p.basic_salary || 0).toLocaleString()}</span>
            </div>
          </div>
          `}

          <div class="deductions-section">
            <div class="section-title">📊 Adjustments</div>
            <div class="earning-row">
              <span class="earning-label">Bonus</span>
              <span class="earning-value green">+ PKR ${parseInt(p.bonus || 0).toLocaleString()}</span>
            </div>
            <div class="earning-row">
              <span class="earning-label">Advance Deducted</span>
              <span class="earning-value red">− PKR ${parseInt(p.advance || 0).toLocaleString()}</span>
            </div>
            <div class="earning-row">
              <span class="earning-label">Other Deductions</span>
              <span class="earning-value red">− PKR ${parseInt(p.deductions || 0).toLocaleString()}</span>
            </div>
          </div>

          <div class="net-section">
            <span class="net-label">NET PAY</span>
            <span class="net-value">PKR ${net.toLocaleString()}</span>
          </div>

          <div class="footer">
            ${p.notes ? `<div class="footer-text" style="margin-bottom:8px">Notes: ${p.notes}</div>` : ''}
            <div class="stamp">✓ PAID</div>
            <div class="footer-text" style="margin-top:8px">Generated by RS APPARELS</div>
          </div>
        </div>
      </body></html>`);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    setTimeout(() => window.focus(), 100);
  };

  const printAll = () => {
    const data = filteredPayrolls;
    const totalNet = data.reduce((s, p) => s + parseFloat(p.net_pay || p.total_pay || 0), 0);
    const rows = data.map(p =>
      activeTab === 'Fixed'
        ? `<tr>
            <td>${p.employee_name || p.full_name}</td>
            <td>${months[(parseInt(p.month) - 1)] || '-'} ${p.year || ''}</td>
            <td>PKR ${parseInt(p.basic_salary || 0).toLocaleString()}</td>
            <td style="color:#16a34a">PKR ${parseInt(p.bonus || 0).toLocaleString()}</td>
            <td style="color:#ef4444">PKR ${parseInt(p.advance || 0).toLocaleString()}</td>
            <td style="color:#ef4444">PKR ${parseInt(p.deductions || 0).toLocaleString()}</td>
            <td style="font-weight:bold;color:#4361ee">PKR ${parseInt(p.net_pay || p.total_pay || 0).toLocaleString()}</td>
          </tr>`
        : `<tr>
            <td>${p.employee_name || p.full_name}</td>
            <td>${p.week_start ? p.week_start.toString().split('T')[0] : '-'} → ${p.week_end ? p.week_end.toString().split('T')[0] : '-'}</td>
            <td>${p.pieces_count || 0}</td>
            <td style="color:#16a34a">PKR ${parseInt(p.bonus || 0).toLocaleString()}</td>
            <td style="color:#ef4444">PKR ${parseInt(p.advance || 0).toLocaleString()}</td>
            <td style="color:#ef4444">PKR ${parseInt(p.deductions || 0).toLocaleString()}</td>
            <td style="font-weight:bold;color:#4361ee">PKR ${parseInt(p.net_pay || p.total_pay || 0).toLocaleString()}</td>
          </tr>`
    ).join('');

    const headers = activeTab === 'Fixed'
      ? '<th>Employee</th><th>Period</th><th>Basic Salary</th><th>Bonus</th><th>Advance</th><th>Deductions</th><th>Net Pay</th>'
      : '<th>Employee</th><th>Week</th><th>Total Pieces</th><th>Bonus</th><th>Advance</th><th>Deductions</th><th>Net Pay</th>';

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Payrolls</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:32px}
        .header{background:#1e1b4b;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
        .header-left h2{font-size:18px;margin-bottom:4px}
        .header-left p{font-size:12px;color:#a5b4fc}
        .header-right .total{font-size:22px;font-weight:bold}
        .header-right .total-label{font-size:11px;color:#a5b4fc}
        table{width:100%;border-collapse:collapse}
        th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:12px}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}
        tr:nth-child(even){background:#f9fafb}
      </style></head>
      <body>
        <div class="header">
          <div class="header-left">
            <h2><img class="header-logo" src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" /> RS APPARELS</h2>
            <p>Total Records: ${data.length}</p>
          </div>
          <div class="header-right">
            <div class="total-label">TOTAL NET PAY</div>
            <div class="total">PKR ${totalNet.toLocaleString()}</div>
          </div>
        </div>
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

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.typeTabs}>
        {['Fixed', 'Contract'].map(t => (
          <TouchableOpacity key={t}
            style={[styles.typeTab, activeTab === t && styles.typeTabActive]}
            onPress={() => setActiveTab(t)}>
            <Text style={[styles.typeTabText, activeTab === t && styles.typeTabTextActive]}>
              {t === 'Fixed' ? '👔 Fixed' : '📋 Contract'}
            </Text>
            <View style={[styles.typeTabBadge, activeTab === t ? styles.typeTabBadgeActive : styles.typeTabBadgeInactive]}>
              <Text style={[styles.typeTabBadgeText, activeTab === t && { color: '#fff' }]}>
                {payrolls.filter(p => (p.employee_type || 'Fixed') === t).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add {activeTab === 'Fixed' ? 'Monthly' : 'Weekly'} Payroll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={printAll}>
          <Text style={styles.printBtnText}>🖨️ Print All</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by employee name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.5 }]}>Employee</Text>
          {activeTab === 'Fixed' ? (
            <>
              {isDesktop && <Text style={[styles.th, { flex: 1 }]}>Period</Text>}
              {isDesktop && <Text style={[styles.th, { flex: 1.2 }]}>Basic Salary</Text>}
            </>
          ) : (
            <>
              {isDesktop && <Text style={[styles.th, { flex: 1.5 }]}>Week</Text>}
              {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Pieces</Text>}
              {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Styles</Text>}
            </>
          )}
          {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Bonus</Text>}
          {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Advance</Text>}
          {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Deduct</Text>}
          <Text style={[styles.th, { flex: 1.2 }]}>Net Pay</Text>
          <Text style={[styles.th, { flex: 0.8 }]}></Text>
        </View>
        <ScrollView>
          {filteredPayrolls.length === 0
            ? <Text style={styles.empty}>No {activeTab.toLowerCase()} payrolls found.</Text>
            : filteredPayrolls.map((p, i) => {
              const pItems = typeof (p.payroll_items || []) === 'string'
                ? JSON.parse(p.payroll_items) : (p.payroll_items || []);
              return (
                <View key={p.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                  <Text style={[styles.td, { flex: 1.5, fontWeight: '600' }]}>{p.employee_name || p.full_name}</Text>
                  {activeTab === 'Fixed' ? (
                    <>
                      {isDesktop && <Text style={[styles.td, { flex: 1 }]}>{months[(parseInt(p.month) - 1)]?.substring(0, 3)} {p.year}</Text>}
                      {isDesktop && <Text style={[styles.td, { flex: 1.2, color: '#4361ee' }]}>PKR {parseInt(p.basic_salary || 0).toLocaleString()}</Text>}
                    </>
                  ) : (
                    <>
                      {isDesktop && <Text style={[styles.td, { flex: 1.5, fontSize: 11 }]}>
                        {p.week_start ? p.week_start.toString().split('T')[0] : '-'} → {p.week_end ? p.week_end.toString().split('T')[0] : '-'}
                      </Text>}
                      {isDesktop && <Text style={[styles.td, { flex: 0.8 }]}>{p.pieces_count || 0}</Text>}
                      {isDesktop && <Text style={[styles.td, { flex: 0.8 }]}>{pItems.length} styles</Text>}
                    </>
                  )}
                  {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#16a34a' }]}>PKR {parseInt(p.bonus || 0).toLocaleString()}</Text>}
                  {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#ef4444' }]}>PKR {parseInt(p.advance || 0).toLocaleString()}</Text>}
                  {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#ef4444' }]}>PKR {parseInt(p.deductions || 0).toLocaleString()}</Text>}
                  <Text style={[styles.td, { flex: 1.2, color: '#4361ee', fontWeight: 'bold' }]}>
                    PKR {parseInt(p.net_pay || p.total_pay || 0).toLocaleString()}
                  </Text>
                  <View style={{ flex: 0.8, flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity onPress={() => printPayroll(p)}><Text style={styles.del}>🖨️</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditModal(p)}><Text style={styles.del}>✏️</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePayroll(p.id)}><Text style={styles.del}>🗑️</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })
          }
        </ScrollView>
        {filteredPayrolls.length > 0 && (
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Total Net Pay:</Text>
            <Text style={styles.subtotalValue}>
              PKR {filteredPayrolls.reduce((s, p) => s + parseFloat(p.net_pay || p.total_pay || 0), 0).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* ADD/EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>
              {editingPayroll ? 'Edit Payroll' : activeTab === 'Fixed' ? '👔 Monthly Payroll' : '📋 Weekly Payroll'}
            </Text>
            <ScrollView>

              {/* Select Employee */}
              {!editingPayroll && (
                <>
                  <Text style={styles.label}>Select Employee *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {(activeTab === 'Fixed' ? fixedEmployees : contractEmployees).map(emp => (
                      <TouchableOpacity key={emp.id}
                        style={[styles.empBtn, String(form.employee_id) === String(emp.id) && styles.empBtnActive]}
                        onPress={() => selectEmployee(emp)}>
                        <Text style={[styles.empBtnName, String(form.employee_id) === String(emp.id) && styles.empBtnNameActive]}>
                          {emp.full_name}
                        </Text>
                        <Text style={[styles.empBtnRole, String(form.employee_id) === String(emp.id) && styles.empBtnRoleActive]}>
                          {emp.role || '-'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* FIXED — Monthly */}
              {activeTab === 'Fixed' && (
                <>
                  <Text style={styles.label}>Month</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {months.map((m, idx) => (
                      <TouchableOpacity key={m}
                        style={[styles.catBtn, parseInt(form.month) === idx + 1 && styles.catBtnActive]}
                        onPress={() => setForm({ ...form, month: idx + 1 })}>
                        <Text style={[styles.catBtnText, parseInt(form.month) === idx + 1 && styles.catBtnTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput style={styles.input} placeholder="Year (e.g. 2026)"
                    value={String(form.year)} onChangeText={(v) => setForm({ ...form, year: v })}
                    keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Basic Salary (PKR)"
                    value={form.basic_salary} onChangeText={(v) => setForm({ ...form, basic_salary: v })}
                    keyboardType="numeric" />
                </>
              )}

              {/* CONTRACT — Weekly */}
              {activeTab === 'Contract' && (
                <>
                  <DatePicker label="Week Start *" value={form.week_start}
                    onChange={(v) => setForm({ ...form, week_start: v })} />
                  <DatePicker label="Week End *" value={form.week_end}
                    onChange={(v) => setForm({ ...form, week_end: v })} />

                  {/* Style Search */}
                  <Text style={styles.label}>Search & Add Styles Worked On</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="🔍 Search by style no, description or party..."
                    value={itemSearchQuery}
                    onChangeText={setItemSearchQuery}
                  />

                  {/* Search Results */}
                  {filteredItems.length > 0 && (
                    <View style={styles.searchResults}>
                      {filteredItems.slice(0, 5).map(item => (
                        <TouchableOpacity key={item.id}
                          style={styles.searchResultItem}
                          onPress={() => addPayrollItem(item)}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultStyle}>{item.style_no}</Text>
                            <Text style={styles.searchResultDesc}>
                              {item.color ? `${item.color} · ` : ''}{item.party_name || ''}{item.description ? ` · ${item.description}` : ''}
                            </Text>
                          </View>
                          <Text style={styles.searchResultPrice}>
                            PKR {parseInt(item.labour_price || 0).toLocaleString()}/pc
                          </Text>
                          <Text style={styles.searchResultAdd}>+ Add</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Added Items */}
                  {payrollItems.length > 0 && (
                    <View style={styles.addedItemsBox}>
                      <Text style={styles.label}>🧵 Styles Added ({payrollItems.length})</Text>
                      {payrollItems.map((item) => (
                        <View key={item.item_id} style={styles.addedItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.addedItemStyle}>
                              {item.style_no}{item.color ? ` · ${item.color}` : ''}
                            </Text>
                            <Text style={styles.addedItemParty}>{item.party_name || ''}</Text>
                          </View>
                          <View style={styles.addedItemControls}>
                            <View style={styles.addedItemInputGroup}>
                              <Text style={styles.addedItemLabel}>Pcs</Text>
                              <TextInput
                                style={styles.addedItemInput}
                                value={String(item.pieces)}
                                onChangeText={(v) => updatePayrollItem(item.item_id, 'pieces', v)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                            <View style={styles.addedItemInputGroup}>
                              <Text style={styles.addedItemLabel}>Rate</Text>
                              <TextInput
                                style={styles.addedItemInput}
                                value={String(item.labour_price)}
                                onChangeText={(v) => updatePayrollItem(item.item_id, 'labour_price', v)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                            <View style={styles.addedItemInputGroup}>
                              <Text style={styles.addedItemLabel}>Total</Text>
                              <Text style={styles.addedItemTotal}>
                                PKR {(parseFloat(item.pieces || 0) * parseFloat(item.labour_price || 0)).toLocaleString()}
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => removePayrollItem(item.item_id)}>
                              <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      {/* Gross calculation */}
                      <View style={styles.grossBox}>
                        <View style={styles.grossRow}>
                          <Text style={styles.grossLabel}>Total Pieces</Text>
                          <Text style={styles.grossValue}>{totalPieces.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.grossRow, { borderTopWidth: 1, borderTopColor: '#e0e7ff', paddingTop: 8, marginTop: 4 }]}>
                          <Text style={[styles.grossLabel, { fontWeight: '700', color: '#1e1b4b' }]}>Gross Pay</Text>
                          <Text style={[styles.grossValue, { color: '#4361ee', fontWeight: '700', fontSize: 16 }]}>
                            PKR {grossFromItems.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Common fields */}
              <TextInput style={styles.input} placeholder="Bonus (PKR)"
                value={String(form.bonus)} onChangeText={(v) => setForm({ ...form, bonus: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Advance Deducted (PKR)"
                value={String(form.advance)} onChangeText={(v) => setForm({ ...form, advance: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Other Deductions (PKR)"
                value={String(form.deductions)} onChangeText={(v) => setForm({ ...form, deductions: v })}
                keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />

              {/* Net Pay Preview */}
              <View style={styles.netPayBox}>
                <View>
                  <Text style={styles.netPayLabel}>NET PAY</Text>
                  {activeTab === 'Contract' && (
                    <Text style={{ color: '#6366f1', fontSize: 11, marginTop: 2 }}>
                      PKR {gross.toLocaleString()} + {form.bonus || 0} − {form.advance || 0} − {form.deductions || 0}
                    </Text>
                  )}
                </View>
                <Text style={styles.netPayValue}>PKR {net.toLocaleString()}</Text>
              </View>

            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false); setEditingPayroll(null);
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
  typeTabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12, elevation: 2 },
  typeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8 },
  typeTabActive: { backgroundColor: '#4361ee' },
  typeTabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  typeTabTextActive: { color: '#fff' },
  typeTabBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  typeTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  typeTabBadgeInactive: { backgroundColor: '#f3f4f6' },
  typeTabBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#444' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  printBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd' },
  printBtnText: { color: '#444', fontWeight: '600', fontSize: 14 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  tableContainer: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, overflow: 'hidden', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 12, paddingHorizontal: 16 },
  th: { color: '#fff', fontWeight: '600', fontSize: 12 },
  tr: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  trEven: { backgroundColor: '#f9fafb' },
  td: { fontSize: 12, color: '#374151' },
  del: { fontSize: 15, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12, borderTopWidth: 2, borderTopColor: '#1e1b4b', backgroundColor: '#f9fafb', gap: 16 },
  subtotalLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  subtotalValue: { fontSize: 16, fontWeight: 'bold', color: '#4361ee' },
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  catBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  catBtnText: { fontSize: 13, color: '#444' },
  catBtnTextActive: { color: '#fff' },
  empBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 10, minWidth: 120, alignItems: 'center', backgroundColor: '#fff' },
  empBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  empBtnName: { fontSize: 13, fontWeight: '600', color: '#1e1b4b' },
  empBtnNameActive: { color: '#fff' },
  empBtnRole: { fontSize: 11, color: '#888', marginTop: 2 },
  empBtnRoleActive: { color: '#e0e7ff' },
  searchResults: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 10, overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8 },
  searchResultStyle: { fontSize: 14, fontWeight: '600', color: '#1e1b4b' },
  searchResultDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  searchResultPrice: { fontSize: 12, color: '#4361ee', fontWeight: '600' },
  searchResultAdd: { fontSize: 12, color: '#16a34a', fontWeight: '700', marginLeft: 8 },
  addedItemsBox: { backgroundColor: '#f8faff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e0e7ff' },
  addedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  addedItemStyle: { fontSize: 13, fontWeight: '600', color: '#1e1b4b' },
  addedItemParty: { fontSize: 11, color: '#888', marginTop: 2 },
  addedItemControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addedItemInputGroup: { alignItems: 'center' },
  addedItemLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  addedItemInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, fontSize: 12, textAlign: 'center', width: 60, backgroundColor: '#fff' },
  addedItemTotal: { fontSize: 12, fontWeight: '600', color: '#4361ee', width: 80, textAlign: 'center' },
  grossBox: { backgroundColor: '#eef2ff', borderRadius: 8, padding: 10, marginTop: 10 },
  grossRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  grossLabel: { fontSize: 13, color: '#666' },
  grossValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  netPayBox: { backgroundColor: '#1e1b4b', borderRadius: 10, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netPayLabel: { fontSize: 16, fontWeight: '600', color: '#a5b4fc', letterSpacing: 1 },
  netPayValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '95%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 640, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});