
# AGI-Shell CMS RefreshRate CoreModule – Spec Prompt v1.0.2-A  
## Fokus: Struktur, Ordnerlogik, Repository-Regeln, Versionskonsistenz

### Zweck
Dieses Spec-Dokument definiert alle strukturellen, organisatorischen und versionsbezogenen Vorgaben, die Boltnew ohne Rückfragen 1:1 erzeugen muss.  
Es ergänzt und präzisiert die Regeln von v1.0.1.

---

## 1. CRITICAL: Modul-Hauptordner (Versionierungsregel)
- Der Modulordner **verwendet ausschließlich MAJOR.MINOR**, niemals PATCH.
- Für dieses Modul lautet der Ordnername **fix**:

```
AGI_Shell_CMS_RefreshRate_CoreModule_v1.0
```

- `"version"` im Manifest darf PATCH-Level enthalten („1.0.2“, „1.0.3“ etc.).
- **Der Ordnername bleibt dennoch unverändert**, damit Reinstall/Upgrade-Prozesse stabil bleiben.

---

## 2. CRITICAL: Repository-Pfad (GitHub)
Das Modul MUSS im Repo `agi-shell-modules` abgelegt werden:

```
agi-shell-modules/
  modules/
    AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
```

Boltnew darf KEINE anderen Root-Level-Ordner erzeugen.

---

## 3. ZIP- und Packaging-Regeln
### ZIP-Root und Repo-Root sind voneinander unabhängig:

**ZIP-Root muss sein:**
```
modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
```

**Repo-Root muss sein:**
```
agi-shell-modules/modules/AGI_Shell_CMS_RefreshRate_CoreModule_v1.0/
```

### Boltnew erzeugt:
- ausschließlich die Ordnerstruktur + Dateien.
- **KEIN ZIP** (Packaging erfolgt extern).

---

## 4. CRITICAL: Strukturfreeze
Alle folgenden Pfade sind fix und dürfen von Boltnew NIE verändert werden:

```
install.module.json
README.md
backend/index.ts
backend/services/*.ts
backend/controllers/*.ts
migrations/postgres/*.sql
ui/*.jsx
```

---

## 5. CRITICAL: Keine Interpretation / Keine Abweichungen
- Boltnew darf KEINE alternativen Ordnernamen vorschlagen.
- Boltnew darf KEINE zusätzlichen Layer einführen (src/, dist/, config/).
- Boltnew darf KEIN TypeScript-Buildsystem anlegen.
- Boltnew darf KEINE Umstrukturierung des Codes vorschlagen.

---

## 6. FINAL
Dieses Dokument definiert ausschließlich Struktur-, Repo-, Versionierungs- und Packaging-Regeln.  
Alle Implementierungsdetails stehen in Spec Prompt v1.0.2-B.
