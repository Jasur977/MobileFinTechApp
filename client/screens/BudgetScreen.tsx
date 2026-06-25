import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';

interface Budget {
  id: string;
  category: string;
  amount: number;
}

const BudgetScreen = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get<Budget[]>('/budgets');
      setBudgets(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch budgets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBudgets(); }, []));

  const handleCreateBudget = async () => {
    if (!category || !amount) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    try {
      await api.post('/budgets', { category, amount: parseFloat(amount) });
      setCategory('');
      setAmount('');
      fetchBudgets(); // Refresh the list
    } catch (err) {
      Alert.alert('Error', 'Failed to create budget.');
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: Budget }) => (
    <View style={styles.budgetItem}>
      <Text style={styles.categoryText}>{item.category}</Text>
      <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budgets</Text>
      
      <View style={styles.createForm}>
        <TextInput
          style={styles.input}
          placeholder="Category (e.g., Dining)"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Monthly Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Button title="Create Budget" onPress={handleCreateBudget} />
      </View>

      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No budgets set.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  createForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  budgetItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: { fontSize: 16, fontWeight: '500' },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' },
});

export default BudgetScreen;