import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    name: "Hello Allie",
    slug: "hello-allie",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      url: "https://u.expo.dev/947fbab6-e057-4e63-a692-bc8ec0c92fe9", // keep this from EAS Update
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ervinclay13.HelloAllie"
    },
    android: {
      package: "com.ervinclay13.HelloAllie",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    extra: {
      eas: {
        projectId: "947fbab6-e057-4e63-a692-bc8ec0c92fe9"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  };
};

  