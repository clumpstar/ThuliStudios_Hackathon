import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase'; // Adjust path as needed

// --- Type for the cards fetched from the backend ---
type QuizCard = {
  id: number; // Matches QuizImage.id as integer
  name: string;
  uri: string;
  metadata?: {
    [key: string]: any; // Matches QuizImage.metadata as a dictionary
  };
};

type Swipe = {
  imageId: string | number; // Matches Pydantic Swipe.imageId
  swipe: 0 | 1; // Matches Pydantic Swipe.swipe
  metadata: { [key: string]: any }; // Matches Pydantic Swipe.metadata
};

export default function StyleQuizScreen() {
  const swiperRef = useRef<DeckSwiper<any>>(null);
  const { theme, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const fetchQuizData = async () => {
      console.info('Starting fetchQuizData', { authLoading });
      if (authLoading) return;

      try {
        if (!session || !session.user || !session.user.id) {
          console.error('No valid session or user ID', { session });
          setError('Please log in to access the style quiz.');
          setLoading(false);
          return;
        }

        // Verify user exists in users table
        console.info('Verifying user in Supabase', { userId: session.user.id });
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        if (userError || !user) {
          console.error('User verification failed:', userError?.message || 'No user found');
          await supabase.auth.signOut();
          router.replace('/auth');
          return;
        }
        console.info('User verified successfully');

        console.info('Fetching refine quiz images');
        const response = await fetch('http://192.168.0.4:8000/api/quiz/refine', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        console.info('Fetch response received', { status: response.status });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.info('Data received', { dataLength: data.length });
        const formattedCards = data.map((item: any) => ({
          id: item.id,
          name: item.name || 'Unnamed Item',
          uri: item.uri || 'https://placehold.co/400x600',
          metadata: item.metadata || {},
        }));
        setQuizCards(formattedCards);
      } catch (e: any) {
        console.error('Error in fetchQuizData:', e.message, { stack: e.stack });
        setError(e.message || 'An unknown error occurred.');
      } finally {
        console.info('Finally block executed, setting loading to false');
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchQuizData();
  }, [authLoading, session]);

  const handleSwipe = (cardIndex: number, direction: 'right' | 'left') => {
    const swipeValue: 0 | 1 = direction === 'right' ? 1 : 0;
    const card = quizCards[cardIndex];
    const newSwipe: Swipe = {
      imageId: card.id.toString(), // Convert to string to match Swipe.imageId flexibility
      swipe: swipeValue,
      metadata: card.metadata || {},
    };
    setSwipes(prevSwipes => [...prevSwipes, newSwipe]);
  };

  const handleQuizCompletion = () => {
    setIsFinished(true);
  };

  const submitQuiz = async () => {
    try {
      if (!session || !session.user || !session.user.id) {
        router.replace('/auth');
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      if (userError || !user) {
        console.error('User not found:', userError?.message);
        await supabase.auth.signOut();
        router.replace('/auth');
        return;
      }

      const response = await fetch('http://192.168.0.4:8000/api/refine-taste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id, swipes }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Failed to refine taste profile.');
      }
      const result = await response.json();
      console.log(result.message); // "Taste profile refined successfully."
      router.push('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Failed to submit quiz preferences.');
    }
  };

  const resetQuiz = () => {
    setSwipes([]);
    setIsFinished(false);
    setQuizCards([]);
    setLoading(true);
    const fetchQuizData = async () => {
      try {
        if (!session || !session.user || !session.user.id) {
          setError('Please log in to access the style quiz.');
          setLoading(false);
          return;
        }
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        if (userError || !user) {
          await supabase.auth.signOut();
          router.replace('/auth');
          return;
        }
        const response = await fetch('http://192.168.0.4:8000/api/quiz/refine', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to connect to the server.');
        const data = await response.json();
        const formattedCards = data.map((item: any) => ({
          id: item.id,
          name: item.name || 'Unnamed Item',
          uri: item.uri || 'https://placehold.co/400x600',
          metadata: item.metadata || {},
        }));
        setQuizCards(formattedCards);
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.content}>
          <Text style={[styles.title, isDark && styles.textDark]}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setLoading(true)}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/auth')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isFinished) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={80} color={isDark ? '#66FF99' : '#4CCC93'} />
          <Text style={[styles.title, isDark && styles.textDark]}>Refinement Completed!</Text>
          <Text style={[styles.subtitle, isDark && styles.textDarkMuted]}>Your style preferences have been updated.</Text>
          <TouchableOpacity style={styles.button} onPress={submitQuiz}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetQuiz}>
            <Text style={styles.buttonText}>Retake Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Ionicons name="shirt-outline" size={28} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>DressUp</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.textDark]}>Refine Your Style</Text>
        <Text style={[styles.subtitle, isDark && styles.textDarkMuted]}>Let us know what you're feeling now.</Text>
        <View style={styles.swiperContainer}>
          <DeckSwiper
            key={theme}
            ref={swiperRef}
            cards={quizCards}
            renderCard={(card) => (
              <View style={[styles.card, isDark && styles.cardDark]}>
                <Image source={{ uri: card.uri }} style={styles.image} resizeMode="cover" />
              </View>
            )}
            onSwipedLeft={(index) => handleSwipe(index, 'left')}
            onSwipedRight={(index) => handleSwipe(index, 'right')}
            onSwipedAll={handleQuizCompletion}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={-15}
            verticalSwipe={false}
            animateOverlayLabelsOpacity
            animateCardOpacity
            overlayLabels={{
              left: { title: 'NOPE', style: { label: [styles.overlayLabelNope, { color: isDark ? '#FF7777' : '#E5566D' }], wrapper: styles.overlayWrapper } },
              right: { title: 'LIKE', style: { label: [styles.overlayLabelLike, { color: isDark ? '#66FF99' : '#4CCC93' }], wrapper: styles.overlayWrapper } },
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerDark: { backgroundColor: '#121212', borderBottomColor: '#272729' },
  headerLogoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  swiperContainer: { height: 500, width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20, color: '#000000' },
  subtitle: { fontSize: 16, color: 'gray', textAlign: 'center', marginBottom: 20 },
  card: { height: 450, borderRadius: 20, backgroundColor: 'white', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardDark: { backgroundColor: '#1C1C1E' },
  image: { width: '100%', height: '100%', borderRadius: 20 },
  textDark: { color: '#FFFFFF' },
  textDarkMuted: { color: '#A9A9A9' },
  overlayWrapper: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 },
  overlayLabelNope: { fontSize: 45, fontWeight: 'bold', borderWidth: 5, padding: 10, borderRadius: 10, transform: [{ rotate: '15deg' }] },
  overlayLabelLike: { fontSize: 45, fontWeight: 'bold', borderWidth: 5, padding: 10, borderRadius: 10, transform: [{ rotate: '-15deg' }] },
  button: { width: '80%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginVertical: 10, backgroundColor: '#E5566D' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#e5e5e5' },
});