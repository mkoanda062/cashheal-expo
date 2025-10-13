import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addTransaction,
  getBalance,
  getCategories,
  getTransactions,
  setBalance as setBalanceDB,
  updateCategoryAmount,
  Balance,
  Category,
  Transaction,
} from '../lib/db';

type RangeKey = 'day' | 'two_weeks' | 'month';

const RANGE_CONFIG: Record<RangeKey, { label: string; days: number }> = {
  day: { label: 'Jour', days: 1 },
  two_weeks: { label: '2 semaines', days: 14 },
  month: { label: 'Mois', days: 30 },
};

const BUDGET_STORAGE_KEY = 'cashheal/budgetTargets';
const CURRENCY_STORAGE_KEY = 'currency';

interface CategorySummary {
  key: string;
  label: string;
  emoji: string;
  color: string;
  total: number;
}

export default function ModernHomeScreen() {
  const [balance, setBalance] = useState<Balance>({ total: 0, current: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('day');
  const [loading, setLoading] = useState(false);

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD' | 'XAF' | 'XOF'>('EUR');
  const [budgetTargets, setBudgetTargets] = useState<Record<RangeKey, number>>({
    day: 60,
    two_weeks: 400,
    month: 900,
  });

  const [modalType, setModalType] = useState<'income' | 'expense' | 'budget' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const formatAmount = useCallback(
    (value: number) => {
      const locale =
        currency === 'USD'
          ? 'en-US'
          : currency === 'EUR'
          ? 'fr-FR'
          : currency === 'GBP'
          ? 'en-GB'
          : currency === 'CAD'
          ? 'en-CA'
          : currency === 'XAF'
          ? 'fr-CM'
          : 'fr-SN';

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(value || 0);
    },
    [currency],
  );

  const loadBudgetsFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<RangeKey, number>;
        setBudgetTargets((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Impossible de charger les budgets:', error);
    }
  }, []);

  const loadCurrency = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (
        saved === 'USD' ||
        saved === 'EUR' ||
        saved === 'GBP' ||
        saved === 'CAD' ||
        saved === 'XAF' ||
        saved === 'XOF'
      ) {
        setCurrency(saved);
      }
    } catch (error) {
      console.warn('Impossible de charger la devise:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const days = RANGE_CONFIG[selectedRange].days;
      const from = now - days * 24 * 60 * 60 * 1000;

      const [b, cats, txs] = await Promise.all([
        getBalance(),
        getCategories(),
        getTransactions({ from }),
      ]);

      setBalance(b);
      setCategories(cats);
      setTransactions(txs);
    } catch (error) {
      console.error('Erreur pendant le chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadCurrency();
    loadBudgetsFromStorage();
  }, [loadBudgetsFromStorage, loadCurrency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const expensesTotal = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const incomesTotal = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const categoryBreakdown: CategorySummary[] = useMemo(() => {
    const map = new Map<string, CategorySummary>();
    const categoryMap = new Map(categories.map((c) => [c.key, c]));

    transactions.forEach((tx) => {
      if (tx.type !== 'expense' || !tx.categoryKey) {
        return;
      }
      const meta = categoryMap.get(tx.categoryKey);
      if (!meta) return;

      if (!map.has(tx.categoryKey)) {
        map.set(tx.categoryKey, {
          key: tx.categoryKey,
          label: meta.label,
          emoji: meta.emoji,
          color: meta.color,
          total: 0,
        });
      }
      const entry = map.get(tx.categoryKey)!;
      entry.total += tx.amount;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

  const budgetTarget = budgetTargets[selectedRange] || 0;
  const remainingBudget = budgetTarget - expensesTotal;
  const progress = budgetTarget > 0 ? Math.min(expensesTotal / budgetTarget, 1) : 0;
  const averagePerDay = expensesTotal / RANGE_CONFIG[selectedRange].days;

  const lastTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const closeModal = () => {
    setModalType(null);
    setAmountInput('');
    setSelectedCategoryKey(null);
    setBudgetInput('');
  };

  const submitTransaction = async () => {
    const raw = parseFloat(amountInput.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    const value = isNaN(raw) ? 0 : Math.abs(raw);
    if (!value) {
      Alert.alert('Montant requis', 'Entre un montant valide.');
      return;
    }

    try {
      if (modalType === 'income') {
        const newTotal = balance.total + value;
        const newCurrent = balance.current + value;
        await setBalanceDB(newTotal, newCurrent);
        await addTransaction('income', value, null);
      } else if (modalType === 'expense') {
        if (!selectedCategoryKey) {
          Alert.alert('Catégorie requise', 'Choisis une catégorie pour cette dépense.');
          return;
        }
        if (balance.current < value) {
          Alert.alert('Attention', "Ton solde actuel n'est pas suffisant.");
        }
        await updateCategoryAmount(selectedCategoryKey, value);
        const newCurrent = Math.max(0, balance.current - value);
        await setBalanceDB(balance.total, newCurrent);
        await addTransaction('expense', value, selectedCategoryKey);
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la transaction:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer la transaction.");
    }
  };

  const submitBudget = async () => {
    const raw = parseFloat(budgetInput.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    const value = isNaN(raw) ? 0 : Math.max(0, raw);
    if (!value) {
      Alert.alert('Montant requis', 'Entre un budget valide.');
      return;
    }
    const next = { ...budgetTargets, [selectedRange]: value };
    setBudgetTargets(next);
    try {
      await AsyncStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Impossible de sauvegarder le budget:', error);
    }
    closeModal();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1FFF3" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Bienvenue 👋</Text>
              <Text style={styles.title}>Ton tableau de bord CashHeal</Text>
            </View>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={async () => {
                const order: typeof currency[] = ['EUR', 'USD', 'GBP', 'CAD', 'XAF', 'XOF'];
                const nextIndex = (order.indexOf(currency) + 1) % order.length;
                const nextCurrency = order[nextIndex];
                setCurrency(nextCurrency);
                await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
              }}
            >
              <Text style={styles.currencySelectorText}>{currency}</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingBanner}>
              <Text style={styles.loadingText}>Mise à jour des données…</Text>
            </View>
          )}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tu as dépensé {RANGE_CONFIG[selectedRange].label}</Text>
            <Text style={styles.summaryAmount}>{formatAmount(expensesTotal)}</Text>

            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Budget cible</Text>
              <Text style={styles.progressLabel}>{formatAmount(budgetTarget)}</Text>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.summaryFooter}>
              <Text style={styles.summaryFooterText}>
                Il te reste{' '}
                <Text style={{ fontWeight: '700', color: remainingBudget >= 0 ? '#15803D' : '#B91C1C' }}>
                  {formatAmount(remainingBudget)}
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalType('budget');
                  setBudgetInput(String(budgetTarget));
                }}
              >
                <Text style={styles.editBudget}>Modifier le budget</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rangeSelector}>
            {(Object.keys(RANGE_CONFIG) as RangeKey[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.rangeButton,
                  selectedRange === key && styles.rangeButtonActive,
                ]}
                onPress={() => setSelectedRange(key)}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    selectedRange === key && styles.rangeButtonTextActive,
                  ]}
                >
                  {RANGE_CONFIG[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.insightsRow}>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Moyenne / jour</Text>
              <Text style={styles.insightValue}>{formatAmount(averagePerDay)}</Text>
              <Text style={styles.insightHint}>
                Basé sur {transactions.filter((t) => t.type === 'expense').length} dépenses
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Revenus enregistrés</Text>
              <Text style={styles.insightValue}>{formatAmount(incomesTotal)}</Text>
              <Text style={styles.insightHint}>
                Solde actuel: {formatAmount(balance.current)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.incomeButton]}
              onPress={() => setModalType('income')}
            >
              <Text style={styles.actionEmoji}>💰</Text>
              <Text style={styles.actionText}>Ajouter un revenu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.expenseButton]}
              onPress={() => setModalType('expense')}
            >
              <Text style={styles.actionEmoji}>🧾</Text>
              <Text style={styles.actionText}>Ajouter une dépense</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tableau de bord</Text>
            {categoryBreakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Aucune dépense sur cette période. Ajoute une dépense pour commencer à suivre tes catégories.
                </Text>
              </View>
            ) : (
              categoryBreakdown.map((item) => {
                const ratio = expensesTotal > 0 ? item.total / expensesTotal : 0;
                return (
                  <View key={item.key} style={styles.categoryRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryLabel}>{item.label}</Text>
                        <Text style={styles.categoryAmount}>{formatAmount(item.total)}</Text>
                      </View>
                      <View style={styles.categoryProgress}>
                        <View style={[styles.categoryProgressFill, { width: `${ratio * 100}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            {lastTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Pas de transactions sur cette période.</Text>
              </View>
            ) : (
              lastTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                const categoryMeta = categories.find((c) => c.key === tx.categoryKey);
                const formattedDate = new Date(tx.createdAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View key={tx.id} style={styles.transactionRow}>
                    <View style={[styles.transactionIcon, isExpense ? styles.expenseBg : styles.incomeBg]}>
                      <Text style={styles.transactionEmoji}>
                        {categoryMeta?.emoji ?? (isExpense ? '🧾' : '💰')}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {isExpense
                          ? categoryMeta?.label ?? 'Dépense'
                          : 'Revenu'}
                      </Text>
                      <Text style={styles.transactionSubtitle}>{formattedDate}</Text>
                    </View>
                    <Text style={[styles.transactionAmount, isExpense ? styles.expenseText : styles.incomeText]}>
                      {isExpense ? '-' : '+'}
                      {formatAmount(tx.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.bottomSummary}>
            <View>
              <Text style={styles.bottomLabel}>Solde total</Text>
              <Text style={styles.bottomValue}>{formatAmount(balance.total)}</Text>
            </View>
            <View>
              <Text style={styles.bottomLabel}>Solde actuel</Text>
              <Text style={styles.bottomValue}>{formatAmount(balance.current)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={modalType === 'income' || modalType === 'expense'}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'income' ? 'Ajouter un revenu' : 'Ajouter une dépense'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Montant"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              autoFocus
            />

            {modalType === 'expense' && (
              <View style={styles.modalCategories}>
                <Text style={styles.modalLabel}>Catégorie</Text>
                <View style={styles.modalCategoryList}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.modalCategoryChip,
                        selectedCategoryKey === cat.key && styles.modalCategoryChipActive,
                      ]}
                      onPress={() => setSelectedCategoryKey(cat.key)}
                    >
                      <Text style={styles.modalCategoryText}>
                        {cat.emoji} {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={closeModal}>
                <Text style={styles.modalSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={submitTransaction}>
                <Text style={styles.modalPrimaryText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalType === 'budget'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Budget {RANGE_CONFIG[selectedRange].label}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Budget cible"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={budgetInput}
              onChangeText={setBudgetInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={closeModal}>
                <Text style={styles.modalSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={submitBudget}>
                <Text style={styles.modalPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1FFF3',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1FFF3',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#0E3E3E',
    opacity: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E3E3E',
    marginTop: 4,
  },
  currencySelector: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#DFF7E2',
  },
  currencySelectorText: {
    fontWeight: '700',
    color: '#0E3E3E',
  },
  loadingBanner: {
    backgroundColor: '#E3F8EE',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0E3E3E',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#0E3E3E',
    opacity: 0.7,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0E3E3E',
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  progressLabel: {
    fontSize: 13,
    color: '#0E3E3E',
    opacity: 0.7,
  },
  progressBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#DFF7E2',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00C897',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  summaryFooterText: {
    fontSize: 14,
    color: '#0E3E3E',
  },
  editBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00C897',
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E3F8EE',
    padding: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#00C897',
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E3E3E',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0E3E3E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  insightLabel: {
    fontSize: 13,
    color: '#0E3E3E',
    opacity: 0.7,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E3E3E',
    marginTop: 6,
  },
  insightHint: {
    fontSize: 12,
    color: '#0E3E3E',
    opacity: 0.6,
    marginTop: 4,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeButton: {
    backgroundColor: '#DFF7E2',
  },
  expenseButton: {
    backgroundColor: '#FEE4E2',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E3E3E',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E3E3E',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#0E3E3E',
    opacity: 0.7,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E3E3E',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E3E3E',
  },
  categoryProgress: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E3F8EE',
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00C897',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  incomeBg: {
    backgroundColor: '#DCFCE7',
  },
  expenseBg: {
    backgroundColor: '#FEE2E2',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E3E3E',
  },
  transactionSubtitle: {
    fontSize: 12,
    color: '#0E3E3E',
    opacity: 0.6,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  incomeText: {
    color: '#15803D',
  },
  expenseText: {
    color: '#B91C1C',
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#0E3E3E',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bottomLabel: {
    fontSize: 13,
    color: '#0E3E3E',
    opacity: 0.7,
  },
  bottomValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E3E3E',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E3E3E',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 10 }),
    fontSize: 16,
    color: '#0E3E3E',
    marginBottom: 16,
  },
  modalCategories: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E3E3E',
    marginBottom: 8,
  },
  modalCategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  modalCategoryChipActive: {
    backgroundColor: '#00C897',
  },
  modalCategoryText: {
    color: '#0E3E3E',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalSecondary: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  modalSecondaryText: {
    fontWeight: '600',
    color: '#0E3E3E',
  },
  modalPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#00C897',
  },
  modalPrimaryText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
