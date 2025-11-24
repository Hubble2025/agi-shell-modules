import React, { useEffect, useState } from "react";

type StateEntry = {
  revision: number;
  updated_at: string;
};

type SystemState = {
  timestamp?: string;
  error?: string;
} & Record<string, StateEntry>;

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;

export const SystemStatePanel: React.FC = () => {
  const [state, setState] = useState<SystemState | null>(null);

  const fetchState = () => {
    fetch(`${FUNCTIONS_BASE}/system-state`)
      .then((r) => r.json())
      .then(setState)
      .catch((err) => {
        console.error("Fetch failed:", err);
        setState({ error: err.message });
      });
  };

  useEffect(() => {
    fetchState();
    const i = setInterval(fetchState, 5000);
    return () => clearInterval(i);
  }, []);

  if (!state) return <div>Loading...</div>;

  if (state.error) {
    return (
      <div>
        <h2>System State</h2>
        <p style={{ color: "red" }}>Error: {state.error}</p>
        <button onClick={fetchState}>Retry</button>
      </div>
    );
  }

  const { timestamp, ...rest } = state;

  return (
    <div>
      <h2>System State</h2>
      {timestamp && <p>Last Update: {timestamp}</p>}
      <pre>{JSON.stringify(rest, null, 2)}</pre>
      <button onClick={fetchState}>Refresh Now</button>
    </div>
  );
};
