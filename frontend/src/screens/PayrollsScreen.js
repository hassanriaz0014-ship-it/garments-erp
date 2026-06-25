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
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [activeTab, setActiveTab] = useState('Fixed');
  const [activeGroup, setActiveGroup] = useState(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Period selector state
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [newPeriodForm, setNewPeriodForm] = useState({
    type: 'Weekly',
    week_start: '',
    week_end: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [form, setForm] = useState({
    employee_id: '', employee_name: '',
    payroll_type: 'Weekly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    week_start: '', week_end: '',
    basic_salary: '',
    bonus: '0', deductions: '0', advance: '0',
    notes: ''
  });
  const [payrollItems, setPayrollItems] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = dateStr.toString().split('T')[0];
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  useEffect(() => { fetchAll(); }, []);

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

  // Get payrolls for current tab
  const tabPayrolls = payrolls.filter(p => {
    const type = p.employee_type || 'Fixed';
    if (activeTab !== type) return false;
    if (searchQuery) {
      return (p.employee_name || p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Group payrolls by period
  const getGroupKey = (p) => {
    if (activeTab === 'Fixed' && (p.payroll_type === 'Monthly' || !p.week_start)) {
      return `month_${p.year}_${p.month}`;
    }
    const start = formatDate(p.week_start);
    const end = formatDate(p.week_end);
    return `week_${start}_${end}`;
  };

  const getGroupLabel = (p) => {
    if (activeTab === 'Fixed' && (p.payroll_type === 'Monthly' || !p.week_start)) {
      return `${months[(parseInt(p.month) - 1)] || ''} ${p.year || ''}`;
    }
    return `${formatDate(p.week_start)} → ${formatDate(p.week_end)}`;
  };

  const groups = {};
  tabPayrolls.forEach(p => {
    const key = getGroupKey(p);
    const label = getGroupLabel(p);
    if (!groups[key]) groups[key] = { key, label, payrolls: [], type: p.payroll_type };
    groups[key].payrolls.push(p);
  });

  // Sort groups by date descending
  const sortedGroups = Object.values(groups).sort((a, b) => {
    const aDate = a.payrolls[0]?.week_start || `${a.payrolls[0]?.year}-${String(a.payrolls[0]?.month).padStart(2,'0')}`;
    const bDate = b.payrolls[0]?.week_start || `${b.payrolls[0]?.year}-${String(b.payrolls[0]?.month).padStart(2,'0')}`;
    return bDate > aDate ? 1 : -1;
  });

  // Set first group as active if none selected
  useEffect(() => {
    if (sortedGroups.length > 0 && !activeGroup) {
      setActiveGroup(sortedGroups[0].key);
    }
  }, [payrolls, activeTab]);

  useEffect(() => {
    setActiveGroup(null);
  }, [activeTab]);

  const currentGroup = groups[activeGroup];
  const currentPayrolls = currentGroup?.payrolls || [];

  const openAddForPeriod = () => {
    if (!selectedPeriod) { alert('Please select or create a period first'); return; }
    setEditingPayroll(null);
    setForm({
      employee_id: '', employee_name: '',
      payroll_type: selectedPeriod.type,
      month: selectedPeriod.month || new Date().getMonth() + 1,
      year: selectedPeriod.year || new Date().getFullYear(),
      week_start: selectedPeriod.week_start || '',
      week_end: selectedPeriod.week_end || '',
      basic_salary: '',
      bonus: '0', deductions: '0', advance: '0',
      notes: ''
    });
    setPayrollItems([]);
    setItemSearchQuery('');
    setModalVisible(true);
  };

  const openAddModal = () => {
    // Open period selector first
    setPeriodModalVisible(true);
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
      basic_salary: emp.employee_type === 'Contract' ? '' : String(emp.salary || '')
    });
    setPayrollItems([]);
  };

  const addPayrollItem = (item) => {
    const existing = payrollItems.find(i => i.item_id === item.id);
    if (existing) { alert(`${item.style_no} already added!`); return; }
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

  const grossFromItems = payrollItems.reduce((sum, i) => sum + (parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)), 0);
  const totalPieces = payrollItems.reduce((sum, i) => sum + parseFloat(i.pieces || 0), 0);

  const isContractTab = activeTab === 'Contract';
  const isWeeklyFixed = form.payroll_type === 'Weekly';

  const calcGross = () => {
    if (isContractTab || isWeeklyFixed) return grossFromItems;
    return parseFloat(form.basic_salary || 0);
  };

  const calcNetPay = () => {
    const g = calcGross();
    return g + parseFloat(form.bonus || 0) - parseFloat(form.deductions || 0) - parseFloat(form.advance || 0);
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

  const printSingle = (p) => {
    const emp = employees.find(e => String(e.id) === String(p.employee_id));
    const isContract = (p.employee_type || 'Fixed') === 'Contract';
    const savedItems = p.payroll_items || [];
    const pItems = typeof savedItems === 'string' ? JSON.parse(savedItems) : savedItems;
    const grossAmt = isContract || p.payroll_type === 'Weekly'
      ? pItems.reduce((sum, i) => sum + (parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)), 0)
      : parseFloat(p.basic_salary || 0);
    const netAmt = parseFloat(p.net_pay || p.total_pay || 0);

    const itemRows = pItems.map(i =>
      `<div class="earning-row">
        <span class="earning-label"><strong>${i.style_no}</strong>${i.color ? ` · ${i.color}` : ''}${i.party_name ? ` · ${i.party_name}` : ''}<br/>
        <small style="color:#888">${parseFloat(i.pieces || 0).toLocaleString()} pcs × PKR ${parseInt(i.labour_price || 0).toLocaleString()}/pc</small></span>
        <span class="earning-value blue">PKR ${(parseFloat(i.pieces || 0) * parseFloat(i.labour_price || 0)).toLocaleString()}</span>
      </div>`
    ).join('');

    const periodText = p.payroll_type === 'Monthly'
      ? `${months[(parseInt(p.month) - 1)] || '-'} ${p.year || ''}`
      : `${formatDate(p.week_start)} → ${formatDate(p.week_end)}`;

    const win = window.open('', '_blank', 'width=700,height=800,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Payroll — ${p.employee_name || p.full_name}</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#f0f4f8;display:flex;justify-content:center;padding:40px 20px}.slip{background:#fff;width:460px;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15)}.header{background:#1e1b4b;padding:24px;text-align:center}.header-logo{width:40px;height:40px;object-fit:contain;background:#000;border-radius:4px;padding:2px;margin-bottom:8px}.header-title{color:#fff;font-size:20px;font-weight:bold}.header-sub{color:#a5b4fc;font-size:13px;margin-top:4px}.badge{display:inline-block;background:#4361ee;color:#fff;font-size:11px;font-weight:bold;padding:3px 12px;border-radius:20px;margin-top:8px}.info-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb}.info-row{display:flex;justify-content:space-between;margin-bottom:6px}.info-label{color:#888;font-size:12px;text-transform:uppercase}.info-value{color:#1e1b4b;font-size:13px;font-weight:600}.earnings-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb}.section-title{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:10px}.earning-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f3f4f6}.earning-label{color:#374151;font-size:13px;flex:1}.earning-value{font-size:13px;font-weight:600;margin-left:12px}.earning-value.green{color:#16a34a}.earning-value.red{color:#ef4444}.earning-value.blue{color:#4361ee}.deductions-section{padding:16px 20px;border-bottom:2px dashed #e5e7eb;background:#fafafa}.net-section{background:#1e1b4b;padding:20px;display:flex;justify-content:space-between;align-items:center}.net-label{color:#a5b4fc;font-size:14px;font-weight:600}.net-value{color:#fff;font-size:28px;font-weight:bold}.footer{padding:16px 20px;text-align:center;background:#f8faff}.footer-text{color:#888;font-size:11px}.stamp{display:inline-block;border:2px solid #16a34a;color:#16a34a;font-size:12px;font-weight:bold;padding:4px 16px;border-radius:4px;margin-top:8px;letter-spacing:2px;transform:rotate(-5deg)}.summary-box{background:#eef2ff;border-radius:8px;padding:10px 16px;margin:12px 0;display:flex;justify-content:space-between}.summary-item{text-align:center}.summary-label{font-size:10px;color:#666;text-transform:uppercase}.summary-value{font-size:15px;font-weight:bold;color:#4361ee}@media print{body{background:#fff;padding:0}.slip{box-shadow:none;border-radius:0;width:100%}}</style></head>
      <body><div class="slip">
        <div class="header">
          <img class="header-logo" src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" crossorigin="anonymous"/>
          <div class="header-title">RS APPARELS</div>
          <div class="header-sub">${isContract ? 'WEEKLY CONTRACT PAYROLL' : p.payroll_type === 'Weekly' ? 'WEEKLY SALARY SLIP' : 'MONTHLY SALARY SLIP'}</div>
          <div class="badge">${isContract ? '📋 CONTRACT' : '👔 FIXED'}</div>
        </div>
        <div class="info-section">
          <div class="info-row"><span class="info-label">Employee</span><span class="info-value">${p.employee_name || p.full_name || '-'}</span></div>
          <div class="info-row"><span class="info-label">Role</span><span class="info-value">${emp?.role || '-'}</span></div>
          <div class="info-row"><span class="info-label">Period</span><span class="info-value">${periodText}</span></div>
        </div>
        ${(isContract || p.payroll_type === 'Weekly') && pItems.length > 0 ? `
        <div class="earnings-section">
          <div class="section-title">🧵 Styles Worked On</div>
          ${itemRows}
          <div class="summary-box">
            <div class="summary-item"><div class="summary-label">Total Pieces</div><div class="summary-value">${pItems.reduce((s,i) => s + parseFloat(i.pieces||0), 0).toLocaleString()}</div></div>
            <div class="summary-item"><div class="summary-label">Styles</div><div class="summary-value">${pItems.length}</div></div>
            <div class="summary-item"><div class="summary-label">Gross Pay</div><div class="summary-value">PKR ${grossAmt.toLocaleString()}</div></div>
          </div>
        </div>` : `
        <div class="earnings-section">
          <div class="section-title">💼 Earnings</div>
          <div class="earning-row"><span class="earning-label">Basic Salary</span><span class="earning-value blue">PKR ${parseInt(p.basic_salary||0).toLocaleString()}</span></div>
        </div>`}
        <div class="deductions-section">
          <div class="section-title">📊 Adjustments</div>
          <div class="earning-row"><span class="earning-label">Bonus</span><span class="earning-value green">+ PKR ${parseInt(p.bonus||0).toLocaleString()}</span></div>
          <div class="earning-row"><span class="earning-label">Advance Deducted</span><span class="earning-value red">− PKR ${parseInt(p.advance||0).toLocaleString()}</span></div>
          <div class="earning-row"><span class="earning-label">Other Deductions</span><span class="earning-value red">− PKR ${parseInt(p.deductions||0).toLocaleString()}</span></div>
        </div>
        <div class="net-section"><span class="net-label">NET PAY</span><span class="net-value">PKR ${netAmt.toLocaleString()}</span></div>
        <div class="footer">${p.notes ? `<div class="footer-text" style="margin-bottom:8px">Notes: ${p.notes}</div>` : ''}<div class="stamp">✓ PAID</div><div class="footer-text" style="margin-top:8px">Generated by RS APPARELS</div></div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},500);},500);};</script>
      </body></html>`);
    win.document.close();
    window.focus();
  };

  const printGroup = (group) => {
    const data = group.payrolls;
    const totalNet = data.reduce((s, p) => s + parseFloat(p.net_pay || p.total_pay || 0), 0);
    const isWeekly = group.type !== 'Monthly';

    const rows = data.map(p => {
      const pItems = typeof (p.payroll_items || []) === 'string' ? JSON.parse(p.payroll_items) : (p.payroll_items || []);
      return isWeekly
        ? `<tr><td>${p.employee_name || p.full_name}</td><td>${pItems.length} styles</td><td>${p.pieces_count || 0}</td>
           <td style="color:#16a34a">PKR ${parseInt(p.bonus||0).toLocaleString()}</td>
           <td style="color:#ef4444">PKR ${parseInt(p.advance||0).toLocaleString()}</td>
           <td style="color:#ef4444">PKR ${parseInt(p.deductions||0).toLocaleString()}</td>
           <td style="font-weight:bold;color:#4361ee">PKR ${parseInt(p.net_pay||p.total_pay||0).toLocaleString()}</td></tr>`
        : `<tr><td>${p.employee_name || p.full_name}</td>
           <td>PKR ${parseInt(p.basic_salary||0).toLocaleString()}</td>
           <td style="color:#16a34a">PKR ${parseInt(p.bonus||0).toLocaleString()}</td>
           <td style="color:#ef4444">PKR ${parseInt(p.advance||0).toLocaleString()}</td>
           <td style="color:#ef4444">PKR ${parseInt(p.deductions||0).toLocaleString()}</td>
           <td style="font-weight:bold;color:#4361ee">PKR ${parseInt(p.net_pay||p.total_pay||0).toLocaleString()}</td></tr>`;
    }).join('');

    const headers = isWeekly
      ? '<th>Employee</th><th>Styles</th><th>Pieces</th><th>Bonus</th><th>Advance</th><th>Deductions</th><th>Net Pay</th>'
      : '<th>Employee</th><th>Basic Salary</th><th>Bonus</th><th>Advance</th><th>Deductions</th><th>Net Pay</th>';

    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Payroll — ${group.label}</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px}.header{background:#1e1b4b;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}.header-left h2{font-size:18px;margin-bottom:4px;display:flex;align-items:center;gap:8px}.header-left p{font-size:12px;color:#a5b4fc}.header-logo{width:36px;height:36px;object-fit:contain;background:#000;border-radius:4px;padding:2px}.header-right .total{font-size:22px;font-weight:bold}.header-right .total-label{font-size:11px;color:#a5b4fc}table{width:100%;border-collapse:collapse}th{background:#1e1b4b;color:#fff;padding:10px 12px;text-align:left;font-size:12px}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}tr:nth-child(even){background:#f9fafb}.footer-total{display:flex;justify-content:flex-end;padding:12px;border-top:2px solid #1e1b4b;font-weight:bold;font-size:14px;color:#4361ee}</style></head>
      <body>
        <div class="header">
          <div class="header-left">
            <h2><img class="header-logo" src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" crossorigin="anonymous"/> RS APPARELS</h2>
            <p>${activeTab} Payroll · ${group.label} · ${data.length} employees</p>
          </div>
          <div class="header-right">
            <div class="total-label">TOTAL NET PAY</div>
            <div class="total">PKR ${totalNet.toLocaleString()}</div>
          </div>
        </div>
        <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
        <div class="footer-total">Total Net Pay: PKR ${totalNet.toLocaleString()}</div>
        <script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},500);},500);};</script>
      </body></html>`);
    win.document.close();
    window.focus();
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4361ee" /></View>
  );

  return (
    <View style={styles.container}>

      {/* Fixed/Contract Tabs */}
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

      <View style={styles.mainLayout}>

        {/* LEFT — Period List */}
        <View style={styles.periodList}>
          <TouchableOpacity style={styles.addPeriodBtn} onPress={openAddModal}>
            <Text style={styles.addPeriodBtnText}>+ New Payroll</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView>
            {sortedGroups.length === 0
              ? <Text style={styles.emptyPeriod}>No payrolls yet</Text>
              : sortedGroups.map(group => {
                  const groupTotal = group.payrolls.reduce((s, p) => s + parseFloat(p.net_pay || p.total_pay || 0), 0);
                  const isActive = activeGroup === group.key;
                  return (
                    <TouchableOpacity key={group.key}
                      style={[styles.periodItem, isActive && styles.periodItemActive]}
                      onPress={() => setActiveGroup(group.key)}>
                      <Text style={[styles.periodItemLabel, isActive && styles.periodItemLabelActive]}>
                        {group.label}
                      </Text>
                      <Text style={[styles.periodItemCount, isActive && styles.periodItemCountActive]}>
                        {group.payrolls.length} emp
                      </Text>
                      <Text style={[styles.periodItemTotal, isActive && styles.periodItemTotalActive]}>
                        PKR {groupTotal.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })
            }
          </ScrollView>
        </View>

        {/* RIGHT — Payroll List for selected period */}
        <View style={styles.payrollList}>
          {currentGroup ? (
            <>
              <View style={styles.groupActions}>
                <Text style={styles.groupTitle}>
                  {activeTab === 'Fixed' ? '👔' : '📋'} {currentGroup.label}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.addEmpBtn}
                    onPress={() => {
                      setSelectedPeriod({
                        type: currentGroup.payrolls[0]?.payroll_type || 'Weekly',
                        week_start: currentGroup.payrolls[0]?.week_start ? currentGroup.payrolls[0].week_start.toString().split('T')[0] : '',
                        week_end: currentGroup.payrolls[0]?.week_end ? currentGroup.payrolls[0].week_end.toString().split('T')[0] : '',
                        month: currentGroup.payrolls[0]?.month,
                        year: currentGroup.payrolls[0]?.year,
                      });
                      setEditingPayroll(null);
                      setForm({
                        employee_id: '', employee_name: '',
                        payroll_type: currentGroup.payrolls[0]?.payroll_type || 'Weekly',
                        month: currentGroup.payrolls[0]?.month || new Date().getMonth() + 1,
                        year: currentGroup.payrolls[0]?.year || new Date().getFullYear(),
                        week_start: currentGroup.payrolls[0]?.week_start ? currentGroup.payrolls[0].week_start.toString().split('T')[0] : '',
                        week_end: currentGroup.payrolls[0]?.week_end ? currentGroup.payrolls[0].week_end.toString().split('T')[0] : '',
                        basic_salary: '',
                        bonus: '0', deductions: '0', advance: '0', notes: ''
                      });
                      setPayrollItems([]);
                      setItemSearchQuery('');
                      setModalVisible(true);
                    }}>
                    <Text style={styles.addEmpBtnText}>+ Add Employee</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.printGroupBtn}
                    onPress={() => printGroup(currentGroup)}>
                    <Text style={styles.printGroupBtnText}>🖨️ Print All</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary Bar */}
              <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Employees</Text>
                  <Text style={styles.summaryValue}>{currentPayrolls.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Net Pay</Text>
                  <Text style={[styles.summaryValue, { color: '#4361ee' }]}>
                    PKR {currentPayrolls.reduce((s, p) => s + parseFloat(p.net_pay || p.total_pay || 0), 0).toLocaleString()}
                  </Text>
                </View>
                {activeTab === 'Contract' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Pieces</Text>
                    <Text style={styles.summaryValue}>
                      {currentPayrolls.reduce((s, p) => s + parseFloat(p.pieces_count || 0), 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Table */}
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.5 }]}>Employee</Text>
                  {activeTab === 'Fixed' && isDesktop && <Text style={[styles.th, { flex: 1 }]}>Type</Text>}
                  {activeTab === 'Fixed' && isDesktop && <Text style={[styles.th, { flex: 1.2 }]}>Basic Salary</Text>}
                  {activeTab === 'Contract' && isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Pieces</Text>}
                  {activeTab === 'Contract' && isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Styles</Text>}
                  {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Bonus</Text>}
                  {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Advance</Text>}
                  {isDesktop && <Text style={[styles.th, { flex: 0.8 }]}>Deduct</Text>}
                  <Text style={[styles.th, { flex: 1.2 }]}>Net Pay</Text>
                  <Text style={[styles.th, { flex: 0.8 }]}></Text>
                </View>
                <ScrollView>
                  {currentPayrolls.map((p, i) => {
                    const pItems = typeof (p.payroll_items || []) === 'string'
                      ? JSON.parse(p.payroll_items) : (p.payroll_items || []);
                    return (
                      <View key={p.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                        <Text style={[styles.td, { flex: 1.5, fontWeight: '600' }]}>{p.employee_name || p.full_name}</Text>
                        {activeTab === 'Fixed' && isDesktop && <Text style={[styles.td, { flex: 1 }]}>{p.payroll_type || 'Monthly'}</Text>}
                        {activeTab === 'Fixed' && isDesktop && <Text style={[styles.td, { flex: 1.2, color: '#4361ee' }]}>PKR {parseInt(p.basic_salary || 0).toLocaleString()}</Text>}
                        {activeTab === 'Contract' && isDesktop && <Text style={[styles.td, { flex: 0.8 }]}>{p.pieces_count || 0}</Text>}
                        {activeTab === 'Contract' && isDesktop && <Text style={[styles.td, { flex: 0.8 }]}>{pItems.length} styles</Text>}
                        {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#16a34a' }]}>PKR {parseInt(p.bonus || 0).toLocaleString()}</Text>}
                        {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#ef4444' }]}>PKR {parseInt(p.advance || 0).toLocaleString()}</Text>}
                        {isDesktop && <Text style={[styles.td, { flex: 0.8, color: '#ef4444' }]}>PKR {parseInt(p.deductions || 0).toLocaleString()}</Text>}
                        <Text style={[styles.td, { flex: 1.2, color: '#4361ee', fontWeight: 'bold' }]}>
                          PKR {parseInt(p.net_pay || p.total_pay || 0).toLocaleString()}
                        </Text>
                        <View style={{ flex: 0.8, flexDirection: 'row', gap: 4 }}>
                          <TouchableOpacity onPress={() => printSingle(p)}><Text style={styles.del}>🖨️</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => openEditModal(p)}><Text style={styles.del}>✏️</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => deletePayroll(p.id)}><Text style={styles.del}>🗑️</Text></TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          ) : (
            <View style={styles.noGroupSelected}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={styles.noGroupText}>Select a period from the left to view payrolls</Text>
              <TouchableOpacity style={styles.addPeriodBtnLarge} onPress={openAddModal}>
                <Text style={styles.addPeriodBtnText}>+ Create New Payroll Period</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* PERIOD SELECTOR MODAL */}
      <Modal visible={periodModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && { width: 480, borderRadius: 16, marginBottom: 40 }]}>
            <Text style={styles.modalTitle}>Select Period</Text>

            {activeTab === 'Fixed' && (
              <>
                <Text style={styles.label}>Payroll Type</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {['Weekly', 'Monthly'].map(t => (
                    <TouchableOpacity key={t}
                      style={[styles.catBtn, newPeriodForm.type === t && styles.catBtnActive]}
                      onPress={() => setNewPeriodForm({ ...newPeriodForm, type: t })}>
                      <Text style={[styles.catBtnText, newPeriodForm.type === t && styles.catBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {(activeTab === 'Contract' || newPeriodForm.type === 'Weekly') ? (
              <>
                <DatePicker label="Week Start *" value={newPeriodForm.week_start}
                  onChange={(v) => setNewPeriodForm({ ...newPeriodForm, week_start: v })} />
                <DatePicker label="Week End *" value={newPeriodForm.week_end}
                  onChange={(v) => setNewPeriodForm({ ...newPeriodForm, week_end: v })} />
              </>
            ) : (
              <>
                <Text style={styles.label}>Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {months.map((m, idx) => (
                    <TouchableOpacity key={m}
                      style={[styles.catBtn, parseInt(newPeriodForm.month) === idx + 1 && styles.catBtnActive]}
                      onPress={() => setNewPeriodForm({ ...newPeriodForm, month: idx + 1 })}>
                      <Text style={[styles.catBtnText, parseInt(newPeriodForm.month) === idx + 1 && styles.catBtnTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={styles.input} placeholder="Year (e.g. 2026)"
                  value={String(newPeriodForm.year)}
                  onChangeText={(v) => setNewPeriodForm({ ...newPeriodForm, year: v })}
                  keyboardType="numeric" />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPeriodModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => {
                const period = {
                  type: activeTab === 'Contract' ? 'Weekly' : newPeriodForm.type,
                  week_start: newPeriodForm.week_start,
                  week_end: newPeriodForm.week_end,
                  month: newPeriodForm.month,
                  year: newPeriodForm.year
                };
                setSelectedPeriod(period);
                setPeriodModalVisible(false);
                setEditingPayroll(null);
                setForm({
                  employee_id: '', employee_name: '',
                  payroll_type: period.type,
                  month: period.month,
                  year: period.year,
                  week_start: period.week_start,
                  week_end: period.week_end,
                  basic_salary: '',
                  bonus: '0', deductions: '0', advance: '0', notes: ''
                });
                setPayrollItems([]);
                setItemSearchQuery('');
                setModalVisible(true);
              }}>
                <Text style={styles.saveText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD/EDIT PAYROLL MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>
              {editingPayroll ? 'Edit Payroll' : `+ Add Employee — ${
                form.payroll_type === 'Monthly'
                  ? `${months[(parseInt(form.month) - 1)] || ''} ${form.year}`
                  : `${form.week_start} → ${form.week_end}`
              }`}
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

              {/* Fixed Monthly */}
              {activeTab === 'Fixed' && form.payroll_type === 'Monthly' && (
                <TextInput style={styles.input} placeholder="Basic Salary (PKR)"
                  value={form.basic_salary} onChangeText={(v) => setForm({ ...form, basic_salary: v })}
                  keyboardType="numeric" />
              )}

              {/* Weekly (Fixed or Contract) — Style breakdown */}
              {(activeTab === 'Contract' || (activeTab === 'Fixed' && form.payroll_type === 'Weekly')) && (
                <>
                  {activeTab === 'Fixed' && (
                    <TextInput style={styles.input} placeholder="Basic Salary (PKR) — optional for weekly"
                      value={form.basic_salary} onChangeText={(v) => setForm({ ...form, basic_salary: v })}
                      keyboardType="numeric" />
                  )}
                  <Text style={styles.label}>Search & Add Styles Worked On</Text>
                  <TextInput style={styles.input}
                    placeholder="🔍 Search by style no, description or party..."
                    value={itemSearchQuery} onChangeText={setItemSearchQuery} />

                  {filteredItems.length > 0 && (
                    <View style={styles.searchResults}>
                      {filteredItems.slice(0, 5).map(item => (
                        <TouchableOpacity key={item.id} style={styles.searchResultItem} onPress={() => addPayrollItem(item)}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultStyle}>{item.style_no}</Text>
                            <Text style={styles.searchResultDesc}>
                              {item.color ? `${item.color} · ` : ''}{item.party_name || ''}{item.description ? ` · ${item.description}` : ''}
                            </Text>
                          </View>
                          <Text style={styles.searchResultPrice}>PKR {parseInt(item.labour_price || 0).toLocaleString()}/pc</Text>
                          <Text style={styles.searchResultAdd}>+ Add</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {payrollItems.length > 0 && (
                    <View style={styles.addedItemsBox}>
                      <Text style={styles.label}>🧵 Styles Added ({payrollItems.length})</Text>
                      {payrollItems.map((item) => (
                        <View key={item.item_id} style={styles.addedItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.addedItemStyle}>{item.style_no}{item.color ? ` · ${item.color}` : ''}</Text>
                            <Text style={styles.addedItemParty}>{item.party_name || ''}</Text>
                          </View>
                          <View style={styles.addedItemControls}>
                            <View style={styles.addedItemInputGroup}>
                              <Text style={styles.addedItemLabel}>Pcs</Text>
                              <TextInput style={styles.addedItemInput}
                                value={String(item.pieces)}
                                onChangeText={(v) => updatePayrollItem(item.item_id, 'pieces', v)}
                                keyboardType="numeric" placeholder="0" />
                            </View>
                            <View style={styles.addedItemInputGroup}>
                              <Text style={styles.addedItemLabel}>Rate</Text>
                              <TextInput style={styles.addedItemInput}
                                value={String(item.labour_price)}
                                onChangeText={(v) => updatePayrollItem(item.item_id, 'labour_price', v)}
                                keyboardType="numeric" placeholder="0" />
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
                value={String(form.bonus)} onChangeText={(v) => setForm({ ...form, bonus: v })} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Advance Deducted (PKR)"
                value={String(form.advance)} onChangeText={(v) => setForm({ ...form, advance: v })} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Other Deductions (PKR)"
                value={String(form.deductions)} onChangeText={(v) => setForm({ ...form, deductions: v })} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Notes"
                value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />

              <View style={styles.netPayBox}>
                <Text style={styles.netPayLabel}>NET PAY</Text>
                <Text style={styles.netPayValue}>PKR {net.toLocaleString()}</Text>
              </View>

            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEditingPayroll(null); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              {!editingPayroll && (
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16a34a' }]} onPress={async () => {
                  if (!form.employee_id) { alert('Please select an employee'); return; }
                  try {
                    await client.post('/payrolls', {
                      ...form, pieces_count: totalPieces, net_pay: net,
                      total_pay: net, status: 'Paid', payroll_items: payrollItems
                    });
                    // Reset employee only, keep period
                    setForm(prev => ({
                      ...prev, employee_id: '', employee_name: '',
                      basic_salary: '', bonus: '0', deductions: '0', advance: '0', notes: ''
                    }));
                    setPayrollItems([]);
                    setItemSearchQuery('');
                    fetchAll();
                  } catch (err) { alert('Could not save payroll'); }
                }}>
                  <Text style={styles.saveText}>Save & Add Another</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={savePayroll}>
                <Text style={styles.saveText}>{editingPayroll ? 'Update' : 'Save & Close'}</Text>
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
  mainLayout: { flex: 1, flexDirection: 'row', gap: 12 },
  periodList: { width: 200, backgroundColor: '#fff', borderRadius: 10, padding: 10, elevation: 2 },
  addPeriodBtn: { backgroundColor: '#4361ee', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10 },
  addPeriodBtnLarge: { backgroundColor: '#4361ee', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 16 },
  addPeriodBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchInput: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, fontSize: 13, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyPeriod: { textAlign: 'center', color: '#888', fontSize: 12, padding: 20 },
  periodItem: { padding: 10, borderRadius: 8, marginBottom: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  periodItemActive: { backgroundColor: '#eef2ff', borderColor: '#4361ee' },
  periodItemLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 2 },
  periodItemLabelActive: { color: '#4361ee' },
  periodItemCount: { fontSize: 11, color: '#888' },
  periodItemCountActive: { color: '#6366f1' },
  periodItemTotal: { fontSize: 12, fontWeight: '700', color: '#1e1b4b', marginTop: 2 },
  periodItemTotalActive: { color: '#4361ee' },
  payrollList: { flex: 1 },
  groupActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  groupTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b4b' },
  addEmpBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  addEmpBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  printGroupBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ddd' },
  printGroupBtnText: { color: '#444', fontWeight: '600', fontSize: 13 },
  summaryBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1, gap: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#1e1b4b' },
  noGroupSelected: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10 },
  noGroupText: { fontSize: 14, color: '#888', marginTop: 12, textAlign: 'center' },
  tableContainer: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, overflow: 'hidden', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 12, paddingHorizontal: 16 },
  th: { color: '#fff', fontWeight: '600', fontSize: 12 },
  tr: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  trEven: { backgroundColor: '#f9fafb' },
  td: { fontSize: 12, color: '#374151' },
  del: { fontSize: 15, textAlign: 'center' },
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
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#1e1b4b' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});