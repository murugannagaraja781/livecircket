import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export const LoginScreen = () => {
  const { loginWithGoogle } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await auth().createUserWithEmailAndPassword(email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      Alert.alert('Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>CRIC<Text style={{ color: COLORS.accent }}>X</Text></Text>
          <Text style={styles.tagline}>Fastest Cricket Live Line & Updates</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>{isRegister ? 'Join the cricketing world today' : 'Login to see live matches'}</Text>

          <View style={styles.inputContainer}>
            <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleAuth} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}</Text>
            <LogIn size={18} color={COLORS.white} />
          </TouchableOpacity>

          {!isRegister && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={googleLoading}>
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  scrollContent: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logo: { width: 100, height: 100 },
  appName: { fontSize: 36, fontWeight: '900', color: COLORS.white, marginTop: 15 },
  tagline: { color: COLORS.textMuted, fontSize: 13, marginTop: 5 },
  formCard: { backgroundColor: COLORS.card, padding: 30, borderRadius: 25, elevation: 10 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 25, marginTop: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.white, fontWeight: '600' },
  loginButton: {
    backgroundColor: COLORS.accent,
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginRight: 10 },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: 10,
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
  },
});
