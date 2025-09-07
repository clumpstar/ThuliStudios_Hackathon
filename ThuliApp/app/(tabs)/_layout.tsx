import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { GestureHandlerRootView, TapGestureHandler, State } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export default function TabLayout() {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawerAnimation = useState(new Animated.Value(-DRAWER_WIDTH))[0];

  useEffect(() => {
    // Check for context issues
    if (!theme) {
      setError('AuthContext is not properly initialized. Ensure useAuth is provided.');
    }
  }, [theme]);

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(drawerAnimation, {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  const handleOverlayTap = ({ nativeEvent }: { nativeEvent: { state: State } }) => {
    if (nativeEvent.state === State.ACTIVE && drawerOpen) {
      toggleDrawer();
    }
  };

  const CustomDrawerContent = (props: any) => {
    return (
      <DrawerContentScrollView
        {...props}
        style={[styles.drawerContent, isDark && styles.drawerContentDark]}
        contentContainerStyle={styles.drawerContentContainer}
      >
        <DrawerItem
          label="Home"
          onPress={() => {
            router.push('/(tabs)');
            toggleDrawer();
          }}
          icon={({ size }) => <Ionicons name="home-outline" size={size} color={isDark ? '#fff' : '#000'} />}
          labelStyle={[styles.drawerItemLabel, isDark && styles.textDark]}
          style={styles.drawerItem}
          activeBackgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          activeTintColor={isDark ? '#fff' : '#000'}
        />
        <DrawerItem
          label="Style Quiz"
          onPress={() => {
            router.push('/(tabs)/StyleQuiz');
            toggleDrawer();
          }}
          icon={({ size }) => <Ionicons name="shirt-outline" size={size} color={isDark ? '#fff' : '#000'} />}
          labelStyle={[styles.drawerItemLabel, isDark && styles.textDark]}
          style={styles.drawerItem}
          activeBackgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          activeTintColor={isDark ? '#fff' : '#000'}
        />
        <DrawerItem
          label="Settings"
          onPress={() => {
            router.push('/(tabs)/SettingsScreen');
            toggleDrawer();
          }}
          icon={({ size }) => <Ionicons name="settings-outline" size={size} color={isDark ? '#fff' : '#000'} />}
          labelStyle={[styles.drawerItemLabel, isDark && styles.textDark]}
          style={styles.drawerItem}
          activeBackgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          activeTintColor={isDark ? '#fff' : '#000'}
        />
        <View style={styles.closeButtonContainer}>
          {/* <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
            <Text style={[styles.closeButtonText, isDark && styles.textDark]}>Close Menu</Text>
          </TouchableOpacity> */}
        </View>
      </DrawerContentScrollView>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textDark]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TapGestureHandler onHandlerStateChange={handleOverlayTap}>
          <View
            style={[
              styles.overlay,
              drawerOpen && { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)' },
            ]}
          >
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: isDark ? '#121212' : '#fff',
                  borderBottomColor: isDark ? '#272729' : '#e0e0e0',
                  borderBottomWidth: 1,
                },
                headerTintColor: isDark ? '#fff' : '#000',
                headerLeft: () => (
                  <TouchableOpacity onPress={toggleDrawer} style={styles.headerButton}>
                    <Ionicons name="menu-outline" size={28} color={isDark ? '#fff' : '#000'} />
                  </TouchableOpacity>
                ),
                headerTitle: () => (
                  <View style={styles.headerLogoContainer}>
                    <Ionicons name="shirt-outline" size={28} color={isDark ? '#fff' : '#000'} />
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>DressUp</Text>
                  </View>
                ),
                headerTitleAlign: 'center',
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Home' }} />
              <Stack.Screen name="StyleQuiz/index" options={{ title: 'Style Quiz' }} />
              <Stack.Screen name="SettingsScreen/index" options={{ title: 'Settings' }} />
            </Stack>
          </View>
        </TapGestureHandler>
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: drawerAnimation }], width: DRAWER_WIDTH },
            isDark ? styles.drawerDark : null,
          ]}
        >
          <CustomDrawerContent />
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  errorText: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E5566D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 12,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  textDark: {
    color: '#FFFFFF',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerDark: {
    backgroundColor: '#1C1C1E',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerContentDark: {
    backgroundColor: '#1C1C1E',
  },
  drawerContentContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20, // Added padding at bottom for consistency
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  drawerItem: {
    marginVertical: 8, // Increased from 8 to 15 for more pleasant spacing
    paddingVertical: 10, // Added padding to give items more breathing room
    paddingHorizontal: 5, // Added horizontal padding for elegance
    borderRadius: 10, // Slightly increased border radius for a softer look
  },
  drawerItemLabel: {
    fontSize: 17, // Increased from 16 for better readability
    fontWeight: '600', // Increased from 500 for a more elegant weight
    color: '#000000',
  },
  overlay: {
    flex: 1,
  },
  closeButtonContainer: {
    paddingVertical: 10, // Added vertical padding for consistency
    alignItems: 'flex-start',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Increased gap for better alignment
    padding: 12, // Increased padding for a larger touch area
    borderRadius: 10, // Increased border radius to match drawer items
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButtonText: {
    fontSize: 17, // Matched font size with drawer items
    fontWeight: '600',
    color: '#000000',
  },
});