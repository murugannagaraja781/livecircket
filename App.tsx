import React, { useContext, useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/redux/store';
import { updateMatch } from './src/redux/matchesSlice';
import io from 'socket.io-client';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { MatchDetailScreen } from './src/screens/MatchDetailScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/colors';

const Stack = createStackNavigator();

const AppContent = () => {
  const { user, initializing } = useContext(AuthContext);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      const socket = io(CONFIG.SOCKET_SERVER);
      socket.on('score_update', (data) => {
        dispatch(updateMatch(data));
      });
      return () => socket.disconnect();
    }
  }, [user]);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' }
});
