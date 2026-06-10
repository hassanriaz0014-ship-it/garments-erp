import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, useWindowDimensions
} from 'react-native';
import client from '../api/client';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    accessories: 0, invoices: 0,
    employees: 0, parties: 0,
    payrolls: 0, items: 0,
    totalOutstanding: 0, totalPaid: 0, totalInvoiceAmount: 0
  });
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [acc, inv, emp, par, pay, itm] = await Promise.all([
        client.get('/accessories'),
        client.get('/invoices'),
        client.get('/employees'),
        client.get('/parties'),
        client.get('/payrolls'),
        client.get('/items'),
      ]);

      // Calculate outstanding balance across all invoices
      const totalInvoiceAmount = inv.data.reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const totalPaid = inv.data.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
      const totalOutstanding = totalInvoiceAmount - totalPaid;

      setStats({
        accessories: acc.data.length,
        invoices: inv.data.length,
        employees: emp.data.length,
        parties: par.data.length,
        payrolls: pay.data.length,
        items: itm.data.length,
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
    { name: 'Invoices', icon: '🧾', screen: 'Invoices', desc: 'Sale & purchase invoices', count: stats.invoices, unit: 'invoices' },
    { name: 'Payrolls', icon: '💰', screen: 'Payrolls', desc: 'Monthly salary management', count: stats.payrolls, unit: 'entries' },
    { name: 'Employees', icon: '👥', screen: 'Employees', desc: 'Staff records', count: stats.employees, unit: 'staff' },
    { name: 'Brands / Parties', icon: '🏪', screen: 'Parties', desc: 'Customers & suppliers', count: stats.parties, unit: 'contacts' },
  ];

  return (
    <ScrollView style={styles.container}>

      {/* Stats summary row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.employees}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.invoices}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.items}</Text>
          <Text style={styles.statLabel}>Styles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.parties}</Text>
          <Text style={styles.statLabel}>Parties</Text>
        </View>
      </View>

      {/* Outstanding balance card */}
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
  statsRow: {
    flexDirection: 'row', padding: 16,
    gap: 10, flexWrap: 'wrap'
  },
  statCard: {
    flex: 1, minWidth: 80,
    backgroundColor: '#1e1b4b', borderRadius: 10,
    padding: 14, alignItems: 'center'
  },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#a5b4fc', fontSize: 12, marginTop: 4 },
  balanceCard: {
    backgroundColor: '#fff', borderRadius: 12,
    marginHorizontal: 16, marginBottom: 16,
    padding: 16, elevation: 2
  },
  balanceTitle: {
    fontSize: 15, fontWeight: '700',
    color: '#1e1b4b', marginBottom: 12
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  balanceValue: { fontSize: 14, fontWeight: 'bold' },
  balanceDivider: {
    width: 1, height: 40,
    backgroundColor: '#e5e7eb', marginHorizontal: 8
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '600',
    color: '#333', margin: 16
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12
  },
  gridDesktop: { gap: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 20, margin: 6, elevation: 2,
    width: '45%', alignItems: 'center'
  },
  cardDesktop: { width: '30%' },
  icon: { fontSize: 32, marginBottom: 8 },
  cardTitle: {
    fontSize: 14, fontWeight: '600',
    color: '#1e1b4b', textAlign: 'center'
  },
  cardDesc: {
    fontSize: 11, color: '#888',
    textAlign: 'center', marginTop: 4
  },
  cardCount: {
    fontSize: 13, color: '#4361ee',
    fontWeight: '600', marginTop: 6
  }
});