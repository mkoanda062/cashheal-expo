import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import { Platform } from 'react-native';
import { Category, getCategories } from '../lib/db';

interface Props {
  navigation: any;
}

type PeriodKey = 'week' | 'month' | 'year';

const StatisticsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month');
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedCategories = await getCategories();
      setCategories(loadedCategories);
      
      const total = loadedCategories.reduce((sum, cat) => sum + cat.amount, 0);
      setTotalSpent(total);
    } catch (error) {
      console.error('Erreur lors du chargement des données', error);
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  }, []);

  const getPeriodLabel = (period: PeriodKey) => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'food':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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
      case 'shopping':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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
      case 'leisure':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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
      default:
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#FFFFFF" strokeWidth={2} />
          </Svg>
        );
    }
  };

  const getCategoryColor = (key: string) => {
    const category = categories.find(cat => cat.key === key);
    return category?.color || '#64748B';
  };

  const getCategoryLabel = (key: string) => {
    const category = categories.find(cat => cat.key === key);
    return category?.label || key;
  };

  const getCategoryAmount = (key: string) => {
    const category = categories.find(cat => cat.key === key);
    return category?.amount || 0;
  };

  const getPercentage = (amount: number) => {
    if (totalSpent === 0) return 0;
    return (amount / totalSpent) * 100;
  };

  const DonutChart = () => {
    const size = 200;
    const center = size / 2;
    const outerRadius = 80;
    const innerRadius = 50;
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

    const segments = categories.map((category) => {
      const ratio = totalSpent === 0 ? 0 : category.amount / totalSpent;
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

      return <Path key={category.key} d={pathData} fill={category.color} />;
    });

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={outerRadius} fill="#E1F5EB" />
        {segments}
        <Circle cx={center} cy={center} r={innerRadius - 2} fill="#F7FFFA" />
        <Text
          x={center}
          y={center - 5}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#0A5C47"
        >
          Total
        </Text>
        <Text
          x={center}
          y={center + 15}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="#0AB17A"
        >
          {formatCurrency(totalSpent)}
        </Text>
      </Svg>
    );
  };

  const BarChart = () => {
    const maxAmount = Math.max(...categories.map(cat => cat.amount), 1);
    const barWidth = 60;
    const maxBarHeight = 120;
    const spacing = 20;

    return (
      <View style={styles.barChartContainer}>
        {categories.map((category, index) => {
          const barHeight = (category.amount / maxAmount) * maxBarHeight;
          const x = index * (barWidth + spacing);
          
          return (
            <View key={category.key} style={styles.barChartItem}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{getCategoryLabel(category.key)}</Text>
              <Text style={styles.barValue}>{formatCurrency(category.amount)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0AB17A', '#0AB17A']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <Text style={styles.headerSubtitle}>Analysez vos dépenses</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.periodSelector}>
              {(['week', 'month', 'year'] as PeriodKey[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}>
                    {getPeriodLabel(period)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Dépenses totales</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.summaryPeriod}>{getPeriodLabel(selectedPeriod)}</Text>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Répartition par catégorie</Text>
              <View style={styles.chartContainer}>
                <DonutChart />
              </View>
            </View>

            <View style={styles.barChartSection}>
              <Text style={styles.chartTitle}>Comparaison des montants</Text>
              <BarChart />
            </View>

            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Détails par catégorie</Text>
              {categories.map((category) => (
                <View key={category.key} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      {getCategoryIcon(category.key)}
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{category.label}</Text>
                      <Text style={styles.categoryPercentage}>
                        {getPercentage(category.amount).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>💡 Insights</Text>
              <Text style={styles.insightsText}>
                {totalSpent > 0 ? (
                  `Votre plus grande dépense est ${getCategoryLabel(
                    categories.reduce((max, cat) => 
                      cat.amount > getCategoryAmount(max.key) ? cat : max, 
                      categories[0] || { key: '', amount: 0 }
                    ).key
                  )} avec ${getPercentage(
                    Math.max(...categories.map(cat => cat.amount))
                  ).toFixed(1)}% de vos dépenses totales.`
                ) : (
                  'Commencez à enregistrer vos dépenses pour voir des insights personnalisés.'
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: '#E6F6EE',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 600,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodButtonActive: {
    backgroundColor: '#0AB17A',
    shadowColor: '#0AB17A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#0AB17A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0AB17A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  barChartSection: {
    marginBottom: 24,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    height: 200,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  barChartItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 40,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#0A5C47',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#64748B',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0AB17A',
  },
  insightsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0AB17A',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default StatisticsScreen;
