import { useState, useEffect } from "react";

export default function ConsentBanner({ onConsent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("analytics_consent");
    if (!consent) setVisible(true);
    else if (consent === "granted") onConsent();
  }, [onConsent]);

  const handleAccept = () => {
    localStorage.setItem("analytics_consent", "granted");
    setVisible(false);
    onConsent();
  };

  const handleDecline = () => {
    localStorage.setItem("analytics_consent", "denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#222",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 6,
        fontSize: 14,
        display: "flex",
        gap: 10,
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <span>
        We use analytics and session recording to improve your experience.
      </span>
      <button onClick={handleAccept} style={{ background: "#4caf50", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4 }}>
        Accept
      </button>
      <button onClick={handleDecline} style={{ background: "#555", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4 }}>
        Decline
      </button>
    </div>
  );
}
