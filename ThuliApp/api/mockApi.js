// This file simulates a backend API for rapid frontend development.
// It provides mock data and functions to mimic server responses.

const celebrityData = [
    { id: 'celeb_1', name: 'Zendaya', image: 'https://placehold.co/600x800/E6E6FA/333?text=Zendaya' },
    { id: 'celeb_2', name: 'Timothée Chalamet', image: 'https://placehold.co/600x800/F0FFF0/333?text=Timothée' },
    { id: 'celeb_3', name: 'Florence Pugh', image: 'https://placehold.co/600x800/FFF0F5/333?text=Florence' },
    { id: 'celeb_4', name: 'Harry Styles', image: 'https://placehold.co/600x800/F5F5DC/333?text=Harry' },
    { id: 'celeb_5', name: 'Anya Taylor-Joy', image: 'https://placehold.co/600x800/FFFFF0/333?text=Anya' },
    { id: 'celeb_6', name: 'Ryan Gosling', image: 'https://placehold.co/600x800/FAFAD2/333?text=Ryan' },
];

const productData = [
    {
        id: 'prod_1',
        name: 'Classic Linen Shirt',
        brand: 'EverLane',
        price: '₹7,500',
        fit: 'Relaxed Fit',
        sizes: ['S', 'M', 'L', 'XL'],
        image: 'https://placehold.co/600x800/ADD8E6/333?text=Linen+Shirt',
        url: 'https://www.example.com/product1',
        description: 'A breezy, comfortable shirt made from 100% premium linen. Perfect for warm weather.'
    },
    {
        id: 'prod_2',
        name: 'Vintage Straight Jeans',
        brand: 'Levi\'s',
        price: '₹9,999',
        fit: 'Straight Leg',
        sizes: ['28', '30', '32', '34'],
        image: 'https://placehold.co/600x800/B0C4DE/333?text=Straight+Jeans',
        url: 'https://www.example.com/product2',
        description: 'Iconic straight-fit jeans with a classic vintage wash. Built to last.'
    },
    {
        id: 'prod_3',
        name: 'Gold Hoop Earrings',
        brand: 'Mejuri',
        price: '₹5,000',
        fit: 'N/A',
        sizes: ['One Size'],
        image: 'https://placehold.co/600x800/FFD700/333?text=Gold+Hoops',
        url: 'https://www.example.com/product3',
        description: 'Elegant and lightweight gold vermeil hoops for everyday wear.'
    },
     {
        id: 'prod_4',
        name: 'Tech Performance Tee',
        brand: 'Nike',
        price: '₹4,200',
        fit: 'Athletic Fit',
        sizes: ['S', 'M', 'L'],
        image: 'https://placehold.co/600x800/D3D3D3/333?text=Tech+Tee',
        url: 'https://www.example.com/product4',
        description: 'A moisture-wicking tee designed for high-performance workouts.'
    },
];

// --- API Functions ---

// Simulate fetching celebrity styles for the initial quiz
export const getStyleQuizItems = () => {
    console.log('Mock API: Fetching style quiz items...');
    return new Promise(resolve => {
        setTimeout(() => resolve(celebrityData), 500); // Simulate network delay
    });
};

// Simulate fetching product recommendations
export const getRecommendations = (userId) => {
    console.log(`Mock API: Fetching recommendations for user ${userId}...`);
    // In a real app, this would be a complex query. Here, we just shuffle.
    const shuffledProducts = [...productData].sort(() => 0.5 - Math.random());
    return new Promise(resolve => {
        setTimeout(() => resolve(shuffledProducts), 800);
    });
};

// Simulate recording a user's swipe interaction
export const recordInteraction = (userId, productId, action) => {
    console.log(`Mock API: User ${userId} ${action} product ${productId}`);
    return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 200);
    });
};
