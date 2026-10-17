"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-provider";
import { UiIcon } from "./ui-icon";

type SpeechResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

const speechLanguage = { en: "en-IN", hi: "hi-IN", pa: "pa-IN" } as const;
const copy = {
  en: {
    start: "Speak to type",
    stop: "Stop voice typing",
    listening: "Listening… speak now. Tap again to stop.",
    unavailable: "Voice typing is unavailable in this browser. Please type instead.",
    permission: "Microphone access was denied. Allow it in browser settings or type instead.",
    noSpeech: "No speech heard. Tap the mic and try again.",
    network: "Voice recognition could not connect. Check your internet or type instead.",
    failed: "Voice typing did not work. Please try again or type instead.",
    full: "This field is full. Shorten the text before speaking again.",
  },
  hi: {
    start: "बोलकर लिखें",
    stop: "बोलकर लिखना बंद करें",
    listening: "सुन रहे हैं… बोलें। रोकने के लिए फिर दबाएँ।",
    unavailable: "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है। कृपया टाइप करें।",
    permission: "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग जाँचें या टाइप करें।",
    noSpeech: "आवाज़ नहीं सुनाई दी। माइक दबाकर फिर बोलें।",
    network: "आवाज़ पहचानने का कनेक्शन नहीं हुआ। इंटरनेट जाँचें या टाइप करें।",
    failed: "बोलकर लिखना नहीं हो पाया। फिर कोशिश करें या टाइप करें।",
    full: "यह जगह भर गई है। दोबारा बोलने से पहले कुछ शब्द हटाएँ।",
  },
  pa: {
    start: "ਬੋਲ ਕੇ ਲਿਖੋ",
    stop: "ਬੋਲ ਕੇ ਲਿਖਣਾ ਬੰਦ ਕਰੋ",
    listening: "ਸੁਣ ਰਹੇ ਹਾਂ… ਬੋਲੋ। ਰੋਕਣ ਲਈ ਫਿਰ ਦਬਾਓ।",
    unavailable: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਬੋਲ ਕੇ ਲਿਖਣਾ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਟਾਈਪ ਕਰੋ।",
    permission: "ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗ ਵੇਖੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।",
    noSpeech: "ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ। ਮਾਈਕ ਦਬਾ ਕੇ ਫਿਰ ਬੋਲੋ।",
    network: "ਆਵਾਜ਼ ਪਛਾਣ ਦਾ ਕਨੈਕਸ਼ਨ ਨਹੀਂ ਬਣਿਆ। ਇੰਟਰਨੈੱਟ ਵੇਖੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।",
    failed: "ਬੋਲ ਕੇ ਲਿਖਣਾ ਨਹੀਂ ਹੋਇਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।",
    full: "ਇਹ ਥਾਂ ਭਰ ਗਈ ਹੈ। ਦੁਬਾਰਾ ਬੋਲਣ ਤੋਂ ਪਹਿਲਾਂ ਕੁਝ ਸ਼ਬਦ ਹਟਾਓ।",
  },
};

export function VoiceInput({ targetId }: { targetId: string }) {
  const { language } = useLanguage();
  const labels = copy[language];
  const recognition = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const browser = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    setSupported(Boolean(browser.SpeechRecognition ?? browser.webkitSpeechRecognition));
    return () => {
      recognition.current?.abort();
      recognition.current = null;
    };
  }, [language]);

  function toggle() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const browser = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const SpeechRecognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage(labels.unavailable);
      return;
    }

    const instance = new SpeechRecognition();
    recognition.current = instance;
    instance.lang = speechLanguage[language];
    instance.continuous = false;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onstart = () => setListening(true);
    instance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (!transcript) return;
      const field = document.getElementById(targetId);
      if (!(field instanceof HTMLTextAreaElement) || field.disabled) return;
      const separator = field.value.trim() ? " " : "";
      const remaining = field.maxLength - field.value.length - separator.length;
      if (remaining <= 0) {
        setMessage(labels.full);
        return;
      }
      field.value += separator + transcript.slice(0, remaining);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.focus();
      setMessage(transcript.length > remaining ? labels.full : null);
    };
    instance.onerror = (event) => {
      if (event.error === "aborted") return;
      setMessage(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? labels.permission
          : event.error === "no-speech"
            ? labels.noSpeech
            : event.error === "network"
              ? labels.network
              : labels.failed,
      );
    };
    instance.onend = () => {
      if (recognition.current === instance) recognition.current = null;
      setListening(false);
    };
    setMessage(null);
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setMessage(labels.failed);
    }
  }

  return (
    <div className="voice-input">
      <button
        type="button"
        className={`voice-button secondary${listening ? " voice-button-listening" : ""}`}
        onClick={toggle}
        disabled={supported === false}
        aria-controls={targetId}
        aria-pressed={listening}
      >
        <UiIcon name="microphone" size={17} />
        {listening ? labels.stop : labels.start}
      </button>
      {listening && <span className="voice-status" role="status">{labels.listening}</span>}
      {supported === false && <span className="voice-status">{labels.unavailable}</span>}
      {message && <span className="voice-error" role="alert">{message}</span>}
    </div>
  );
}
