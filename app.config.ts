// app.config.ts
export default {
  expo: {
    name: "Nukhbah",
    slug: "nukhbah",
    scheme: "nukhbah", // needed for magic-link deep links on iOS,
     ios: {
    bundleIdentifier: "com.app.nukhbah", // <-- add this
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
