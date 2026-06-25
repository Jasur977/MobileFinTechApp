import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';

// Define the transaction type for navigation params
interface Transaction {
  id: string;
  rawDescription: string;
  amount: number;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  category: string | null;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  AddTransaction: undefined;
  EditTransaction: { transaction: Transaction }; // Route expects a transaction object
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }}/>
        <Stack.Screen 
          name="AddTransaction" 
          component={AddTransactionScreen} 
          options={{ title: 'Add Transaction' }} 
        />
        <Stack.Screen 
          name="EditTransaction" 
          component={EditTransactionScreen} 
          options={{ title: 'Edit Transaction' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;