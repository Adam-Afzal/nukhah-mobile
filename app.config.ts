// app.config.ts
export default {
  expo: {
    name: "Nukhbah",
    slug: "nukhbah",
    version: "1.0.0", // Add version
    icon: "./assets/icon.png", // Add icon
    ios: {
      bundleIdentifier: "com.app.nukhbah",
      supportsTablet: true, // Optional
    },
    android: {
      package: "com.app.nukhbah", // Add for Android
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#070A12" // Your brand dark color
      }
    },
    extra: {
      eas: {
        projectId:"765952ec-82b2-40a7-84fb-8a01b2388714"
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY
    },

    
  plugins: [
    "expo-router",
    "expo-web-browser"
  ]


    
    
  }
};
