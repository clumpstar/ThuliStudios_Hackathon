import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ProductCard = ({ card }) => {
    if (!card) return null;

    return (
        <View style={styles.card}>
            <Image source={{ uri: card.image }} style={styles.image} />
            <View style={styles.overlay}>
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{card.name}</Text>
                    <Text style={styles.brand}>{card.brand}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>${card.price.toFixed(2)}</Text>
                </View>
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
        height: '30%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        padding: 20,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    brand: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    priceContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E1E1E',
    }
});

export default ProductCard;
