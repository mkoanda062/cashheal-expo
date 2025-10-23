import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFinance } from '../src/hooks/useFinance';
import { useCurrency } from '../src/contexts/CurrencyContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import storage from '../src/utils/persistentStorage';

interface Props {
  navigation: any;
}

type QuestionStep = 'budget' | 'rent' | 'spending' | 'savings' | 'result';

type BudgetPlan = {
  monthlyBudget: number;
  rent: number;
  dailySpending: number;
  weeklySpending: number;
  biweeklySpending: number;
  monthlySpending: number;
  savingsType: 'conservative' | 'balanced' | 'aggressive';
  savingsPercentage: number;
  fixedCharges: number;
  availableForSpending: number;
};

const STORAGE_KEY = 'budgetAdvisorPlan';

const BudgetAdvisorScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { result, compute } = useFinance();
  const { format } = useCurrency();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<QuestionStep>('budget');
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan>({
    monthlyBudget: 0,
    rent: 0,
    dailySpending: 0,
    weeklySpending: 0,
    biweeklySpending: 0,
    monthlySpending: 0,
    savingsType: 'balanced',
    savingsPercentage: 20,
    fixedCharges: 0,
    availableForSpending: 0,
  });
  const [inputValue, setInputValue] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadSavedPlan();
  }, []);

  const loadSavedPlan = async () => {
    try {
      const saved = await storage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: BudgetPlan = JSON.parse(saved);
        setBudgetPlan(parsed);
      }
    } catch (error) {
      console.warn('Failed to load budget plan', error);
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  // Utiliser le formatage de devise du contexte
  const formatCurrency = useCallback((amount: number) => {
    return format(amount || 0);
  }, [format]);

  const parseInput = (value: string) => {
    return parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
  };

  const handleNext = async () => {
    const value = parseInput(inputValue);
    
    if (value <= 0) {
      Alert.alert('Valeur invalide', 'Veuillez entrer une valeur positive.');
      return;
    }

    let nextStep: QuestionStep;
    let updatedPlan = { ...budgetPlan };

    switch (currentStep) {
      case 'budget':
        updatedPlan.monthlyBudget = value;
        nextStep = 'rent';
        break;
      case 'rent':
        updatedPlan.rent = value;
        nextStep = 'spending';
        break;
      case 'spending':
        updatedPlan.dailySpending = value;
        updatedPlan.weeklySpending = value * 7;
        updatedPlan.biweeklySpending = value * 14;
        updatedPlan.monthlySpending = value * 30;
        nextStep = 'savings';
        break;
      case 'savings':
        nextStep = 'result';
        break;
      default:
        nextStep = 'budget';
    }

    setBudgetPlan(updatedPlan);
    setInputValue('');
    
    if (nextStep === 'result') {
      await calculateFinalPlan(updatedPlan);
    } else {
      animateTransition(() => setCurrentStep(nextStep));
    }
  };

  const calculateFinalPlan = async (plan: BudgetPlan) => {
    try {
    const calcResult = await compute({
        monthlyIncome: plan.monthlyBudget,
        rent: plan.rent,
        dailySpending: plan.dailySpending,
        savingsPercentage: plan.savingsPercentage,
      });

      const updatedPlan = {
        ...plan,
        fixedCharges: calcResult.fixedCharges,
        availableForSpending: calcResult.availableForSpending,
        monthlySpending: calcResult.monthlySpending,
        weeklySpending: calcResult.weeklySpending,
        biweeklySpending: calcResult.biweeklySpending,
        dailySpending: calcResult.dailySpending,
      };

      setBudgetPlan(updatedPlan);
      animateTransition(() => setCurrentStep('result'));
    } catch (error) {
      console.error('Erreur lors du calcul du plan:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du calcul de votre plan budgétaire.');
    }
  };

  const handleSavingsTypeSelect = (type: 'conservative' | 'balanced' | 'aggressive') => {
    const percentages = {
      conservative: 30,
      balanced: 20,
      aggressive: 10,
    };
    
    setBudgetPlan(prev => ({
      ...prev,
      savingsType: type,
      savingsPercentage: percentages[type],
    }));
  };

  const savePlan = async () => {
      try {
        const toSave = {
          ...budgetPlan,
          timestamp: Date.now(),
        };
        await storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      Alert.alert('Plan sauvegardé', 'Votre plan budgétaire a été enregistré avec succès.');
    } catch (error) {
      console.error('Failed to save plan', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le plan.');
    }
  };

  const resetQuestionnaire = () => {
    setCurrentStep('budget');
    setBudgetPlan({
      monthlyBudget: 0,
      rent: 0,
      dailySpending: 0,
      weeklySpending: 0,
      biweeklySpending: 0,
      monthlySpending: 0,
      savingsType: 'balanced',
      savingsPercentage: 20,
      fixedCharges: 0,
      availableForSpending: 0,
    });
    setInputValue('');
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 'budget':
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{t('advisor.monthly_budget')}</Text>
            <Text style={styles.questionSubtitle}>Entrez votre revenu mensuel total</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="Ex: 3000"
              placeholderTextColor="#94a3b8"
            />
          </View>
        );
      
      case 'rent':
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{t('advisor.rent')}</Text>
            <Text style={styles.questionSubtitle}>Montant de votre loyer ou crédit immobilier</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="Ex: 1000"
              placeholderTextColor="#94a3b8"
            />
          </View>
        );
      
      case 'spending':
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{t('advisor.daily_spending')}</Text>
            <Text style={styles.questionSubtitle}>Montant quotidien pour vos dépenses personnelles</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="Ex: 50"
              placeholderTextColor="#94a3b8"
            />
          </View>
        );
      
      case 'savings':
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{t('advisor.savings_goal')}</Text>
            <Text style={styles.questionSubtitle}>Choisissez votre stratégie d'épargne</Text>
            
            <View style={styles.savingsOptions}>
              <TouchableOpacity
                style={[
                  styles.savingsOption,
                  budgetPlan.savingsType === 'conservative' && styles.savingsOptionSelected
                ]}
                onPress={() => handleSavingsTypeSelect('conservative')}
                activeOpacity={0.8}
              >
                <View style={styles.savingsOptionContent}>
                  <Text style={styles.savingsOptionTitle}>{t('advisor.savings_30')}</Text>
                  <Text style={styles.savingsOptionSubtitle}>30% d'épargne</Text>
                  <Text style={styles.savingsOptionDescription}>Sécurité maximale</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.savingsOption,
                  budgetPlan.savingsType === 'balanced' && styles.savingsOptionSelected
                ]}
                onPress={() => handleSavingsTypeSelect('balanced')}
                activeOpacity={0.8}
              >
                <View style={styles.savingsOptionContent}>
                  <Text style={styles.savingsOptionTitle}>{t('advisor.savings_balanced')}</Text>
                  <Text style={styles.savingsOptionSubtitle}>20% d'épargne</Text>
                  <Text style={styles.savingsOptionDescription}>Juste milieu</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.savingsOption,
                  budgetPlan.savingsType === 'aggressive' && styles.savingsOptionSelected
                ]}
                onPress={() => handleSavingsTypeSelect('aggressive')}
                activeOpacity={0.8}
              >
                <View style={styles.savingsOptionContent}>
                  <Text style={styles.savingsOptionTitle}>{t('advisor.savings_invest')}</Text>
                  <Text style={styles.savingsOptionSubtitle}>10% d'épargne</Text>
                  <Text style={styles.savingsOptionDescription}>Plus d'investissement</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'result':
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Votre plan budgétaire</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé mensuel</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Budget total</Text>
                <Text style={styles.summaryValue}>{formatCurrency(budgetPlan.monthlyBudget)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loyer</Text>
                <Text style={styles.summaryValue}>{formatCurrency(budgetPlan.rent)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Charges fixes (10%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(budgetPlan.fixedCharges)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Épargne ({budgetPlan.savingsPercentage}%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(budgetPlan.monthlyBudget * budgetPlan.savingsPercentage / 100)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowHighlighted]}>
                <Text style={styles.summaryLabelHighlighted}>Disponible pour dépenses</Text>
                <Text style={styles.summaryValueHighlighted}>{formatCurrency(budgetPlan.availableForSpending)}</Text>
              </View>
            </View>

            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>Recommandations</Text>
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Dépenses quotidiennes</Text>
                <Text style={styles.recommendationValue}>{formatCurrency(budgetPlan.availableForSpending / 30)}</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Dépenses hebdomadaires</Text>
                <Text style={styles.recommendationValue}>{formatCurrency(budgetPlan.availableForSpending / 4)}</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Dépenses mensuelles</Text>
                <Text style={styles.recommendationValue}>{formatCurrency(budgetPlan.availableForSpending)}</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps = ['budget', 'rent', 'spending', 'savings', 'result'];
    return steps.indexOf(currentStep) + 1;
  };

  const getTotalSteps = () => 5;

  const canProceed = () => {
    if (currentStep === 'savings') return true;
    if (currentStep === 'result') return false;
    return parseInput(inputValue) > 0;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0AB17A', '#0AB17A']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => currentStep === 'budget' ? navigation.goBack() : setCurrentStep(currentStep === 'rent' ? 'budget' : currentStep === 'spending' ? 'rent' : currentStep === 'savings' ? 'spending' : 'savings')}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conseiller Budget</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(getStepNumber() / getTotalSteps()) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{getStepNumber()}/{getTotalSteps()}</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {renderQuestion()}
          </Animated.View>
        </ScrollView>

        {currentStep !== 'result' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 'savings' ? 'Voir les résultats' : 'Suivant'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 'result' && (
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePlan}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetQuestionnaire}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0AB17A',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    backgroundColor: '#E6F6EE',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 400,
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A5C47',
    textAlign: 'center',
    marginBottom: 12,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#0A5C47',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  savingsOptions: {
    width: '100%',
    gap: 16,
  },
  savingsOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  savingsOptionSelected: {
    borderColor: '#0AB17A',
    backgroundColor: '#F0FDF4',
  },
  savingsOptionContent: {
    alignItems: 'center',
  },
  savingsOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 4,
  },
  savingsOptionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0AB17A',
    marginBottom: 8,
  },
  savingsOptionDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  resultContainer: {
    width: '100%',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A5C47',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#0AB17A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowHighlighted: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  summaryLabelHighlighted: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryValueHighlighted: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recommendationLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  recommendationValue: {
    fontSize: 18,
    color: '#0AB17A',
    fontWeight: '700',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  nextButton: {
    backgroundColor: '#0AB17A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0AB17A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0AB17A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0AB17A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0AB17A',
  },
  resetButtonText: {
    color: '#0AB17A',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BudgetAdvisorScreen;