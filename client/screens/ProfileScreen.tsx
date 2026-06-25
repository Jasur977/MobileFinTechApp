import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ email: string }>('/user/profile');
        setEmail(response.data.email);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch profile information.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Button title="Logout" onPress={handleLogout} color="#E53935" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  email: {
    fontSize: 18,
    marginTop: 5,
  },
  footer: {
    marginTop: 30,
  }
});

export default ProfileScreen;