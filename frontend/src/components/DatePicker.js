import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DatePicker({ label, value, onChange, type = 'date' }) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '11px',
          fontSize: '14px',
          color: '#374151',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '10px',
          fontFamily: 'sans-serif',
          outline: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 2 },
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 }
});