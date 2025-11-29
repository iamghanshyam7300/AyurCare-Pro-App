# Expo SDK 54 Upgrade Notes

## What Changed

### Core Dependencies
- **Expo**: Upgraded from SDK 49 to SDK 54
- **React**: Upgraded from 18.2.0 to 19.1.0
- **React Native**: Upgraded from 0.72.0 to 0.81.0

### Updated Packages
- `@react-native-async-storage/async-storage`: ^1.19.0 → ^2.1.0
- `@react-navigation/bottom-tabs`: ^6.5.0 → ^6.6.1
- `@react-navigation/native`: ^6.1.0 → ^6.1.18
- `@react-navigation/stack`: ^6.3.0 → ^6.4.1
- `react-native-gesture-handler`: ~2.12.0 → ~2.20.2
- `react-native-safe-area-context`: 4.6.3 → 4.14.0
- `react-native-screens`: ~3.22.0 → ~4.4.0
- `graphql`: ^15.8.0 → ^16.9.0
- `axios`: ^1.5.0 → ^1.7.9

### Removed Dependencies
- `metro` and `metro-react-native-babel-preset` - Now managed by Expo automatically

## New Features in SDK 54

1. **Precompiled React Native for iOS** - Significantly faster build times
2. **React 19.1.0** - Latest React features and improvements
3. **React Native 0.81** - Latest React Native with performance improvements
4. **Android Edge-to-Edge Layouts** - Better support for Android 16

## Breaking Changes to Watch For

1. **React 19 Changes**: Some deprecated APIs may have been removed
2. **React Native 0.81**: Check for any deprecated components or APIs
3. **Navigation Libraries**: Updated to latest versions - test navigation flows

## Testing Checklist

- [ ] Login/Registration flow
- [ ] Navigation between screens
- [ ] API calls and data fetching
- [ ] Forms and input handling
- [ ] Bottom tab navigation
- [ ] Stack navigation
- [ ] AsyncStorage operations

## Installation

If you need to reinstall dependencies:
```bash
npm install --legacy-peer-deps
```

## Running the App

```bash
npx expo start --clear
```

The `--clear` flag clears the Metro bundler cache, which is recommended after major upgrades.

