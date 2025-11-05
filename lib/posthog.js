// lib/posthog.js
import posthog from "posthog-js";
import { getUserId } from "./session";

export const initPosthog = () => {
  if (typeof window === "undefined") return; // only run client-side
  if (posthog.__initialized) return; // prevent double init

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    autocapture: true, // automatically capture clicks, forms, etc.
    capture_pageview: true,
    disable_session_recording: false, // we want session replay
    session_recording: {
      maskAllInputs: true, // privacy-safe: mask typed text
      maskTextSelector: '.private', // mask elements with class "private"
    },
  });
//   posthog.identify(getUserId());
  posthog.__initialized = true;
  console.log("✅ PostHog initialized");
};

export { posthog };