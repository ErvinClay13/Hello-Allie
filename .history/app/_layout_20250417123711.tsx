// Import navigation themes from React Navigation
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before fonts or other assets are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Get the user's system color scheme (light or dark mode)
  const colorScheme = useColorScheme();

  // Load custom fonts and return a 'loaded' boolean when finished
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    SegoeUI: require("../assets/fonts/Segoe-UI.ttf"),
  });

  // Once fonts are loaded, hide the splash screen
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Prevent app UI from rendering until fonts are fully loaded
  if (!loaded) {
    return null;
  }

  return (
    // Apply either the dark or default (light) theme to the app based on user preference
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* Define navigation stack and disable default headers */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Route definitions */}
        <Stack.Screen name="index" />                        {/* Splash logic or landing screen */}
        <Stack.Screen name="(routes)/onboarding/index" />    {/* Onboarding flow */}
        <Stack.Screen name="(routes)/home/index" />          {/* Main/home screen */}
      </Stack>
    </ThemeProvider>
  );
}
