import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function index() {
  const [ isOnboarding, setIsOnboarding ] = useState(true);
  const [ loading,   setLoading ] = useState(true);
  
  useEffect(() => {
    const checkOnBoarding = async () => {
      const isOnboarding = await AsyncStorage.getItem('onboarding')
      if(isOnboarding) {
        setIsOnboarding(false);
      }
      setLoading(false);
    }

    checkOnBoarding();
  }, []);

  if(loading) return null; 

  return (
    <Redirect 
      href={isOnboarding ? "/(routes)/onboarding" : "/(routes)/home"} 
    />
  );
}