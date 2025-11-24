
# AGI Shell CMS – RefreshRate CoreModule  
## Unified Super-Spec v2.1 (FULLSPEC + STRUCTURE + BEHAVIOUR + MASTER BUILD)

**Modulname (fix):** `AGI_Shell_CMS_RefreshRate_CoreModule_v1.0`  
**Modultyp:** Internal Core Module (CMS Systemkomponente)  
**Zweck:** Zentrales Refresh-Rate- und System-State-Modul für das AGI Shell CMS.

Diese Spezifikation ist eine **komplette, eigenständige Master-Spec**. Sie vereint:

- die ursprüngliche Vollspezifikation (Struktur + Code + Migrations + UI),  
- die strukturellen Regeln (Spec v1.0.2-A),  
- die Verhaltens- und Runtime-Regeln (Spec v1.0.2-B),  
- den MasterBuild-Prompt v1.0.2-C,  
- alle von Boltnew identifizierten Verbesserungs- und Sicherheitsanforderungen.

Diese Datei ist so gestaltet, dass **Boltnew allein mit dieser Spezifikation**:

- das vollständige Modul erzeugen kann,  
- ohne Rückfragen (außer in genau definierten Notfällen),  
- ohne Interpretationsspielraum,  
- deterministisch und auditierbar.  

---

## 0. Changelog v2.1

- Ergänzung eines verbindlichen DB-Importpfads (`import db from "../../../db";` in Services, `/db/index.ts` im CMS-Root).  
- Präzisierung der Datenbankzugriffsschicht inkl. `pg.Pool`-Konfiguration.  
- Ergänzung von **Row Level Security (RLS)** für die Tabellen `system_revision` und `refresh_policy`.  
- Dokumentation des Auth-Mechanismus für `/api/system/*` Endpunkte (Einsatz von `requireAdmin()` im Core-Router).  
- Ergänzung von minimalem UI-Error-Handling in beiden React-Komponenten (`SystemStatePanel.jsx`, `RefreshPolicyForm.jsx`).  
- Optionale Angabe von `peerDependencies` im Manifest (`react`, `pg`) zur besseren Tooling-Integration.  
- Klarstellung optionaler Typ- und Testdateien (können erzeugt werden, sind aber nicht verpflichtend).  

> Hinweis: v2.1 ändert **nur** Sicherheits-, Infrastruktur- und Robustheitsaspekte.  
> Die fachliche Funktion des Moduls (Refresh-Policy / System State) bleibt unverändert zu v2.0.

---

## 1. Global Rules (verbindlich)

1. Diese Spezifikation ist **autoritativ** für das Modul `AGI_Shell_CMS_RefreshRate_CoreModule_v1.0`.  
2. Alle Vorgaben sind **1:1** umzusetzen – ohne kreative Abweichungen.  
3. Es dürfen **keine zusätzlichen Dateien**, Ordner, Endpunkte oder Felder erfunden werden.  
4. Es dürfen **keine Namen geändert** werden (Ordner, Dateien, Endpunkte, Felder), außer wenn diese Spezifikation dies explizit vorsieht.  
5. Es dürfen **keine zusätzlichen Bibliotheken** eingeführt werden.  
6. Die hier eingebetteten Datei-Inhalte gelten als **vollständig und bindend**.  
7. Optional markierte Dateien dürfen nur erzeugt werden, wenn dies im Projekt ausdrücklich gewünscht ist. Standardfall: **nur Pflichtdateien**.  

---

## 2. Boltnew-Rolle & Override-Regel

Boltnew agiert als:

> **Strict Spec Executor – Senior Full-Stack Engineer ohne Interpretationsspielraum**

- Es werden **keine Verbesserungen** vorgeschlagen.  
- Es werden **keine Alternativen** generiert.  
- Es werden **keine eigenen Architekturentscheidungen** getroffen.  

### 2.1 Rückfragen-Regel (Override)

Grundsatz: **Keine Rückfragen.**  

Ausnahme (Notfall-Protokoll), siehe Abschnitt 15:

- technisch unauflösbarer Widerspruch,  
- erzwungener Sicherheitsverstoß,  
- erzwungener syntaktisch ungültiger Code.  

In diesen 3 Fällen ist **genau eine** Rückfrage zulässig, ansonsten nicht.

---

## 3. Versionierungsmodell

### 3.1 Ordner-Version (MAJOR.MINOR)

Der Modul-Root-Ordner verwendet **immer nur MAJOR.MINOR**:

- `AGI_Shell_CMS_RefreshRate_CoreModule_v1.0`  
- künftige Breaking-/Feature-Versionen z. B.:  
  - `AGI_Shell_CMS_RefreshRate_CoreModule_v1.1`  
  - `AGI_Shell_CMS_RefreshRate_CoreModule_v2.0`  

Ein neuer Ordner wird erstellt bei:

- **MINOR**-Inkrement (1.0 → 1.1)  
- **MAJOR**-Inkrement (1.x → 2.0)  

### 3.2 Manifest-Version (MAJOR.MINOR.PATCH)

Die Manifest-Version folgt SemVer (MAJOR.MINOR.PATCH).  
PATCH-Versionen **erzeugen keinen** neuen Ordner.

Beispiel:

- 1.0.0 → 1.0.1 → 1.0.2 → …  
- Ordner bleibt: `AGI_Shell_CMS_RefreshRate_CoreModule_v1.0`  

### 3.3 Breaking Changes

Jede inkompatible Änderung (Breaking Change) erfordert ein MAJOR-Inkrement und damit einen neuen Ordner (`v2.0`, `v3.0`, …).

---

## 4. Repository-Architektur & Packaging

### 4.1 GitHub Repository

Das Modul ist im **GitHub-Repository** `agi-shell-modules` wie folgt abzulegen:

```text
agi-shell-modules/
  modules/
    AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
      install.module.json
      README.md
      migrations/
        postgres/
          001_create_system_revision.sql
          002_create_refresh_policy.sql
      backend/
        index.ts
        services/
          RevisionService.ts
          RefreshPolicyService.ts
        controllers/
          SystemStateController.ts
          RefreshPolicyController.ts
      ui/
        SystemStatePanel.jsx
        RefreshPolicyForm.jsx
```

### 4.2 ZIP-Struktur für Upload

Für den Modul-Upload wird eine ZIP-Datei mit folgendem Root erwartet:

```text
modules/
  AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
    <alle Moduldateien wie oben>
```

Boltnew erzeugt in seiner Ausgabe **nur** die Modulstruktur ab:

```text
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
```

Die eigentliche ZIP-Erstellung erfolgt außerhalb von Boltnew.

---

## 5. Modul-Root & Verzeichnisstruktur (fix)

### 5.1 Modul-Root

```text
modules/
  AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
```

### 5.2 Verzeichnisbaum (Pflichtdateien)

```text
modules/
  AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
    install.module.json
    README.md
    migrations/
      postgres/
        001_create_system_revision.sql
        002_create_refresh_policy.sql
    backend/
      index.ts
      services/
        RevisionService.ts
        RefreshPolicyService.ts
      controllers/
        SystemStateController.ts
        RefreshPolicyController.ts
    ui/
      SystemStatePanel.jsx
      RefreshPolicyForm.jsx
```

### 5.3 Optionale Dateien (nur bei ausdrücklicher Anforderung)

```text
modules/
  AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
    backend/
      types.ts           (optional)
    tests/
      refresh-policy.test.ts   (optional)
```

Standardfall: **Boltnew erzeugt nur die Pflichtdateien**.  
Optionale Dateien werden nur generiert, wenn im Projekt explizit angefordert.

---

## 6. Manifest (install.module.json)

Verbindlicher Inhalt von:

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/install.module.json`

```json
{
  "id": "agi_shell_refresh_rate_core",
  "name": "AGI Shell CMS RefreshRate CoreModule",
  "version": "1.0.1",
  "type": "core",
  "internal": true,
  "protected": true,
  "installSource": "core",
  "upgradeViaUploadAllowed": true,
  "entrypoints": {
    "backend": "backend/index.ts",
    "ui": "ui/SystemStatePanel.jsx"
  },
  "navigation": {
    "settings": {
      "label": "System State",
      "section": "System",
      "visibility": "visible"
    }
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "pg": "^8.0.0"
  }
}
```

- Diese Manifest-Struktur ist **fix**.  
- Die Modulflags (`internal`, `protected`, `installSource`, `upgradeViaUploadAllowed`) dürfen nicht geändert werden.

---

## 7. README.md

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/README.md`

```markdown
# AGI Shell CMS – Refresh Rate Core Module

Internal core module providing:
- System revision tracking
- Global refresh interval policy
- System state API

This module is protected, internal, and upgradable via Upload.
Initial installation is done via Console (migrations), upgrades via Upload.
```

---

## 8. Datenbank-Migrationen (inkl. RLS)

### 8.1 001_create_system_revision.sql

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/migrations/postgres/001_create_system_revision.sql`

```sql
CREATE TABLE IF NOT EXISTS system_revision (
  key TEXT PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_revision ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_only_system_revision
  ON system_revision
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 8.2 002_create_refresh_policy.sql

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/migrations/postgres/002_create_refresh_policy.sql`

```sql
CREATE TABLE IF NOT EXISTS refresh_policy (
  id SERIAL PRIMARY KEY,
  default_interval INT NOT NULL DEFAULT 5000,
  module_interval INT NOT NULL DEFAULT 5000,
  settings_interval INT NOT NULL DEFAULT 5000,
  dashboard_interval INT NOT NULL DEFAULT 10000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE refresh_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_only_refresh_policy
  ON refresh_policy
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

- Migrationen sind **idempotent** (nutzen `IF NOT EXISTS`).  
- RLS wird aktiviert, und eine Admin-Policy wird definiert.  

---

## 9. Backend – index.ts & DB-Zugriff

### 9.1 index.ts

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/index.ts`

```ts
import { SystemStateController } from "./controllers/SystemStateController";
import { RefreshPolicyController } from "./controllers/RefreshPolicyController";

export const init = (router) => {
  router.get("/api/system/state", SystemStateController.getSystemState);
  router.get("/api/system/refresh-policy", RefreshPolicyController.getPolicy);
  router.put("/api/system/refresh-policy", RefreshPolicyController.updatePolicy);
};
```

- Es werden **genau drei** Endpunkte registriert:
  - `GET /api/system/state`
  - `GET /api/system/refresh-policy`
  - `PUT /api/system/refresh-policy`  
- Es dürfen keine weiteren Routen aus diesem Modul hinzugefügt werden.

### 9.2 Datenbankzugriff (DB-Importpfad)

Alle Services verwenden die zentrale DB-Instanz über:

```ts
import db from "../../../db";
```

Die Datei `db/index.ts` liegt im CMS-Root (außerhalb des Moduls) und exportiert:

```ts
import { Pool } from "pg";

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true"
});

export default db;
```

- Das Modul definiert **keine eigene Datenbankkonfiguration**, sondern nutzt die globale CMS-DB-Schicht.

---

## 10. Backend – Services

### 10.1 RevisionService.ts

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/services/RevisionService.ts`

```ts
import db from "../../../db";

export class RevisionService {
  static async increment(key: string) {
    await db.query(
      `INSERT INTO system_revision (key, revision, updated_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (key)
       DO UPDATE SET revision = system_revision.revision + 1, updated_at = NOW()`,
      [key]
    );
  }

  static async getAll() {
    const res = await db.query(
      `SELECT key, revision, updated_at FROM system_revision`
    );
    const result: Record<string, { revision: number; updated_at: string }> = {};
    res.rows.forEach(r => {
      result[r.key] = { revision: r.revision, updated_at: r.updated_at };
    });
    return result;
  }
}
```

### 10.2 RefreshPolicyService.ts

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/services/RefreshPolicyService.ts`

```ts
import db from "../../../db";

export type RefreshPolicy = {
  id: number;
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
  updated_at: string;
};

export type RefreshPolicyInput = {
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
};

export class RefreshPolicyService {
  static async getPolicy(): Promise<RefreshPolicy> {
    const res = await db.query(`SELECT * FROM refresh_policy LIMIT 1`);
    if (res.rows.length === 0) {
      await db.query(`INSERT INTO refresh_policy (default_interval) VALUES (5000)`);
      return this.getPolicy();
    }
    return res.rows[0];
  }

  static validate(input: RefreshPolicyInput) {
    const keys: (keyof RefreshPolicyInput)[] = [
      "default_interval",
      "module_interval",
      "settings_interval",
      "dashboard_interval"
    ];
    for (const k of keys) {
      if (typeof input[k] !== "number") throw new Error("INVALID_INTERVAL");
      if (input[k] < 1000 || input[k] > 60000) throw new Error("INTERVAL_OUT_OF_RANGE");
    }
  }

  static async updatePolicy(input: RefreshPolicyInput): Promise<RefreshPolicy> {
    this.validate(input);
    const res = await db.query(
      `UPDATE refresh_policy SET 
        default_interval=$1,
        module_interval=$2,
        settings_interval=$3,
        dashboard_interval=$4,
        updated_at=NOW()
       RETURNING *`,
      [
        input.default_interval,
        input.module_interval,
        input.settings_interval,
        input.dashboard_interval
      ]
    );
    return res.rows[0];
  }
}
```

- `getPolicy()` stellt sicher, dass eine Default-Policy existiert (Insert mit `default_interval = 5000`).  
- `validate()` erzwingt Werte zwischen **1000 und 60000 ms**.  
- Alle Queries verwenden **Prepared Statements** (Platzhalter `$1`–`$4`).  

---

## 11. Backend – Controller & Auth-Kontext

### 11.1 SystemStateController.ts

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/controllers/SystemStateController.ts`

```ts
import { RevisionService } from "../services/RevisionService";

export class SystemStateController {
  static async getSystemState(req, res) {
    const revisions = await RevisionService.getAll();
    res.json({
      ...revisions,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 11.2 RefreshPolicyController.ts

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/controllers/RefreshPolicyController.ts`

```ts
import { RefreshPolicyService } from "../services/RefreshPolicyService";

export class RefreshPolicyController {
  static async getPolicy(req, res) {
    const policy = await RefreshPolicyService.getPolicy();
    res.json(policy);
  }

  static async updatePolicy(req, res) {
    try {
      const updated = await RefreshPolicyService.updatePolicy(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
```

### 11.3 Endpunkt-Autorisierung (Core-Router, dokumentarisch)

- Alle `/api/system/*` Endpunkte werden im CMS-Core-Router mit einer Admin-Middleware geschützt, z. B.:

```ts
import { requireAdmin } from "../../middleware/auth";

export const registerSystemRoutes = (router) => {
  router.use("/api/system", requireAdmin);
  // hier wird dann init(...) des Moduls eingehängt
};
```

- Dieses Modul selbst definiert keine eigene Auth-Logik, sondern setzt voraus, dass die Routen durch den globalen Router geschützt werden.  

---

## 12. UI – Komponenten (inkl. Fehlerbehandlung)

### 12.1 SystemStatePanel.jsx

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/ui/SystemStatePanel.jsx`

```jsx
import React, { useState, useEffect } from "react";

export default function SystemStatePanel() {
  const [state, setState] = useState(null);

  const fetchState = () => {
    fetch("/api/system/state")
      .then(r => r.json())
      .then(setState)
      .catch(err => {
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

  return (
    <div>
      <h2>System State</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <button onClick={fetchState}>Refresh Now</button>
    </div>
  );
}
```

### 12.2 RefreshPolicyForm.jsx

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/ui/RefreshPolicyForm.jsx`

```jsx
import React, { useState, useEffect } from "react";

export default function RefreshPolicyForm() {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    fetch("/api/system/refresh-policy")
      .then(r => r.json())
      .then(setPolicy)
      .catch(err => {
        console.error("Fetch failed:", err);
        setPolicy(prev => ({ ...(prev || {}), error: err.message }));
      });
  }, []);

  const update = () => {
    fetch("/api/system/refresh-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy)
    })
      .then(r => r.json())
      .then(setPolicy)
      .catch(err => {
        console.error("Update failed:", err);
        setPolicy(prev => ({ ...(prev || {}), error: err.message }));
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
        onChange={e => setPolicy({ ...policy, default_interval: Number(e.target.value) })}
      />

      <label>Module Interval (ms)</label>
      <input
        type="number"
        value={policy.module_interval}
        onChange={e => setPolicy({ ...policy, module_interval: Number(e.target.value) })}
      />

      <label>Settings Interval (ms)</label>
      <input
        type="number"
        value={policy.settings_interval}
        onChange={e => setPolicy({ ...policy, settings_interval: Number(e.target.value) })}
      />

      <label>Dashboard Interval (ms)</label>
      <input
        type="number"
        value={policy.dashboard_interval}
        onChange={e => setPolicy({ ...policy, dashboard_interval: Number(e.target.value) })}
      />

      <button onClick={update}>Save</button>
    </div>
  );
}
```

- UI ist **rein lokal** (React + Fetch), ohne zusätzliche Routing-/Navigationslogik.  
- Fehler werden im UI sichtbar gemacht, ohne zusätzliche Komplexität.

---

## 13. Sicherheits-Mindeststandards

Für dieses Modul gelten folgende Sicherheitsgrundsätze:

1. **DB-Zugriffe:**  
   - erfolgen ausschließlich über `db.query(...)` mit Platzhaltern (`$1`, `$2`, …).  
   - Keine String-Konkatenation mit Nutzereingaben.  

2. **Auth/ACL:**  
   - Die Endpunkte werden in der globalen API-Registrierung nur für berechtigte Nutzer (Admin/Settings) freigeschaltet.  
   - Dieses Modul selbst fügt keine eigene Auth-Bypass-Logik hinzu.  

3. **RLS:**  
   - RLS ist für `system_revision` und `refresh_policy` **aktiviert**.  
   - Die Policies erlauben nur Zugriff für Nutzer mit Admin-Rolle.  

4. **Input-Validierung:**  
   - numerische Intervalle werden strikt geprüft (1000–60000).  
   - bei Verstoß wird ein 400-Fehler mit `{ error: "..." }` zurückgegeben.  

---

## 14. Testbarkeit (optional)

Empfohlene, aber optionale Tests:

- SQL-Migrations-Syntaxtest (z. B. via CI).  
- Test, dass `/api/system/refresh-policy` eine Policy liefert.  
- Test, dass ein ungültiges Intervall (`<1000` oder `>60000`) mit 400 + `{ error: "..." }` beantwortet wird.  

Optionale Beispiel-Testdatei (nur als Dokumentation, nicht verpflichtend zu generieren):

```ts
// modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/tests/refresh-policy.test.ts
// (optional, nur falls Tests im Projekt vorgesehen sind)

import { RefreshPolicyService } from "../backend/services/RefreshPolicyService";

describe("RefreshPolicyService", () => {
  it("rejects intervals < 1000", async () => {
    await expect(
      RefreshPolicyService.updatePolicy({
        default_interval: 500,
        module_interval: 5000,
        settings_interval: 5000,
        dashboard_interval: 5000
      })
    ).rejects.toThrow("INTERVAL_OUT_OF_RANGE");
  });
});
```

---

## 15. Notfall-Protokoll (für Boltnew)

Boltnew darf genau **eine Rückfrage** stellen, wenn und nur wenn:

1. Diese Spezifikation zwei sich **widersprechende, technisch unvereinbare** Anforderungen enthält, oder  
2. die Spezifikation eine **sicherheitskritische Implementierung erzwingen würde**, oder  
3. die Spezifikation zwingend **syntaktisch ungültigen Code** produziert.  

In allen anderen Fällen gilt:  
**Spezifikation ist vollständig, keine Rückfragen zulässig.**

---

## 16. Output-Format für Boltnew

Wenn Boltnew aus dieser Spezifikation generiert, muss die Ausgabe wie folgt strukturiert sein:

Für jede Datei im Modul:

```text
=== FILE: modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/<RELATIVER/PFAD> ===
```

gefolgt von einem Codeblock mit passender Sprache (`json`, `ts`, `jsx`, `sql`, `md`).

Beispiele:

```text
=== FILE: modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/install.module.json ===
```

```json
{ ... }
```

```text
=== FILE: modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/backend/index.ts ===
```

```ts
// ...
```

Es dürfen **nur** die in Abschnitt 5–12 definierten Dateien ausgegeben werden.

---

## 17. Final Build Instruction (für Boltnew)

> Erzeuge exakt die in dieser Spezifikation definierte Modulstruktur  
> `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/`  
> inklusive aller Dateien und Inhalte, ohne Abweichungen, ohne zusätzliche Dateien,  
> ohne eigene Interpretationen oder „Optimierungen“.
