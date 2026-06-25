import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

interface Transaction {
  id: string;
  rawDescription: string;
  amount: number;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  category: string | null;
}

const DashboardScreen = ({ navigation }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
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

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds([]);
  };

  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    Alert.alert(`Delete ${selectedIds.length} Transactions`, "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await api.delete('/transactions', { data: selectedIds });
            fetchData();
            setIsSelectMode(false);
            setSelectedIds([]);
          } catch (err) {
            Alert.alert("Error", "Failed to delete selected transactions.");
          }
        },
        style: "destructive",
      },
    ]);
  };

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
      fetchData();
    } catch (err) {
      console.error('CSV Upload Error:', err);
      Alert.alert('Error', 'Failed to upload CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    navigation.replace('Login');
  };

  const handleEdit = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transaction });
  };
  
  const handleDelete = async (transactionId: string) => {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: async () => {
          try {
            await api.delete(`/transactions/${transactionId}`);
            fetchData();
          } catch (err) {
            Alert.alert("Error", "Failed to delete transaction.");
          }
        }, style: "destructive" },
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity onLongPress={toggleSelectMode} onPress={() => isSelectMode && handleSelectItem(item.id)}>
        <View style={[styles.card, isSelected && styles.cardSelected]}>
          {isSelectMode && (
            <MaterialIcons name={isSelected ? 'check-circle' : 'radio-button-unchecked'} size={24} color="#007AFF" style={styles.checkbox} />
          )}
          <View style={styles.cardContent}>
            <Text style={styles.description}>{item.rawDescription}</Text>
            <View style={styles.row}>
              <Text style={styles.date}>{new Date(item.transactionDate).toLocaleDateString()}</Text>
              {item.category && <View style={styles.categoryBadge}><Text style={styles.categoryText}>{item.category}</Text></View>}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, item.type === 'INCOME' ? styles.income : styles.expense]}>{item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}</Text>
            {!isSelectMode && (
              <>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}><MaterialIcons name="edit" size={22} color="#007AFF" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}><MaterialIcons name="delete-outline" size={22} color="#E53935" /></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.headerButtons}>
          {!isSelectMode ? (
            <>
              <Button title="Select" onPress={toggleSelectMode} />
              <View style={{ width: 10 }} /><Button title="Upload" onPress={handleUploadCsv} /><View style={{ width: 10 }} /><Button title="Add" onPress={() => navigation.navigate('AddTransaction')} />
            </>
          ) : (
            <Button title="Cancel" onPress={toggleSelectMode} />
          )}
        </View>
      </View>
      {loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }}/> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<View style={styles.balanceCard}><Text style={styles.balanceLabel}>Total Balance</Text><Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text></View>}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
      {isSelectMode && selectedIds.length > 0 && (
        <View style={styles.bulkDeleteFooter}><Text style={styles.selectedCount}>{selectedIds.length} selected</Text><Button title="Delete Selected" color="#E53935" onPress={handleDeleteSelected} /></View>
      )}
      {!isSelectMode && <View style={styles.footer}><Button title="Logout" onPress={handleLogout} /></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  balanceCard: { backgroundColor: '#007AFF', borderRadius: 12, padding: 20, marginVertical: 10, alignItems: 'center', elevation: 3 },
  balanceLabel: { fontSize: 16, color: '#FFFFFF', opacity: 0.8 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  listContent: { paddingHorizontal: 15, paddingBottom: 80 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 15, marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  cardSelected: { backgroundColor: '#E8F0FE', borderColor: '#007AFF', borderWidth: 1 },
  checkbox: { marginRight: 15 },
  cardContent: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  description: { fontSize: 16, fontWeight: '500', marginBottom: 5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12, color: '#666' },
  categoryBadge: { backgroundColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  categoryText: { fontSize: 10, color: '#333', fontWeight: '500' },
  amount: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  income: { color: '#2E7D32' },
  expense: { color: '#C62828' },
  actionButton: { padding: 5, marginLeft: 5 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F4F6F8' },
  bulkDeleteFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#E0E0E0' },
  selectedCount: { fontSize: 16, fontWeight: 'bold' }
});

export default DashboardScreen;