# Boltnew Spec – Strict Module Root Placement for RefreshRate CoreModule v3.2
Version: 2.0  
Status: FINAL – MUST be followed 1:1

## 0. GLOBAL CONTEXT

- Ziel: Alle Dateien des **RefreshRate CoreModule v3.2** müssen in einem einzigen Modul-Hauptordner liegen.  
- Dieser Modul-Hauptordner ist (innerhalb des aktuellen Projekts/Repos):

`modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/`

- Es dürfen **keine** Moduldateien im Projekt-Root oder in anderen, nicht explizit freigegebenen Verzeichnissen liegen.

---

## 1. ABSOLUTE ROOT-REGEL (RULE_0 – NON-NEGOTIABLE)

Boltnew MUSS folgende Hauptregel strikt einhalten:

> **RULE_0:**  
> Alle vom RefreshRate CoreModule v3.2 erzeugten Dateien und Ordner müssen sich unterhalb von  
> `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/` befinden.  
>  
> **Es ist strikt verboten, Moduldateien außerhalb dieses Modulordners zu erzeugen oder zu belassen.**

---

## 2. ERLAUBTE VERZEICHNISSTRUKTUR

Die **einzige** gültige Struktur für dieses Modul (aus Sicht von Boltnew) ist:

```text
modules/
  AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/
    supabase/
      migrations/
      functions/
    src/
      lib/
      components/
    config/
    manifest/
      manifest.json
    docs/
      AGI_Shell_CMS_RefreshRate_CoreModule_v3.2_FINAL.md
    env/
      .env.example
```

### 2.1 Pflichtordner

Innerhalb von `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/` müssen mindestens existieren:

- `supabase/migrations/`
- `supabase/functions/`
- `src/lib/`
- `src/components/`
- `manifest/`
- `env/`

---

## 3. ZU ORDNENDE / UMZUZIEHENDE DATEIEN

Wenn im aktuellen Projekt bereits Dateien existieren (z. B. durch frühere Läufe), MUSS Boltnew diese konsequent verschieben:

### 3.1 Frontend-Dateien

**Ist-Zustand (Beispiel):**

```text
src/lib/boltDatabaseClient.ts
src/components/SystemStatePanel.tsx
src/components/RefreshPolicyForm.tsx
```

**Soll-Zustand:**

```text
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/src/lib/boltDatabaseClient.ts
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/src/components/SystemStatePanel.tsx
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/src/components/RefreshPolicyForm.tsx
```

### 3.2 Supabase-Dateien

**Ist-Zustand (Beispiel):**

```text
supabase/functions/system-state/index.ts
supabase/functions/refresh-policy/index.ts
supabase/migrations/20251124000001_refresh_core_schema.sql
```

**Soll-Zustand:**

```text
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/supabase/functions/system-state/index.ts
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/supabase/functions/refresh-policy/index.ts
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/supabase/migrations/20251124000001_refresh_core_schema.sql
```

### 3.3 Manifest- und Doku-Dateien

```text
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/manifest/manifest.json
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/docs/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2_FINAL.md
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/env/.env.example
```

Boltnew MUSS sicherstellen, dass diese Dateien **existieren** und sich in genau diesen Pfaden befinden.

---

## 4. VERBOTENE PFAD- UND ORDNERVERWENDUNG

Boltnew DARF für dieses Modul **keine** der folgenden Pfade als Zielort nutzen:

- Projekt-Root: `./`
- Direkt unter `src/` (ohne Modulpfad)
- Direkt unter `supabase/` (ohne Modulpfad)
- Irgendein anderer Modulordner (z. B. für Navigation-Module)
- Irgendein globaler `modules/`-Unterordner, der NICHT  
  `AGI_Shell_CMS_RefreshRate_CoreModule_v3.2` heißt

Konkret VERBOTEN sind u. a.:

```text
src/boltDatabaseClient.ts
src/lib/boltDatabaseClient.ts        # außerhalb des Modulordners
src/components/SystemStatePanel.tsx  # außerhalb des Modulordners
supabase/functions/system-state/index.ts
supabase/migrations/20251124000001_refresh_core_schema.sql
AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/ (direkt im Root)
```

---

## 5. HANDLING BESTEHENDER DATEIEN (REFRESH / RE-RUN)

Wenn Boltnew den Prompt in einem Projekt ausführt, in dem bereits Dateien existieren:

1. Boltnew MUSS zuerst prüfen, ob Moduldateien im Projekt-Root oder in nicht erlaubten Pfaden liegen.
2. Falls ja, MUSS Boltnew:
   - diese Dateien in die oben definierten Soll-Pfade unter  
     `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/` verschieben/neu generieren,
   - sicherstellen, dass in den verbotenen Pfaden keine verwaisten Modulkopien verbleiben.
3. Es darf nach Abschluss **nur eine** gültige Kopie pro Datei geben:  
   die im Modulordner.

---

## 6. BEZUG ZUM AGI-SHELL-MODULES REPO

Dieser Prompt ist so formuliert, dass er sowohl im lokalen Projekt als auch im späteren `agi-shell-modules` Repository funktioniert.

Wenn der Projekt-Root aktuell z. B. so aussieht:

```text
/tmp/cc-agent/60588811/project/
```

dann MUSS Boltnew davon ausgehen, dass der Modulordner relativ dazu ist:

```text
/tmp/cc-agent/60588811/project/modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/
```

Im späteren GitHub-Repo `agi-shell-modules` gilt analog:

```text
agi-shell-modules/modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/
```

---

## 7. DO & DON'T FÜR BOLTNEW

### 7.1 DO

- DO lege **alle** Moduldateien nur unterhalb von  
  `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/` an.
- DO verschiebe bestehende Moduldateien konsequent in diesen Modulordner.
- DO halte exakt die oben spezifizierte Struktur ein.
- DO generiere keine zusätzliche Ordner-Hierarchie oberhalb des Modulordners.

### 7.2 DON'T

- DON'T lege Moduldateien direkt im Projekt-Root an.
- DON'T lasse alte Kopien in `src/` oder `supabase/` außerhalb des Modulpfads liegen.
- DON'T benutze einen anderen Modulordnernamen.
- DON'T lege weitere Module in diesem Prompt an (nur RefreshRate CoreModule v3.2).

---

## 8. FINAL BUILD INSTRUCTION (für Boltnew)

> **INSTRUCTION:**  
>  
> 1. Lies diese Spec vollständig.  
> 2. Erzeuge bzw. reorganisiere ALLE Dateien des  
>    **AGI_Shell_CMS_RefreshRate_CoreModule v3.2** so,  
>    dass sie **ausschließlich** unterhalb von  
>    `modules/AGI_Shell_CMS_RefreshRate_CoreModule_v3.2/` liegen.  
> 3. Stelle sicher, dass im Projekt-Root, unter `src/` oder `supabase/`  
>    **keine weitere Kopie** irgendeiner RefreshRate-CoreModule-Datei übrig bleibt.  
> 4. Halte dich strikt an alle Pfadvorgaben, DO & DON'T-Regeln und die  
>    Verbotliste in Abschnitt 4.
