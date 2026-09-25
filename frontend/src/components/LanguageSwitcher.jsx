"use client";
import { useEffect, useState, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇦🇪" },
  { code: "zh-CN", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
];

export default function LanguageSwitcher({ compact = false }) {
  const [selectedLang, setSelectedLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Check cookie or localStorage for pre-selected language
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };

    const googtrans = getCookie("googtrans");
    if (googtrans) {
      const parts = googtrans.split("/");
      const lang = parts.at(-1);
      if (lang && LANGUAGES.some((l) => l.code === lang)) {
        setSelectedLang(lang);
      }
    } else {
      const saved = localStorage.getItem("utlio_lang");
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setSelectedLang(saved);
      }
    }

    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    localStorage.setItem("utlio_lang", langCode);

    // Set Google Translate cookie
    const hostname = window.location.hostname;
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (hostname !== "localhost") {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
    }

    // Attempt to trigger the native Google Translate select box if initialized
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    } else {
      // Reload so Google Translate picks up the cookie
      window.location.reload();
    }
  };

  const current = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="language-switcher-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`language-switcher-btn ${compact ? "is-compact" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select website language"
        aria-expanded={isOpen}
      >
        <span className="lang-globe">
          <Globe size={16} />
        </span>
        <span className="lang-flag">{current.flag}</span>
        {!compact && <span className="lang-name">{current.name}</span>}
        <ChevronDown size={14} className={`lang-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown-menu" role="menu">
          <div className="language-dropdown-header">
            <span>Translate Website</span>
            <small>Powered by Google Translate</small>
          </div>
          <div className="language-options-list">
            {LANGUAGES.map((lang) => {
              const active = lang.code === selectedLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`language-option-item ${active ? "active" : ""}`}
                  onClick={() => changeLanguage(lang.code)}
                  role="menuitem"
                >
                  <span className="option-flag">{lang.flag}</span>
                  <div className="option-text">
                    <strong className="option-name">{lang.name}</strong>
                    <span className="option-native">{lang.nativeName}</span>
                  </div>
                  {active && <Check size={16} className="option-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
