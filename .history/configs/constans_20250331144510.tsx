// Import SVG components for onboarding illustrations
import OnBoarding1 from "@/assets/svgs/onboarding1";
import OnBoarding2 from "@/assets/svgs/onboarding2";
import OnBoarding3 from "@/assets/svgs/onboarding3";

// Define and export the onboarding data array with type annotation
// Each object represents one screen in the onboarding flow
export const onBoardingData: onBoardingDataType[] = [
  {
    id: 1, // Unique identifier for the screen
    title: "Meet Your AI Companion", // Main title text
    subtitle: "Discover the future of communication and knowledge through interactive AI conversations.", // Descriptive subtitle
    image: <OnBoarding1 /> // JSX for the first SVG image
  },
  {
    id: 2,
    title: "Ask, Learn, Evolve",
    subtitle: "Engage with AI, ask questions, and unlock insights to help you grow in real-time.",
    image: <OnBoarding2 /> // JSX for the second SVG image
  },
  {
    id: 3,
    title: "Explore your life",
    subtitle: "Tailor the AI experience to fit your unique needs and get personalized responses anytime.",
    image: <OnBoarding3 /> // JSX for the third SVG image
  }
];
