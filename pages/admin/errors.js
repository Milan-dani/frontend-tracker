import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getServerSideProps() {
  const snap = await getDocs(collection(db, "errors"));
  const errors = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { props: { errors } };
}

export default function ErrorList({ errors }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Error Logs</h1>
      <ul>
        {errors.map(err => (
          <li key={err.id} style={{ marginBottom: 16 }}>
            <strong>{err.message}</strong><br />
            <small>{err.posthogSessionId}</small><br />
            <small>{err.timestamp}</small><br />
            {err.sessionReplayUrl && (
              <a href={err.sessionReplayUrl} target="_blank" rel="noreferrer">
                🔗 View session replay
              </a>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
