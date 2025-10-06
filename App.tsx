import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './screens/SplashScreen';
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
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
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