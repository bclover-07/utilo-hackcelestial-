"use client";
import { useSyncExternalStore } from "react";

export const I18N_DICTIONARY = {
  // Navigation & Role Modes
  "Seeker": {
    hi: "अन्वेषक (Seeker)",
    mr: "शोधक (Seeker)",
    es: "Buscador",
    fr: "Demandeur",
    de: "Suchender",
    ar: "الباحث",
    "zh-CN": "需求方",
    ja: "シーカー",
    pt: "Buscador",
    bn: "সন্ধানী",
    gu: "શોધક",
    ta: "தேடுபவர்",
    te: "అన్వేషకుడు",
  },
  "Provider": {
    hi: "प्रदाता (Provider)",
    mr: "प्रदाता (Provider)",
    es: "Proveedor",
    fr: "Fournisseur",
    de: "Anbieter",
    ar: "المزود",
    "zh-CN": "提供方",
    ja: "プロバイダー",
    pt: "Provedor",
    bn: "প্রদানকারী",
    gu: "પ્રદાતા",
    ta: "வழங்குநர்",
    te: "సరఫరాదారు",
  },
  "SEEKER DASHBOARD": {
    hi: "अन्वेषक डैशबोर्ड",
    mr: "शोधक डॅशबोर्ड",
    es: "PANEL DEL BUSCADOR",
    fr: "TABLEAU DE BORD DEMANDEUR",
    de: "SUCHER-DASHBOARD",
    ar: "لوحة تحكم الباحث",
    "zh-CN": "需求方控制台",
    ja: "シーカーダッシュボード",
  },
  "PROVIDER DASHBOARD": {
    hi: "प्रदाता डैशबोर्ड",
    mr: "प्रदाता डॅशबोर्ड",
    es: "PANEL DEL PROVEEDOR",
    fr: "TABLEAU DE BORD FOURNISSEUR",
    de: "ANBIETER-DASHBOARD",
    ar: "لوحة تحكم المزود",
    "zh-CN": "提供方控制台",
    ja: "プロバイダーダッシュボード",
  },
  "OPERATIONS STUDIO": {
    hi: "संचालन स्टूडियो",
    mr: "ऑपरेशन्स स्टुडिओ",
    es: "ESTUDIO DE OPERACIONES",
    fr: "STUDIO D'OPÉRATIONS",
    de: "BETRIEBSSTUDIO",
    ar: "استوديو العمليات",
    "zh-CN": "运营控制中心",
    ja: "オペレーションスタジオ",
  },
  // Feature Nav Items
  "Overview summary": {
    hi: "अवलोकन सारांश",
    mr: "आढावा सारांश",
    es: "Resumen general",
    fr: "Vue d'ensemble",
    de: "Übersicht",
    ar: "ملخص عام",
    "zh-CN": "概览摘要",
    ja: "概要サマリー",
  },
  "Discover resources": {
    hi: "संसाधन खोजें",
    mr: "साधने शोधा",
    es: "Descubrir recursos",
    fr: "Découvrir les ressources",
    de: "Ressourcen entdecken",
    ar: "استكشاف الموارد",
    "zh-CN": "发现资源",
    ja: "リソースを探す",
  },
  "AI Conductor": {
    hi: "एआई कंडक्टर",
    mr: "एआय कंडक्टर",
    es: "Director IA",
    fr: "Chef d'orchestre IA",
    de: "KI-Dirigent",
    ar: "موجه الذكاء الاصطناعي",
    "zh-CN": "AI 编排助手",
    ja: "AIコンダクター",
  },
  "My requirements (RFQs)": {
    hi: "मेरी आवश्यकताएं (RFQs)",
    mr: "माझ्या गरजा (RFQs)",
    es: "Mis requerimientos (RFQ)",
    fr: "Mes besoins (RFQ)",
    de: "Meine Anforderungen (RFQ)",
    ar: "متطلباتي (عروض الأسعار)",
    "zh-CN": "我的采购需求 (RFQ)",
    ja: "リクエスト一覧 (RFQ)",
  },
  "Saved & compare": {
    hi: "सहेजे गए और तुलना",
    mr: "जतन केलेले आणि तुलना",
    es: "Guardados y comparar",
    fr: "Enregistrés et comparer",
    de: "Gespeichert & vergleichen",
    ar: "المحفوظة والمقارنة",
    "zh-CN": "收藏与对比",
    ja: "保存と詳細比較",
  },
  "My listings": {
    hi: "मेरी लिस्टिंग",
    mr: "माझी यादी",
    es: "Mis listados",
    fr: "Mes annonces",
    de: "Meine Angebote",
    ar: "قوائمي",
    "zh-CN": "我的房源/设备",
    ja: "マイリスティング",
  },
  "Availability & Calendar": {
    hi: "उपलब्धता और कैलेंडर",
    mr: "उपलब्धता आणि कॅलेंडर",
    es: "Disponibilidad y calendario",
    fr: "Disponibilité et calendrier",
    de: "Verfügbarkeit & Kalender",
    ar: "التوفر والتقويم",
    "zh-CN": "档期与日历",
    ja: "空き状況とカレンダー",
  },
  "Smart pricing advisor": {
    hi: "स्मार्ट मूल्य निर्धारण सलाहकार",
    mr: "स्मार्ट दर सल्लागार",
    es: "Asesor inteligente de precios",
    fr: "Conseiller de tarification intelligent",
    de: "Intelligenter Preisberater",
    ar: "مستشار التسعير الذكي",
    "zh-CN": "智能定价顾问",
    ja: "スマート価格アドバイザー",
  },
  "Demand outlook & trends": {
    hi: "मांग दृष्टिकोण और रुझान",
    mr: "मागणी अंदाज आणि ट्रेंड",
    es: "Perspectiva de demanda y tendencias",
    fr: "Perspectives de la demande",
    de: "Nachfrageprognose",
    ar: "توقعات الطلب والاتجاهات",
    "zh-CN": "需求预测与趋势",
    ja: "需要予測とトレンド",
  },
  "Provider performance": {
    hi: "प्रदाता प्रदर्शन",
    mr: "प्रदाता कामगिरी",
    es: "Rendimiento del proveedor",
    fr: "Performance du fournisseur",
    de: "Anbieterleistung",
    ar: "أداء المزود",
    "zh-CN": "供应商绩效",
    ja: "プロバイダー実績",
  },
  "Agent Studio": {
    hi: "एजेंट स्टूडियो",
    mr: "एजंट स्टुडिओ",
    es: "Estudio de Agentes",
    fr: "Studio d'Agents",
    de: "Agenten-Studio",
    ar: "استوديو الوكلاء",
    "zh-CN": "智能体工作室",
    ja: "エージェントスタジオ",
  },
  "Active quotes & chat": {
    hi: "सक्रिय उद्धरण और बातचीत",
    mr: "सक्रिय कोट्स आणि चॅट",
    es: "Cotizaciones activas y chat",
    fr: "Devis actifs et discussion",
    de: "Aktive Angebote & Chat",
    ar: "عروض الأسعار والمحادثة",
    "zh-CN": "议价与沟通",
    ja: "見積りとチャット",
  },
  "Incoming RFQs & Chat": {
    hi: "आने वाले RFQ और बातचीत",
    mr: "येणारे RFQ आणि चॅट",
    es: "RFQ entrantes y chat",
    fr: "Demandes entrantes et chat",
    de: "Eingehende RFQ & Chat",
    ar: "عروض الأسعار الواردة",
    "zh-CN": "收到的需求与沟通",
    ja: "受信リクエストとチャット",
  },
  "Confirmed bookings": {
    hi: "पुष्टि की गई बुकिंग",
    mr: "निश्चित बुकिंग",
    es: "Reservas confirmadas",
    fr: "Réservations confirmées",
    de: "Bestätigte Buchungen",
    ar: "الحجوزات المؤكدة",
    "zh-CN": "已确认预订",
    ja: "確定した予約",
  },
  "My bookings & calendar": {
    hi: "मेरी बुकिंग और कैलेंडर",
    mr: "माझी बुकिंग आणि कॅलेंडर",
    es: "Mis reservas y calendario",
    fr: "Mes réservations et calendrier",
    de: "Meine Buchungen & Kalender",
    ar: "حجوزاتي والتقويم",
    "zh-CN": "我的预订与日历",
    ja: "マイスケジュール",
  },
  "Reviews & reputation": {
    hi: "समीक्षा और प्रतिष्ठा",
    mr: "पुनरावलोकने आणि प्रतिष्ठा",
    es: "Reseñas y reputación",
    fr: "Avis et réputation",
    de: "Bewertungen & Reputation",
    ar: "التقييمات والسمعة",
    "zh-CN": "评价与信誉",
    ja: "レビューと評価",
  },
  "Reviews given & received": {
    hi: "दी गई और प्राप्त समीक्षाएं",
    mr: "दिलेली आणि मिळालेली पुनरावलोकने",
    es: "Reseñas dadas y recibidas",
    fr: "Avis donnés et reçus",
    de: "Gegebene & erhaltene Bewertungen",
    ar: "التقييمات المعطاة والمستلمة",
    "zh-CN": "我的全部评价",
    ja: "送受信レビュー",
  },
  "Disputes & claims": {
    hi: "विवाद और दावे",
    mr: "वाद आणि दावे",
    es: "Disputas y reclamaciones",
    fr: "Litiges et réclamations",
    de: "Streitfälle & Ansprüche",
    ar: "النزاعات والمطالبات",
    "zh-CN": "争议与维权",
    ja: "異議申し立て",
  },
  "Disputes & mediation": {
    hi: "विवाद और मध्यस्थता",
    mr: "वाद आणि मध्यस्थता",
    es: "Disputas y mediación",
    fr: "Litiges et médiation",
    de: "Streitfälle & Schlichtung",
    ar: "النزاعات والوساطة",
    "zh-CN": "争议与调解",
    ja: "紛争調停",
  },
  "Live market pulse": {
    hi: "लाइव मार्केट पल्स",
    mr: "थेट बाजार पल्स",
    es: "Pulso del mercado en vivo",
    fr: "Pouls du marché en direct",
    de: "Live-Marktpuls",
    ar: "نبض السوق المباشر",
    "zh-CN": "实时市场动态",
    ja: "リアルタイム市場指標",
  },
  "Market analytics": {
    hi: "बाजार विश्लेषण",
    mr: "बाजार विश्लेषण",
    es: "Analítica del mercado",
    fr: "Analyses de marché",
    de: "Marktanalysen",
    ar: "تحليلات السوق",
    "zh-CN": "市场深度分析",
    ja: "マーケット分析",
  },
  "Alerts & updates": {
    hi: "सूचनाएं और अपडेट",
    mr: "सूचना आणि अद्यतने",
    es: "Alertas y actualizaciones",
    fr: "Alertes et mises à jour",
    de: "Benachrichtigungen",
    ar: "التنبيهات والتحديثات",
    "zh-CN": "消息通知",
    ja: "通知と更新",
  },
  "Business profile & KYC": {
    hi: "व्यावसायिक प्रोफ़ाइल और केवाईसी",
    mr: "व्यवसाय प्रोफाइल आणि केवायसी",
    es: "Perfil comercial y KYC",
    fr: "Profil d'entreprise et KYC",
    de: "Unternehmensprofil & KYC",
    ar: "ملف العمل والتحقق",
    "zh-CN": "企业资料与KYC认证",
    ja: "企業プロフィールと認証",
  },
  "Log out": {
    hi: "लॉग आउट",
    mr: "बाहेर पडा",
    es: "Cerrar sesión",
    fr: "Déconnexion",
    de: "Abmelden",
    ar: "تسجيل الخروج",
    "zh-CN": "退出登录",
    ja: "ログアウト",
  },
};

function readCurrentLang() {
  if (typeof window === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]+)/);
  const value = match?.[1]?.split("/").at(-1) || localStorage.getItem("utlio_lang");
  return value || "en";
}

function subscribe(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("utlio:language", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("utlio:language", listener);
    window.removeEventListener("storage", listener);
  };
}

export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, readCurrentLang, () => "en");

  const t = (key) => {
    if (!key) return "";
    const entry = I18N_DICTIONARY[key];
    if (entry && entry[lang]) {
      return entry[lang];
    }
    return key;
  };

  return { t, lang };
}
