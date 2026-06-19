import PartyDetailScreen from './src/screens/PartyDetailScreen';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView, Modal, TextInput } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PartiesScreen from './src/screens/PartiesScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import AccessoriesScreen from './src/screens/AccessoriesScreen';
import PayrollsScreen from './src/screens/PayrollsScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import SupplierDetailScreen from './src/screens/SupplierDetailScreen';
import PurchaseOrdersScreen from './src/screens/PurchaseOrdersScreen';
import client from './src/api/client';

const Stack = createNativeStackNavigator();
const Stack2 = createNativeStackNavigator();

const navItems = [
  { name: 'Dashboard', icon: '🏠', screen: 'Dashboard' },
  { name: 'Accessories', icon: '🧵', screen: 'Accessories' },
  { name: 'Items / Styles', icon: '👔', screen: 'Items' },
  { name: 'Invoices', icon: '🧾', screen: 'Invoices' },
  { name: 'Payrolls', icon: '💰', screen: 'Payrolls' },
  { name: 'Employees', icon: '👥', screen: 'Employees' },
  { name: 'Brands / Parties', icon: '🏪', screen: 'Parties' },
  { name: 'Suppliers', icon: '🏭', screen: 'Suppliers' },
  { name: 'Purchase Orders', icon: '📋', screen: 'PurchaseOrders' },
];

const screens = [
  { name: 'Dashboard', component: DashboardScreen },
  { name: 'Accessories', component: AccessoriesScreen },
  { name: 'Items', component: ItemsScreen },
  { name: 'Invoices', component: InvoicesScreen },
  { name: 'Payrolls', component: PayrollsScreen },
  { name: 'Employees', component: EmployeesScreen },
  { name: 'Parties', component: PartiesScreen },
  { name: 'PartyDetail', component: PartyDetailScreen },
  { name: 'Suppliers', component: SuppliersScreen },
  { name: 'SupplierDetail', component: SupplierDetailScreen },
  { name: 'PurchaseOrders', component: PurchaseOrdersScreen },
];

function Sidebar({ navigation, currentScreen, onLogout, onSettings }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>RS APPARELS</Text>
      </View>
      <ScrollView>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles.navItem, currentScreen === item.screen && styles.navItemActive]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navText, currentScreen === item.screen && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.settingsBtn} onPress={onSettings}>
        <Text style={styles.navIcon}>⚙️</Text>
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.navIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomTabBar({ navigation, currentScreen, onLogout }) {
  const visibleItems = navItems.slice(0, 5);
  return (
    <View style={styles.bottomBar}>
      {visibleItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.bottomTabItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.bottomTabIcon}>{item.icon}</Text>
          <Text style={[styles.bottomTabText, currentScreen === item.screen && styles.bottomTabTextActive]}>
            {item.name.split(' ')[0]}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.bottomTabItem} onPress={onLogout}>
        <Text style={styles.bottomTabIcon}>🚪</Text>
        <Text style={styles.bottomTabText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainApp({ onLogout }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    current_password: '', new_username: '', new_password: '', confirm_password: ''
  });
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsMsgType, setSettingsMsgType] = useState('error');

  const saveCredentials = async () => {
    if (!settingsForm.current_password) {
      setSettingsMsgType('error');
      setSettingsMsg('Current password is required');
      return;
    }
    if (settingsForm.new_password && settingsForm.new_password !== settingsForm.confirm_password) {
      setSettingsMsgType('error');
      setSettingsMsg('New passwords do not match');
      return;
    }
    if (!settingsForm.new_username && !settingsForm.new_password) {
      setSettingsMsgType('error');
      setSettingsMsg('Enter a new username or password to update');
      return;
    }
    try {
      await client.put('/auth/change-credentials', {
        current_password: settingsForm.current_password,
        new_username: settingsForm.new_username || undefined,
        new_password: settingsForm.new_password || undefined
      });
      setSettingsMsgType('success');
      setSettingsMsg('✅ Updated! Please login again.');
      setTimeout(() => {
        localStorage.removeItem('token');
        setSettingsVisible(false);
        onLogout();
      }, 2000);
    } catch (err) {
      setSettingsMsgType('error');
      setSettingsMsg(err.response?.data?.message || 'Could not update credentials');
    }
  };

  const closeSettings = () => {
    setSettingsVisible(false);
    setSettingsMsg('');
    setSettingsForm({ current_password: '', new_username: '', new_password: '', confirm_password: '' });
  };

  return (
    <>
      <Stack2.Navigator screenOptions={{ headerShown: false }}>
        {screens.map(({ name, component: Component }) => (
          <Stack2.Screen key={name} name={name}>
            {(props) => (
              <View style={styles.appContainer}>
                {isDesktop && (
                  <Sidebar
                    navigation={props.navigation}
                    currentScreen={name}
                    onLogout={onLogout}
                    onSettings={() => setSettingsVisible(true)}
                  />
                )}
                <View style={styles.mainContent}>
                  <View style={styles.topBar}>
                    {!isDesktop && <Text style={styles.menuIcon}>👗</Text>}
                    <Text style={styles.pageTitle}>
                      {name === 'Items' ? 'Items / Styles' : name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {!isDesktop && (
                        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                          <Text style={{ fontSize: 20 }}>⚙️</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.userBadge}>
                        👤 {global.currentUser?.username || 'Admin'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Component {...props} />
                  </View>
                  {!isDesktop && (
                    <BottomTabBar
                      navigation={props.navigation}
                      currentScreen={name}
                      onLogout={onLogout}
                    />
                  )}
                </View>
              </View>
            )}
          </Stack2.Screen>
        ))}
      </Stack2.Navigator>

      {/* SETTINGS MODAL */}
      <Modal visible={settingsVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, isDesktop && { width: 440 }]}>
            <Text style={styles.modalTitle}>⚙️ Change Credentials</Text>
            <Text style={styles.modalSub}>Leave new username or password blank to keep unchanged.</Text>

            <TextInput
              style={styles.input}
              placeholder="Current Password *"
              secureTextEntry
              value={settingsForm.current_password}
              onChangeText={(v) => setSettingsForm({ ...settingsForm, current_password: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="New Username (optional)"
              value={settingsForm.new_username}
              onChangeText={(v) => setSettingsForm({ ...settingsForm, new_username: v })}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="New Password (optional)"
              secureTextEntry
              value={settingsForm.new_password}
              onChangeText={(v) => setSettingsForm({ ...settingsForm, new_password: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={settingsForm.confirm_password}
              onChangeText={(v) => setSettingsForm({ ...settingsForm, confirm_password: v })}
            />

            {settingsMsg !== '' && (
              <View style={[styles.msgBox, settingsMsgType === 'success' ? styles.msgSuccess : styles.msgError]}>
                <Text style={{ color: settingsMsgType === 'success' ? '#065f46' : '#991b1b', fontSize: 13 }}>
                  {settingsMsg}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeSettings}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCredentials}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (savedUser) global.currentUser = JSON.parse(savedUser);
      setLoggedIn(true);
    }
    setAuthChecked(true);

    
  }, []);

  if (!authChecked) return null;

  return (
    <NavigationContainer linking={{ prefixes: [] }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => setLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {(props) => (
              <MainApp
                {...props}
                onLogout={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('currentUser');
                  client.defaults.headers.common['Authorization'] = '';
                  global.currentUser = null;
                  setLoggedIn(false);
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f4f8' },
  sidebar: { width: 220, backgroundColor: '#1e1b4b', paddingTop: 20, paddingHorizontal: 12 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#3730a3' },
  sidebarTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, marginBottom: 4 },
  navItemActive: { backgroundColor: '#4361ee' },
  navIcon: { fontSize: 18 },
  navText: { color: '#a5b4fc', fontSize: 14, fontWeight: '500' },
  navTextActive: { color: '#fff' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, marginBottom: 4, backgroundColor: '#2d2a6e' },
  settingsText: { color: '#a5b4fc', fontSize: 14, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, marginBottom: 20, marginTop: 4, borderTopWidth: 1, borderTopColor: '#3730a3', paddingTop: 16 },
  logoutText: { color: '#f87171', fontSize: 14, fontWeight: '500' },
  mainContent: { flex: 1, flexDirection: 'column' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2 },
  menuIcon: { fontSize: 20, marginRight: 8 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', flex: 1 },
  userBadge: { fontSize: 14, color: '#6366f1' },
  bottomBar: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 8, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#3730a3' },
  bottomTabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  bottomTabIcon: { fontSize: 20 },
  bottomTabText: { color: '#a5b4fc', fontSize: 10, marginTop: 2 },
  bottomTabTextActive: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  settingsModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 440 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#888', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  msgBox: { borderRadius: 8, padding: 10, marginBottom: 10 },
  msgSuccess: { backgroundColor: '#d1fae5' },
  msgError: { backgroundColor: '#fee2e2' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});