import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { trackEvent, logError } from "../utils/tracking";
import { useErrorTracker } from "@/hooks/useErrorTracker";
import { initPosthog } from "@/lib/posthog";
import ConsentBanner from "@/components/ConsentBanner";

let breadcrumbs = [];

function addBreadcrumb(type, detail) {
  breadcrumbs.push({ type, detail, ts: Date.now() });
  if (breadcrumbs.length > 50) breadcrumbs.shift();
}

export default function App({ Component, pageProps }) {
  // useErrorTracker(); // initialize once globally

  // // Track page views
  // useEffect(() => {
  //   const handleRouteChange = (url) => {
  //     trackEvent("page_view", { page_path: url });
  //     addBreadcrumb("navigation", { url });
  //   };

  //   window.addEventListener("error", (e) => {
  //     logError(e.error || new Error(e.message), { breadcrumbs });
  //   });

  //   window.addEventListener("unhandledrejection", (e) => {
  //     logError(e.reason || new Error("Unhandled rejection"), { breadcrumbs });
  //   });

  //   window.addEventListener("click", (e) => {
  //     const el = e.target.closest("[data-analytics]");
  //     if (!el) return;
  //     const name = el.getAttribute("data-analytics");
  //     const label = el.getAttribute("data-analytics-label");
  //     addBreadcrumb("click", { name, label });
  //     trackEvent("ui_click", { name, label });
  //   });

  //   return () => {
  //     window.removeEventListener("error");
  //     window.removeEventListener("unhandledrejection");
  //   };
  // }, []);




  // useEffect(() => {
  //   initPosthog();
  // }, []);



  const [consentGiven, setConsentGiven] = useState(false);

  // ✅ Always call hook — it will internally check consent
  useErrorTracker(consentGiven);

  const handleConsent = () => {
    initPosthog();
    setConsentGiven(true);
  };

  useEffect(() => {
    const consent = localStorage.getItem("analytics_consent");
    if (consent === "granted") handleConsent();
  }, []);


  return (<><Component {...pageProps} /><ConsentBanner onConsent={handleConsent} /></>);
}
