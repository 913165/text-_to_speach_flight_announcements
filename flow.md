# 🔄 Spring AI Voice Studio — Request & Response Flow

---

## 📐 High-Level Architecture

```
Browser (Thymeleaf + JS)
        │
        │  HTTP POST (JSON)
        ▼
VoiceController  (Spring MVC)
        │
        ├──► VoiceService              → OpenAI TTS API
        │
        └──► RailwayAnnouncementService → OpenAI Chat API (GPT)
                                        → OpenAI TTS API
```

---

## 1️⃣ Text to Speech Flow

**Tab:** 🔊 Text to Speech

```
User types text + selects voice
        │
        │  click "Generate Voice"
        ▼
[Browser — app.js]
  POST /generate-audio-json
  Body: { "text": "Hello!", "voice": "nova" }
        │
        ▼
[VoiceController.generateAudioJson()]
  → validates: text must not be blank
  → resolves voice (defaults to "alloy" if missing)
        │
        ▼
[VoiceService.generateSpeech(text, voice)]
  → builds OpenAiAudioSpeechOptions:
      model  = gpt-4o-mini-tts
      voice  = nova
      format = MP3
      speed  = 1.0
  → creates TextToSpeechPrompt(text, options)
  → calls OpenAiAudioSpeechModel.call(prompt)
        │
        ▼
[OpenAI TTS API]
  ← returns raw MP3 bytes
        │
        ▼
[VoiceService]
  ← byte[] audioBytes
        │
        ▼
[VoiceController]
  → Base64.encode(audioBytes)
  → returns VoiceResponse { audioBase64, success: true }
        │
        ▼
[Browser — app.js]
  → decodes Base64 → Uint8Array → Blob (audio/mpeg)
  → URL.createObjectURL(blob)
  → sets <audio>.src = objectURL
  → audio.play()
  → sets download link href = objectURL
```

**Response JSON:**
```json
{
  "audioBase64": "SUQzBAAAAAAAI...",
  "success": true,
  "error": null
}
```

---

## 2️⃣ Flight Announcement Flow

**Tab:** ✈️ Flight Announcement

```
User fills form:
  Flight Number, Airline, Origin, Destination,
  Gate, Terminal, Status, Delay Minutes
        │
        │  click "✈️ Generate Announcement"
        ▼
[Browser — app.js]
  POST /generate-railway-announcement
  Body: {
    "trainNumber":        "AI-202",
    "trainName":          "Air India",
    "sourceStation":      "Mumbai (BOM)",
    "destinationStation": "Delhi (DEL)",
    "platformNumber":     "Gate 14B",
    "terminal":           "Terminal 2",
    "status":             "Boarding",
    "delayMinutes":       ""
  }
        │
        ▼
[VoiceController.generateRailwayAnnouncement()]
  → validates: trainNumber must not be blank
        │
        ▼
[RailwayAnnouncementService.generateAnnouncement(request)]

  ── STEP 1: GPT Text Generation ──────────────────────────
  → builds prompt template:
      "Generate a professional airport PA announcement…
       Flight Number: {trainNumber}
       Airline: {trainName}
       From: {sourceStation}
       To: {destinationStation}
       Gate: {platformNumber}
       Terminal: {terminal}
       Status: {status}
       Delay Minutes: {delayMinutes}"
  → PromptTemplate.create(vars)
  → ChatModel.call(prompt)
        │
        ▼
  [OpenAI Chat API — gpt-4o-mini]
  ← returns generated announcement text:
      "Ladies and gentlemen, Air India flight AI-202
       from Mumbai to New Delhi is now boarding at
       Gate 14B, Terminal 2…"

  ── STEP 2: Text to Speech ───────────────────────────────
  → builds OpenAiAudioSpeechOptions:
      model  = gpt-4o-mini-tts
      voice  = alloy
      format = MP3
      speed  = 1.0
  → TextToSpeechPrompt(announcementText, options)
  → OpenAiAudioSpeechModel.call(ttsPrompt)
        │
        ▼
  [OpenAI TTS API — gpt-4o-mini-tts]
  ← returns raw MP3 bytes
        │
        ▼
[RailwayAnnouncementService]
  ← returns String[] { announcementText, base64Audio }
        │
        ▼
[VoiceController]
  → returns RailwayAnnouncementResponse {
      announcementText, audioBase64, success: true
    }
        │
        ▼
[Browser — app.js]
  → displays announcementText in response box
  → decodes Base64 → Blob → audio.play()
  → adds entry to Announcement History panel
```

**Response JSON:**
```json
{
  "announcementText": "Ladies and gentlemen, Air India flight AI-202…",
  "audioBase64": "SUQzBAAAAAAAI...",
  "success": true,
  "error": null
}
```

---

## 3️⃣ Live Simulation Flow

**Tab:** 📡 Live Simulation

```
User clicks "▶ Start Live Simulation"
        │
        ▼
[Browser — app.js]
  liveIndex = 0
  liveRunning = true
  calls runNextAnnouncement()

  ┌─────────────────────────────────────────────────────┐
  │              SEQUENTIAL LOOP (no setInterval)        │
  │                                                     │
  │  fireAnnouncement(msgIndex)                         │
  │      │                                              │
  │      │  POST /generate-audio-json                   │
  │      │  Body: { text: LIVE_MESSAGES[i], voice: "alloy" }
  │      │                                              │
  │      ▼                                              │
  │  [VoiceController.generateAudioJson()]              │
  │      → VoiceService.generateSpeech(text, "alloy")  │
  │      → OpenAI TTS API                               │
  │      ← MP3 bytes → Base64                           │
  │      ← { audioBase64, success: true }               │
  │      │                                              │
  │      ▼                                              │
  │  [Browser]                                          │
  │      → decode Base64 → Blob                         │
  │      → liveAudioPlayer.src = objectURL              │
  │      → liveAudioPlayer.play()                       │
  │      → appendLiveItem(num, text)  ← add to history  │
  │      │                                              │
  │      │  audio.onended fires ◄── waits for playback  │
  │      │  to fully complete                           │
  │      ▼                                              │
  │  scheduleNext()                                     │
  │      → 3-second pause (progress bar countdown)      │
  │      → setTimeout(runNextAnnouncement, 3000)        │
  │      │                                              │
  │      ▼                                              │
  │  runNextAnnouncement()                              │
  │      → liveIndex++                                  │
  │      → if liveIndex < 5 → back to fireAnnouncement  │
  │      → if liveIndex = 5 → finishLiveSimulation()   │
  └─────────────────────────────────────────────────────┘
        │
        ▼
  finishLiveSimulation()
    → liveDot = green ✅
    → "All 5 announcements completed!"
    → Stop button hidden, Start button shown
```

**Stop at any time:**
```
User clicks "⏹ Stop"
  → liveRunning = false
  → clearTimeout(livePauseTimeout)
  → clearInterval(liveCountdownId)
  → liveAudioPlayer.pause()
  → liveAudioPlayer.src = ''
  → UI reset to idle state
```

**5 Pre-written Messages:**
```
[0] AI-202 Air India      Mumbai → New Delhi   Boarding Gate 14B T2
[1] 6E-345 IndiGo         Delhi  → Bengaluru   Delayed 30 min
[2] UK-985 Vistara        Chennai → Mumbai     Boarding Gate 22 T1
[3] SG-117 SpiceJet       Kolkata → Hyderabad  Gate changed → 5C
[4] IX-763 Air Asia India Pune   → Goa         Cancelled
```

---

## 🔁 Shared Flow: Base64 Audio Decode (Browser)

```
API Response: { "audioBase64": "SUQzBA..." }
        │
        ▼
atob(base64)              → binary string
new Uint8Array(binary)    → raw bytes
new Blob([bytes], { type: 'audio/mpeg' })  → audio blob
URL.createObjectURL(blob) → blob://... URL
<audio>.src = blobURL     → browser loads MP3
<audio>.play()            → plays audio
<a>.href = blobURL        → download link
```

---

## 🗂️ DTO Flow Summary

```
Browser JSON  ──►  DTO (Java)  ──►  Service  ──►  OpenAI  ──►  DTO  ──►  Browser JSON

VoiceRequest          VoiceService          OpenAI TTS       VoiceResponse
{ text, voice }  →   generateSpeech()   →  MP3 bytes    →   { audioBase64, success }

RailwayAnnouncementRequest                               RailwayAnnouncementResponse
{ trainNumber,         RailwayAnnouncementService        { announcementText,
  trainName,      →    generateAnnouncement()  →           audioBase64,
  sourceStation,       Step1: GPT → text                   success }
  destinationStation,  Step2: TTS → MP3
  platformNumber,
  terminal,
  status,
  delayMinutes }
```

---

## 🌐 Endpoint Summary

```
GET  /                              → index.html (Thymeleaf)
POST /generate-audio-json           → VoiceController → VoiceService → TTS
POST /generate-audio                → VoiceController → VoiceService → TTS (raw MP3)
POST /generate-railway-announcement → VoiceController → RailwayAnnouncementService → GPT + TTS
```

---

*Spring AI Voice Studio — Flow Documentation · April 2026*

