"use client";
import { useEffect } from "react";

export default function GoogleTranslateScript() {
  useEffect(() => {
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function () {
        if (window.google?.translate?.TranslateElement) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                autoDisplay: false,
                includedLanguages: "en,hi,mr,es,fr,de,ar,zh-CN,ja,pt,bn,gu,ta,te",
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              },
              "google_translate_element"
            );
          } catch (e) {
            console.error("Google Translate initialization error:", e);
          }
        }
      };
    }

    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        opacity: 0.01,
        pointerEvents: "none",
        zIndex: -9999,
      }}
      aria-hidden="true"
    />
  );
}

