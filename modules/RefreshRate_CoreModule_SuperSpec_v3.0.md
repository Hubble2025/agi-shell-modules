# AGI Shell CMS – RefreshRate CoreModule  
## Unified Super-Spec v3.0 (Bolt Database + Edge Functions + Vite/React)

**Modulname (logisch):** `AGI_Shell_CMS_RefreshRate_CoreModule`  
**Modulversion (SemVer):** `3.0.0`  
**Modultyp:** Internal Core Module (CMS Systemkomponente)  
**Zweck:** Zentrales Refresh-Rate- und System-State-Modul für das AGI Shell CMS – jetzt vollständig kompatibel mit **Bolt Database (Supabase)**, **Edge Functions** und **Vite/React SPA**.

---

## 0. Changelog v3.0

- Vollständiger Architekturwechsel von `pg.Pool` / Express-Backend zu:
  - **Bolt Database (Supabase)** als primäre Datenbank
  - **Supabase Edge Functions** als Backend-API-Layer
  - **Vite + React SPA** als Frontend
- Einführung eines **Bolt Database-kompatiblen Schema- und RLS-Designs**:
  - Tabellen: `system_revision`, `refresh_policy`, `module_registry`
  - RLS-Policies für Admin-/System-Rollen
- Implementierung der Backend-Logik in **Edge Functions**:
  - `system-state` (GET)
  - `refresh-policy` (GET/PUT)
- Anpassung der Frontend-Komponenten:
  - React Components konsumieren Edge Functions über `VITE_FUNCTIONS_BASE_URL`
- Definition einer **Modul-Registry** in Bolt Database:
  - Speicherung von Modul-Metadaten (id, version, type, install_source, enabled, usw.)
- Klarer, deterministischer Build-Prompt für Boltnew:
  - Alle Dateien, Pfade und Inhalte sind eindeutig spezifiziert
  - Keine Abhängigkeit mehr von einem Express-Router

---

## 1. GLOBAL RULES

1. Diese Spezifikation ist **autoritativ** für das `RefreshRate CoreModule v3.0`.  
2. Boltnew MUSS alle hier definierten Dateien, Pfade, Inhalte und Signaturen **1:1** erzeugen.  
3. Es dürfen **keine zusätzlichen Dateien, Ordner, Endpunkte oder Tabellen** erfunden werden.  
4. Es dürfen **keine Namen** (Dateien, Ordner, Tabellen, Policies, Edge Functions) geändert werden.  
5. Es dürfen **keine zusätzlichen Libraries** eingeführt werden, außer den hier explizit genannten.  
6. Wo Code-Blöcke definiert sind, gelten diese als **bindende Referenzimplementierung**.  
7. Optional markierte Teile sind wirklich optional; standardmäßig werden nur Pflichtdateien erzeugt.  

---

## 2. ZIEL-STACK & ARCHITEKTUR

Die Spezifikation zielt auf folgende Umgebung:

- **Frontend:**
  - Framework: `React` (Vite-basiert)
  - Build-Tool: `Vite`
  - Entry-Ordner: `src/`
- **Backend:**
  - **Supabase / Bolt Database** als Datenbank (PostgreSQL mit RLS)
  - **Supabase Edge Functions** als Server-seitiger Code (Deno)
- **Konfiguration:**
  - `.env` / `.env.local` mit `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Datenfluss:**
  - React-Components rufen `fetch()` auf Edge Functions Endpoints:
    - `GET {VITE_FUNCTIONS_BASE_URL}/system-state`
    - `GET {VITE_FUNCTIONS_BASE_URL}/refresh-policy`
    - `PUT {VITE_FUNCTIONS_BASE_URL}/refresh-policy`

---

## 3. REPOSITORY- & DATEISTRUKTUR

Boltnew MUSS folgende Ordner und Dateien erzeugen:

```text
supabase/
  migrations/
    202501010001_refresh_core_schema.sql

  functions/
    system-state/
      index.ts
    refresh-policy/
      index.ts

src/
  lib/
    boltDatabaseClient.ts

  components/
    SystemStatePanel.tsx
    RefreshPolicyForm.tsx

  modules/
    refreshRateCore/
      manifest.json

.env.example
```

**Hinweis:**

* `supabase/migrations/*` werden über das Supabase/Bolt-Tooling eingespielt.
* `supabase/functions/*` sind Edge Functions.
* `src/components/*` sind Vite/React-Komponenten.
* `src/lib/boltDatabaseClient.ts` ist der Browser-Client für die Frontend-Seite (Anon Key).
* `manifest.json` dient als modulbezogene Metadatenbasis (für Modul-Registry / Installer).

---

## 4. DOTENV & CLIENT-KONFIGURATION

### 4.1 `.env.example`

Boltnew MUSS folgende `.env.example` erzeugen:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### 4.2 `src/lib/boltDatabaseClient.ts`

Boltnew MUSS folgende Datei erzeugen:

```ts
// src/lib/boltDatabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not set");
}

// Frontend client (Anon Key)
export const boltDb = createClient(supabaseUrl, supabaseAnonKey);
```

* Dieser Client wird **nur im Frontend** verwendet (kein Service Role Key).

---

## 5. DATENBANK-SCHEMA (SUPABASE / BOLT DATABASE)

### 5.1 Migration: `supabase/migrations/202501010001_refresh_core_schema.sql`

Boltnew MUSS **eine** kombinierte Migration erzeugen:

```sql
-- 1) system_revision: globale Revisions-Tabelle
CREATE TABLE IF NOT EXISTS system_revision (
  key TEXT PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) refresh_policy: zentrale Refresh-Policy
CREATE TABLE IF NOT EXISTS refresh_policy (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  default_interval INT NOT NULL DEFAULT 5000,
  module_interval INT NOT NULL DEFAULT 5000,
  settings_interval INT NOT NULL DEFAULT 5000,
  dashboard_interval INT NOT NULL DEFAULT 10000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) module_registry: einfache Modul-Registry
CREATE TABLE IF NOT EXISTS module_registry (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  type TEXT NOT NULL,
  install_source TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- RLS: system_revision
-- ================================================
ALTER TABLE system_revision ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_system_revision"
  ON system_revision
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_read_system_revision"
  ON system_revision
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'system')
    )
  );

-- ================================================
-- RLS: refresh_policy
-- ================================================
ALTER TABLE refresh_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_refresh_policy"
  ON refresh_policy
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_read_refresh_policy"
  ON refresh_policy
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'system')
    )
  );

-- ================================================
-- RLS: module_registry
-- ================================================
ALTER TABLE module_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_module_registry"
  ON module_registry
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_read_module_registry"
  ON module_registry
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'system')
    )
  );
```

* Diese Migration ist **idempotent**.
* Policies erlauben:

  * Vollzugriff für `service_role` (Edge Functions)
  * Lesezugriff für authentifizierte Admin-/System-User

---

## 6. EDGE FUNCTIONS – SYSTEM STATE

### 6.1 Datei: `supabase/functions/system-state/index.ts`

Boltnew MUSS folgende Edge Function erzeugen:

```ts
// supabase/functions/system-state/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(url, serviceKey);

  // Option: spätere Erweiterung – inkrementieren bestimmter Revisions
  const { data, error } = await supabase
    .from("system_revision")
    .select("key, revision, updated_at");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const map: Record<string, { revision: number; updated_at: string }> = {};
  (data ?? []).forEach((row: any) => {
    map[row.key] = {
      revision: row.revision,
      updated_at: row.updated_at
    };
  });

  const body = {
    ...map,
    timestamp: new Date().toISOString()
  };

  return new Response(
    JSON.stringify(body),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
```

* Diese Function liefert den **System State** als JSON.
* Später kann über andere Mechanismen (`system_revision` Update) nachgezogen werden.

---

## 7. EDGE FUNCTIONS – REFRESH POLICY

### 7.1 Datei: `supabase/functions/refresh-policy/index.ts`

Boltnew MUSS folgende Edge Function erzeugen:

```ts
// supabase/functions/refresh-policy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RefreshPolicy = {
  id: number;
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
  updated_at: string;
};

type RefreshPolicyInput = {
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
};

function validate(input: RefreshPolicyInput) {
  const keys: (keyof RefreshPolicyInput)[] = [
    "default_interval",
    "module_interval",
    "settings_interval",
    "dashboard_interval"
  ];
  for (const k of keys) {
    const v = input[k];
    if (typeof v !== "number") throw new Error("INVALID_INTERVAL");
    if (v < 1000 || v > 60000) throw new Error("INTERVAL_OUT_OF_RANGE");
  }
}

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(url, serviceKey);

  const method = req.method.toUpperCase();

  if (method === "GET") {
    const { data, error } = await supabase
      .from("refresh_policy")
      .select("*")
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("refresh_policy")
        .insert({ default_interval: 5000 })
        .select("*")
        .limit(1);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(inserted[0]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data[0]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (method === "PUT") {
    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({ error: "INVALID_BODY" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      validate(body as RefreshPolicyInput);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("refresh_policy")
      .update({
        default_interval: body.default_interval,
        module_interval: body.module_interval,
        settings_interval: body.settings_interval,
        dashboard_interval: body.dashboard_interval,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data[0]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
});
```

---

## 8. MODUL-REGISTRY & MANIFEST

### 8.1 Modul-Registry (Tabellen-Design – siehe Migration)

| Spalte         | Typ         | Bedeutung                                      |
| -------------- | ----------- | ---------------------------------------------- |
| id             | TEXT        | Modul-ID (z. B. `agi_shell_refresh_rate_core`) |
| version        | TEXT        | SemVer-Version (`3.0.0`)                       |
| type           | TEXT        | `core`, `external`, `internal`, etc.           |
| install_source | TEXT        | `core`, `upload`, `system`                     |
| enabled        | BOOLEAN     | Modul aktiv ja/nein                            |
| created_at     | TIMESTAMPTZ | Erstregistrierung                              |
| updated_at     | TIMESTAMPTZ | Letzte Änderung                                |

> Die Registry dient als Grundlage für zukünftige modulare Install-/Upgrade-Logik.

---

### 8.2 `src/modules/refreshRateCore/manifest.json`

Boltnew MUSS folgende Manifest-Datei erzeugen:

```json
{
  "id": "agi_shell_refresh_rate_core",
  "name": "AGI Shell CMS RefreshRate CoreModule",
  "version": "3.0.0",
  "type": "core",
  "internal": true,
  "protected": true,
  "installSource": "core",
  "upgradeViaUploadAllowed": true,
  "entrypoints": {
    "ui_main": "src/components/SystemStatePanel.tsx",
    "ui_settings": "src/components/RefreshPolicyForm.tsx",
    "edge_functions": {
      "system_state": "supabase/functions/system-state/index.ts",
      "refresh_policy": "supabase/functions/refresh-policy/index.ts"
    }
  }
}
```

---

## 9. FRONTEND – SystemStatePanel

### 9.1 Datei: `src/components/SystemStatePanel.tsx`

```tsx
import React, { useEffect, useState } from "react";

type SystemState = Record<string, { revision: number; updated_at: string }> & {
  timestamp?: string;
  error?: string;
};

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
```

---

## 10. FRONTEND – RefreshPolicyForm

### 10.1 Datei: `src/components/RefreshPolicyForm.tsx`

```tsx
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
        setPolicy((prev) => ({ ...(prev || ({} as any)), error: err.message }));
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
        setPolicy((prev) => ({ ...(prev || ({} as any)), error: err.message }));
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
        value={policy.default_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            default_interval: Number(e.target.value)
          })
        }
      />

      <label>Module Interval (ms)</label>
      <input
        type="number"
        value={policy.module_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            module_interval: Number(e.target.value)
          })
        }
      />

      <label>Settings Interval (ms)</label>
      <input
        type="number"
        value={policy.settings_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            settings_interval: Number(e.target.value)
          })
        }
      />

      <label>Dashboard Interval (ms)</label>
      <input
        type="number"
        value={policy.dashboard_interval}
        onChange={(e) =>
          setPolicy({
            ...policy,
            dashboard_interval: Number(e.target.value)
          })
        }
      />

      <button onClick={update}>Save</button>
    </div>
  );
};
```

---

## 11. SICHERHEITS- & VALIDIERUNGSREGELN

1. **DB-Zugriff ausschließlich über Bolt Database/Supabase-Client**:

   * Edge Functions nutzen `service_role`-Key.
   * Frontend nutzt `Anon Key` mit RLS-Schutz.
2. **RLS aktiv** für alle Module-Tabellen (siehe Migration).
3. **Input-Validierung**:

   * Intervalle 1000–60000 ms (Edge Function `refresh-policy`).
4. **Fehlerformat** (Edge Functions):

   * `{"error": "<MESSAGE>"}` mit HTTP-Status 4xx/5xx.
5. **Keine Express-Server-Instanz**; Backend ausschließlich über Edge Functions.

---

## 12. VERSIONIERUNG

* Manifest-Version: `3.0.0` (SemVer).
* Datenbank-Schema-Version über Migrations-Dateinamen (`202501010001_*`).
* Für zukünftige Major-Änderungen: neue Migrationen + neues Manifest (`4.0.0`).

---

## 13. PRODUKTIONSREIFE & ERWEITERUNGSPUNKTE

* Modul ist als **Core-Blueprint** gedacht:

  * Refresh-Policy und System State sind generisch.
  * Modul-Registry kann später erweitert werden (z. B. modul-spezifische Policies).
* Weitere Edge Functions (z. B. `module-upload`, `module-install`) können auf dieser Spec aufbauen.

---

## 14. FINAL BUILD INSTRUCTION (für Boltnew)

> Erzeuge exakt die in dieser Spezifikation definierte Struktur,
> inklusive aller Dateien, Inhalte und Migrationsskripte.
> Nutze dabei den Supabase/Bolt Database Stack (Edge Functions + Vite/React),
> ohne zusätzliche Dateien oder Libraries anzulegen.
>
> Ziel ist eine **vollständig funktionsfähige, Bolt Database-kompatible Implementierung** des
> `AGI Shell CMS RefreshRate CoreModule` für den Einsatz im Vite/React-Szenario und als Blueprint für zukünftige CMS-Integration.
