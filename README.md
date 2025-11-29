<<<<<<< HEAD
# AyurDiet Pro - React Native Mobile App

Mobile-friendly React Native application for the AyurDiet Pro healthcare management system.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Server IP**
   - Open `config/server.js`
   - Add your server IPv4 address:
     ```javascript
     export const SERVER_IP = '192.168.1.100'; // Replace with your server IP
     ```

3. **Start the App**
   ```bash
   npm start
   ```

   Then press:
   - `a` for Android
   - `i` for iOS
   - `w` for web

## Features

- **Authentication**: Login and Registration for Doctors and Patients
- **Doctor Features**:
  - Patient Management
  - Food Database
  - Diet Plans
  - Recipes
  - Diet Chart
  - Auto Generate Diet
  - Collections
  - Reports

- **Patient Features**:
  - Dashboard
  - Diet History
  - Chat with Doctor
  - Reminders
  - Reports
  - Patient Settings

## Color Scheme

The app uses the same color scheme as the web UI:
- Primary: #4CAF50 (Green)
- Background: #FAF3E0 (Beige)
- Accent: #FF9800 (Orange)
- Card: #FFFFFF (White)

## Project Structure

```
ayucareapp/
├── screens/          # All screen components
├── contexts/         # React contexts (AuthContext)
├── services/         # API services
├── config/           # Configuration files
├── colors.js         # Color scheme
├── App.js            # Main app component with navigation
└── package.json      # Dependencies
```

## Notes

- Make sure your backend server is running and accessible from your device/emulator
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For iOS simulator, use `localhost` or your machine's IP
- For physical devices, use your computer's local network IP address

