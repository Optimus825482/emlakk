# Plan: Advanced Voice Mode Enhancement

## User Goal

Enhance voice chat with Silence Detection (auto-send), Auto-Mute (while AI speaks), and Realtime Preview.

## Analysis

- **Current Stack:** Next.js, React, Web Speech API (`VoiceAssistant` class), Tailwind CSS.
- **Key Files:**
  - Logic: `src/lib/ai/voice-assistant.ts`
  - UI: `src/components/admin/DemirAIWidget.tsx`
  - Visual: `src/components/admin/VoiceVisualizer.tsx`

## Implementation Steps

### Phase 1: Core Logic Update (`src/lib/ai/voice-assistant.ts`)

1.  **Silence Detection (VAD):**
    - Add a `silenceTimeout` property.
    - usage: On every `onresult` (final or interim), clear the timeout. Set a new timeout (e.g., 2000ms).
    - If timeout triggers -> `stopListening()` and emit a specific "SilenceDetected" or allow the final result to flow through.
2.  **Realtime Preview:**
    - Expose `interimResults` properly via a new callback `onInterimResult(text: string)`.
3.  **Auto-Mute Control:**
    - Ensure `speak()` method stops recognition before playing audio.
    - Ensure it restarts recognition after audio ends (if continuous mode is on).

### Phase 2: UI Integration (`src/components/admin/DemirAIWidget.tsx`)

1.  **State Management:**
    - Add `interimTranscript` state.
    - Add `isAutoSending` state.
2.  **Realtime Preview UI:**
    - Display `interimTranscript` in a floating overlay or ghost text inside the input.
3.  **Auto-Send Logic:**
    - When `VoiceAssistant` signals "Final Result" + "Silence" -> Automatically trigger the send function.
    - Clear input after send.
4.  **Audio Handling:**
    - Update `handleAiResponse`: Stop listening (mute mic).
    - On `speechEnd`: Resume listening (unmute mic).

## Verification Strategy

- **Manual Test:** Speak -> Pause -> Verify auto-send.
- **Manual Test:** Listen to AI -> Verify mic icon is off/muted.
- **Manual Test:** Speak -> Verify text appears in real-time.

---

**Approval Required:**
Shall we proceed with this implementation plan?
