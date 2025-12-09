// screens/BotpressChatScreen.js
import React, { useMemo } from "react";
import { Image } from "react-native";
import { WebView } from "react-native-webview";

export default function BotpressChatScreen() {
  // Resolve LOCAL LOGO
  const logoSource = useMemo(() => {
    const resolved = Image.resolveAssetSource(
      require("../assets/ayurcare_logo.jpg")   // <<< YOUR JPEG
    );
    return resolved.uri;
  }, []);

  const botpressConfig =
    "https://files.bpcontent.cloud/2025/09/20/16/20250920164615-AV6TM9YQ.js";

  const html = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body {
        margin:0;
        padding:0;
        height:100vh;
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        background:white;
        font-family:sans-serif;
      }
      #wrapper {
        text-align:center;
      }
      #logo {
        width:140px;
        height:140px;
        border-radius:70px;
        object-fit:cover;
        margin-bottom:20px;
      }
      #start-btn {
        background:#2e7d32;
        padding:14px 24px;
        border-radius:12px;
        border:none;
        color:white;
        font-size:16px;
        font-weight:bold;
        opacity:0.4;           /* dim state initially */
        pointer-events:none;   /* disable clicks */
        transition:opacity 0.4s ease;
      }
      #start-btn.active {
        opacity:1;             /* bright when ready */
        pointer-events:auto;   /* clickable */
      }
      #loading-text {
        margin-top:10px;
        font-size:14px;
        color:#777;
      }
      #bp-toggle-chat { display:none; }
    </style>
  </head>

  <body>
    <div id="wrapper">
      <img id="logo" src="${logoSource}" />
      <button id="start-btn">Start AyurBot Chat 🌿</button>
      <div id="loading-text">Loading AyurBot… Please wait</div>
    </div>

    <button id="bp-toggle-chat"></button>

    <script src="https://cdn.botpress.cloud/webchat/v3.5/inject.js"></script>

    <script>
      /* Load bot config */
      const script = document.createElement("script");
      script.src = "${botpressConfig}";
      script.defer = true;
      document.body.appendChild(script);

      /* ⭐ TIMER TO ENABLE BUTTON AFTER 3 SECONDS ⭐ */
      setTimeout(() => {
        const btn = document.getElementById("start-btn");
        const msg = document.getElementById("loading-text");

        btn.classList.add("active");    // brighten + enable
        msg.textContent = "AyurBot is ready ✔";
      }, 3000); // 3 seconds delay

      /* Start Chat click */
      document.getElementById("start-btn").addEventListener("click", () => {
        document.getElementById("wrapper").style.display = "none";

        // If Botpress is ready, open immediately
        if (window.botpressWebChat?.open) {
          window.botpressWebChat.open();
          window.botpressWebChat.sendEvent({ type: "show" });
        } else {
          // fallback
          document.getElementById("bp-toggle-chat").click();
        }
      });
    </script>
  </body>
</html>
`;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      style={{ flex: 1 }}
    />
  );
}
