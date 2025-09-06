import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import DeckSwiper from 'react-native-deck-swiper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type QuizCard = {
  id: number;
  name: string;
  uri: string;
  metadata: {
    primary_color: string;
    fit: string;
    pattern: string;
    type: string;
  };
};

export default function InitialQuizScreen() {
  const router = useRouter();
  const { session, loading: authLoading, theme } = useAuth();
  const [swipes, setSwipes] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<QuizCard | null>(null);
  const swiperRef = useRef<DeckSwiper<any>>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuthAndUser = async () => {
      if (authLoading) return;

      try {
        if (!session) {
          console.log('No valid session, redirecting to auth');
          router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
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
          router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
          return;
        }

        // Fetch quiz data
        const response = await fetch('http://192.168.0.4:8000/api/quiz/initial');
        if (!response.ok) {
          throw new Error('Failed to connect to the server. Is it running?');
        }
        const data = await response.json();
        setQuizCards(data);
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndUser();
  }, [authLoading, session]);

  const handleSwipe = (cardIndex: number, direction: 'right' | 'left') => {
    const swipeValue = direction === 'right' ? 1 : 0;
    const card = quizCards[cardIndex];
    const newSwipe = { 
      imageId: card.id, 
      swipe: swipeValue, 
      metadata: card.metadata 
    };
    setSwipes(prevSwipes => [...prevSwipes, newSwipe]);
  };

  const handleQuizCompletion = () => {
    setIsFinished(true);
  };

  const submitQuiz = async () => {
    try {
      if (!session) {
        console.log('No valid session, redirecting to auth');
        router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
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
        router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
        return;
      }

      const response = await fetch('http://192.168.0.4:8000/api/quiz/initial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          swipes: swipes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      router.push('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Failed to submit quiz');
    }
  };

  const resetQuiz = () => {
    setSwipes([]);
    setIsFinished(false);
    swiperRef.current?.jumpToCardIndex(0);
  };

  const openCardDetails = (card: QuizCard) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const closeCardDetails = () => {
    setModalVisible(false);
    setTimeout(() => translateY.setValue(0), 300);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      if (event.nativeEvent.translationY > 150) {
        closeCardDetails();
      } else {
        Animated.spring(translateY, { 
          toValue: 0, 
          useNativeDriver: true 
        }).start();
      }
    }
  };

  if (loading || authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme === 'light' ? '#007AFF' : '#4C8EFF'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, theme === 'light' ? styles.light : styles.dark]}>
        <Text style={[styles.errorText, { color: theme === 'light' ? 'red' : '#FF5555' }]}>{error}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme === 'light' ? '#007AFF' : '#4C8EFF' }]} onPress={() => {
          setError(null);
          setLoading(true);
          const retry = async () => {
            try {
              if (!session) {
                router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
                return;
              }
              const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle();
              if (userError || !user) {
                await supabase.auth.signOut();
                router.replace({ pathname: '/auth', params: { swipes: JSON.stringify(swipes) } });
                return;
              }
              const response = await fetch('http://192.168.0.4:8000/api/quiz/initial');
              if (!response.ok) {
                throw new Error('Failed to connect to the server.');
              }
              const data = await response.json();
              setQuizCards(data);
            } catch (e: any) {
              setError(e.message || 'An unknown error occurred.');
            } finally {
              setLoading(false);
            }
          };
          retry();
        }}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFinished) {
    return (
      <SafeAreaView style={[styles.container, styles.center, theme === 'light' ? styles.light : styles.dark]}>
        <Ionicons name="checkmark-circle" size={80} color={theme === 'light' ? '#4CCC93' : '#66FF99'} />
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#FFF' }]}>Quiz Completed!</Text>
        <Text style={[styles.subtitle, { color: theme === 'light' ? 'gray' : '#AAA' }]}>You're all set. Let's create your account to see your personalized styles.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme === 'light' ? '#007AFF' : '#4C8EFF' }]} onPress={submitQuiz}>
          <Text style={styles.buttonText}>Continue to Your Styles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton, { backgroundColor: theme === 'light' ? '#e5e5e5' : '#333' }]} onPress={resetQuiz}>
          <Text style={[styles.buttonText, { color: theme === 'light' ? '#007AFF' : '#4C8EFF' }]}>Retake Quiz</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, theme === 'light' ? styles.light : styles.dark]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#FFF' }]}>Let's Find Your Style!</Text>
      <Text style={[styles.subtitle, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Swipe right for styles you like, left for those you don't.</Text>
      <View style={styles.swiperContainer}>
        <DeckSwiper
          ref={swiperRef}
          cards={quizCards}
          renderCard={(card: QuizCard) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openCardDetails(card)}>
              <View style={[styles.card, { backgroundColor: theme === 'light' ? 'white' : '#222' }]}>
                <Image source={{ uri: card.uri }} style={styles.image} resizeMode="cover" />
              </View>
            </TouchableOpacity>
          )}
          onSwipedLeft={(index) => handleSwipe(index, 'left')}
          onSwipedRight={(index) => handleSwipe(index, 'right')}
          onSwipedAll={handleQuizCompletion}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={-15}
          animateOverlayLabelsOpacity
          animateCardOpacity
          verticalSwipe={false}
          overlayLabels={{
            left: { 
              title: 'NOPE', 
              style: { label: [styles.overlayLabelNope, { color: theme === 'light' ? '#E5566D' : '#FF7777' }], wrapper: styles.overlayWrapper } 
            },
            right: { 
              title: 'LIKE', 
              style: { label: [styles.overlayLabelLike, { color: theme === 'light' ? '#4CCC93' : '#66FF99' }], wrapper: styles.overlayWrapper } 
            },
          }}
        />
      </View>

      <Modal 
        visible={isModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={closeCardDetails}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)' }]} onPress={closeCardDetails}>
          <PanGestureHandler 
            onGestureEvent={onGestureEvent} 
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View style={[
              styles.drawerContainer, 
              { transform: [{ 
                translateY: translateY.interpolate({ 
                  inputRange: [0, 400], 
                  outputRange: [0, 400], 
                  extrapolate: 'clamp' 
                }) 
              }], backgroundColor: theme === 'light' ? 'white' : '#222' }
            ]}>
              <View style={[styles.drawerHandle, { backgroundColor: theme === 'light' ? '#ccc' : '#555' }]} />
              {selectedCard && (
                <View style={styles.drawerContent}>
                  <View style={styles.metadataRow}>
                    <Text style={[styles.metadataLabel, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Color:</Text>
                    <Text style={[styles.metadataValue, { color: theme === 'light' ? '#000' : '#FFF' }]}>{selectedCard.metadata.primary_color}</Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Text style={[styles.metadataLabel, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Fit:</Text>
                    <Text style={[styles.metadataValue, { color: theme === 'light' ? '#000' : '#FFF' }]}>{selectedCard.metadata.fit}</Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Text style={[styles.metadataLabel, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Pattern:</Text>
                    <Text style={[styles.metadataValue, { color: theme === 'light' ? '#000' : '#FFF' }]}>{selectedCard.metadata.pattern}</Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Text style={[styles.metadataLabel, { color: theme === 'light' ? 'gray' : '#AAA' }]}>Type:</Text>
                    <Text style={[styles.metadataValue, { color: theme === 'light' ? '#000' : '#FFF' }]}>{selectedCard.metadata.type}</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          </PanGestureHandler>
        </Pressable>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  light: {
    backgroundColor: '#f5f5f5',
  },
  dark: {
    backgroundColor: '#111',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  errorText: { 
    textAlign: 'center', 
    fontSize: 16, 
    marginBottom: 20 
  },
  swiperContainer: { 
    height: 500, 
    width: '100%' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  card: { 
    height: 450, 
    borderRadius: 15, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4 
  },
  image: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 15 
  },
  overlayWrapper: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1 
  },
  overlayLabelNope: { 
    fontSize: 45, 
    fontWeight: 'bold', 
    borderWidth: 5, 
    padding: 10, 
    borderRadius: 10, 
    transform: [{ rotate: '15deg' }] 
  },
  overlayLabelLike: { 
    fontSize: 45, 
    fontWeight: 'bold', 
    borderWidth: 5, 
    padding: 10, 
    borderRadius: 10, 
    transform: [{ rotate: '-15deg' }] 
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#e5e5e5',
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  drawerContainer: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    minHeight: 300 
  },
  drawerHandle: { 
    width: 40, 
    height: 5, 
    borderRadius: 2.5, 
    alignSelf: 'center', 
    marginBottom: 15 
  },
  drawerContent: { 
    alignItems: 'flex-start' 
  },
  metadataRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  metadataLabel: { 
    fontSize: 16,
  },
  metadataValue: { 
    fontSize: 16, 
    fontWeight: '600', 
    textTransform: 'capitalize' 
  },
});