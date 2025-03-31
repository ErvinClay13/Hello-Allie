// Importing necessary components from React Native
import { View, Text } from 'react-native';

// Importing React and hooks
import React, { useEffect, useState } from 'react';

// Importing Redirect from Expo Router to navigate programmatically
import { Redirect } from 'expo-router';

// Importing AsyncStorage to retrieve onboarding state from local storage
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function index() {
  // State to determine if user needs onboarding
  const [isOnboarding, setIsOnboarding] = useState(true);

  // State to handle loading state while checking storage
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Async function to check if onboarding has been completed
    const checkOnBoarding = async () => {
      const isOnboarding = await AsyncStorage.getItem('onboarding');

      // If 'onboarding' is found in storage, skip onboarding screen
      if (isOnboarding) {
        setIsOnboarding(false);
      }

      // Once the check is complete, stop loading
      setLoading(false);
    };

    // Call the function when component mounts
    checkOnBoarding();
  }, []);

  // While loading, return nothing to avoid flickering
  if (loading) return null;

  // Redirect user to onboarding or home screen based on state
  return (
    <Redirect 
      href={isOnboarding ? "/(routes)/onboarding" : "/(routes)/home"} 
    />
  );
}
