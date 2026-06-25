import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator'; // Import the central param list

type Props = NativeStackScreenProps<RootStackParamList, 'EditTransaction'>;

const EditTransactionScreen = ({ route, navigation }: Props) => {
  const { transaction } = route.params;

  const [description, setDescription] = useState(transaction.rawDescription);
  const [amount, setAmount] = useState(transaction.amount.toString());
  // Format date correctly for TextInput value
  const [date, setDate] = useState(new Date(transaction.transactionDate).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateTransaction = async () => {
    if (!description || !amount || !date) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.put(`/transactions/${transaction.id}`, {
        rawDescription: description,
        amount: parseFloat(amount),
        transactionDate: date,
      });
      
      navigation.goBack();

    } catch (err: any) {
      console.error('Update Transaction Error:', err.response ? err.response.data : err.message);
      setError('Failed to update transaction. Please try again.');
      Alert.alert('Error', 'Could not update the transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Transaction</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Description"
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
        <Button title="Update Transaction" onPress={handleUpdateTransaction} />
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

export default EditTransactionScreen;