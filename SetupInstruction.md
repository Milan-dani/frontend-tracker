# 🧠 Full Frontend Analytics & Error Tracking (Next.js + Firebase + PostHog)

This guide shows how to build a **free, privacy-friendly frontend tracking system** using:

- ⚙️ **Next.js + React** — your frontend  
- 🔥 **Firebase Firestore** — store error logs  
- 🧩 **PostHog** — analytics & session replay  
- 💡 **Custom hook (`useErrorTracker`)** — tracks user behaviour, breadcrumbs, and errors  

---

## 🚀 What You’ll Get

✅ Capture JS errors, console logs, and promise rejections  
✅ Track page views and user clicks  
✅ Record “breadcrumbs” (recent user actions before an error)  
✅ Link every error to a PostHog session replay  
✅ Store logs in Firestore — free & serverless  
✅ Fully respects user consent (GDPR friendly)  

---

## ⚙️ Quick Start

### 1️⃣ Create a New Project

```bash
npx create-next-app@latest frontend-tracker
cd frontend-tracker
```

---

### 2️⃣ Install Dependencies

```bash
npm install firebase posthog-js
```

*(Optional but recommended for TypeScript users)*

```bash
npm install --save-dev typescript @types/react @types/node
```

---

### 3️⃣ Folder Structure

```
frontend-tracker/
│
├── lib/
│   ├── firebase.js
│   └── posthog.js
│
├── utils/
│   └── tracking.js
│
├── hooks/
│   └── useErrorTracker.js
│
├── components/
│   └── ConsentBanner.js
│
├── pages/
│   ├── _app.js
│   └── index.js
│
└── package.json
```

---

## 🔥 4️⃣ Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project → Enable **Firestore Database**
3. Add a Web App → Copy your config
4. Paste it into `/lib/firebase.js`:

```js
// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  projectId: "YOUR_APP",
  storageBucket: "YOUR_APP.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

## 📊 5️⃣ PostHog Setup (Session Replay)

1. Create an account at [https://posthog.com](https://posthog.com)
2. Create a project → Copy your **API key** & **host URL**
3. Add it to `/lib/posthog.js`:

```js
// lib/posthog.js
import posthog from "posthog-js";

export function initPosthog() {
  if (typeof window === "undefined") return;
  if (posthog.__initialized) return;

  posthog.init("YOUR_POSTHOG_API_KEY", {
    api_host: "https://app.posthog.com",
    person_profiles: "identified_only",
    persistence: "localStorage",
    capture_pageview: true,
    capture_pageleave: true,
  });

  posthog.__initialized = true;
}
```

---

## 📁 6️⃣ Logging Helpers

```js
// utils/tracking.js
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import posthog from "posthog-js";

export async function logError(error, context = {}) {
  const data = {
    message: error.message,
    stack: error.stack,
    context,
    userId: posthog.get_distinct_id?.(),
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "errors"), data);
  } catch (err) {
    console.error("Error logging to Firestore:", err);
  }

  posthog.capture("frontend_error", data);
}

export function trackEvent(name, props = {}) {
  posthog.capture(name, props);
}
```

---

## 🪝 7️⃣ Main Hook: `useErrorTracker()`

Tracks navigation, clicks, JS errors, console logs, and stores breadcrumbs.

```js
// hooks/useErrorTracker.js
import { useEffect, useRef } from "react";
import { trackEvent, logError } from "../utils/tracking";

export function useErrorTracker(enabled = true) {
  const breadcrumbs = useRef([]);

  const addBreadcrumb = (type, detail) => {
    breadcrumbs.current.push({ type, detail, ts: new Date().toISOString() });
    if (breadcrumbs.current.length > 50) breadcrumbs.current.shift();
  };

  useEffect(() => {
    if (!enabled) return;

    const handleNavigation = () => {
      addBreadcrumb("navigation", { url: window.location.pathname });
      trackEvent("page_view", { page_path: window.location.pathname });
    };
    handleNavigation();
    window.addEventListener("popstate", handleNavigation);

    const handleClick = (e) => {
      const el = e.target.closest("[data-analytics]");
      if (!el) return;
      const name = el.getAttribute("data-analytics");
      const label = el.getAttribute("data-analytics-label");
      addBreadcrumb("click", { name, label });
      trackEvent("ui_click", { name, label });
    };

    const handleError = (e) =>
      logError(e.error || new Error(e.message), {
        source: "window.onerror",
        breadcrumbs: breadcrumbs.current,
      });

    const handleRejection = (e) =>
      logError(e.reason || new Error("Unhandled Promise rejection"), {
        source: "window.onunhandledrejection",
        breadcrumbs: breadcrumbs.current,
      });

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
      addBreadcrumb("console.error", { message });
      logError(new Error(message), { source: "console.error", args, breadcrumbs: breadcrumbs.current });
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
      addBreadcrumb("console.warn", { message });
      logError(new Error(message), { source: "console.warn", args, breadcrumbs: breadcrumbs.current });
      originalConsoleWarn.apply(console, args);
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("popstate", handleNavigation);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [enabled]);

  return {
    addBreadcrumb,
    trackEvent: (name, params) => {
      addBreadcrumb("custom", { name, params });
      trackEvent(name, params);
    },
    logError: (err, context = {}) =>
      logError(err, { ...context, breadcrumbs: breadcrumbs.current }),
  };
}
```

---

## 🍪 8️⃣ Consent Banner

```jsx
// components/ConsentBanner.js
export default function ConsentBanner({ onConsent }) {
  const accept = () => {
    localStorage.setItem("analytics_consent", "granted");
    onConsent();
  };

  if (localStorage.getItem("analytics_consent") === "granted") return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#222", color: "#fff", padding: "12px", textAlign: "center" }}>
      <span>We use cookies for analytics and error tracking. </span>
      <button onClick={accept} style={{ marginLeft: "10px" }}>Accept</button>
    </div>
  );
}
```

---

## 🧩 9️⃣ Hook It Into `_app.js`

```jsx
// pages/_app.js
import { useState, useEffect } from "react";
import ConsentBanner from "../components/ConsentBanner";
import { initPosthog } from "../lib/posthog";
import { useErrorTracker } from "../hooks/useErrorTracker";

export default function App({ Component, pageProps }) {
  const [consentGiven, setConsentGiven] = useState(false);
  useErrorTracker(consentGiven); // ✅ safe hook usage

  const handleConsent = () => {
    initPosthog();
    setConsentGiven(true);
  };

  useEffect(() => {
    const consent = localStorage.getItem("analytics_consent");
    if (consent === "granted") handleConsent();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <ConsentBanner onConsent={handleConsent} />
    </>
  );
}
```

---

## 🧪 🔍 10️⃣ Test Everything

In your browser console, run:

```js
console.error("API failed", { status: 500 });
console.warn("Deprecated function used");
throw new Error("Manual test error");
Promise.reject(new Error("Unhandled rejection test"));
```

Check:

* **Firestore → `errors` collection** for stored logs
* **PostHog dashboard** for replay and analytics

---

## 📊 Example Firestore Log

```json
{
  "message": "TypeError: Cannot read properties of undefined",
  "context": {
    "source": "window.onerror",
    "breadcrumbs": [
      { "type": "navigation", "detail": { "url": "/" }, "ts": "2025-11-05T18:00:00Z" },
      { "type": "click", "detail": { "name": "submit_button" }, "ts": "2025-11-05T18:00:10Z" }
    ]
  },
  "userId": "posthog-distinct-id",
  "timestamp": "2025-11-05T18:00:12Z"
}
```

---

## 💡 Notes

* 💰 **Free**: Firebase + PostHog both have generous free tiers.
* 🔒 **Private**: User consent required before tracking.
* 🧭 **Breadcrumbs**: Shows steps leading to the error.
* 🎥 **Replay Integration**: PostHog replays show the exact session.

