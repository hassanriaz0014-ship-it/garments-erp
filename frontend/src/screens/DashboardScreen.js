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

      // Only count sale invoices for financial overview
      const saleInvoices = inv.data.filter(i => i.type === 'Sale' || !i.type);
      const totalInvoiceAmount = saleInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const totalPaid = saleInvoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
      const totalOutstanding = totalInvoiceAmount - totalPaid;

      setStats({
        accessories: acc.data.length,
        invoices: saleInvoices.length,
        employees: emp.data.length,
        fixedEmployees: fixedEmp.length,
        contractEmployees: contractEmp.length,
        parties: customers.length,
        suppliers: suppliers.length,
        payrolls: pay.data.length,
        items: itm.data.length,
        purchaseOrders: po.data.length,
        totalInvoiceAmount,
        totalPaid,
        totalOutstanding,
      });
    } catch (err) {
      console.log('Stats error:', err.message);
    }
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

      {/* Stats summary row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.employees}</Text>
          <Text style={styles.statLabel}>Employees</Text>
          <Text style={styles.statSub}>{stats.fixedEmployees} Fixed · {stats.contractEmployees} Contract</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.invoices}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
          <Text style={styles.statSub}>Sale invoices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.items}</Text>
          <Text style={styles.statLabel}>Styles</Text>
          <Text style={styles.statSub}>Items & styles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.parties}</Text>
          <Text style={styles.statLabel}>Parties</Text>
          <Text style={styles.statSub}>{stats.suppliers} Suppliers</Text>
        </View>
      </View>

      {/* Financial Overview */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>💰 Financial Overview</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Total Invoiced</Text>
            <Text style={[styles.balanceValue, { color: '#4361ee' }]}>
              PKR {stats.totalInvoiceAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Total Received</Text>
            <Text style={[styles.balanceValue, { color: '#16a34a' }]}>
              PKR {stats.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Outstanding</Text>
            <Text style={[styles.balanceValue, { color: '#ef4444' }]}>
              PKR {stats.totalOutstanding.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStat, { backgroundColor: '#eef2ff' }]}>
          <Text style={styles.quickStatIcon}>📋</Text>
          <Text style={styles.quickStatNumber}>{stats.purchaseOrders}</Text>
          <Text style={styles.quickStatLabel}>Purchase Orders</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.quickStatIcon}>🧵</Text>
          <Text style={styles.quickStatNumber}>{stats.accessories}</Text>
          <Text style={styles.quickStatLabel}>Accessories</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: '#fef3c7' }]}>
          <Text style={styles.quickStatIcon}>💰</Text>
          <Text style={styles.quickStatNumber}>{stats.payrolls}</Text>
          <Text style={styles.quickStatLabel}>Payrolls</Text>
        </View>
      </View>

      {/* Module cards */}
      <Text style={styles.sectionTitle}>Modules</Text>
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.name}
            style={[styles.card, isDesktop && styles.cardDesktop]}
            onPress={() => navigation.navigate(mod.screen)}
          >
            <Text style={styles.icon}>{mod.icon}</Text>
            <Text style={styles.cardTitle}>{mod.name}</Text>
            <Text style={styles.cardDesc}>{mod.desc}</Text>
            <Text style={styles.cardCount}>{mod.count} {mod.unit}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: 80, backgroundColor: '#1e1b4b',
    borderRadius: 10, padding: 14, alignItems: 'center'
  },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#a5b4fc', fontSize: 12, marginTop: 4 },
  statSub: { color: '#6366f1', fontSize: 10, marginTop: 2, textAlign: 'center' },
  balanceCard: {
    backgroundColor: '#fff', borderRadius: 12,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, elevation: 2
  },
  balanceTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  balanceValue: { fontSize: 14, fontWeight: 'bold' },
  balanceDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  quickStatsRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginBottom: 12
  },
  quickStat: {
    flex: 1, borderRadius: 10, padding: 12,
    alignItems: 'center', elevation: 1
  },
  quickStatIcon: { fontSize: 20, marginBottom: 4 },
  quickStatNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b' },
  quickStatLabel: { fontSize: 10, color: '#666', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', margin: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  gridDesktop: { gap: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 20, margin: 6, elevation: 2,
    width: '45%', alignItems: 'center'
  },
  cardDesktop: { width: '22%' },
  icon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1e1b4b', textAlign: 'center' },
  cardDesc: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  cardCount: { fontSize: 13, color: '#4361ee', fontWeight: '600', marginTop: 6 }
});