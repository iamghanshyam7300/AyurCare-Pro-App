<div align="center">
  <h1>AyurCare App</h1>

  <p>
    <b>A modern, cross-platform mobile application connecting users with Ayurvedic healthcare.</b>
  </p>

  <p>
    <a href="https://expo.dev" target="_blank">
      <img src="https://img.shields.io/badge/Built%20with-Expo-000020.svg?style=flat-square&logo=expo&logoColor=white" alt="Built with Expo" />
    </a>
    <a href="https://reactnative.dev" target="_blank">
      <img src="https://img.shields.io/badge/Framework-React%20Native-61DAFB.svg?style=flat-square&logo=react&logoColor=black" alt="Framework - React Native" />
    </a>
    <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-9cf.svg?style=flat-square" alt="Platforms" />
  </p>

  <br />

  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</div>

<hr />

<h2 id="about">📖 About The Project</h2>

<p>
  <b>AyurCare</b> is designed to streamline the process of finding and consulting with Ayurvedic practitioners. Built with the robust <b>React Native</b> framework and powered by <b>Expo</b>, it serves as the mobile interface for the AyurCare platform.
</p>

<p>
  <blockquote>
    <b>Important Note:</b> This mobile application acts as a client frontend. It relies on connecting to an <b>external website backend API</b> to manage user data, doctor profiles, appointments, and secure communications. It will not function correctly without a live backend connection.
  </blockquote>
</p>

<h2 id="features">✨ Key Features</h2>

<ul>
  <li>🔐 <b>Secure Authentication:</b> Login and Signup flows that integrate with the external backend auth system.</li>
  <li>🏠 <b>Home Dashboard:</b> A central hub for navigation and quick access to services.</li>
  <li>🔍 <b>Doctor Discovery:</b> Browse and search for practitioner profiles fetched dynamically from the server.</li>
  <li>📅 <b>Appointment Hub:</b> Schedule, view, and manage upcoming consultations.</li>
  <li>💬 <b>Integrated Chat:</b> Connect directly with practitioners for inquiries.</li>
  <li>👤 <b>User Profile:</b> Manage personal information synced with the backend database.</li>
  <li>🗺️ <b>Smooth Navigation:</b> Intuitive transitions using industry-standard Tab and Stack navigators.</li>
</ul>

<h2 id="tech-stack">🛠️ Tech Stack</h2>

<ul>
  <li><a href="https://reactnative.dev/">React Native</a> - Core framework for native mobile components.</li>
  <li><a href="https://expo.dev/">Expo SDK</a> - Platform for rapid development and build tooling.</li>
  <li><a href="https://reactnavigation.org/">React Navigation v6</a> - Routing and navigation standard.</li>
  <li><b>API Integration (REST)</b> - Connection to external backend for data persistence.</li>
</ul>

<hr />

<h2 id="getting-started">🚀 Getting Started</h2>

<p>Follow these steps to set up your local development environment and connect it to the required backend service.</p>

<h3>Prerequisites</h3>

<ul>
  <li><a href="https://nodejs.org/en/">Node.js</a> (LTS Version recommended)</li>
  <li><code>npm</code> or <code>yarn</code> package manager.</li>
  <li>📱 <b>Expo Go App:</b> Installed on your physical iOS or Android device.</li>
</ul>

<h3>Installation & Configuration</h3>

<ol>
  <li>
    <b>Clone the repository</b>
    <pre><code>git clone https://github.com/YOUR-ORG/ayurcare-pro-app.git
cd ayurcare-pro-app</code></pre>
  </li>

  <li>
    <b>Install dependencies</b>
    <pre><code>npm install</code></pre>
  </li>

  <li>
    <b>⚙️ Backend Configuration (Crucial Step)</b>
    <p>Since this app connects to an external backend, you must configure the API endpoint.</p>
    <ul>
        <li>Create a file named <code>.env</code> in the root directory of the project.</li>
        <li>Add the backend base URL provided by the backend team to this file.</li>
    </ul>
    <p><i>Example `.env` content:</i></p>
    <pre><code>EXPO_PUBLIC_API_URL=https://development-api.ayurcarewebsite.com</code></pre>
  </li>

  <li>
    <b>Start the development server</b>
    <pre><code>npx expo start</code></pre>
    <p><i>(Note: If you just added the .env file, you might need to run `npx expo start -c` to clear the cache).</i></p>
  </li>

  <li>
    <b>Run on Device</b>
    <ul>
      <li>Scan the QR code displayed in the terminal using the <b>Expo Go</b> app on your phone.</li>
      <li>Or, press <code>i</code> for iOS Simulator / <code>a</code> for Android Emulator.</li>
    </ul>
  </li>
</ol>

<hr />

<h2 id="project-structure">📂 Project Structure</h2>

<pre><code>ayurcare-pro-app/
├── 📁 assets/        # Images, fonts, and splash screens
├── 📁 components/    # Reusable UI elements (Buttons, Cards, etc.)
├── 📁 navigation/    # Routing configuration (Tabs, Stacks, AuthFlow)
├── 📁 screens/       # Main application view components
├── 📁 services/      # API service calls and backend integration logic
├── 📄 .env           # Environment config (API URLs) - DO NOT COMMIT
├── 📄 App.js         # Application entry point
├── 📄 app.json       # Expo configuration details
└── 📄 package.json   # Dependencies and scripts</code></pre>
