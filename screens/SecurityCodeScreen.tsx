import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';

interface SecurityCodeScreenProps {
  navigation: any;
}

export default function SecurityCodeScreen({ navigation }: SecurityCodeScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputs = React.useRef<TextInput[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleAccept = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      // Vérification du code et navigation
      navigation.navigate('FaceIdSetup');
    } else {
      alert('Veuillez entrer le code complet');
    }
  };

  const handleResendCode = () => {
    alert('Code renvoyé par email');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00C897" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Code de sécurité</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Entrez le code de sécurité qui vous a été envoyé par courriel
        </Text>

        {/* Code Input Fields */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) codeInputs.current[index] = ref;
              }}
              style={styles.codeInput}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
          <Text style={styles.resendButtonText}>Renvoyer Le Code</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.socialContainer}>
          <Text style={styles.socialText}>
            Besoin d'aide ? Contactez le support ou renvoyez le code.
          </Text>
        </View>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    padding: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#1A3635',
    textAlign: 'left',
    marginBottom: 30,
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 2,
    borderColor: '#00C897',
    borderRadius: 22.5,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3635',
    backgroundColor: '#FFFFFF',
  },
  acceptButton: {
    backgroundColor: '#00C897',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  resendButtonText: {
    color: '#1A3635',
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    alignItems: 'center',
  },
  socialText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
});
