import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface FaceIdSetupScreenProps {
  navigation: any;
}

export default function FaceIdSetupScreen({ navigation }: FaceIdSetupScreenProps) {
  const handleUseFaceId = () => {
    // Logique de configuration Face ID
    // Pour l'instant, on navigue vers l'écran principal
    navigation.navigate('Home');
  };

  const handleSkip = () => {
    // Option pour passer cette étape
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00C897" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FACE ID</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Face ID Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.fingerprintIcon}>🔒</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Configurez Face ID</Text>

        {/* Description */}
        <Text style={styles.description}>
          Connectez-vous simplement avec Face ID la prochaine fois
        </Text>

        {/* Use Face ID Button */}
        <TouchableOpacity style={styles.useFaceIdButton} onPress={handleUseFaceId}>
          <Text style={styles.useFaceIdButtonText}>Utiliser Face ID</Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00C897',
  },
  header: {
    backgroundColor: '#00C897',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F8F0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00C897',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintIcon: {
    fontSize: 50,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A3635',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#1A3635',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 22,
  },
  useFaceIdButton: {
    backgroundColor: '#F0F8F0',
    borderWidth: 2,
    borderColor: '#00C897',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  useFaceIdButtonText: {
    color: '#1A3635',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#6C757D',
    fontSize: 16,
    textAlign: 'center',
  },
});
