import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import ModernHomeScreen from './screens/ModernHomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SplashScreen from './screens/SplashScreen';
import SecurityCodeScreen from './screens/SecurityCodeScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import PasswordChangedSuccessScreen from './screens/PasswordChangedSuccessScreen';
import FaceIdSetupScreen from './screens/FaceIdSetupScreen';
import BudgetAdvisorScreen from './screens/BudgetAdvisorScreen';
import StatisticsScreen from './screens/StatisticsScreen';

const RootStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#E6F6EE',
  },
};

function MainTabs() {
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#E6F6EE',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#0AB17A',
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'HomeTab':
              return <Ionicons name="home" size={size} color={color} />;
            case 'BudgetAdvisorTab':
              return <Ionicons name="help-circle" size={size} color={color} />;
            case 'StatisticsTab':
              return <Ionicons name="stats-chart" size={size} color={color} />;
            case 'SettingsTab':
              return <Ionicons name="settings" size={size} color={color} />;
            default:
              return <Ionicons name="ellipse" size={size} color={color} />;
          }
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <AppTabs.Screen name="HomeTab" component={ModernHomeScreen} options={{ title: 'Accueil' }} />
      <AppTabs.Screen name="BudgetAdvisorTab" component={BudgetAdvisorScreen} options={{ title: 'Conseiller' }} />
      <AppTabs.Screen name="StatisticsTab" component={StatisticsScreen} options={{ title: 'Statistiques' }} />
      <AppTabs.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Paramètres' }} />
    </AppTabs.Navigator>
  );
}

const HAS_COMPLETED_ONBOARDING = 'hasCompletedOnboarding';

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SecurityCode: undefined;
  ForgotPassword: undefined;
  PasswordChangedSuccess: undefined;
  FaceIdSetup: undefined;
  BudgetAdvisor: undefined;
  MainTabs: NavigatorScreenParams<any>;
};

export default function App() {
  const [initialRoute, setInitialRoute] = React.useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HAS_COMPLETED_ONBOARDING);
        setInitialRoute(stored ? 'MainTabs' : 'Onboarding');
      } catch (error) {
        console.warn('Failed to check onboarding completion', error);
        setInitialRoute('Onboarding');
      }
    })();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SecurityCode" component={SecurityCodeScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="PasswordChangedSuccess" component={PasswordChangedSuccessScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="FaceIdSetup" component={FaceIdSetupScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="BudgetAdvisor" component={BudgetAdvisorScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="Details" component={DetailsScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
