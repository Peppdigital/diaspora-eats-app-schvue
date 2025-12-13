
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { US_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/LocationData';

export default function LocationSetupScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedState) {
      Alert.alert('Error', 'Please select a state');
      return;
    }
    if (!selectedCity) {
      Alert.alert('Error', 'Please select a city');
      return;
    }

    setLoading(true);
    try {
      await updateUser({
        default_location_state: selectedState,
        default_location_city: selectedCity,
      });
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('Location setup error:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/(home)/');
  };

  const cities = selectedState ? MAJOR_CITIES_BY_STATE[selectedState] || [] : [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="location.fill"
            android_material_icon_name="location_on"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Set Your Location</Text>
          <Text style={styles.subtitle}>
            Help us show you the best restaurants and groceries near you
          </Text>
        </View>

        {/* State Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your State</Text>
          <View style={styles.optionsGrid}>
            {US_STATES.map((state, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedState === state.code && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedState(state.code);
                    setSelectedCity('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedState === state.code && styles.optionTextSelected,
                    ]}
                  >
                    {state.name}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* City Selection */}
        {selectedState && cities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Your City</Text>
            <View style={styles.optionsGrid}>
              {cities.map((city, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      selectedCity === city && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSelectedCity(city)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedCity === city && styles.optionTextSelected,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedState || !selectedCity || loading) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedState || !selectedCity || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(212, 163, 115, 0.3)',
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    padding: 18,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
