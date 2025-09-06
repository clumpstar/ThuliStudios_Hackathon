import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

interface StyleQuizCardProps {
  card: {
    id: string;
    name: string;
    image: string;
  };
}

const { width } = Dimensions.get('window');

const StyleQuizCard: React.FC<StyleQuizCardProps> = ({ card }) => {
  if (!card) return null;

  return (
    <View style={styles.card}>
      <Image source={{ uri: card.image }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.name}>{card.name}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: width * 1.3,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
});

export default StyleQuizCard;
