import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { WalletProvider } from './src/context/WalletContext';
import WalletScreen from './src/screens/WalletScreen';
import PatientRegistrationScreen from './src/screens/PatientRegistrationScreen';
import EncounterFormScreen from './src/screens/EncounterFormScreen';
import RecordHistoryScreen from './src/screens/RecordHistoryScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = {
    Identity: '🪪',
    Register: '👤',
    Encounter: '📋',
    History: '📁',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '•'}</Text>;
}

export default function App() {
  return (
    <WalletProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: () => <TabIcon label={route.name} />,
            tabBarActiveTintColor: '#7C3AED',
            tabBarInactiveTintColor: '#9CA3AF',
            headerStyle: { backgroundColor: '#7C3AED' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
          })}
        >
          <Tab.Screen
            name="Identity"
            component={WalletScreen}
            options={{ title: '🏥 MediRelay' }}
          />
          <Tab.Screen
            name="Register"
            component={PatientRegistrationScreen}
            options={{ title: 'Register Patient' }}
          />
          <Tab.Screen
            name="Encounter"
            component={EncounterFormScreen}
            options={{ title: 'New Encounter' }}
          />
          <Tab.Screen
            name="History"
            component={RecordHistoryScreen}
            options={{ title: 'Record History' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </WalletProvider>
  );
}
