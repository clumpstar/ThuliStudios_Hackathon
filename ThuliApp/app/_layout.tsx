import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function RootLayoutContent() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (authLoading) return;

      try {
        if (!session) {
          console.log('No valid session, redirecting to auth');
          if (segments[0] !== 'auth') {
            router.replace('/auth');
          }
          setLoading(false);
          return;
        }

        // Verify user exists in users table
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userError || !user) {
          console.error('User not found in users table:', userError?.message || 'No user found');
          await supabase.auth.signOut();
          if (segments[0] !== 'auth') {
            router.replace('/auth');
          }
          setLoading(false);
          return;
        }

        // Check if initial quiz is required
        console.log(`Fetching profile status for user_id: ${session.user.id}`);
        const response = await fetch(`http://192.168.0.4:8000/api/quiz/initial/required?user_id=${session.user.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Profile check failed: Status ${response.status}, ${errorText}`);
          throw new Error(`Failed to check profile status: ${response.status} ${errorText}`);
        }

        const { required } = await response.json();
        console.log(`Profile required: ${required}`);

        if (required && segments[0] !== 'initial-quiz') {
          router.replace('/initial-quiz');
        } else if (!required && segments[0] !== '(tabs)') {
          router.replace('/(tabs)');
        }
      } catch (error) {
        // console.error('Error checking auth/profile:', error);
        if (segments[0] !== 'auth') {
          router.replace('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [authLoading, session, segments, router]);

  if (loading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}