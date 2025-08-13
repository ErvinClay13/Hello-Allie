import 'dotenv/config';

export default {
  expo: {
    name: "Hello-Allie",
    slug: "Hello-Allie",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/AllieImg3.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/947fbab6-e057-4e63-a692-bc8ec0c92fe9",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.ervinclay13.HelloAllie",
      kotlinVersion: "1.9.25", // Keep this for clarity
      adaptiveIcon: {
        foregroundImage: "./assets/images/AllieImg3.png",
        backgroundColor: "#4c6",
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-av",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.9.25",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "947fbab6-e057-4e63-a692-bc8ec0c92fe9",
      },
    },
  },
};
