// // hooks/useErrorTracker.js
// import { useEffect, useRef } from "react";
// import { trackEvent, logError } from "../utils/tracking";

// /**
//  * A React hook that tracks user actions, navigation, and errors.
//  * 
//  * It captures breadcrumbs (recent actions) and automatically logs
//  * unhandled JS errors and rejected promises to Firestore.
//  */
// export function useErrorTracker(enabled = true) {
//   const breadcrumbs = useRef([]);

//   const addBreadcrumb = (type, detail) => {
//     breadcrumbs.current.push({
//       type,
//       detail,
//       ts: new Date().toISOString(),
//     });
//     if (breadcrumbs.current.length > 50) breadcrumbs.current.shift();
//   };

//   useEffect(() => {

//     if (!enabled) return; // 👈 skip if tracking not enabled

//     // 🧭 Track navigation changes
//     const handleNavigation = () => {
//       addBreadcrumb("navigation", { url: window.location.pathname });
//       trackEvent("page_view", { page_path: window.location.pathname });
//     };
//     handleNavigation(); // log initial load
//     window.addEventListener("popstate", handleNavigation);

//     // 🖱️ Track clicks via data attributes
//     const handleClick = (e) => {
//       const el = e.target.closest("[data-analytics]");
//       if (!el) return;
//       const name = el.getAttribute("data-analytics");
//       const label = el.getAttribute("data-analytics-label");
//       addBreadcrumb("click", { name, label });
//       trackEvent("ui_click", { name, label });
//     };

//     // ❗ Capture global JS errors
//     const handleError = (e) => {
//       logError(e.error || new Error(e.message), { breadcrumbs: breadcrumbs.current });
//     };

//     // ❗ Capture unhandled promise rejections
//     const handleRejection = (e) => {
//       logError(e.reason || new Error("Unhandled promise rejection"), {
//         breadcrumbs: breadcrumbs.current,
//       });
//     };

//     document.addEventListener("click", handleClick);
//     window.addEventListener("error", handleError);
//     window.addEventListener("unhandledrejection", handleRejection);

//     return () => {
//       document.removeEventListener("click", handleClick);
//       window.removeEventListener("error", handleError);
//       window.removeEventListener("unhandledrejection", handleRejection);
//       window.removeEventListener("popstate", handleNavigation);
//     };
// //   }, []);
//   }, [enabled]);

//   // Allow manual logging if you want to log inside a component
//   return {
//     addBreadcrumb,
//     trackEvent: (name, params) => {
//       addBreadcrumb("custom", { name, params });
//       trackEvent(name, params);
//     },
//     logError: (err, context = {}) => logError(err, { ...context, breadcrumbs: breadcrumbs.current }),
//   };
// }



// hooks/useErrorTracker.js
import { useEffect, useRef } from "react";
import { trackEvent, logError } from "../utils/tracking";

/**
 * Tracks user actions, navigation, and all error types (including console).
 * Includes breadcrumbs for context before each error.
 */
export function useErrorTracker(enabled = true) {
  const breadcrumbs = useRef([]);

  const addBreadcrumb = (type, detail) => {
    breadcrumbs.current.push({
      type,
      detail,
      ts: new Date().toISOString(),
    });
    if (breadcrumbs.current.length > 50) breadcrumbs.current.shift();
  };

  useEffect(() => {
    if (!enabled) return; // 👈 skip if tracking not enabled

    // 🧭 Track navigation
    const handleNavigation = () => {
      addBreadcrumb("navigation", { url: window.location.pathname });
      trackEvent("page_view", { page_path: window.location.pathname });
    };
    handleNavigation(); // log initial load
    window.addEventListener("popstate", handleNavigation);

    // 🖱️ Track clicks with data attributes
    const handleClick = (e) => {
      const el = e.target.closest("[data-analytics]");
      if (!el) return;
      const name = el.getAttribute("data-analytics");
      const label = el.getAttribute("data-analytics-label");
      addBreadcrumb("click", { name, label });
      trackEvent("ui_click", { name, label });
    };

    // ❗ Global JS error handler
    const handleError = (e) => {
      logError(e.error || new Error(e.message), {
        source: "window.onerror",
        breadcrumbs: breadcrumbs.current,
      });
    };

    // ❗ Unhandled Promise rejections
    const handleRejection = (e) => {
      logError(e.reason || new Error("Unhandled Promise rejection"), {
        source: "window.onunhandledrejection",
        breadcrumbs: breadcrumbs.current,
      });
    };

    // ⚠️ Console error/warn capture
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      try {
        const message = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
        addBreadcrumb("console.error", { message });
        logError(new Error(message), {
          source: "console.error",
          args,
          breadcrumbs: breadcrumbs.current,
        });
      } catch (err) {
        // Fallback if something goes wrong
        console.log("Failed to log console.error:", err);
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      try {
        const message = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
        addBreadcrumb("console.warn", { message });
        logError(new Error(message), {
          source: "console.warn",
          args,
          breadcrumbs: breadcrumbs.current,
        });
      } catch (err) {
        console.log("Failed to log console.warn:", err);
      }
      originalConsoleWarn.apply(console, args);
    };

    // ✅ Register all event listeners
    document.addEventListener("click", handleClick);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      // 🔁 Clean up
      document.removeEventListener("click", handleClick);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("popstate", handleNavigation);

      // Restore console
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [enabled]);

  // Allow manual logging + breadcrumb recording
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
