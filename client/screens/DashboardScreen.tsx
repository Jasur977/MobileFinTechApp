import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api/api';

// Navigation and data types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  AddTransaction: undefined;
};

interface Transaction {
  id: string;
  rawDescription: string;
  amount: number;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
}

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen = ({ navigation }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch transactions and balance in parallel
      const [transactionsResponse, balanceResponse] = await Promise.all([
        api.get<Transaction[]>('/transactions'),
        api.get<{ balance: number }>('/transactions/balance'),
      ]);

      const sorted = transactionsResponse.data.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      setTransactions(sorted);
      setBalance(balanceResponse.data.balance);
      setError('');
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleUploadCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

      setLoading(true);
      await api.post('/transactions/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'CSV uploaded successfully.');
      fetchData(); // Refresh all data
    } catch (err) {
      console.error('CSV Upload Error:', err);
      Alert.alert('Error', 'Failed to upload CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: async () => {
          try {
            await api.delete(`/transactions/${transactionId}`);
            fetchData(); // Refresh all data
          } catch (err) {
            Alert.alert("Error", "Failed to delete transaction.");
          }
        }, style: "destructive" },
    ]);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.description}>{item.rawDescription}</Text>
        <Text style={styles.date}>{new Date(item.transactionDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.amount, item.type === 'INCOME' ? styles.income : styles.expense]}>
          {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.headerButtons}>
          <Button title="Upload" onPress={handleUploadCsv} />
          <View style={{ width: 10 }} />
          <Button title="Add" onPress={() => navigation.navigate('AddTransaction')} />
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }}/>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.footer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  balanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: { paddingHorizontal: 15, paddingBottom: 80 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 15, marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  cardContent: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  description: { fontSize: 16, fontWeight: '500' },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold', marginRight: 15 },
  income: { color: '#2E7D32' },
  expense: { color: '#C62828' },
  deleteButton: { padding: 5 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F4F6F8' }
});

export default DashboardScreen;