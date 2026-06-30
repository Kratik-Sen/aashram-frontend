import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import i18n, { detectDeviceLanguage, supportedLanguages } from "../i18n";

const LanguageContext = createContext(null);
const originalText = new WeakMap();
const translatedAttributes = ["placeholder", "title", "aria-label"];

const wordTranslations = {
  a: "ए",
  an: "एन",
  and: "और",
  are: "हैं",
  as: "ऐज़",
  at: "ऐट",
  be: "बी",
  been: "बीन",
  but: "बट",
  by: "बाय",
  can: "कैन",
  for: "फॉर",
  from: "फ्रॉम",
  has: "हैज़",
  have: "हैव",
  in: "इन",
  into: "इन्टू",
  is: "इज़",
  it: "इट",
  its: "इट्स",
  more: "मोर",
  not: "नॉट",
  of: "ऑफ",
  on: "ऑन",
  or: "या",
  the: "द",
  this: "दिस",
  to: "टू",
  with: "विद",
  you: "यू",
  your: "योर",

  active: "एक्टिव",
  admin: "एडमिन",
  amount: "अमाउंट",
  approval: "अप्रूवल",
  approved: "अप्रूव्ड",
  available: "अवेलेबल",
  browser: "ब्राउज़र",
  category: "कैटेगरी",
  check: "चेक",
  checking: "चेकिंग",
  clear: "क्लियर",
  command: "कमांड",
  control: "कंट्रोल",
  created: "क्रिएटेड",
  current: "करंट",
  daal: "दाल",
  dashboard: "डैशबोर्ड",
  data: "डेटा",
  date: "डेट",
  delete: "डिलीट",
  deleted: "डिलीटेड",
  department: "डिपार्टमेंट",
  departments: "डिपार्टमेंट्स",
  description: "डिस्क्रिप्शन",
  donation: "डोनेशन",
  donations: "डोनेशन्स",
  donor: "डोनर",
  edit: "एडिट",
  email: "ईमेल",
  enabled: "इनेबल्ड",
  english: "इंग्लिश",
  expense: "एक्सपेंस",
  filter: "फिल्टर",
  filters: "फिल्टर्स",
  flour: "फ्लोर",
  food: "फूड",
  found: "फाउंड",
  hinglish: "हिंग्लिश",
  inactive: "इनएक्टिव",
  inventory: "इन्वेंटरी",
  issue: "इश्यू",
  issued: "इश्यूड",
  issues: "इश्यूज़",
  item: "आइटम",
  items: "आइटम्स",
  jun: "जून",
  kg: "केजी",
  kitchen: "किचन",
  live: "लाइव",
  load: "लोड",
  loading: "लोडिंग",
  location: "लोकेशन",
  login: "लॉगिन",
  logout: "लॉगआउट",
  low: "लो",
  manager: "मैनेजर",
  management: "मैनेजमेंट",
  month: "मंथ",
  monthly: "मंथली",
  name: "नेम",
  note: "नोट",
  notification: "नोटिफिकेशन",
  notifications: "नोटिफिकेशन्स",
  office: "ऑफिस",
  overview: "ओवरव्यू",
  password: "पासवर्ड",
  pending: "पेंडिंग",
  phone: "फोन",
  purchase: "पर्चेज़",
  purchases: "पर्चेज़",
  quantity: "क्वांटिटी",
  recent: "रीसेंट",
  record: "रिकॉर्ड",
  recorded: "रिकॉर्डेड",
  records: "रिकॉर्ड्स",
  rejected: "रिजेक्टेड",
  report: "रिपोर्ट",
  reports: "रिपोर्ट्स",
  request: "रिक्वेस्ट",
  requested: "रिक्वेस्टेड",
  requests: "रिक्वेस्ट्स",
  role: "रोल",
  save: "सेव",
  search: "सर्च",
  select: "सेलेक्ट",
  session: "सेशन",
  sign: "साइन",
  staff: "स्टाफ",
  status: "स्टेटस",
  stock: "स्टॉक",
  store: "स्टोर",
  supplier: "सप्लायर",
  suppliers: "सप्लायर्स",
  system: "सिस्टम",
  theme: "थीम",
  total: "टोटल",
  updated: "अपडेटेड",
  user: "यूज़र",
  users: "यूज़र्स",
  viewer: "व्यूअर",
  want: "वांट",
  wheat: "व्हीट",

  lorem: "लोरेम",
  ipsum: "इप्सम",
  simply: "सिम्पली",
  dummy: "डमी",
  text: "टेक्स्ट",
  printing: "प्रिंटिंग",
  typesetting: "टाइपसेटिंग",
  industry: "इंडस्ट्री",
  standard: "स्टैंडर्ड",
  ever: "एवर",
  since: "सिंस",
  designers: "डिज़ाइनर्स",
  letraset: "लेट्रासेट",
  james: "जेम्स",
  mosley: "मोस्ली",
  librarian: "लाइब्रेरियन",
  bride: "ब्राइड",
  london: "लंदन",
  took: "टुक",
  cicero: "सिसरो",
  translation: "ट्रांसलेशन",
  scrambled: "स्क्रैम्बल्ड",
  make: "मेक",
  sheets: "शीट्स",
  survived: "सर्वाइव्ड",
  only: "ओनली",
  many: "मैनी",
  decades: "डिकेड्स",
  leap: "लीप",
  electronic: "इलेक्ट्रॉनिक",
  remaining: "रिमेनिंग",
  essentially: "एसेंशियली",
  unchanged: "अनचेंज्ड",
  popularised: "पॉपुलराइज़्ड",
  thanks: "थैंक्स",
  these: "दीज़",
  recently: "रीसेंटली",
  desktop: "डेस्कटॉप",
  publishing: "पब्लिशिंग",
  software: "सॉफ्टवेयर",
  including: "इन्क्लूडिंग",
  versions: "वर्ज़न्स",
  hello: "हेलो",
  ting: "टिंग"
};

const consonants = {
  bh: "भ",
  ch: "च",
  dh: "ध",
  gh: "घ",
  kh: "ख",
  ph: "फ",
  sh: "श",
  th: "थ",
  aa: "आ",
  ai: "ऐ",
  au: "औ",
  ee: "ई",
  oo: "ऊ",
  a: "अ",
  b: "ब",
  c: "क",
  d: "द",
  e: "ए",
  f: "फ",
  g: "ग",
  h: "ह",
  i: "इ",
  j: "ज",
  k: "क",
  l: "ल",
  m: "म",
  n: "न",
  o: "ओ",
  p: "प",
  q: "क",
  r: "र",
  s: "स",
  t: "ट",
  u: "उ",
  v: "व",
  w: "व",
  x: "क्स",
  y: "य",
  z: "ज़"
};

const vowelSigns = {
  a: "",
  aa: "ा",
  ai: "ै",
  au: "ौ",
  e: "े",
  ee: "ी",
  i: "ि",
  o: "ो",
  oo: "ू",
  u: "ु"
};

const vowelLetters = {
  a: "अ",
  aa: "आ",
  ai: "ऐ",
  au: "औ",
  e: "ए",
  ee: "ई",
  i: "इ",
  o: "ओ",
  oo: "ऊ",
  u: "उ"
};

const readPair = (word, index, source) => {
  if (!word || index >= word.length) return "";
  const two = word.slice(index, index + 2).toLowerCase();
  if (source[two] !== undefined) return two;
  return word[index]?.toLowerCase() || "";
};

const transliterateWord = (word) => {
  const lower = word.toLowerCase();
  if (wordTranslations[lower]) return wordTranslations[lower];
  if (/^[A-Z]{2,4}$/.test(word)) {
    return word.toLowerCase().split("").map((letter) => wordTranslations[letter] || consonants[letter] || letter).join("");
  }

  let output = "";
  let index = 0;
  while (index < lower.length) {
    const vowel = readPair(lower, index, vowelLetters);
    if (vowelLetters[vowel]) {
      output += vowelLetters[vowel];
      index += vowel.length;
      continue;
    }

    const consonant = readPair(lower, index, consonants);
    if (!consonants[consonant] || vowelLetters[consonant]) {
      output += word[index];
      index += 1;
      continue;
    }

    const nextIndex = index + consonant.length;
    const nextVowel = readPair(lower, nextIndex, vowelSigns);
    output += consonants[consonant];
    if (vowelSigns[nextVowel] !== undefined) {
      output += vowelSigns[nextVowel];
      index = nextIndex + nextVowel.length;
    } else {
      output += "्";
      index = nextIndex;
    }
  }

  return output.replace(/्$/g, "");
};

const transliterateFreeText = (text) => text
  .replace(/[A-Za-z]+(?:'[A-Za-z]+)?/g, transliterateWord);

const shouldSkipNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest("script, style, code, pre, [data-no-translate]"));
};

const translateValue = (value, language) => {
  const text = String(value || "").trim();
  if (!text) return value;
  if (language === "en") return text;
  if (i18n.exists(text)) return i18n.t(text);
  return transliterateFreeText(text);
};

export const translateContent = (value, language) => translateValue(value, language);

const translateTextNode = (node, language) => {
  if (shouldSkipNode(node)) return;

  const currentValue = node.nodeValue;
  const currentState = originalText.get(node);

  if (!currentState || (currentValue !== currentState.source && currentValue !== currentState.translated)) {
    originalText.set(node, { source: currentValue, translated: currentValue });
  }

  const source = originalText.get(node).source;
  const trimmed = source.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return;

  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const nextValue = `${leading}${translateValue(trimmed, language)}${trailing}`;
  originalText.set(node, { source, translated: nextValue });
  if (node.nodeValue !== nextValue) {
    node.nodeValue = nextValue;
  }
};

const translateElementAttributes = (element, language) => {
  if (element.closest("script, style, code, pre, [data-no-translate]")) return;

  translatedAttributes.forEach((attribute) => {
    const current = element.getAttribute(attribute);
    if (!current) return;

    const originalAttribute = `data-i18n-original-${attribute}`;
    if (!element.hasAttribute(originalAttribute)) {
      element.setAttribute(originalAttribute, current);
    }

    const source = element.getAttribute(originalAttribute);
    const nextValue = translateValue(source, language);
    if (current !== nextValue) {
      element.setAttribute(attribute, nextValue);
    }
  });
};

const translateDom = (root, language) => {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => translateTextNode(node, language));

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(root, language);
  }

  root.querySelectorAll?.("[placeholder], [title], [aria-label]").forEach((element) => {
    translateElementAttributes(element, language);
  });
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => detectDeviceLanguage());
  const scheduledRef = useRef(false);

  const applyTranslations = useCallback(() => {
    if (scheduledRef.current) return;

    scheduledRef.current = true;
    window.requestAnimationFrame(() => {
      translateDom(document.body, language);
      scheduledRef.current = false;
    });
  }, [language]);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("aashram_language", language);
    document.documentElement.lang = language === "hi" ? "hi-IN" : "en";
    applyTranslations();
  }, [applyTranslations, language]);

  useEffect(() => {
    const observer = new MutationObserver(() => applyTranslations());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes
    });

    applyTranslations();
    return () => observer.disconnect();
  }, [applyTranslations]);

  const changeLanguage = useCallback((nextLanguage) => {
    if (supportedLanguages[nextLanguage]) setLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === "hi" ? "en" : "hi"));
  }, []);

  const t = useCallback((key, options) => i18n.t(key, options), []);

  const value = useMemo(
    () => ({ language, changeLanguage, toggleLanguage, supportedLanguages, t }),
    [changeLanguage, language, t, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
