import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../api/api';

// Assuming your navigation stack param list is defined elsewhere
// For now, let's define it here for clarity
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  AddTransaction: undefined; // Add this
};

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

const AddTransactionScreen = ({ navigation }: Props) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTransaction = async () => {
    if (!description || !amount || !date) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/transactions', {
        rawDescription: description,
        amount: parseFloat(amount),
        transactionDate: date,
      });
      
      // Navigate back to the Dashboard, which will then re-fetch the updated list
      navigation.goBack();

    } catch (err: any) {
      console.error('Add Transaction Error:', err.response ? err.response.data : err.message);
      setError('Failed to add transaction. Please try again.');
      Alert.alert('Error', 'Could not add the transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Transaction</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Description (e.g., Coffee, Groceries)"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Add Transaction" onPress={handleAddTransaction} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default AddTransactionScreen;