import PartyDetailScreen from './src/screens/PartyDetailScreen';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, ScrollView } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PartiesScreen from './src/screens/PartiesScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import AccessoriesScreen from './src/screens/AccessoriesScreen';
import PayrollsScreen from './src/screens/PayrollsScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ItemsScreen from './src/screens/ItemsScreen';

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
];

// SIDEBAR — shown on web/desktop
function Sidebar({ navigation, currentScreen, onLogout }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarLogo}>✂️</Text>
        <Text style={styles.sidebarTitle}>Garments ERP</Text>
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
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.navIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// BOTTOM TAB BAR — shown on mobile
function BottomTabBar({ navigation, currentScreen, onLogout }) {
  // Show only first 5 items on bottom bar to avoid overflow
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
          <Text style={[styles.bottomTabText,
            currentScreen === item.screen && styles.bottomTabTextActive]}>
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
  // If width > 768 treat as desktop/web, else mobile
  const isDesktop = width > 768;

  return (
    <Stack2.Navigator screenOptions={{ headerShown: false }}>
      {screens.map(({ name, component: Component }) => (
        <Stack2.Screen key={name} name={name}>
          {(props) => (
            <View style={styles.appContainer}>

              {/* Show sidebar on desktop, nothing on mobile (bottom bar handles it) */}
              {isDesktop && (
                <Sidebar
                  navigation={props.navigation}
                  currentScreen={name}
                  onLogout={onLogout}
                />
              )}

              <View style={styles.mainContent}>
                {/* Top bar */}
                <View style={styles.topBar}>
                  {/* Show menu icon on mobile */}
                  {!isDesktop && (
                    <Text style={styles.menuIcon}>✂️</Text>
                  )}
                  <Text style={styles.pageTitle}>
                    {name === 'Items' ? 'Items / Styles' : name}
                  </Text>
                  <Text style={styles.userBadge}>
                    👤 {global.currentUser?.username || 'Admin'}
                  </Text>
                </View>

                {/* Screen content */}
                <View style={{ flex: 1 }}>
                  <Component {...props} />
                </View>

                {/* Show bottom tab bar on mobile */}
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
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => setLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {(props) => <MainApp {...props} onLogout={() => setLoggedIn(false)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f4f8' },

  // Sidebar styles
  sidebar: {
    width: 220, backgroundColor: '#1e1b4b',
    paddingTop: 20, paddingHorizontal: 12,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 16, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#3730a3'
  },
  sidebarLogo: { fontSize: 24 },
  sidebarTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 12, borderRadius: 8, marginBottom: 4
  },
  navItemActive: { backgroundColor: '#4361ee' },
  navIcon: { fontSize: 18 },
  navText: { color: '#a5b4fc', fontSize: 14, fontWeight: '500' },
  navTextActive: { color: '#fff' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 12, borderRadius: 8,
    marginBottom: 20, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#3730a3',
    paddingTop: 16
  },
  logoutText: { color: '#f87171', fontSize: 14, fontWeight: '500' },

  // Top bar styles
  mainContent: { flex: 1, flexDirection: 'column' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 24,
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', elevation: 2
  },
  menuIcon: { fontSize: 20, marginRight: 8 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', flex: 1 },
  userBadge: { fontSize: 14, color: '#6366f1' },

  // Bottom tab bar styles (mobile)
  bottomBar: {
    flexDirection: 'row', backgroundColor: '#1e1b4b',
    paddingVertical: 8, paddingHorizontal: 4,
    borderTopWidth: 1, borderTopColor: '#3730a3'
  },
  bottomTabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 4
  },
  bottomTabIcon: { fontSize: 20 },
  bottomTabText: { color: '#a5b4fc', fontSize: 10, marginTop: 2 },
  bottomTabTextActive: { color: '#fff', fontWeight: 'bold' },
});