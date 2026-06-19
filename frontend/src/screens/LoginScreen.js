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
          <img src="data:image/png;base64,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" style={{width:56,height:56,objectFit:'contain',background:'#000',borderRadius:8,padding:4,marginRight:12}} />
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