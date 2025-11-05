// utils/tracking.js
import { posthog } from "@/lib/posthog";
import { analytics, db, logEvent } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { getSessionId, getUserId } from "@/lib/session";

// export const trackEvent = (name, params = {}) => {
//   if (!analytics) return;
//   try {
//     logEvent(analytics, name, params);
//   } catch (err) {
//     console.warn("Analytics event failed:", err);
//   }
// };
export const trackEvent = (name, params = {}) => {
const userId = getUserId();
  const sessionId = getSessionId();

  const enriched = { ...params, userId, sessionId };

  if (analytics) logEvent(analytics, name, enriched);
  if (posthog?.capture) posthog.capture(name, enriched  );
};

// // Firestore error logger
// export const logError = async (error, context = {}) => {
//   try {
//     await addDoc(collection(db, "errors"), {
//       message: error.message || String(error),
//       stack: error.stack || null,
//       context,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (e) {
//     console.error("Failed to log error:", e);
//   }
// };

export const logError = async (error, context = {}) => {
 const userId = getUserId();
  const sessionId = getSessionId();

  const posthogSessionId = posthog?.get_session_id?.() || null;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_URL || "https://app.posthog.com";
  const sessionReplayUrl = posthogSessionId
    // ? `${posthogHost}/project/${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || "default"}/session/${posthogSessionId}`
    ? `${posthogHost}/project/${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || "default"}/replay/${posthogSessionId}`
    : null;
  try {
    await addDoc(collection(db, "errors"), {
      message: error.message || String(error),
      stack: error.stack || null,
      context,
      userId,
      sessionId,
      posthogSessionId,
      sessionReplayUrl,
      timestamp: new Date().toISOString(),
    });

    // Also capture the error in PostHog for linking
    if (posthog?.capture) {
      posthog.capture("frontend_error", {
        message: error.message,
        stack: error.stack,
        userId,
      sessionId,
        session_id: posthogSessionId,
      });
    }
  } catch (e) {
    console.error("Failed to log error:", e);
  }
};
