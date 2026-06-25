import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, useWindowDimensions
} from 'react-native';
import client from '../api/client';


export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const response = await client.post('/auth/login', { username, password });
      const token = response.data.token;
      global.userToken = token;
      global.currentUser = response.data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      onLogin();
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>

        <View style={styles.logoRow}>
          <img 
            src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" 
            style={{width:56,height:56,objectFit:'contain',background:'#000',borderRadius:8,padding:4,marginRight:12}} 
          />
          <View>
            <Text style={styles.title}>RS APPARELS</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#f0f4f8',
    justifyContent: 'center', alignItems: 'center', padding: 24
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 24, elevation: 3, width: '100%'
  },
  cardDesktop: { width: 400 },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 24
  },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e1b4b' },
  subtitle: { fontSize: 13, color: '#666' },
  label: { fontSize: 13, color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 15, marginBottom: 14
  },
  button: {
    backgroundColor: '#4361ee', borderRadius: 8,
    padding: 14, alignItems: 'center', marginTop: 8
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});