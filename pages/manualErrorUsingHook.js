import { useErrorTracker } from "@/hooks/useErrorTracker";

export default function Home() {
  const { trackEvent, logError } = useErrorTracker();

  const triggerError = () => {
    try {
      throw new Error("Manual test error from Home page");
    } catch (err) {
        console.log("Logging error via hook:", err);
      logError(err, { page: "home" });
    }
    throw new Error("Manual test error from Home page");
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Firebase Tracker Hook Demo</h1>

      <button
        data-analytics="click_hello"
        data-analytics-label="Hello Button"
        onClick={() => {trackEvent("hello_click", { label: "Hello Button" }); alert("Hello!");}}
      >
        Say Hello
      </button>

      <button
        data-analytics="click_error"
        data-analytics-label="Crash Button"
        onClick={triggerError}
        style={{ marginLeft: 10 }}
      >
        Trigger Error
      </button>
    </main>
  );
}
