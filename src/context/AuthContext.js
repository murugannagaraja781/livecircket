import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: '918317979398-p2erua31voh342pgdo4m1uqbgslh83mh.apps.googleusercontent.com',
      offlineAccess: true,
    });

    const subscriber = auth().onAuthStateChanged((usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  const logout = async () => {
    try {
      await auth().signOut();
      // Also sign out from Google
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (e) {
        // Ignore Google sign out errors
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
