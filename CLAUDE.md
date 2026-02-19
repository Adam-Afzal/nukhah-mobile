# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nukhah is a Muslim matchmaking mobile app built with Expo/React Native. Features include brother/sister profiles, AI-powered matching via OpenAI embeddings, interest expressions with compatibility questions, imam verification, and a notification system.

## Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run web version

# Code Quality
npm run lint           # Run ESLint

# Test Data
npm run seed-test      # Seed test brother account
npm run seed-sister    # Seed test sister account
npm run create-imam    # Create imam account
npm run list-masjid    # List masjid entries
```

## Architecture

**Stack:** Expo (v54) + React Native, Expo Router (file-based routing), Supabase (auth + PostgreSQL), TanStack React Query (server state), OpenAI API (embeddings)

**Path Alias:** `@/*` maps to project root

### Route Groups

- `(auth)/` - Protected routes for authenticated users (main app experience)
- `(application)/` - User onboarding flows (brother.tsx, sister.tsx)
- `(imam)/` - Imam dashboard and verification system

### Key Files

- `app/_layout.tsx` - Root layout with auth state and role-based routing logic
- `hooks/useUserStatus.ts` - Main hook that determines app routing based on user status
- `lib/supabase.ts` - Supabase client initialization
- `lib/queryClient.ts` - React Query config (staleTime: 5min, gcTime: 10min)
- `lib/embeddingService.ts` - OpenAI embeddings for profile matching
- `lib/interestService.ts` - Interest expression/acceptance/rejection logic
- `constants/theme.ts` - Dark theme colors (#070A12 background, #F2CC66 accent gold)

### Patterns

**Components:** Use `ThemedText` and `ThemedView` for theme-aware UI

**Data Flow:** Supabase auth session → useUserStatus hook → layout redirects → services fetch/mutate data → React Query caches

**State:** Server state via React Query hooks, local UI state via useState

**Errors:** Alert.alert() for user-facing, console.error for debugging, try/catch in async functions

## Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase endpoint
- `EXPO_PUBLIC_SUPABASE_KEY` - Supabase anon key
- `SUPABASE_SECRET_KEY` - Service role key
- `EXPO_PUBLIC_OPENAI_API_KEY` - For embeddings
- `RESEND_API_KEY` - Email service
