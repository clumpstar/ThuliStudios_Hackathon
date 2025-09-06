import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { swipes } = useLocalSearchParams<{ swipes?: string }>();
  const { session, signOut, theme } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || (isSignUp && !trimmedConfirmPassword)) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (isSignUp) {
      if (trimmedPassword !== trimmedConfirmPassword) {
        Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
        return false;
      }
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(trimmedPassword)) {
        Alert.alert('Weak Password', 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    if (isSignUp) {
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.trim())
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error(checkError.message || 'Error checking email existence');
        }

        if (existingUser) {
          Alert.alert('Account Exists', 'You already have an account. Please sign in.');
          setIsSignUp(false);
          setConfirmPassword('');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already exists')) {
            Alert.alert('Account Exists', 'You already have an account. Please sign in.');
            setIsSignUp(false);
            setConfirmPassword('');
          } else {
            Alert.alert('Authentication Error', error.message);
          }
        } else {
          Alert.alert('Success!', 'Please check your email to confirm your account.');
          setIsSignUp(false);
          setConfirmPassword('');
        }
      } catch (e: any) {
        Alert.alert('Authentication Error', e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (!data.session) throw new Error('Sign in failed, please try again.');

        if (swipes) {
          const parsedSwipes = JSON.parse(swipes);
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ style_preferences: parsedSwipes, updated_at: new Date() })
            .eq('id', data.session.user.id);

          if (profileError) throw profileError;
        }

        router.replace('/(tabs)');
      } catch (e: any) {
        Alert.alert('Authentication Error', e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, theme === 'light' ? styles.light : styles.dark]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#FFF' }]}>{isSignUp ? 'Create Your Account' : 'Welcome Back!'}</Text>
      <Text style={[styles.subtitle, { color: theme === 'light' ? 'gray' : '#AAA' }]}>To see your personalized style suggestions, please sign in or create an account.</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme === 'light' ? 'white' : '#222', borderColor: theme === 'light' ? '#ccc' : '#444', color: theme === 'light' ? '#000' : '#FFF' }]}
        placeholder="Email"
        placeholderTextColor={theme === 'light' ? '#999' : '#777'}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, { backgroundColor: theme === 'light' ? 'white' : '#222', borderColor: theme === 'light' ? '#ccc' : '#444', color: theme === 'light' ? '#000' : '#FFF' }]}
        placeholder="Password"
        placeholderTextColor={theme === 'light' ? '#999' : '#777'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isSignUp && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? 'white' : '#222', borderColor: theme === 'light' ? '#ccc' : '#444', color: theme === 'light' ? '#000' : '#FFF' }]}
            placeholder="Confirm Password"
            placeholderTextColor={theme === 'light' ? '#999' : '#777'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Text style={[styles.passwordHint, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Use 8+ characters with a mix of letters, numbers & symbols.</Text>
        </>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme === 'light' ? '#007AFF' : '#4C8EFF' }]} onPress={handleAuth} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, { backgroundColor: theme === 'light' ? 'transparent' : '#333' }]}
        onPress={() => setIsSignUp(!isSignUp)}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: theme === 'light' ? '#007AFF' : '#4C8EFF' }]}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>

      {session && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme === 'light' ? '#E5566D' : '#FF7777' }]} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  light: { backgroundColor: '#f5f5f5' },
  dark: { backgroundColor: '#111' },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 15,
    marginVertical: 10,
    borderRadius: 15,
  },
  passwordHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
});