// app.config.ts
export default {
  expo: {
    name: "Mithaq",
    slug: "mithaq",
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
        projectId: "765952ec-82b2-40a7-84fb-8a01b2388714"
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      EXPO_PUBLIC_REVENUECAT_APPLE_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
      EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
    }
  }
};