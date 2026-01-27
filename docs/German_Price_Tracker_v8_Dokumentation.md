# German Price Tracker v8 - ScrapingBee
## Dokumentation für Einrichtung und Funktionsweise

---

## 1. Übersicht

Der **German Price Tracker v8** ist ein n8n-Workflow zur automatischen Preisüberwachung von Produkten in deutschen Online-Shops. Der Workflow nutzt **ScrapingBee** für das Web-Scraping und **OpenAI GPT-4** für die intelligente Preisextraktion aus Screenshots.

### Unterstützte Shops

| Shop | Methode | Status |
|------|---------|--------|
| Preispiraten | Apify Crawler | ✅ Funktioniert |
| Lohmeier | ScrapingBee + Screenshot | ✅ Funktioniert |
| Motorland | ScrapingBee + Screenshot | ✅ Funktioniert |
| Agrieuro | ScrapingBee + Screenshot | ✅ Funktioniert |
| Simon-Profi | ScrapingBee + Screenshot | ✅ Funktioniert |

### Workflow-Ablauf

```
Google Sheets (EAN-Liste)
        ↓
    Filter (EAN vorhanden)
        ↓
    Loop (Pro Produkt)
        ↓
    Set Data (EAN + Produktname)
        ↓
    ┌─────────────────────────────────────────────────────┐
    │  Parallel: 5 Shop-Crawler                           │
    │  • Preispiraten (Apify)                            │
    │  • Lohmeier (ScrapingBee → Screenshot → GPT-4)     │
    │  • Motorland (ScrapingBee → Screenshot → GPT-4)    │
    │  • Agrieuro (ScrapingBee → Screenshot → GPT-4)     │
    │  • Simon-Profi (ScrapingBee → Screenshot → GPT-4)  │
    └─────────────────────────────────────────────────────┘
        ↓
    Merge All (Ergebnisse zusammenführen)
        ↓
    Process AI Results (Preise verarbeiten)
        ↓
    Prepare Sheet (Daten formatieren)
        ↓
    Save to Google Sheets
```

---

## 2. Voraussetzungen

### 2.1 Accounts & API Keys

| Service | Zweck | Link |
|---------|-------|------|
| **ScrapingBee** | Web-Scraping mit JS-Rendering | https://www.scrapingbee.com/ |
| **OpenAI** | GPT-4 Vision für Preisextraktion | https://platform.openai.com/ |
| **Apify** | Crawler für Preispiraten | https://apify.com/ |
| **Google Cloud** | Google Sheets API | https://console.cloud.google.com/ |

### 2.2 ScrapingBee Kosten

- **Free Tier:** 1.000 Credits/Monat
- **Screenshot:** ~25 Credits pro Request
- **Empfehlung:** Freelancer Plan ($49/Monat) für regelmäßige Nutzung

### 2.3 OpenAI Kosten

- **GPT-4O-LATEST:** ~$0.01-0.03 pro Bildanalyse
- **Empfehlung:** Budget-Limit in OpenAI Dashboard setzen

---

## 3. Einrichtung in n8n

### 3.1 Credentials anlegen

#### ScrapingBee API
1. Gehe zu **Settings → Credentials → Add Credential**
2. Wähle **HTTP Query Auth**
3. Konfiguration:
   - **Name:** `ScrapingBee API`
   - **Parameter Name:** `api_key`
   - **Parameter Value:** `DEIN_SCRAPINGBEE_API_KEY`

#### OpenAI API
1. Gehe zu **Settings → Credentials → Add Credential**
2. Wähle **OpenAI API**
3. Konfiguration:
   - **Name:** `OpenAi account`
   - **API Key:** `DEIN_OPENAI_API_KEY`

#### Apify API
1. Gehe zu **Settings → Credentials → Add Credential**
2. Wähle **HTTP Header Auth**
3. Konfiguration:
   - **Name:** `Apify API`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer DEIN_APIFY_TOKEN`

#### Google Sheets
1. Gehe zu **Settings → Credentials → Add Credential**
2. Wähle **Google Sheets OAuth2 API**
3. Folge dem OAuth-Flow zur Autorisierung

---

## 4. Shop-Konfiguration

### 4.1 Lohmeier (ScrapingBee)

**HTTP Request Node - Parameter:**

| Parameter | Wert |
|-----------|------|
| Method | GET |
| URL | `https://app.scrapingbee.com/api/v1/` |
| Authentication | Query Auth → ScrapingBee API |

**Query Parameters:**

| Name | Value |
|------|-------|
| url | `=https://www.lohmeier-shop.de/search?search={{ encodeURIComponent($json.produktname) }}+{{ $json.ean }}` |
| render_js | true |
| premium_proxy | true |
| wait | 8000 |
| screenshot | true |
| screenshot_full_page | false |
| block_ads | true |

**Options:**
- Response Format: **File**
- Timeout: 90000

---

### 4.2 Motorland (ScrapingBee)

**Query Parameters:**

| Name | Value |
|------|-------|
| url | `=https://www.motorland.de/search?q={{ encodeURIComponent($json.produktname) }}` |
| render_js | true |
| premium_proxy | true |
| wait | 10000 |
| screenshot | true |
| screenshot_full_page | false |
| block_ads | true |
| window_width | 1920 |
| window_height | 1080 |

**Options:**
- Response Format: **File**

---

### 4.3 Agrieuro (ScrapingBee)

**Query Parameters:**

| Name | Value |
|------|-------|
| url | `=https://www.agrieuro.de/suche.php?search={{ encodeURIComponent($json.produktname) }}` |
| render_js | true |
| premium_proxy | true |
| stealth_proxy | true |
| wait | 8000 |
| screenshot | true |
| screenshot_full_page | false |
| block_ads | true |
| window_width | 1920 |
| window_height | 1080 |
| js_scenario | `{"instructions":[{"wait":5000},{"scroll_y":800},{"wait":3000}]}` |

**Hinweis:** `stealth_proxy: true` ist wichtig für Cloudflare-Bypass!

**Options:**
- Response Format: **File**

---

### 4.4 Simon-Profi (ScrapingBee)

**Query Parameters:**

| Name | Value |
|------|-------|
| url | `=https://www.simon-profi-technik.de/catalogsearch/result/?q={{ encodeURIComponent($json.produktname) }}` |
| render_js | true |
| premium_proxy | true |
| wait | 8000 |
| screenshot | true |
| screenshot_full_page | false |
| block_ads | true |
| window_width | 1920 |
| window_height | 1080 |
| js_scenario | `{"instructions":[{"wait":5000},{"scroll_y":400},{"wait":3000}]}` |

**Options:**
- Response Format: **File**

---

## 5. AI-Nodes Konfiguration

### 5.1 OpenAI Analyze Image Node

Für jeden Shop (Lohmeier, Motorland, Agrieuro, Simon-Profi):

**Node-Einstellungen:**

| Feld | Wert |
|------|------|
| Resource | Image |
| Operation | Analyze Image |
| Model | **CHATGPT-4O-LATEST** |
| Input Type | Binary File(s) |
| Input Data Field Name | `data` |
| Simplify Output | ✅ Aktiviert |

**Text Input (Prompt) - Beispiel für Lohmeier:**

```
Analysiere diesen Screenshot von Lohmeier.shop.

GESUCHTES PRODUKT: {{ $('Set Data').item.json.produktname }}

WICHTIG - PREISE LESEN:
- Der AKTUELLE Preis steht in GROSSER SCHRIFT
- Durchgestrichene Preise IGNORIEREN
- Lies den Preis EXAKT ab - nicht raten!

Antworte NUR mit JSON:
{"gefunden": true/false, "shop": "Lohmeier", "preis": XXX.XX, "produkt_gefunden": "Name", "notiz": "..."}

WARNUNG: Erfinde KEINE Preise! Wenn unsicher, antworte mit preis: null
```

---

## 6. Wichtige Hinweise

### 6.1 Response Format

**KRITISCH:** Die ScrapingBee HTTP Request Nodes müssen auf **Response Format: File** eingestellt sein, damit die Screenshots als Binary-Daten an die OpenAI Analyze Image Nodes übergeben werden können.

### 6.2 Model-Auswahl

| Model | Genauigkeit | Kosten |
|-------|-------------|--------|
| GPT-4O-MINI | ⚠️ Niedrig (halluziniert Preise) | Günstig |
| GPT-4O | ⚠️ Mittel | Mittel |
| **CHATGPT-4O-LATEST** | ✅ Hoch | Höher |

**Empfehlung:** Immer **CHATGPT-4O-LATEST** für Preisextraktion verwenden!

### 6.3 js_scenario für Cookie-Banner

Wenn Cookie-Banner die Preise verdecken, mehr scrollen:

```json
{"instructions":[{"wait":5000},{"scroll_y":800},{"wait":3000}]}
```

Oder Cookie-Button klicken:

```json
{"instructions":[
  {"wait":3000},
  {"click":".cookie-accept"},
  {"wait":1000},
  {"scroll_y":400},
  {"wait":2000}
]}
```

---

## 7. Fehlerbehebung

### Problem: "Binary file not found"
**Lösung:** Response Format auf "File" ändern

### Problem: "Unsupported image format"
**Lösung:** Response Format auf "File" ändern (nicht Text)

### Problem: Screenshot zeigt nur Header
**Lösung:** js_scenario mit scroll_y hinzufügen

### Problem: Timeout bei ScrapingBee
**Lösung:**
- wait-Parameter erhöhen (z.B. 15000)
- Timeout in Options erhöhen (z.B. 120000)

### Problem: 403 Forbidden (Cloudflare)
**Lösung:** `stealth_proxy: true` hinzufügen

### Problem: Falsche Preise (Halluzinationen)
**Lösung:**
- Model auf CHATGPT-4O-LATEST ändern
- Prompt präzisieren mit "EXAKT ablesen, nicht raten"

---

## 8. Google Sheets Struktur

### EAN-Liste (Input)

| Spalte | Beschreibung |
|--------|--------------|
| EAN | Produkt-EAN |
| Produktname | z.B. "MS 261 C-M Motorsäge 40cm" |

### Preisvergleich (Output)

| Spalte | Beschreibung |
|--------|--------------|
| Datum | Abfragedatum |
| EAN | Produkt-EAN |
| Produktname | Produktbezeichnung |
| Lohmeier | Preis bei Lohmeier |
| Motorland | Preis bei Motorland |
| Agrieuro | Preis bei Agrieuro |
| Simon | Preis bei Simon-Profi |
| Guenstigster_Shop | Shop mit niedrigstem Preis |
| Guenstigster_Preis | Niedrigster Preis |
| Anzahl_Shops | Anzahl Shops mit Ergebnis |

---

## 9. Wartung & Updates

### Regelmäßige Prüfungen

- [ ] ScrapingBee Credits prüfen
- [ ] OpenAI API-Kosten überwachen
- [ ] Shop-URLs auf Änderungen prüfen
- [ ] Screenshot-Qualität bei Fehlern prüfen

### Bei Shop-Änderungen

1. URL-Struktur prüfen
2. js_scenario anpassen (falls Layout geändert)
3. Prompt anpassen (falls Preisdarstellung geändert)

---

## 10. Kontakt & Support

- **n8n Community:** https://community.n8n.io/
- **ScrapingBee Docs:** https://www.scrapingbee.com/documentation/
- **OpenAI API Docs:** https://platform.openai.com/docs/

---

*Dokumentation erstellt: Januar 2026*
*Workflow Version: v8 - ScrapingBee*
