import React, { useState } from 'react';
import { View, StyleSheet, Button, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import AuthForm from '../components/AuthForm';
import api from '../api/api';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/authenticate', { email, password });
      await SecureStore.setItemAsync('jwt_token', response.data.token);
      navigation.replace('Dashboard');
    } catch (err) {
      setError('Invalid email or password.');
      console.error(err);
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
        <AuthForm title="Login" onSubmit={handleLogin} error={error} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Sign Up</Text></Text>
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

export default LoginScreen;