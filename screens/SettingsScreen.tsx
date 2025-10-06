import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD' | 'XAF' | 'XOF'>('USD');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('currency');
      if (saved === 'USD' || saved === 'EUR' || saved === 'GBP' || saved === 'CAD' || saved === 'XAF' || saved === 'XOF') {
        setCurrency(saved);
      }
    })();
  }, []);

  const choose = async (c: typeof currency) => {
    setCurrency(c);
    await AsyncStorage.setItem('currency', c);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.subtitle}>Devise</Text>
      <View style={styles.row}>
        {(['USD','EUR','GBP','CAD','XAF','XOF'] as const).map(c => (
          <TouchableOpacity key={c} onPress={() => choose(c)} style={[styles.chip, currency === c && styles.chipActive]}>
            <Text style={styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  subtitle: { color: '#a7f3d0', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#374151', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  chipText: { color: '#fff', fontWeight: '700' },
});


