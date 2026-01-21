# AI Visibility Checker - Dokumentation

## Einrichtung und Funktionsweise

**Version:** 2.0
**Erstellt:** Januar 2026
**Plattform:** n8n Workflow Automation

---

## 1. Übersicht

### 1.1 Was macht dieser Workflow?

Der **AI Visibility Checker** ist ein automatisierter Workflow, der:

1. Einen Prompt über ein Web-Formular entgegennimmt
2. Diesen Prompt parallel an drei KI-Plattformen sendet:
   - **ChatGPT** (OpenAI GPT-4o)
   - **Google Gemini** (Gemini 1.5 Pro)
   - **Perplexity** (Sonar Pro mit Web-Suche)
3. Die Antworten und Quellenangaben sammelt
4. Einen formatierten HTML-Report per E-Mail versendet

### 1.2 Anwendungsfälle

- **SEO/Marketing:** Prüfen, wie verschiedene KI-Systeme eine Marke oder ein Thema darstellen
- **Content-Strategie:** Vergleichen, welche Quellen von KI-Systemen zitiert werden
- **Wettbewerbsanalyse:** Sichtbarkeit im Vergleich zu Mitbewerbern prüfen
- **Recherche:** Schneller Überblick über Antworten verschiedener KI-Systeme

---

## 2. Voraussetzungen

### 2.1 Benötigte API-Zugänge

| Plattform | API | Kosten |
|-----------|-----|--------|
| OpenAI | OpenAI API | Pay-per-use |
| Google | Google AI Studio / Vertex AI | Free Tier verfügbar |
| Perplexity | Perplexity API | Pay-per-use |
| Gmail | Gmail OAuth2 | Kostenlos |

### 2.2 API-Keys beschaffen

#### OpenAI API Key
1. Gehe zu https://platform.openai.com
2. Registriere dich oder melde dich an
3. Navigiere zu "API Keys"
4. Erstelle einen neuen API Key
5. Kopiere den Key (wird nur einmal angezeigt!)

#### Google AI API Key
1. Gehe zu https://aistudio.google.com
2. Melde dich mit deinem Google-Konto an
3. Klicke auf "Get API Key"
4. Erstelle einen neuen API Key

#### Perplexity API Key
1. Gehe zu https://www.perplexity.ai
2. Melde dich an und gehe zu den Einstellungen
3. Navigiere zu "API"
4. Erstelle einen neuen API Key

#### Gmail OAuth2
1. In n8n: Gehe zu Credentials
2. Wähle "Gmail OAuth2"
3. Folge dem OAuth-Flow und autorisiere n8n

---

## 3. Installation in n8n

### 3.1 Workflow importieren

1. Öffne n8n
2. Klicke auf **"Add workflow"** → **"Import from JSON"**
3. Füge den Workflow-JSON ein
4. Klicke **"Import"**

### 3.2 Credentials einrichten

Nach dem Import müssen die Credentials konfiguriert werden:

#### Schritt 1: OpenAI API
1. Gehe zu **Settings** → **Credentials**
2. Klicke **"Add Credential"**
3. Wähle **"OpenAI API"**
4. Gib deinen API Key ein
5. Speichern

#### Schritt 2: Google AI API
1. Klicke **"Add Credential"**
2. Wähle **"Google AI"** oder erstelle ein **"Header Auth"** Credential
3. Für Header Auth:
   - Name: `x-goog-api-key`
   - Value: Dein Google AI API Key
4. Speichern

#### Schritt 3: Perplexity API
1. Klicke **"Add Credential"**
2. Wähle **"Header Auth"**
3. Konfiguration:
   - Name: `Authorization`
   - Value: `Bearer DEIN_PERPLEXITY_API_KEY`
4. Speichern

#### Schritt 4: Gmail OAuth2
1. Klicke **"Add Credential"**
2. Wähle **"Gmail OAuth2"**
3. Folge dem OAuth-Autorisierungsflow
4. Erlaube n8n Zugriff auf dein Gmail-Konto

### 3.3 Credentials den Nodes zuweisen

1. Öffne jeden API-Node im Workflow
2. Wähle unter "Credentials" das entsprechende Credential aus
3. Speichere den Workflow

---

## 4. Workflow-Architektur

### 4.1 Übersicht der Nodes

```
┌─────────────────────────────┐
│  📝 Prompt Eingabe Formular │  ← Trigger (Form)
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  🔧 Prompt vorbereiten      │  ← Quellenanforderung hinzufügen
└──────────────┬──────────────┘
               │
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          │
┌────────┐ ┌────────┐ ┌───────────┐  │
│ChatGPT │ │ Gemini │ │Perplexity │  │ ← Parallele API-Calls
│  API   │ │  API   │ │   API     │  │
└───┬────┘ └───┬────┘ └─────┬─────┘  │
    │          │            │        │
    ▼          ▼            ▼        │
┌────────┐ ┌────────┐ ┌───────────┐  │
│ChatGPT │ │ Gemini │ │Perplexity │  │ ← Ergebnisse strukturieren
│Ergebnis│ │Ergebnis│ │ Ergebnis  │  │
└───┬────┘ └───┬────┘ └─────┬─────┘  │
    │          │            │        │
    └──────────┴────────────┘        │
               │                     │
               ▼                     │
┌─────────────────────────────┐      │
│  🔀 Ergebnisse zusammenführen│ ← Merge (Append)
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  📊 Antworten verarbeiten   │  ← Code Node (Report erstellen)
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  📧 Report per Gmail senden │  ← E-Mail versenden
└─────────────────────────────┘
```

### 4.2 Node-Beschreibungen

| Node | Typ | Funktion |
|------|-----|----------|
| Prompt Eingabe Formular | Form Trigger | Nimmt Prompt, E-Mail und Thema entgegen |
| Prompt vorbereiten | Set | Erweitert den Prompt um Quellenanforderung |
| ChatGPT API | HTTP Request | Sendet Anfrage an OpenAI API |
| Gemini API | HTTP Request | Sendet Anfrage an Google AI API |
| Perplexity API | HTTP Request | Sendet Anfrage an Perplexity API |
| *Ergebnis Nodes | Set | Strukturieren die API-Antworten |
| Ergebnisse zusammenführen | Merge | Kombiniert alle Antworten |
| Antworten verarbeiten | Code | Erstellt HTML-Report |
| Report per Gmail senden | Gmail | Versendet den Report |

---

## 5. Benutzung

### 5.1 Workflow aktivieren

1. Öffne den Workflow in n8n
2. Klicke auf **"Inactive"** (oben rechts)
3. Schalte auf **"Active"**
4. Der Workflow ist jetzt aktiv und wartet auf Eingaben

### 5.2 Formular aufrufen

1. Klicke auf den **"Prompt Eingabe Formular"** Node
2. Kopiere die **Webhook URL** (Production)
3. Öffne diese URL im Browser
4. Das Eingabeformular erscheint

### 5.3 Eingabefelder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| Prompt | Ja | Die Frage/Anfrage an die KI-Systeme |
| E-Mail | Ja | Empfänger-Adresse für den Report |
| Marke/Thema | Nein | Optional: Für die Report-Überschrift |

### 5.4 Beispiel-Prompts

**SEO-Analyse:**
```
Was sind die besten SEO-Strategien für E-Commerce-Websites in 2026?
```

**Marken-Sichtbarkeit:**
```
Was sind die führenden Anbieter für ergonomische Bürostühle in Deutschland?
```

**Produkt-Recherche:**
```
Welche Faktoren sollte man beim Kauf eines höhenverstellbaren Schreibtischs beachten?
```

---

## 6. Report-Struktur

### 6.1 Report-Inhalte

Der per E-Mail versendete Report enthält:

1. **Header:** Titel und Zeitstempel
2. **Analyse-Details:** Prompt, Thema, Zeitpunkt
3. **Ergebnisse pro Plattform:**
   - Status (Erfolg/Fehler)
   - Vollständige Antwort
   - Extrahierte Quellenangaben (Tabelle)
4. **Footer:** Zusammenfassung

### 6.2 Quellenextraktion

- **Perplexity:** Liefert native Web-Citations (echte URLs)
- **ChatGPT/Gemini:** URLs werden aus dem Antworttext extrahiert

---

## 7. Anpassungen

### 7.1 Modelle ändern

#### ChatGPT Modell ändern:
1. Öffne den **"ChatGPT API"** Node
2. Ändere im JSON Body `"model": "gpt-4o"` zu:
   - `"gpt-4-turbo"` - Schneller, günstiger
   - `"gpt-4o-mini"` - Noch günstiger

#### Gemini Modell ändern:
1. Öffne den **"Gemini API"** Node
2. Ändere in der URL `gemini-1.5-pro` zu:
   - `gemini-1.5-flash` - Schneller, günstiger
   - `gemini-2.0-flash-exp` - Neuestes Modell

### 7.2 Prompt-Template anpassen

1. Öffne den **"Prompt vorbereiten"** Node
2. Bearbeite das Feld `enhancedPrompt`
3. Passe die Quellenanforderung nach Bedarf an

### 7.3 Report-Design ändern

1. Öffne den **"Antworten verarbeiten"** Node
2. Bearbeite die HTML-Templates in den Funktionen:
   - `generatePlatformSection()` - Plattform-Boxen
   - `htmlReport` - Gesamt-Layout

---

## 8. Fehlerbehebung

### 8.1 Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| 401 Unauthorized | Falscher API Key | API Key überprüfen |
| 404 Not Found | Falsches Modell | Modellname korrigieren |
| 429 Rate Limit | Zu viele Anfragen | Warten oder Limit erhöhen |
| Keine Daten verfügbar | Datenstruktur-Problem | Code-Node überprüfen |

### 8.2 API-spezifische Fehler

#### OpenAI:
- `max_tokens` → `max_completion_tokens` für neuere Modelle
- Rate Limits beachten

#### Gemini:
- Modellname muss exakt stimmen (z.B. `gemini-1.5-pro`)
- API-Version prüfen (`v1beta`)

#### Perplexity:
- Authorization Header mit `Bearer ` Prefix
- `return_citations: true` für Quellenangaben

### 8.3 Debug-Tipps

1. **Node einzeln testen:** Klicke "Execute step" bei jedem Node
2. **Output prüfen:** Schaue dir die JSON-Struktur im Output an
3. **Console.log:** Füge Debug-Ausgaben im Code-Node hinzu

---

## 9. Kosten

### 9.1 Geschätzte Kosten pro Anfrage

| Plattform | Geschätzte Kosten |
|-----------|-------------------|
| ChatGPT (GPT-4o) | ~$0.01-0.03 |
| Gemini 1.5 Pro | ~$0.00-0.01 |
| Perplexity | ~$0.01-0.02 |
| **Gesamt** | **~$0.02-0.06** |

*Kosten variieren je nach Antwortlänge*

### 9.2 Kosten optimieren

- Günstigere Modelle verwenden (gpt-4o-mini, gemini-1.5-flash)
- Token-Limits reduzieren
- Nur benötigte Plattformen aktivieren

---

## 10. Sicherheit

### 10.1 API Keys schützen

- API Keys niemals im Code hardcoden
- n8n Credentials verwenden
- Regelmäßig Keys rotieren

### 10.2 Formular absichern

1. Öffne den Form Trigger Node
2. Aktiviere **"Authentication"**
3. Wähle **"Basic Auth"**
4. Setze Benutzername und Passwort

---

## 11. Support

### 11.1 Ressourcen

- **n8n Dokumentation:** https://docs.n8n.io
- **OpenAI API:** https://platform.openai.com/docs
- **Google AI:** https://ai.google.dev/docs
- **Perplexity API:** https://docs.perplexity.ai

### 11.2 Community

- n8n Community Forum: https://community.n8n.io
- n8n Discord Server

---

**Dokumentation erstellt für AI Visibility Checker Workflow v2.0**
