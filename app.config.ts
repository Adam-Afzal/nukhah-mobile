// app.config.ts
export default {
  expo: {
    name: "Mithaq",
    slug: "mithaq",
    owner: "adam-afzal",
    scheme: "mithaq",
    version: "1.0.0",
    icon: "./assets/icon.png",
    ios: {
      bundleIdentifier: "com.app.mithaq",
      supportsTablet: true,
    },
    android: {
      package: "com.app.mithaq",
    },
    plugins: [
      "expo-router",
      "expo-web-browser"
    ],
    extra: {
      eas: {
        projectId: "12cd5d60-25de-41a7-a14d-2f15e1243c86"
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      EXPO_PUBLIC_REVENUECAT_APPLE_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
      EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
    }
  }
};