"use client";
import { useEffect, useState, useRef, useSyncExternalStore, useMemo } from "react";
import { Globe, ChevronDown, Check, Search, X } from "lucide-react";

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

function readLanguage() {
  if (typeof window === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]+)/);
  const value = match?.[1]?.split("/").at(-1) || localStorage.getItem("utlio_lang");
  return LANGUAGES.some((language) => language.code === value) ? value : "en";
}

function subscribeLanguage(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("utlio:language", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("utlio:language", listener);
    window.removeEventListener("storage", listener);
  };
}

function persistLanguage(langCode) {
  if (typeof window === "undefined") return;
  localStorage.setItem("utlio_lang", langCode);
  const hostname = window.location.hostname;

  if (langCode === "en") {
    // Clear Google translate cookies
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
    if (hostname.includes(".")) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
    }
  } else {
    // Set for root path and auto/en variants
    document.cookie = `googtrans=/en/${langCode}; path=/; SameSite=Lax`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname}; SameSite=Lax`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; SameSite=Lax`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${hostname}; SameSite=Lax`;
    if (hostname.includes(".")) {
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${hostname}; SameSite=Lax`;
    }
  }
  window.dispatchEvent(new Event("utlio:language"));
}

function triggerGoogleTranslateCombo(langCode) {
  if (typeof document === "undefined") return false;
  const select = document.querySelector(".goog-te-combo");
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  return false;
}

export default function LanguageSwitcher({ compact = false, showLabel = true }) {
  const selectedLang = useSyncExternalStore(subscribeLanguage, readLanguage, () => "en");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-sync Google Translate widget on initial load if user already picked a language
  useEffect(() => {
    const saved = localStorage.getItem("utlio_lang");
    if (saved && saved !== "en") {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (triggerGoogleTranslateCombo(saved) || tries > 25) {
          clearInterval(interval);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const changeLanguage = (langCode) => {
    setIsOpen(false);
    persistLanguage(langCode);

    // Attempt to directly trigger Google Translate widget
    const triggered = triggerGoogleTranslateCombo(langCode);
    if (!triggered) {
      // Poll briefly for widget to be ready
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (triggerGoogleTranslateCombo(langCode) || attempts > 20) {
          clearInterval(timer);
          if (attempts > 20 && !document.querySelector(".goog-te-combo")) {
            window.location.reload();
          }
        }
      }, 100);
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const current = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="language-switcher-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`language-switcher-btn ${compact ? "is-compact" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select website language. Currently ${current.name}`}
        aria-expanded={isOpen}
      >
        <span className="lang-globe">
          <Globe size={15} />
        </span>
        <span className="lang-flag">{current.flag}</span>
        {(!compact || showLabel) && <span className="lang-name">{current.name}</span>}
        <ChevronDown size={13} className={`lang-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown-menu" role="menu">
          <div className="language-dropdown-header">
            <div className="language-dropdown-title-row">
              <span>Change Language</span>
              <button
                type="button"
                className="language-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close language selector"
              >
                <X size={14} />
              </button>
            </div>
            <small>Translate everything into your local language</small>
            <div className="language-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="language-search-input"
              />
            </div>
          </div>

          <div className="language-options-list">
            {filteredLanguages.length === 0 ? (
              <div className="language-no-results">No languages found</div>
            ) : (
              filteredLanguages.map((lang) => {
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
