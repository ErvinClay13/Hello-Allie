// Import the View component and its props type from React Native
import { View, type ViewProps } from 'react-native';

// Import custom hook for accessing light/dark theme colors
import { useThemeColor } from '@/hooks/useThemeColor';

// Define props for the ThemedView component, extending standard ViewProps
// and adding optional custom light and dark theme colors
export type ThemedViewProps = ViewProps & {
  lightColor?: string; // Optional override color for light mode
  darkColor?: string;  // Optional override color for dark mode
};

// Functional component that renders a View with dynamic background color
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Determine the background color based on theme using the custom hook
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Render the View with the computed backgroundColor and any additional styles/props
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
