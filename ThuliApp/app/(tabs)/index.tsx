import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dummy recommendation data for demonstration
const DUMMY_RECOMMENDATIONS = [
  { id: '1', name: 'Vintage Denim Jacket', brand: 'RetroFits', price: 89.99, fit: 'Regular', color: 'Blue', image: 'https://placehold.co/400x600?text=Denim+Jacket' },
  { id: '2', name: 'Linen Summer Dress', brand: 'BreezyStyle', price: 120.00, fit: 'Loose', color: 'Beige', image: 'https://placehold.co/400x600?text=Summer+Dress' },
  { id: '3', name: 'Slim-Fit Chinos', brand: 'UrbanWear', price: 65.50, fit: 'Slim', color: 'Khaki', image: 'https://placehold.co/400x600?text=Chinos' },
  { id: '4', name: 'Graphic Print Tee', brand: 'Artify', price: 35.00, fit: 'Oversized', color: 'Black', image: 'https://placehold.co/400x600?text=Graphic+Tee' },
  { id: '5', name: 'Leather Ankle Boots', brand: 'StepUp', price: 150.00, fit: 'Standard', color: 'Brown', image: 'https://placehold.co/400x600?text=Boots' },
];

// Card component for a single recommendation
const RecommendationCard = ({ item, isDark }: { item: any, isDark: boolean }) => (
  <View style={[styles.card, isDark && styles.cardDark]}>
    <Image source={{ uri: item.image }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={[styles.cardBrand, isDark && styles.textDarkMuted]}>{item.brand}</Text>
      <Text style={[styles.cardName, isDark && styles.textDark]}>{item.name}</Text>
      <View style={styles.metadataContainer}>
        <Text style={[styles.metadataText, isDark && styles.textDarkMuted]}>{item.fit} Fit</Text>
        <Text style={[styles.metadataText, isDark && styles.textDarkMuted]}>{item.color}</Text>
      </View>
      <Text style={[styles.cardPrice, isDark && styles.textDark]}>${item.price.toFixed(2)}</Text>
    </View>
  </View>
);

export default function HomeScreen() {
  const { theme } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from your backend
    setTimeout(() => {
      setRecommendations(DUMMY_RECOMMENDATIONS);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Updated Custom Header - Centered with no settings icon */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerLogoContainer}>
          <Ionicons name="shirt-outline" size={28} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>DressUp</Text>
        </View>
      </View>

      {/* Recommendations List */}
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecommendationCard item={item} isDark={isDark} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => <Text style={[styles.listTitle, isDark && styles.textDark]}>For You</Text>}
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
    justifyContent: 'center', // Center the content
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
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
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
});

