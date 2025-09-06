import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; // Adjust path if needed

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has a profile in the profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          // Profile exists, redirect to tabs
          router.replace('/(tabs)');
        } else {
          // No profile, redirect to initial quiz
          router.replace('/initial-quiz');
        }
      } else {
        // No session, redirect to auth
        router.replace('/auth');
      }
      setLoading(false);
    };

    // A small delay to show the logo briefly before checking session
    const timer = setTimeout(() => {
      checkSessionAndProfile();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    // Show a loading indicator with the logo
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="shirt-outline" size={100} color="#8A2BE2" />
        <Text style={styles.logoText}>DressUp</Text>
        <ActivityIndicator size="small" color="#8A2BE2" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="shirt-outline" size={100} color="#8A2BE2" />
        <Text style={styles.logoText}>DressUp</Text>
        <Text style={styles.tagline}>Your Personal Style, Discovered.</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/auth')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  tagline: {
    fontSize: 18,
    color: 'gray',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});