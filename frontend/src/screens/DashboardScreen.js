import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, useWindowDimensions
} from 'react-native';
import client from '../api/client';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    accessories: 0, invoices: 0,
    employees: 0, fixedEmployees: 0, contractEmployees: 0,
    parties: 0, suppliers: 0,
    payrolls: 0, items: 0, purchaseOrders: 0,
    totalOutstanding: 0, totalPaid: 0, totalInvoiceAmount: 0
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [acc, inv, emp, par, pay, itm, po] = await Promise.all([
        client.get('/accessories'),
        client.get('/invoices'),
        client.get('/employees'),
        client.get('/parties'),
        client.get('/payrolls'),
        client.get('/items'),
        client.get('/purchase-orders'),
      ]);
      const customers = par.data.filter(p => p.type === 'Customer');
      const suppliers = par.data.filter(p => p.type === 'Supplier');
      const fixedEmp = emp.data.filter(e => (e.employee_type || 'Fixed') === 'Fixed');
      const contractEmp = emp.data.filter(e => e.employee_type === 'Contract');
      const saleInvoices = inv.data.filter(i => i.type === 'Sale' || !i.type);
      const totalInvoiceAmount = saleInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const totalPaid = saleInvoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
      const totalOutstanding = totalInvoiceAmount - totalPaid;
      setStats({
        accessories: acc.data.length, invoices: saleInvoices.length,
        employees: emp.data.length, fixedEmployees: fixedEmp.length,
        contractEmployees: contractEmp.length, parties: customers.length,
        suppliers: suppliers.length, payrolls: pay.data.length,
        items: itm.data.length, purchaseOrders: po.data.length,
        totalInvoiceAmount, totalPaid, totalOutstanding,
      });
    } catch (err) { console.log('Stats error:', err.message); }
  };

  const modules = [
    { name: 'Accessories', icon: '🧵', screen: 'Accessories', desc: 'Raw materials & fabric', count: stats.accessories, unit: 'items' },
    { name: 'Items / Styles', icon: '👔', screen: 'Items', desc: 'Stitched items & styles', count: stats.items, unit: 'styles' },
    { name: 'Invoices', icon: '🧾', screen: 'Invoices', desc: 'Sale invoices', count: stats.invoices, unit: 'invoices' },
    { name: 'Purchase Orders', icon: '📋', screen: 'PurchaseOrders', desc: 'Orders management', count: stats.purchaseOrders, unit: 'orders' },
    { name: 'Payrolls', icon: '💰', screen: 'Payrolls', desc: 'Salary management', count: stats.payrolls, unit: 'entries' },
    { name: 'Employees', icon: '👥', screen: 'Employees', desc: 'Staff records', count: stats.employees, unit: 'staff' },
    { name: 'Brands / Parties', icon: '🏪', screen: 'Parties', desc: 'Customers', count: stats.parties, unit: 'customers' },
    { name: 'Suppliers', icon: '🏭', screen: 'Suppliers', desc: 'Material suppliers', count: stats.suppliers, unit: 'suppliers' },
  ];

  return (
    <ScrollView style={styles.container}>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, !isDesktop && styles.statNumberMobile]}>{stats.employees}</Text>
          <Text style={[styles.statLabel, !isDesktop && styles.statLabelMobile]}>Employees</Text>
          <Text style={[styles.statSub, !isDesktop && styles.statSubMobile]}>{stats.fixedEmployees} Fixed · {stats.contractEmployees} Contract</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, !isDesktop && styles.statNumberMobile]}>{stats.invoices}</Text>
          <Text style={[styles.statLabel, !isDesktop && styles.statLabelMobile]}>Invoices</Text>
          <Text style={[styles.statSub, !isDesktop && styles.statSubMobile]}>Sale invoices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, !isDesktop && styles.statNumberMobile]}>{stats.items}</Text>
          <Text style={[styles.statLabel, !isDesktop && styles.statLabelMobile]}>Styles</Text>
          <Text style={[styles.statSub, !isDesktop && styles.statSubMobile]}>Items & styles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, !isDesktop && styles.statNumberMobile]}>{stats.parties}</Text>
          <Text style={[styles.statLabel, !isDesktop && styles.statLabelMobile]}>Parties</Text>
          <Text style={[styles.statSub, !isDesktop && styles.statSubMobile]}>{stats.suppliers} Suppliers</Text>
        </View>
      </View>

      {/* Financial Overview */}
      <View style={[styles.balanceCard, !isDesktop && styles.balanceCardMobile]}>
        <Text style={[styles.balanceTitle, !isDesktop && styles.balanceTitleMobile]}>💰 Financial Overview</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, !isDesktop && styles.balanceLabelMobile]}>Total Invoiced</Text>
            <Text style={[styles.balanceValue, { color: '#4361ee' }, !isDesktop && styles.balanceValueMobile]}>
              PKR {stats.totalInvoiceAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, !isDesktop && styles.balanceLabelMobile]}>Total Received</Text>
            <Text style={[styles.balanceValue, { color: '#16a34a' }, !isDesktop && styles.balanceValueMobile]}>
              PKR {stats.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, !isDesktop && styles.balanceLabelMobile]}>Outstanding</Text>
            <Text style={[styles.balanceValue, { color: '#ef4444' }, !isDesktop && styles.balanceValueMobile]}>
              PKR {stats.totalOutstanding.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={[styles.quickStatsRow, !isDesktop && styles.quickStatsRowMobile]}>
        <View style={[styles.quickStat, { backgroundColor: '#eef2ff' }]}>
          <Text style={[styles.quickStatIcon, !isDesktop && styles.quickStatIconMobile]}>📋</Text>
          <Text style={[styles.quickStatNumber, !isDesktop && styles.quickStatNumberMobile]}>{stats.purchaseOrders}</Text>
          <Text style={[styles.quickStatLabel, !isDesktop && styles.quickStatLabelMobile]}>Purchase Orders</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.quickStatIcon, !isDesktop && styles.quickStatIconMobile]}>🧵</Text>
          <Text style={[styles.quickStatNumber, !isDesktop && styles.quickStatNumberMobile]}>{stats.accessories}</Text>
          <Text style={[styles.quickStatLabel, !isDesktop && styles.quickStatLabelMobile]}>Accessories</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.quickStatIcon, !isDesktop && styles.quickStatIconMobile]}>💰</Text>
          <Text style={[styles.quickStatNumber, !isDesktop && styles.quickStatNumberMobile]}>{stats.payrolls}</Text>
          <Text style={[styles.quickStatLabel, !isDesktop && styles.quickStatLabelMobile]}>Payrolls</Text>
        </View>
      </View>

      {/* Module Cards */}
      <Text style={[styles.sectionTitle, !isDesktop && styles.sectionTitleMobile]}>Modules</Text>
      <View style={styles.grid}>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.name}
            style={[styles.card, isDesktop && styles.cardDesktop]}
            onPress={() => navigation.navigate(mod.screen)}
          >
            <Text style={[styles.icon, isDesktop && styles.iconDesktop]}>{mod.icon}</Text>
            <Text style={[styles.cardTitle, isDesktop && styles.cardTitleDesktop]}>{mod.name}</Text>
            {isDesktop && <Text style={styles.cardDesc}>{mod.desc}</Text>}
            <Text style={[styles.cardCount, isDesktop && styles.cardCountDesktop]}>
              {mod.count} {mod.unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },

  // Stats row
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1e1b4b', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statNumberMobile: { fontSize: 18 },
  statLabel: { color: '#a5b4fc', fontSize: 12, marginTop: 4 },
  statLabelMobile: { fontSize: 10, marginTop: 2 },
  statSub: { color: '#6366f1', fontSize: 10, marginTop: 2, textAlign: 'center' },
  statSubMobile: { fontSize: 8, marginTop: 1 },

  // Balance card
  balanceCard: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12, marginBottom: 10, padding: 16, elevation: 2 },
  balanceCardMobile: { padding: 12 },
  balanceTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 12 },
  balanceTitleMobile: { fontSize: 13, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  balanceLabelMobile: { fontSize: 9, marginBottom: 2 },
  balanceValue: { fontSize: 14, fontWeight: 'bold' },
  balanceValueMobile: { fontSize: 11 },
  balanceDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb', marginHorizontal: 8 },

  // Quick stats
  quickStatsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginBottom: 12 },
  quickStatsRowMobile: { gap: 6, marginHorizontal: 12 },
  quickStat: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', elevation: 1 },
  quickStatIcon: { fontSize: 20, marginBottom: 4 },
  quickStatIconMobile: { fontSize: 16, marginBottom: 2 },
  quickStatNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b' },
  quickStatNumberMobile: { fontSize: 16 },
  quickStatLabel: { fontSize: 10, color: '#666', marginTop: 2, textAlign: 'center' },
  quickStatLabelMobile: { fontSize: 9 },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', margin: 12 },
  sectionTitleMobile: { fontSize: 14, margin: 10 },

  // Module cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, margin: 4, elevation: 2, width: '47%', alignItems: 'center' },
  cardDesktop: { width: '22%', padding: 20 },
  icon: { fontSize: 20, marginBottom: 4 },
  iconDesktop: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1e1b4b', textAlign: 'center' },
  cardTitleDesktop: { fontSize: 14 },
  cardDesc: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  cardCount: { fontSize: 11, color: '#4361ee', fontWeight: '600', marginTop: 4 },
  cardCountDesktop: { fontSize: 13, marginTop: 6 },
});