import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Card component for a single recommendation
const RecommendationCard = ({ item, isDark }: { item: any, isDark: boolean }) => (
  <View style={[styles.card, isDark && styles.cardDark]}>
    <Image source={{ uri: item.image }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={[styles.cardBrand, isDark && styles.textDarkMuted]}>{item.brand || 'Unknown Brand'}</Text>
      <Text style={[styles.cardName, isDark && styles.textDark]}>{item.name}</Text>
      <View style={styles.metadataContainer}>
        <Text style={[styles.metadataText, isDark && styles.textDarkMuted]}>{item.fit || 'Regular'} Fit</Text>
        <Text style={[styles.metadataText, isDark && styles.textDarkMuted]}>{item.primary_color || 'Unknown'}</Text>
      </View>
      <Text style={[styles.cardPrice, isDark && styles.textDark]}>${(item.price || 0).toFixed(2)}</Text>
    </View>
  </View>
);

export default function HomeScreen() {
  const { theme, session } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session || !session.user || !session.user.id) {
        setError('Please log in to view recommendations.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://192.168.0.4:8000/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: session.user.id }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // Map API response to include optional fields like price and brand (assuming defaults if not provided)
        const mappedRecommendations = data.map((item: any) => ({
          ...item,
          brand: item.brand || 'Unknown Brand',
          price: item.price || 0, // Assuming price might not be in the Recommendation model yet
        }));
        setRecommendations(mappedRecommendations);
      } catch (e: any) {
        console.error('Error fetching recommendations:', e.message);
        setError(e.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.content}>
          <Text style={[styles.listTitle, isDark && styles.textDark]}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setLoading(true)}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerLogoContainer}>
          <Ionicons name="shirt-outline" size={28} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>DressUp</Text>
        </View>
      </View>

      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <RecommendationCard item={item} isDark={isDark} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => <Text style={[styles.listTitle, isDark && styles.textDark]}>For You</Text>}
        ListEmptyComponent={() => (
          <Text style={[styles.listTitle, isDark && styles.textDark]}>No recommendations available.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerDark: {
    backgroundColor: '#121212',
    borderBottomColor: '#272729',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  listTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardDark: { backgroundColor: '#1C1C1E' },
  cardImage: { width: '100%', height: 400, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  cardContent: { padding: 15 },
  cardBrand: { color: 'gray', fontSize: 14, marginBottom: 5 },
  cardName: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  metadataContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metadataText: { color: 'gray', fontSize: 14 },
  cardPrice: { fontSize: 18, fontWeight: 'bold' },
  textDark: { color: '#FFFFFF' },
  textDarkMuted: { color: '#A9A9A9' },
  button: { width: '80%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginVertical: 10, backgroundColor: '#E5566D' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});