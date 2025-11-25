import React, { useEffect, useState } from "react";

type RefreshPolicy = {
  id: number;
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
  updated_at: string;
  error?: string;
};

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;

export const RefreshPolicyForm: React.FC = () => {
  const [policy, setPolicy] = useState<RefreshPolicy | null>(null);

  useEffect(() => {
    fetch(`${FUNCTIONS_BASE}/refresh-policy`)
      .then((r) => r.json())
      .then(setPolicy)
      .catch((err) => {
        console.error("Fetch failed:", err);
        setPolicy((prev) => ({
          ...(prev || ({} as any)),
          error: err.message
        }));
      });
  }, []);

  const update = () => {
    if (!policy) return;

    const body = {
      default_interval: policy.default_interval,
      module_interval: policy.module_interval,
      settings_interval: policy.settings_interval,
      dashboard_interval: policy.dashboard_interval
    };

    fetch(`${FUNCTIONS_BASE}/refresh-policy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then((r) => r.json())
      .then(setPolicy)
      .catch((err) => {
        console.error("Update failed:", err);
        setPolicy((prev) => ({
          ...(prev || ({} as any)),
          error: err.message
        }));
      });
  };

  if (!policy) return <div>Loading...</div>;

  return (
    <div>
      <h2>Refresh Policy</h2>

      {policy.error && (
        <p style={{ color: "red" }}>Error: {policy.error}</p>
      )}

      <label>Default Interval (ms)</label>
      <input
        type="number"
        min="1000"
        max="60000"
        value={policy.default_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            default_interval: Number(e.target.value) || 1000
          })
        }
      />

      <label>Module Interval (ms)</label>
      <input
        type="number"
        min="1000"
        max="60000"
        value={policy.module_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            module_interval: Number(e.target.value) || 1000
          })
        }
      />

      <label>Settings Interval (ms)</label>
      <input
        type="number"
        min="1000"
        max="60000"
        value={policy.settings_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            settings_interval: Number(e.target.value) || 1000
          })
        }
      />

      <label>Dashboard Interval (ms)</label>
      <input
        type="number"
        min="1000"
        max="60000"
        value={policy.dashboard_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            dashboard_interval: Number(e.target.value) || 1000
          })
        }
      />

      <button onClick={update}>Save</button>
    </div>
  );
};
