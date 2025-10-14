import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { initializeDatabase, addNote, getNotes } from './lib/db';

const Stack = createNativeStackNavigator();

export default function App() {
  const [notes, setNotes] = useState<{ id: number; title: string }[]>([]);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const data = await getNotes();
      setNotes(data);
    })();
  }, []);

  const handleAdd = async () => {
    await addNote('Note ' + new Date().toLocaleTimeString());
    const data = await getNotes();
    setNotes(data);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SecurityCode" component={SecurityCodeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PasswordChangedSuccess" component={PasswordChangedSuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FaceIdSetup" component={FaceIdSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={ModernHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  listTitle: {
    marginTop: 8,
    marginBottom: 8,
    color: '#ffffff',
    fontWeight: '600',
  },
  noteItem: {
    color: '#ffffff',
    marginBottom: 6,
  },
});
