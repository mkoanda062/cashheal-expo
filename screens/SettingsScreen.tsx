import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  navigation: any;
}

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'XAF' | 'XOF';
type Language = 'fr' | 'en' | 'es';
type Country = 'FR' | 'US' | 'CA' | 'GB' | 'CM' | 'SN';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'FR' },
  { code: 'USD', symbol: '$', name: 'Dollar US', country: 'US' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling', country: 'GB' },
  { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien', country: 'CA' },
  { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA', country: 'CM' },
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA', country: 'SN' },
];

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [language, setLanguage] = useState<Language>('fr');
  const [country, setCountry] = useState<Country>('FR');
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem('currency');
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedCountry = await AsyncStorage.getItem('country');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedBiometric = await AsyncStorage.getItem('biometric');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');

      if (savedCurrency && CURRENCIES.find(c => c.code === savedCurrency)) {
        setCurrency(savedCurrency as Currency);
      }
      if (savedLanguage && LANGUAGES.find(l => l.code === savedLanguage)) {
        setLanguage(savedLanguage as Language);
      }
      if (savedCountry && COUNTRIES.find(c => c.code === savedCountry)) {
        setCountry(savedCountry as Country);
      }
      if (savedNotifications !== null) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedBiometric !== null) {
        setBiometric(JSON.parse(savedBiometric));
      }
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres', error);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}`, error);
    }
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    saveSetting('currency', newCurrency);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveSetting('language', newLanguage);
  };

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
    saveSetting('country', newCountry);
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    saveSetting('notifications', value);
  };

  const handleBiometricToggle = (value: boolean) => {
    setBiometric(value);
    saveSetting('biometric', value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    saveSetting('darkMode', value);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            // Ici vous pouvez ajouter la logique de déconnexion
            navigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Ici vous pouvez ajouter la logique de suppression du compte
            Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    icon?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        {icon && <View style={styles.settingIcon}>{icon}</View>}
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {rightElement || (
        onPress && (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18L15 12L9 6"
              stroke="#64748B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )
      )}
    </TouchableOpacity>
  );

  const renderCurrencySelector = () => {
    const selectedCurrency = CURRENCIES.find(curr => curr.code === currency);
    
    return (
      <View style={styles.compactSelector}>
        <TouchableOpacity
          style={styles.compactSelectorButton}
          onPress={() => {
            // Ici on pourrait ouvrir un modal ou une liste déroulante
            Alert.alert(
              'Choisir une devise',
              'Sélectionnez votre devise préférée',
              CURRENCIES.map(curr => ({
                text: `${curr.flag} ${curr.name} (${curr.symbol})`,
                onPress: () => handleCurrencyChange(curr.code as Currency),
              }))
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.compactSelectorFlag}>{selectedCurrency?.flag}</Text>
          <View style={styles.compactSelectorText}>
            <Text style={styles.compactSelectorTitle}>{selectedCurrency?.name}</Text>
            <Text style={styles.compactSelectorSubtitle}>{selectedCurrency?.symbol} {selectedCurrency?.code}</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9L12 15L18 9"
              stroke="#64748B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLanguageSelector = () => {
    const selectedLanguage = LANGUAGES.find(lang => lang.code === language);
    
    return (
      <View style={styles.compactSelector}>
        <TouchableOpacity
          style={styles.compactSelectorButton}
          onPress={() => {
            Alert.alert(
              'Choisir une langue',
              'Sélectionnez votre langue préférée',
              LANGUAGES.map(lang => ({
                text: `${lang.flag} ${lang.name}`,
                onPress: () => handleLanguageChange(lang.code as Language),
              }))
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.compactSelectorFlag}>{selectedLanguage?.flag}</Text>
          <View style={styles.compactSelectorText}>
            <Text style={styles.compactSelectorTitle}>{selectedLanguage?.name}</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9L12 15L18 9"
              stroke="#64748B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCountrySelector = () => {
    const selectedCountry = COUNTRIES.find(c => c.code === country);
    
    return (
      <View style={styles.compactSelector}>
        <TouchableOpacity
          style={styles.compactSelectorButton}
          onPress={() => {
            Alert.alert(
              'Choisir un pays',
              'Sélectionnez votre pays',
              COUNTRIES.map(c => ({
                text: `${c.flag} ${c.name}`,
                onPress: () => handleCountryChange(c.code as Country),
              }))
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.compactSelectorFlag}>{selectedCountry?.flag}</Text>
          <View style={styles.compactSelectorText}>
            <Text style={styles.compactSelectorTitle}>{selectedCountry?.name}</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9L12 15L18 9"
              stroke="#64748B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0AB17A', '#0AB17A']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <Text style={styles.headerSubtitle}>Personnalisez votre expérience</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Préférences</Text>
              
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>Devise</Text>
                {renderCurrencySelector()}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>Langue</Text>
                {renderLanguageSelector()}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>Pays</Text>
                {renderCountrySelector()}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              
              <View style={styles.sectionCard}>
                {renderSettingItem(
                  'Notifications push',
                  'Recevoir des notifications sur vos dépenses',
                  undefined,
                  <Switch
                    value={notifications}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: '#E5E7EB', true: '#0AB17A' }}
                    thumbColor={notifications ? '#FFFFFF' : '#FFFFFF'}
                  />,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                      fill="#0AB17A"
                    />
                    <Path
                      d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10.38 4.15 10.79 4.06 11.22 4.03C11.65 4.06 12.06 4.15 12.44 4.29C15.41 5.17 17.44 7.9 17.44 11V17L19.44 19H21Z"
                      fill="#0AB17A"
                    />
                    <Path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" fill="#0AB17A" />
                  </Svg>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sécurité</Text>
              
              <View style={styles.sectionCard}>
                {renderSettingItem(
                  'Authentification biométrique',
                  'Utiliser Face ID ou Touch ID',
                  undefined,
                  <Switch
                    value={biometric}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: '#E5E7EB', true: '#0AB17A' }}
                    thumbColor={biometric ? '#FFFFFF' : '#FFFFFF'}
                  />,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                      fill="#0AB17A"
                    />
                    <Path
                      d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10.38 4.15 10.79 4.06 11.22 4.03C11.65 4.06 12.06 4.15 12.44 4.29C15.41 5.17 17.44 7.9 17.44 11V17L19.44 19H21Z"
                      fill="#0AB17A"
                    />
                    <Path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" fill="#0AB17A" />
                  </Svg>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Apparence</Text>
              
              <View style={styles.sectionCard}>
                {renderSettingItem(
                  'Mode sombre',
                  'Activer le thème sombre',
                  undefined,
                  <Switch
                    value={darkMode}
                    onValueChange={handleDarkModeToggle}
                    trackColor={{ false: '#E5E7EB', true: '#0AB17A' }}
                    thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
                  />,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                      fill="#0AB17A"
                    />
                  </Svg>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compte</Text>
              
              <View style={styles.sectionCard}>
                {renderSettingItem(
                  'Informations personnelles',
                  'Modifier votre profil',
                  () => {
                    // Navigation vers la page de profil
                    Alert.alert('Profil', 'Fonctionnalité à venir');
                  },
                  undefined,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="#0AB17A"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx={12} cy={7} r={4} stroke="#0AB17A" strokeWidth={2} />
                  </Svg>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              <View style={styles.sectionCard}>
                {renderSettingItem(
                  'Se déconnecter',
                  'Déconnexion de votre compte',
                  handleLogout,
                  undefined,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M16 17L21 12L16 7"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M21 12H9"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
                
                {renderSettingItem(
                  'Supprimer le compte',
                  'Supprimer définitivement votre compte',
                  handleDeleteAccount,
                  undefined,
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 6H5H21"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A5C47',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#0C7E5B',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  selectorContainer: {
    gap: 8,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectorOptionSelected: {
    borderColor: '#0AB17A',
    backgroundColor: '#F0FDF4',
  },
  selectorFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 2,
  },
  selectorTitleSelected: {
    color: '#0AB17A',
  },
  selectorSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  selectorSubtitleSelected: {
    color: '#0AB17A',
  },
  compactSelector: {
    marginTop: 8,
  },
  compactSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  compactSelectorFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  compactSelectorText: {
    flex: 1,
  },
  compactSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A5C47',
    marginBottom: 2,
  },
  compactSelectorSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default SettingsScreen;