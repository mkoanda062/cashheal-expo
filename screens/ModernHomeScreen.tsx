import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Polygon, Polyline } from 'react-native-svg';
import { Category, getCategories } from '../lib/db';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrency } from '../src/contexts/CurrencyContext';
import storage from '../src/utils/persistentStorage';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'XAF' | 'XOF';
type PeriodKey = 'day' | '2weeks' | 'month';

type PeriodPreset = {
  spent: number;
  budget: number;
  average: number;
  prediction: number;
  predictionMessage: string;
};

type PeriodDataMap = Record<PeriodKey, PeriodPreset>;

const BASE_PERIOD_PRESETS: Record<PeriodKey, PeriodPreset> = {
  day: {
    spent: 24.25,
    budget: 50,
    average: 178.34,
    prediction: 40.0,
    predictionMessage: 'Tu as dépensé 10 $ de moins que prévu continue comme ça.',
  },
  '2weeks': {
    spent: 210.75,
    budget: 350,
    average: 420.2,
    prediction: 512.55,
    predictionMessage: 'Tu es sur la bonne voie pour rester sous le budget.',
  },
  month: {
    spent: 845.3,
    budget: 1500,
    average: 1210.45,
    prediction: 1625.1,
    predictionMessage: 'Tu devrais économiser 80 $ supplémentaires ce mois-ci.',
  },
};

const CATEGORY_ORDER = ['food', 'shopping', 'leisure'] as const;

const CATEGORY_FALLBACKS: Record<
  (typeof CATEGORY_ORDER)[number],
  { label: string; amount: number; color: string }
> = {
  food: { label: 'Nourriture', amount: 65.15, color: '#FB9F3C' },
  shopping: { label: 'Shopping', amount: 35.25, color: '#11C689' },
  leisure: { label: 'Loisirs', amount: 17.97, color: '#7B61FF' },
};

const FoodIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 3V11"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M11 3V11"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M7 11C7 14 5 16 5 19"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M11 11C11 14 9 16 9 19"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M16 3V10"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M16 10C16 12 18 13 18 15V19"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ShoppingIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 8H18L19.2 19H4.8L6 8Z"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 8V6C9 4.343 10.343 3 12 3C13.657 3 15 4.343 15 6V8"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LeisureIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 10H17C19.209 10 21 11.791 21 14C21 16.209 19.209 18 17 18H16L14 16H10L8 18H7C4.791 18 3 16.209 3 14C3 11.791 4.791 10 7 10Z"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={8.5} cy={13.5} r={0.8} fill="#FFFFFF" />
    <Circle cx={15.5} cy={13.5} r={0.8} fill="#FFFFFF" />
  </Svg>
);

const CATEGORY_ICONS: Record<(typeof CATEGORY_ORDER)[number], () => React.JSX.Element> = {
  food: FoodIcon,
  shopping: ShoppingIcon,
  leisure: LeisureIcon,
};

interface Props {
  navigation: any;
}

export default function ModernHomeScreen({ navigation }: Props) {
  const { format } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('day');
  const [periodDataMap, setPeriodDataMap] = useState<PeriodDataMap>(() => ({
    day: { ...BASE_PERIOD_PRESETS.day },
    '2weeks': { ...BASE_PERIOD_PRESETS['2weeks'] },
    month: { ...BASE_PERIOD_PRESETS.month },
  }));
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'remove'>('add');
  const [modalAmount, setModalAmount] = useState('');
  const [modalCategory, setModalCategory] = useState<(typeof CATEGORY_ORDER)[number]>('food');

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const loadedCategories = await getCategories();
      setCategories(loadedCategories);

      // Charger le plan budgétaire du questionnaire
      const budgetPlan = await storage.getItem('budgetAdvisorPlan');
      
      if (budgetPlan) {
        const plan = JSON.parse(budgetPlan);
        // Mettre à jour les budgets basés sur le questionnaire
        setPeriodDataMap(prev => ({
          day: {
            ...prev.day,
            budget: plan.dailyBudget ?? prev.day.budget,
            spent: plan.dailySpending ?? prev.day.spent,
          },
          '2weeks': {
            ...prev['2weeks'],
            budget: plan.biweeklyBudget ?? prev['2weeks'].budget,
            spent: plan.biweeklySpending ?? prev['2weeks'].spent,
          },
          month: {
            ...prev.month,
            budget: plan.availableForSpending ?? prev.month.budget,
            spent: plan.monthlySpending ?? prev.month.spent,
          },
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données', error);
    }
  };

  const formatAmount = useCallback(
    (value: number, fractionalDigits: number = 2) => {
      return format(value);
    },
    [format],
  );

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const parseMoneyInput = (value: string) =>
    parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;

  const openExpenseModal = (mode: 'add' | 'remove') => {
    setModalMode(mode);
    setModalAmount('');
    setModalCategory('food');
    setExpenseModalVisible(true);
  };

  const handleModalConfirm = async () => {
    const amount = parseMoneyInput(modalAmount);
    if (!amount) {
      showToast('Entre un montant valide.');
      return;
    }

    const delta = modalMode === 'add' ? amount : -amount;

    // Mettre à jour les données de période
    setPeriodDataMap((prev) => {
      const current = prev[period];
      const updated: PeriodPreset = {
        ...current,
        spent: Math.max(0, current.spent + delta),
        average: Math.max(0, current.average + delta / 7),
        prediction: Math.max(0, current.prediction + delta * 1.1),
      };
      return {
        ...prev,
        [period]: updated,
      };
    });

    // Mettre à jour les catégories
    try {
      const updatedCategories = categories.map(category => {
        if (category.key === modalCategory) {
          return {
            ...category,
            amount: Math.max(0, category.amount + delta)
          };
        }
        return category;
      });
      
      setCategories(updatedCategories);
      
      // Sauvegarder en base de données
      const { updateCategory } = await import('../lib/db');
      const categoryToUpdate = updatedCategories.find(cat => cat.key === modalCategory);
      if (categoryToUpdate) {
        await updateCategory(categoryToUpdate.key, categoryToUpdate.amount);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des catégories:', error);
    }

    setExpenseModalVisible(false);
    setModalAmount('');
    showToast(modalMode === 'add' ? 'Dépense ajoutée.' : 'Dépense annulée.');
  };

  const periodData = periodDataMap[period];
  const remainingBudget = Math.max(periodData.budget - periodData.spent, 0);
  const progressRatio = Math.min(periodData.spent / Math.max(periodData.budget, 1), 1);

  const categorySegments = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => {
        const source = categories.find((category) => category.key === key);
        const fallback = CATEGORY_FALLBACKS[key];
        const amount = source ? Number(source.amount) || 0 : fallback.amount;
        return {
          key,
          label: fallback.label,
          amount,
          color: fallback.color,
        };
      }),
    [categories],
  );

  const donutOrder: (typeof CATEGORY_ORDER)[number][] = ['food', 'leisure', 'shopping'];

  const donutSegments = useMemo(
    () =>
      donutOrder
        .map((key) => categorySegments.find((segment) => segment.key === key))
        .filter((segment): segment is (typeof categorySegments)[number] => Boolean(segment)),
    [categorySegments],
  );

  const totalChartAmount = donutSegments.reduce((sum, item) => sum + item.amount, 0) || 1;

  const handlePeriodSelect = (value: PeriodKey) => {
    setPeriod(value);
  };

  const renderCategoryIcon = (key: (typeof CATEGORY_ORDER)[number]) => {
    const IconComponent = CATEGORY_ICONS[key];
    return <IconComponent />;
  };

const DonutChart = () => {
  const size = 170;
  const center = size / 2;
  const outerRadius = 70;
  const innerRadius = 44;
  const gapAngle = 4;
  let currentAngle = -90;

  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const polarToCartesian = (radius: number, angle: number) => {
    const radians = toRadians(angle);
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };

    const segments = donutSegments.map((segment) => {
      const ratio = totalChartAmount === 0 ? 0 : segment.amount / totalChartAmount;
      if (ratio <= 0) {
        return null;
      }

      const sweep = ratio * 360;
      const safeSweep = Math.max(1, sweep - gapAngle);
      const sweepReduction = sweep - safeSweep;
      const startAngle = currentAngle + sweepReduction / 2;
      const endAngle = startAngle + safeSweep;
      currentAngle += sweep;

      const outerStart = polarToCartesian(outerRadius, startAngle);
      const outerEnd = polarToCartesian(outerRadius, endAngle);
      const innerEnd = polarToCartesian(innerRadius, endAngle);
      const innerStart = polarToCartesian(innerRadius, startAngle);
      const largeArcFlag = safeSweep > 180 ? 1 : 0;

      const pathData = [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ');

      return <Path key={segment.key} d={pathData} fill={segment.color} />;
    });

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={outerRadius} fill="#E1F5EB" />
        {segments}
        <Circle cx={center} cy={center} r={innerRadius - 2} fill="#F7FFFA" />
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.safeAreaContent}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.wrapper}>
          <LinearGradient colors={['#0AB17A', '#0AB17A']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: 24 + insets.top, paddingBottom: Math.max(40, 16 + insets.bottom) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeHeading}>Bienvenue !</Text>
                <Text style={styles.greetingText}>Bonjour 👋</Text>
                <Text style={styles.welcomeText}>Prêt à soigner vos finances ?</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} style={styles.notificationButton}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                    fill="#ffffff"
                  />
                  <Path
                    d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10.38 4.15 10.79 4.06 11.22 4.03C11.65 4.06 12.06 4.15 12.44 4.29C15.41 5.17 17.44 7.9 17.44 11V17L19.44 19H21Z"
                    fill="#ffffff"
                  />
                  <Path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" fill="#ffffff" />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.contentSurface}>
              <View style={styles.summaryCard}>
                <Text style={styles.summarySubtitle}>Tu As Dépensé Aujourd'hui</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.summaryAmount}>{formatAmount(periodData.spent)}</Text>
                  <View style={styles.amountActions}>
                <TouchableOpacity
                      style={[styles.actionButton, styles.addButton]}
                      activeOpacity={0.9}
                      onPress={() => openExpenseModal('add')}
                    >
                      <Text style={styles.actionButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      activeOpacity={0.9}
                      onPress={() => openExpenseModal('remove')}
                    >
                      <Text style={styles.actionButtonText}>-</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetLabel}>Budget du jour</Text>
                    <Text style={styles.budgetAmount}>{formatAmount(periodData.budget)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(progressRatio * 100, 6)}%` }]} />
                  </View>
                  <Text style={styles.budgetRemainingText}>
                    Il te reste <Text style={styles.highlightedText}>{formatAmount(remainingBudget)}</Text> pour aujourd'hui.
                  </Text>
                </View>

                <View style={styles.periodSwitch}>
                  <TouchableOpacity
                    style={[styles.periodButton, period === 'day' && styles.periodButtonActive]}
                    onPress={() => handlePeriodSelect('day')}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.periodButtonText, period === 'day' && styles.periodButtonTextActive]}>Jour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, period === '2weeks' && styles.periodButtonActive]}
                    onPress={() => handlePeriodSelect('2weeks')}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.periodButtonText, period === '2weeks' && styles.periodButtonTextActive]}>2 semaines</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                    onPress={() => handlePeriodSelect('month')}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>Mois</Text>
                </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statTitle}>Moyenne cette semaine</Text>
                  <Text style={styles.statValue}>{formatAmount(periodData.average)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statTitle}>Prédiction</Text>
                  <View style={styles.predictionRow}>
                    <Svg width={36} height={36} viewBox="0 0 36 36">
                      <Circle cx={18} cy={18} r={18} fill="#E8F9F0" />
                      <Circle cx={18} cy={18} r={14} fill="#0FCF9E" />
                      <Circle cx={14} cy={15} r={2} fill="#0A5C47" />
                      <Circle cx={22} cy={15} r={2} fill="#0A5C47" />
                      <Path
                        d="M12 22C13.5 24 15.5 25 18 25C20.5 25 22.5 24 24 22"
                        stroke="#0A5C47"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.predictionText}>{periodData.predictionMessage}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dashboardSection}>
                <Text style={styles.dashboardTitle}>Tableau De Bord</Text>
                <View style={styles.dashboardContent}>
                  <DonutChart />
                  <View style={styles.dashboardCategories}>
                    {categorySegments.map((segment) => (
                      <View key={segment.key} style={styles.dashboardCategoryCard}>
                        <View style={[styles.dashboardCategoryIcon, styles[`dashboardCategoryIcon_${segment.key}`]]}>
                          {renderCategoryIcon(segment.key)}
                        </View>
                        <View>
                          <Text style={styles.dashboardCategoryLabel}>{segment.label}</Text>
                          <Text style={styles.dashboardCategoryAmount}>{formatAmount(segment.amount)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          </View>

        <Modal visible={expenseModalVisible} transparent animationType="fade" onRequestClose={() => setExpenseModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.select({ ios: 'padding', android: undefined })}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {modalMode === 'add' ? 'Ajouter une dépense' : 'Annuler une dépense'}
                </Text>
                
                <Text style={styles.modalLabel}>Catégorie</Text>
                <View style={styles.categorySelector}>
                  {CATEGORY_ORDER.map((categoryKey) => {
                    const category = CATEGORY_FALLBACKS[categoryKey];
                    const isSelected = modalCategory === categoryKey;
                    return (
                      <TouchableOpacity
                        key={categoryKey}
                        style={[
                          styles.categoryOption,
                          isSelected && styles.categoryOptionSelected,
                          { backgroundColor: isSelected ? category.color : '#F9FAFB' }
                        ]}
                        onPress={() => setModalCategory(categoryKey)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.categoryIcon, { backgroundColor: isSelected ? '#FFFFFF' : category.color }]}>
                          {renderCategoryIcon(categoryKey)}
                        </View>
                        <Text style={[
                          styles.categoryLabel,
                          { color: isSelected ? '#FFFFFF' : '#0A5C47' }
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.modalLabel}>Montant</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalAmount}
                  onChangeText={setModalAmount}
                  keyboardType="numeric"
                  placeholder="Montant"
                  placeholderTextColor="#95A5A6"
                />
                <View style={styles.modalButtons}>
              <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setExpenseModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={handleModalConfirm}
                    activeOpacity={0.9}
              >
                    <Text style={styles.modalConfirmText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0AB17A',
  },
  safeAreaContent: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#E6F6EE',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 160,
  },
  headerContent: {
    paddingHorizontal: 24,
    marginTop: -12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeHeading: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  greetingText: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 16,
  },
  welcomeText: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSurface: {
    marginTop: -60,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#E6F6EE',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 24,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#0A5C47',
    fontWeight: '500',
  },
  amountRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0047BE',
  },
  amountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#0FCF9E',
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  budgetCard: {
    marginTop: 20,
    backgroundColor: '#12C184',
    borderRadius: 22,
    padding: 18,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#F2FFFB',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2FFFB',
  },
  progressTrack: {
    marginTop: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(7,91,66,0.4)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  budgetRemainingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#F2FFFB',
  },
  highlightedText: {
    color: '#0047BE',
    fontWeight: '600',
  },
  periodSwitch: {
    flexDirection: 'row',
    marginTop: 22,
    backgroundColor: '#E6F6EE',
    borderRadius: 18,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#13C88A',
    shadowColor: '#13C88A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#0A5C47',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 26,
    gap: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2FBF5',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 6,
  },
  statTitle: {
    fontSize: 13,
    color: '#0A5C47',
    fontWeight: '600',
  },
  statValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#0A5C47',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  predictionText: {
    flex: 1,
    fontSize: 13,
    color: '#0A5C47',
    lineHeight: 18,
    fontWeight: '500',
  },
  dashboardSection: {
    marginTop: 28,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 18,
  },
  dashboardContent: {
    backgroundColor: '#F7FFFA',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
  dashboardCategories: {
    flex: 1,
    gap: 16,
  },
  dashboardCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dashboardCategoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardCategoryIcon_leisure: {
    backgroundColor: '#7B61FF',
  },
  dashboardCategoryIcon_food: {
    backgroundColor: '#FB9F3C',
  },
  dashboardCategoryIcon_shopping: {
    backgroundColor: '#11C689',
  },
  dashboardCategoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A5C47',
  },
  dashboardCategoryAmount: {
    marginTop: 2,
    fontSize: 14,
    color: '#0A5C47',
    fontWeight: '500',
  },
  bottomNavigationContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#E6F6EE',
  },
  bottomNavigation: {
    backgroundColor: '#D8F1E6',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navItemActive: {
    transform: [{ translateY: -6 }],
  },
  navIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#ECF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconWrapperActive: {
    backgroundColor: '#13C88A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 360,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0A5C47',
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#EFF2F5',
  },
  modalConfirmButton: {
    backgroundColor: '#13C88A',
  },
  modalCancelText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickStatsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#E6F6EE',
  },
  quickStatsButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#0AB17A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginTop: 12,
  },
  quickStatsLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 12,
    marginTop: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionSelected: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
