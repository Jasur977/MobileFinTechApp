import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import AuthForm from '../components/AuthForm';
import api from '../api/api';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (email: string, password: string) => {
    // Frontend validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ characters with a number and a symbol.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', { email, password });
      await SecureStore.setItemAsync('jwt_token', response.data.token);
      navigation.replace('Dashboard');
    } catch (err: any) {
      console.error('Registration Error:', err.response ? err.response.data : err.message);
      if (err.response) {
        setError(err.response.data.message || 'Registration failed: Server error');
      } else if (err.request) {
        setError('Registration failed: No response from server.');
      } else {
        setError('Registration failed: An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.formContainer}>
        <AuthForm title="Register" onSubmit={handleRegister} error={error} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  switchText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  switchLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  }
});

export default RegisterScreen;