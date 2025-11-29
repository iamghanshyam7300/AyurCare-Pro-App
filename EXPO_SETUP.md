# Running the App with Expo Go

## Prerequisites
1. Install Expo Go app on your phone:
   - **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Make sure your phone and computer are on the same Wi-Fi network

## Steps to Run

1. **Install Dependencies**
   ```bash
   cd ayucareapp
   npm install
   ```

2. **Start Expo Development Server**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

3. **Scan QR Code**
   - A QR code will appear in your terminal
   - **Android**: Open Expo Go app and tap "Scan QR code"
   - **iOS**: Open Camera app and scan the QR code, then tap the notification

## Alternative Methods

### Using Tunnel (if same network doesn't work)
```bash
npx expo start --tunnel
```

### Using LAN (for local network)
```bash
npx expo start --lan
```

### Direct Connection
- Press `s` to switch to development build
- Press `a` for Android emulator
- Press `i` for iOS simulator

## Troubleshooting

### If QR code doesn't work:
1. Make sure both devices are on the same Wi-Fi
2. Try using `--tunnel` mode
3. Check firewall settings on your computer
4. Ensure port 19000 and 19001 are not blocked

### Server Connection Issues:
- Make sure your backend server at `http://192.168.29.72:5000` is running
- For Android emulator, use `10.0.2.2` instead of your local IP
- For iOS simulator, use `localhost` or your machine's IP
- For physical devices, ensure the IP is accessible from your phone's network

## Notes
- The app uses your configured server IP: `192.168.29.72:5000`
- All dependencies are Expo-compatible
- No custom native code is required

