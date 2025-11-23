
# AGI-Shell CMS RefreshRate CoreModule – Spec Prompt v1.0.2-B  
## Fokus: Backend-Verhalten, UI, API, Error-Format, Defaults, Runtime-Standards

### Zweck
Dieses Dokument ergänzt v1.0.2-A und schließt alle offenen natürlichen Fragen, die Boltnew bei der Implementation stellen würde.

---

# 1. CRITICAL: Error-Format
Für dieses Modul gilt zu 100%:

```json
{ "error": "MESSAGE" }
```

- KEIN `success:false`
- KEINE zusätzlichen Felder
- KEINE globale Error-Structure
- KEINE Änderungen durch Boltnew

---

# 2. CRITICAL: Defaultwerte in RefreshPolicy
Beim ersten Abruf wird:

```
INSERT INTO refresh_policy (default_interval) VALUES (5000)
```

ausgeführt.

- Alle anderen Werte stammen aus SQL DEFAULTS.
- Boltnew darf **keine zusätzlichen Felder setzen**.
- Boltnew darf die Migrationen NICHT erweitern.
- Boltnew darf die Insert-Query NICHT ändern.

---

# 3. RevisionService: NICHT AKTIV VERWENDEN
`RevisionService.increment()` ist im Code enthalten, wird aber:

- NICHT von diesem Modul aufgerufen  
- NICHT automatisch getriggert  
- NICHT durch Policy-Updates verwendet  

Boltnew darf daher:
- KEIN Routing hinzufügen
- KEINE Auto-Trigger erzeugen
- KEINE zusätzliche Logik anlegen

---

# 4. CRITICAL: UI-Standards
- Datei-Endungen **immer .jsx**  
- KEIN TypeScript im UI  
- KEINE Routing-Integration  
- KEINE Navigationserzeugung  

Die UI wird **allein durch das Manifest.navigation** im CMS sichtbar.

Boltnew darf:
- KEINE Menüs erzeugen
- KEINE Sidebar-Einträge generieren
- KEINE Tabs oder Layouts hinzufügen

---

# 5. CRITICAL: ECMAScript-Standard
- Backend-Code ist **pure ESModule TypeScript**.
- KEINE Decorators.
- KEIN experimental syntax.
- KEINE globalen Helper.

Boltnew muss exakt die Syntax ausgeben:

```ts
import ...
export const ...
```

---

# 6. API-Spezifikation – Fixiert und unverhandelbar
Boltnew darf ausschließlich die folgenden Endpoints generieren:

```
GET  /api/system/state
GET  /api/system/refresh-policy
PUT  /api/system/refresh-policy
```

- KEINE DELETE-Varianten  
- KEINE POST-Endpunkte  
- KEINE weiteren Routen  

---

# 7. Keine Self-Tests / Healthchecks
Boltnew soll KEINE der folgenden Dinge erzeugen:

- healthcheck.ts  
- selftest.ts  
- status-endpoints  
- readiness-/liveness-Probing  

---

# 8. Keine zusätzlichen Validierungen
- KEINE JSON-Schemas  
- KEINE Zod-Validierung  
- KEINE Joi- oder Yup-Integration  
- KEINE Optional-Felder  

Alle Validierungen müssen **EXAKT so bleiben**, wie in der ursprünglichen Prompt-Version.

---

# 9. FINAL
Dieses Dokument fixiert alle Implementations- und Runtime-Regeln und schließt NATÜRLICHE Rückfragen von Boltnew vollständig aus.
