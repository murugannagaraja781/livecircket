import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};
