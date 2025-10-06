import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { getRecentTransactions, Transaction } from '../lib/db';

export default function TransactionsScreen() {
  const [items, setItems] = useState<Transaction[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getRecentTransactions(100);
      setItems(data);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.row, item.type === 'income' ? styles.income : styles.expense]}>
            <Text style={styles.type}>{item.type === 'income' ? 'Revenu' : 'Dépense'}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
            {item.categoryKey ? <Text style={styles.category}>· {item.categoryKey}</Text> : null}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#9ca3af', padding: 16 }}>Aucune transaction.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  row: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  income: {
    borderColor: '#065f46',
  },
  expense: {
    borderColor: '#7f1d1d',
  },
  type: {
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  amount: {
    color: '#e5e7eb',
  },
  category: {
    color: '#9ca3af',
  },
  date: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 12,
  },
});


