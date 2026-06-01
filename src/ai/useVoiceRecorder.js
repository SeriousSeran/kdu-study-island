import React from "react";
import { transcribeAudio } from "./transcribe.js";

/**
 * useVoiceRecorder — settings-aware voice recorder hook.
 *
 * Now accepts `settings` so it can route through the correct STT provider.
 * Falls back gracefully if settings is not passed (backward compatible).
 *
 * @param {(text: string) => void} onText   Called with final transcript.
 * @param {Object} [settings]               App settings (sttProvider etc).
 */
export function useVoiceRecorder(onText, settings = {}) {
  const recorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const [recording, setRecording] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState("");

  const toggleRecording = async () => {
    setVoiceError("");
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("Voice recording is unavailable in this browser. Type the answer instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!blob.size) return;
        try {
          // Use provider-aware transcription
          const text = await transcribeAudio(blob, settings);
          onText(text);
        } catch (err) {
          setVoiceError(`Could not transcribe. Keep typing manually. ${err.message}`);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setRecording(false);
      setVoiceError(`Microphone unavailable. ${err.message}`);
    }
  };

  return { recording, voiceError, toggleRecording };
}
