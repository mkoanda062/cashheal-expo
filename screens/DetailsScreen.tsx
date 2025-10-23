import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

const STORAGE_KEY = 'budgetAdvisorPlan';

export default function DetailsScreen() {
  const navigation = useNavigation();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [plan, setPlan] = useState<any>(null);

  const formattedPlan = useMemo(() => {
    if (!plan) return null;
    return {
      monthlyIncome: plan.monthlyIncome,
      savingsTarget: plan.savingsTarget,
      dailyAllowance: plan.daily,
      weeklyAllowance: plan.weekly,
      available: plan.available,
    };
  }, [plan]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const computePlan = async () => {
    const income = parseFloat(monthlyIncome) || 0;
    const target = parseFloat(savingsTarget) || 0;
    const available = Math.max(income - target, 0);
    const daily = available / 30;
    const weekly = available / 4;
    const payload = { monthlyIncome: income, savingsTarget: target, available, daily, weekly };
    setPlan(payload);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Plan budgétaire rapide</Text>

      <Text style={styles.label}>Revenu mensuel (EUR)</Text>
      <TextInput
        value={monthlyIncome}
        onChangeText={setMonthlyIncome}
        keyboardType="numeric"
        style={styles.input}
        placeholder="Ex. 2500"
      />

      <Text style={styles.label}>Objectif d’épargne mensuel</Text>
      <TextInput
        value={savingsTarget}
        onChangeText={setSavingsTarget}
        keyboardType="numeric"
        style={styles.input}
        placeholder="Ex. 700"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={computePlan}>
        <Text style={styles.primaryButtonText}>Calculer</Text>
      </TouchableOpacity>

      {formattedPlan && (
        <View style={styles.outputCard}>
          <Text style={styles.cardTitle}>Recommandations</Text>
          <Text style={styles.cardLine}>Dépenses mensuelles : {formatCurrency(formattedPlan.available)}</Text>
          <Text style={styles.cardLine}>Dépenses hebdo : {formatCurrency(formattedPlan.weeklyAllowance)}</Text>
          <Text style={styles.cardLine}>Dépenses quotidiennes : {formatCurrency(formattedPlan.dailyAllowance)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('BudgetAdvisor')}
      >
        <Text style={styles.secondaryButtonText}>Aller au plan détaillé</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginTop: 12,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  outputCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardLine: {
    fontSize: 15,
    color: '#1E293B',
    marginTop: 6,
  },
  secondaryButton: {
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});

