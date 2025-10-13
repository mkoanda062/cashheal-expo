import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ToastAndroid } from 'react-native';
import { getBalance, getCategories, setBalance as setBalanceDB, updateCategoryAmount, addTransaction, Balance, Category } from '../lib/db';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const [balance, setBalance] = useState<Balance>({ total: 0, current: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [expenseInput, setExpenseInput] = useState<string>("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD' | 'XAF' | 'XOF'>('USD');

  const formatAmount = (value: number) => {
    const currencyToLocale: Record<typeof currency, string> = {
      USD: 'en-US',
      EUR: 'fr-FR',
      GBP: 'en-GB',
      CAD: 'en-CA',
      XAF: 'fr-CM',
      XOF: 'fr-SN',
    } as const;
    return new Intl.NumberFormat(currencyToLocale[currency], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  useEffect(() => {
    (async () => {
      try {
        // Load persisted currency
        const savedCurrency = await AsyncStorage.getItem('currency');
        if (savedCurrency === 'USD' || savedCurrency === 'EUR' || savedCurrency === 'GBP' || savedCurrency === 'CAD' || savedCurrency === 'XAF' || savedCurrency === 'XOF') {
          setCurrency(savedCurrency);
        }
        const b = await getBalance();
        const c = await getCategories();
        console.log('Balance chargée:', b);
        console.log('Catégories chargées:', c);
        setBalance(b);
        setCategories(c);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
    })();
  }, []);

  const totalExpenses = useMemo(() => {
    return categories.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [categories]);

  const netAfterExpenses = useMemo(() => {
    return (Number(balance.current) || 0) - totalExpenses;
  }, [balance.current, totalExpenses]);
  const netColor = netAfterExpenses >= 0 ? '#22c55e' : '#ef4444';

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS simple fallback
      Alert.alert('Info', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: 'height' })} keyboardVerticalOffset={0}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.appTitle}>CashHeal</Text>
          <View style={styles.currencyRow}>
            {(['USD','EUR','GBP','CAD','XAF','XOF'] as const).map((c) => (
              <TouchableOpacity key={c} onPress={async () => { setCurrency(c); await AsyncStorage.setItem('currency', c); }} style={[styles.currencyChip, currency === c && styles.currencyChipActive]}>
                <Text style={styles.currencyChipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#374151' }]} onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.btnText}>Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#374151' }]} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.btnText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde total</Text>
          <Text style={styles.balanceValue}>{formatAmount(balance.total)}</Text>
          <View style={styles.separator} />
          <Text style={styles.subBalanceLabel}>Solde actuel</Text>
          <Text style={styles.subBalanceValue}>{formatAmount(balance.current)}</Text>
          <View style={styles.separator} />
          <View style={styles.rowBetween}>
            <Text style={styles.subBalanceLabel}>Dépenses</Text>
            <Text style={styles.subBalanceValue}>{formatAmount(totalExpenses)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.subBalanceLabel}>Différence (actuel - dépenses)</Text>
            <Text style={[styles.subBalanceValue, { color: netColor }]}>{formatAmount(netAfterExpenses)}</Text>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#065f46' }]}
              onPress={async () => {
                const newTotal = balance.total + 10;
                const newCurrent = balance.current + 10;
                await setBalanceDB(newTotal, newCurrent);
                setBalance({ total: newTotal, current: newCurrent });
              }}
            >
              <Text style={styles.btnText}>+10€</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#7f1d1d' }]}
              onPress={async () => {
                const newTotal = Math.max(0, balance.total - 10);
                const newCurrent = Math.max(0, balance.current - 10);
                await setBalanceDB(newTotal, newCurrent);
                setBalance({ total: newTotal, current: newCurrent });
              }}
            >
              <Text style={styles.btnText}>-10€</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Catégories de dépenses</Text>

        <View style={styles.categories}>
          {categories.map((c) => (
            <TouchableOpacity key={c.key} onPress={() => setSelectedCategoryKey(c.key)} activeOpacity={0.8} style={[styles.categoryItem, { borderColor: selectedCategoryKey === c.key ? '#34d399' : c.color }]}> 
              <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryLabel}>{c.label}</Text>
                <Text style={styles.categoryAmount}>{formatAmount(c.amount)}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[styles.btnSm, { backgroundColor: '#065f46' }]}
                  onPress={async () => {
                    await updateCategoryAmount(c.key, 5);
                    const cNew = await getCategories();
                    setCategories(cNew);
                  }}
                >
                  <Text style={styles.btnText}>+5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSm, { backgroundColor: '#7f1d1d' }]}
                  onPress={async () => {
                    await updateCategoryAmount(c.key, -5);
                    const cNew = await getCategories();
                    setCategories(cNew);
                  }}
                >
                  <Text style={styles.btnText}>-5</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Montant libre</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amountInput}
            placeholder={currency === 'USD' ? '$ 25.00' : currency === 'EUR' ? '€ 25,00' : currency === 'GBP' ? '£ 25.00' : currency === 'CAD' ? 'CA$ 25.00' : '25,00'}
            placeholderTextColor="#9ca3af"
            onChangeText={setAmountInput}
            returnKeyType="done"
            onSubmitEditing={async () => {
              const val = parseFloat(amountInput.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
              if (!val) return;
              // Revenue: n'affecte pas les catégories
              const newTotal = balance.total + val;
              const newCurrent = balance.current + val;
              await setBalanceDB(newTotal, newCurrent);
              setBalance({ total: newTotal, current: newCurrent });
              await addTransaction('income', val, null);
              setAmountInput('');
              showToast(`Revenu de ${formatAmount(val)} enregistré`);
            }}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#065f46' }]}
            onPress={async () => {
              const val = parseFloat(amountInput.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
              if (!val) return;
              // Revenue: n'affecte pas les catégories
              const newTotal = balance.total + val;
              const newCurrent = balance.current + val;
              
              try {
                console.log('Tentative d\'enregistrement:', { val, newTotal, newCurrent, currentBalance: balance });
                await setBalanceDB(newTotal, newCurrent);
                console.log('Balance mise à jour en DB');
                // Recharger les données depuis la DB pour s'assurer de la cohérence
                const updatedBalance = await getBalance();
                console.log('Balance rechargée:', updatedBalance);
                setBalance(updatedBalance);
                await addTransaction('income', val, null);
                setAmountInput('');
                showToast(`Revenu de ${formatAmount(val)} enregistré`);
              } catch (error: any) {
                console.error('Erreur détaillée lors de l\'enregistrement:', error);
                showToast(`Erreur: ${error?.message || error}`);
              }
            }}
          >
            <Text style={styles.btnText}>Ajouter revenu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={expenseInput}
            placeholder={currency === 'USD' ? '$ 15.00' : currency === 'EUR' ? '€ 15,00' : currency === 'GBP' ? '£ 15.00' : currency === 'CAD' ? 'CA$ 15.00' : '15,00'}
            placeholderTextColor="#9ca3af"
            onChangeText={setExpenseInput}
            returnKeyType="done"
            onSubmitEditing={async () => {
              const val = parseFloat(expenseInput.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
              if (!val) return;
              if (!selectedCategoryKey) {
                Alert.alert('Catégorie requise', "Sélectionne une catégorie pour enregistrer une dépense.");
                return;
              }
              // Dépense: augmente le total de la catégorie, diminue le solde actuel
              await updateCategoryAmount(selectedCategoryKey, val);
              const cNew = await getCategories();
              setCategories(cNew);
              const newTotal = balance.total; // Le solde total ne change pas
              const newCurrent = Math.max(0, balance.current - val);
              await setBalanceDB(newTotal, newCurrent);
              setBalance({ total: newTotal, current: newCurrent });
              await addTransaction('expense', val, selectedCategoryKey);
              setExpenseInput('');
              showToast('Dépense enregistrée');
            }}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#7f1d1d' }]}
            onPress={async () => {
              const val = parseFloat(expenseInput.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
              if (!val) return;
              if (!selectedCategoryKey) {
                Alert.alert('Catégorie requise', "Sélectionne une catégorie pour enregistrer une dépense.");
                return;
              }
              // Dépense: augmente le total de la catégorie, diminue le solde actuel
              await updateCategoryAmount(selectedCategoryKey, val);
              const cNew = await getCategories();
              setCategories(cNew);
              const newTotal = balance.total; // Le solde total ne change pas
              const newCurrent = Math.max(0, balance.current - val);
              await setBalanceDB(newTotal, newCurrent);
              setBalance({ total: newTotal, current: newCurrent });
              await addTransaction('expense', val, selectedCategoryKey);
              setExpenseInput('');
              showToast('Dépense enregistrée');
            }}
          >
            <Text style={styles.btnText}>Ajouter dépense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  currencyChip: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currencyChipActive: {
    backgroundColor: '#065f46',
    borderColor: '#065f46',
  },
  currencyChipText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  balanceCard: {
    backgroundColor: '#0a0a0a',
    borderColor: '#14532d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  balanceLabel: {
    color: '#a7f3d0',
    fontSize: 14,
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#134e4a',
    marginVertical: 12,
    opacity: 0.6,
  },
  subBalanceLabel: {
    color: '#a7f3d0',
    fontSize: 13,
  },
  subBalanceValue: {
    color: '#d1fae5',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnSm: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  categories: {
    gap: 12,
  },
  categoryItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTextWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  categoryLabel: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 1,
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
});

