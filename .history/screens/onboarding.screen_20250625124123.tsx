// Import core React Native components and hooks
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient"; // For background gradient
import { onBoardingData } from "@/configs/constans"; // Onboarding content
import { scale, verticalScale } from "react-native-size-matters"; // Responsive sizing
import { useFonts } from "expo-font"; // Custom font loading
import AntDesign from "@expo/vector-icons/AntDesign"; // Icon pack
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage
import { router } from "expo-router"; // Navigation

export default function OnBoardingScreen() {
  // Load custom fonts
  let [fontsLoaded, fontError] = useFonts({
    SegoeUI: require("../assets/fonts/Segoe-UI.ttf"),
  });

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  const [activeIndex, setActiveIndex] = useState(0); // Track which slide is active
  const scrollViewRef = useRef<ScrollView>(null); // Reference to ScrollView

  // Detect scroll position and update the active index accordingly
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(
      contentOffsetX / event.nativeEvent.layoutMeasurement.width
    );
    setActiveIndex(currentIndex);
  };

  // Handle skip button: move to next slide or complete onboarding
  const handleSkip = async () => {
    const nextIndex = activeIndex + 1;

    // If not last slide, scroll to next
    if(nextIndex < onBoardingData.length){
      scrollViewRef.current?.scrollTo({
        x: Dimensions.get("window").width * nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    } else {
      // If last slide, store flag and navigate to Home
      await AsyncStorage.setItem('onboarding', 'true');
      router.push("/(routes)/home");
    }
  };

  return (
    // Full screen linear gradient background
    <LinearGradient
      colors={["#250152", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Skip button at top right */}
      <Pressable style={styles.skipContainer} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
        <AntDesign name="arrowright" size={scale(18)} color="white" />
      </Pressable>

      {/* Scrollable onboarding slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={scrollViewRef}
      >
        {onBoardingData.map((item: onBoardingDataType, index: number) => (
          <View key={index} style={styles.slide}>
            {item.image}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {onBoardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                opacity: activeIndex === index ? 1 : 0.3, // Highlight active dot
              },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

// Component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: scale(23),
    fontFamily: "SegoeUI",
    textAlign: "center",
    fontWeight: "500",
  },
  subtitle: {
    width: scale(290),
    marginHorizontal: "auto",
    color: "#9A9999",
    fontSize: scale(14),
    fontFamily: "SegoeUI",
    textAlign: "center",
    fontWeight: "400",
    paddingTop: verticalScale(10),
  },
  paginationContainer: {
    position: "absolute",
    bottom: verticalScale(70),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: 100,
    backgroundColor: "#fff",
    marginHorizontal: scale(2),
  },
  skipContainer: {
    position: "absolute",
    top: verticalScale(45),
    right: scale(30),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    zIndex: 100,
  },
  skipText: {
    color: "#fff",
    fontSize: scale(16),
    fontFamily: "SegoeUI",
    fontWeight: "400",
  },
});
