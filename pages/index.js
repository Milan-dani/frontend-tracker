export default function Home() {
  const triggerError = () => {
    throw new Error("Test crash from user!");
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Firebase Tracker Demo</h1>
      <button
        data-analytics="click_hello"
        data-analytics-label="Hello Button"
        onClick={() => alert("Hello!")}
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
