export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "or", name: "ଓଡ଼ିଆ (Oriya)" },
  { code: "as", name: "অসমীয়া (Assamese)" },
  { code: "ur", name: "اردو (Urdu)" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

type StringsMap = {
  [key in LanguageCode]: {
    pageTitle: string;
    reportTitle: string;
    reportDesc: string;
    categoryWater: string;
    categoryDamage: string;
    categoryDisease: string;
    categoryMissing: string;
    categoryOther: string;
    notesLabel: string;
    notesPlaceholder: string;
    photoLabel: string;
    voiceBtn: string;
    voiceRecording: string;
    submitBtn: string;
    submitting: string;
    successToast: string;
    offlineToast: string;
    voiceConfirmTitle: string;
    voiceConfirmDesc: string;
    confirmBtn: string;
    cancelBtn: string;
  };
};

export const STRINGS: StringsMap = {
  en: {
    pageTitle: "Tree Information",
    reportTitle: "Report an Incident",
    reportDesc: "Help us take care of this tree. What did you notice?",
    categoryWater: "Needs Water",
    categoryDamage: "Physical Damage",
    categoryDisease: "Looks Diseased",
    categoryMissing: "Tree Missing",
    categoryOther: "Other",
    notesLabel: "Additional Notes",
    notesPlaceholder: "Any details?",
    photoLabel: "Add a Photo",
    voiceBtn: "Use Voice",
    voiceRecording: "Recording... Tap to stop",
    submitBtn: "Submit Report",
    submitting: "Submitting...",
    successToast: "Reported — thank you",
    offlineToast: "Saved offline. Will sync when connected.",
    voiceConfirmTitle: "Confirm Details",
    voiceConfirmDesc: "Here is what we understood from your voice note:",
    confirmBtn: "Looks Good, Submit",
    cancelBtn: "Edit / Cancel",
  },
  // Basic fallbacks for the demo, in a real app these would be translated
  hi: {
    pageTitle: "पेड़ की जानकारी",
    reportTitle: "रिपोर्ट करें",
    reportDesc: "इस पेड़ की देखभाल में हमारी मदद करें। आपने क्या देखा?",
    categoryWater: "पानी चाहिए",
    categoryDamage: "क्षतिग्रस्त",
    categoryDisease: "बीमार लग रहा है",
    categoryMissing: "पेड़ गायब है",
    categoryOther: "अन्य",
    notesLabel: "अतिरिक्त जानकारी",
    notesPlaceholder: "कोई विवरण?",
    photoLabel: "फोटो जोड़ें",
    voiceBtn: "बोलकर बताएं",
    voiceRecording: "रिकॉर्ड हो रहा है... रोकने के लिए टैप करें",
    submitBtn: "रिपोर्ट जमा करें",
    submitting: "जमा हो रहा है...",
    successToast: "रिपोर्ट दर्ज हो गई — धन्यवाद",
    offlineToast: "ऑफ़लाइन सहेजा गया। कनेक्ट होने पर सिंक हो जाएगा।",
    voiceConfirmTitle: "विवरण की पुष्टि करें",
    voiceConfirmDesc: "हम आपके वॉयस नोट से यह समझ पाए हैं:",
    confirmBtn: "सही है, जमा करें",
    cancelBtn: "संपादित करें / रद्द करें",
  },
  mr: { pageTitle: "झाडाची माहिती", reportTitle: "अहवाल द्या", reportDesc: "या झाडाची काळजी घेण्यास आम्हाला मदत करा.", categoryWater: "पाण्याची गरज", categoryDamage: "नुकसान", categoryDisease: "आजार", categoryMissing: "झाड गहाळ", categoryOther: "इतर", notesLabel: "नोंद", notesPlaceholder: "तपशील?", photoLabel: "फोटो", voiceBtn: "आवाज", voiceRecording: "रेकॉर्डिंग...", submitBtn: "सबमिट करा", submitting: "सबमिट करत आहे...", successToast: "अहवाल दिला — धन्यवाद", offlineToast: "ऑफ़लाइन जतन केले.", voiceConfirmTitle: "तपशील निश्चित करा", voiceConfirmDesc: "आम्हाला हे समजले:", confirmBtn: "ठीक आहे", cancelBtn: "रद्द करा" },
  kn: { pageTitle: "ಮರದ ಮಾಹಿತಿ", reportTitle: "ವರದಿ ಮಾಡಿ", reportDesc: "ಈ ಮರವನ್ನು ನೋಡಿಕೊಳ್ಳಲು ನಮಗೆ ಸಹಾಯ ಮಾಡಿ.", categoryWater: "ನೀರು ಬೇಕು", categoryDamage: "ಹಾನಿ", categoryDisease: "ರೋಗ", categoryMissing: "ಮರ ನಾಪತ್ತೆ", categoryOther: "ಇತರೆ", notesLabel: "ಟಿಪ್ಪಣಿ", notesPlaceholder: "ವಿವರ?", photoLabel: "ಫೋಟೋ", voiceBtn: "ಧ್ವನಿ", voiceRecording: "ರೆಕಾರ್ಡಿಂಗ್...", submitBtn: "ಸಲ್ಲಿಸಿ", submitting: "ಸಲ್ಲಿಸುತ್ತಿದೆ...", successToast: "ವರದಿಯಾಗಿದೆ — ಧನ್ಯವಾದಗಳು", offlineToast: "ಆಫ್‌ಲೈನ್ ಉಳಿಸಲಾಗಿದೆ.", voiceConfirmTitle: "ವಿವರ ಖಚಿತಪಡಿಸಿ", voiceConfirmDesc: "ನಾವು ಅರ್ಥಮಾಡಿಕೊಂಡದ್ದು:", confirmBtn: "ಸರಿ", cancelBtn: "ರದ್ದುಮಾಡಿ" },
  ta: { pageTitle: "மரத்தின் தகவல்", reportTitle: "புகாரளி", reportDesc: "இந்த மரத்தை பராமரிக்க உதவுங்கள்.", categoryWater: "தண்ணீர் தேவை", categoryDamage: "சேதம்", categoryDisease: "நோய்", categoryMissing: "மரம் காணவில்லை", categoryOther: "மற்றவை", notesLabel: "குறிப்புகள்", notesPlaceholder: "விவரம்?", photoLabel: "படம்", voiceBtn: "குரல்", voiceRecording: "பதிவாகிறது...", submitBtn: "சமர்ப்பி", submitting: "சமர்ப்பிக்கிறது...", successToast: "புகாரளிக்கப்பட்டது — நன்றி", offlineToast: "ஆஃப்லைனில் சேமிக்கப்பட்டது.", voiceConfirmTitle: "உறுதிப்படுத்து", voiceConfirmDesc: "நாங்கள் புரிந்து கொண்டது:", confirmBtn: "சரி", cancelBtn: "ரத்து" },
  te: { pageTitle: "చెట్టు సమాచారం", reportTitle: "రిపోర్ట్ చేయండి", reportDesc: "ఈ చెట్టును చూసుకోవడంలో సహాయం చేయండి.", categoryWater: "నీరు కావాలి", categoryDamage: "నష్టం", categoryDisease: "వ్యాధి", categoryMissing: "చెట్టు లేదు", categoryOther: "ఇతర", notesLabel: "గమనికలు", notesPlaceholder: "వివరాలు?", photoLabel: "ఫోటో", voiceBtn: "వాయిస్", voiceRecording: "రికార్డ్ అవుతోంది...", submitBtn: "సమర్పించు", submitting: "సమర్పిస్తోంది...", successToast: "రిపోర్ట్ చేయబడింది — ధన్యవాదాలు", offlineToast: "ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది.", voiceConfirmTitle: "నిర్ధారించండి", voiceConfirmDesc: "మేము అర్థం చేసుకున్నది:", confirmBtn: "సరే", cancelBtn: "రద్దు" },
  bn: { pageTitle: "গাছের তথ্য", reportTitle: "রিপোর্ট করুন", reportDesc: "এই গাছটির যত্ন নিতে আমাদের সাহায্য করুন।", categoryWater: "জল প্রয়োজন", categoryDamage: "ক্ষতি", categoryDisease: "রোগ", categoryMissing: "গাছ নেই", categoryOther: "অন্যান্য", notesLabel: "নোট", notesPlaceholder: "বিস্তারিত?", photoLabel: "ছবি", voiceBtn: "ভয়েস", voiceRecording: "রেকর্ড হচ্ছে...", submitBtn: "জমা দিন", submitting: "জমা হচ্ছে...", successToast: "রিপোর্ট করা হয়েছে — ধন্যবাদ", offlineToast: "অফলাইনে সংরক্ষিত।", voiceConfirmTitle: "নিশ্চিত করুন", voiceConfirmDesc: "আমরা যা বুঝতে পেরেছি:", confirmBtn: "ঠিক আছে", cancelBtn: "বাতিল করুন" },
  gu: { pageTitle: "વૃક્ષની માહિતી", reportTitle: "રિપોર્ટ કરો", reportDesc: "આ વૃક્ષની સંભાળ લેવામાં મદદ કરો.", categoryWater: "પાણી જોઈએ", categoryDamage: "નુકસાન", categoryDisease: "રોગ", categoryMissing: "વૃક્ષ ગાયબ", categoryOther: "અન્ય", notesLabel: "નોંધ", notesPlaceholder: "વિગત?", photoLabel: "ફોટો", voiceBtn: "અવાજ", voiceRecording: "રેકોર્ડિંગ...", submitBtn: "સબમિટ કરો", submitting: "સબમિટ થઈ રહ્યું છે...", successToast: "રિપોર્ટ નોંધાયેલ — આભાર", offlineToast: "ઑફલાઇન સાચવેલ.", voiceConfirmTitle: "ખાતરી કરો", voiceConfirmDesc: "અમે જે સમજ્યા:", confirmBtn: "બરાબર", cancelBtn: "રદ કરો" },
  ml: { pageTitle: "മരത്തിന്റെ വിവരം", reportTitle: "റിപ്പോർട്ട് ചെയ്യുക", reportDesc: "ഈ മരത്തെ സംരക്ഷിക്കാൻ സഹായിക്കുക.", categoryWater: "വെള്ളം വേണം", categoryDamage: "നാശം", categoryDisease: "രോഗം", categoryMissing: "മരം കാണാനില്ല", categoryOther: "മറ്റ്", notesLabel: "കുറിപ്പുകൾ", notesPlaceholder: "വിശദാംശങ്ങൾ?", photoLabel: "ചിത്രം", voiceBtn: "ശബ്ദം", voiceRecording: "റെക്കോർഡിംഗ്...", submitBtn: "സമർപ്പിക്കുക", submitting: "സമർപ്പിക്കുന്നു...", successToast: "റിപ്പോർട്ട് ചെയ്തു — നന്ദി", offlineToast: "ഓഫ്‌ലൈനിൽ സംരക്ഷിച്ചു.", voiceConfirmTitle: "ഉറപ്പാക്കുക", voiceConfirmDesc: "ഞങ്ങൾ മനസ്സിലാക്കിയത്:", confirmBtn: "ശരി", cancelBtn: "റദ്ദാക്കുക" },
  pa: { pageTitle: "ਰੁੱਖ ਦੀ ਜਾਣਕਾਰੀ", reportTitle: "ਰਿਪੋਰਟ ਕਰੋ", reportDesc: "ਇਸ ਰੁੱਖ ਦੀ ਦੇਖਭਾਲ ਵਿੱਚ ਸਾਡੀ ਮਦਦ ਕਰੋ।", categoryWater: "ਪਾਣੀ ਦੀ ਲੋੜ", categoryDamage: "ਨੁਕਸਾਨ", categoryDisease: "ਬਿਮਾਰੀ", categoryMissing: "ਰੁੱਖ ਗਾਇਬ", categoryOther: "ਹੋਰ", notesLabel: "ਨੋਟਸ", notesPlaceholder: "ਵੇਰਵਾ?", photoLabel: "ਫੋਟੋ", voiceBtn: "ਆਵਾਜ਼", voiceRecording: "ਰਿਕਾਰਡ ਹੋ ਰਿਹਾ ਹੈ...", submitBtn: "ਜਮ੍ਹਾਂ ਕਰੋ", submitting: "ਜਮ੍ਹਾਂ ਹੋ ਰਿਹਾ ਹੈ...", successToast: "ਰਿਪੋਰਟ ਕੀਤੀ ਗਈ — ਧੰਨਵਾਦ", offlineToast: "ਆਫਲਾਈਨ ਸੇਵ ਕੀਤਾ।", voiceConfirmTitle: "ਪੁਸ਼ਟੀ ਕਰੋ", voiceConfirmDesc: "ਅਸੀਂ ਕੀ ਸਮਝੇ:", confirmBtn: "ਠੀਕ ਹੈ", cancelBtn: "ਰੱਦ ਕਰੋ" },
  or: { pageTitle: "ଗଛ ସୂଚନା", reportTitle: "ରିପୋର୍ଟ କରନ୍ତୁ", reportDesc: "ଏହି ଗଛର ଯତ୍ନ ନେବାରେ ସାହାଯ୍ୟ କରନ୍ତୁ।", categoryWater: "ପାଣି ଦରକାର", categoryDamage: "କ୍ଷତି", categoryDisease: "ରୋଗ", categoryMissing: "ଗଛ ନାହିଁ", categoryOther: "ଅନ୍ୟ", notesLabel: "ନୋଟ୍", notesPlaceholder: "ବିବରଣୀ?", photoLabel: "ଫଟୋ", voiceBtn: "ସ୍ୱର", voiceRecording: "ରେକର୍ଡିଂ...", submitBtn: "ଦାଖଲ କରନ୍ତୁ", submitting: "ଦାଖଲ ହେଉଛି...", successToast: "ରିପୋର୍ଟ କରାଗଲା — ଧନ୍ୟବାଦ", offlineToast: "ଅଫଲାଇନ୍ ସେଭ୍ କରାଗଲା।", voiceConfirmTitle: "ନିଶ୍ଚିତ କରନ୍ତୁ", voiceConfirmDesc: "ଆମେ ଯାହା ବୁଝିଲୁ:", confirmBtn: "ଠିକ୍ ଅଛି", cancelBtn: "ବାତିଲ୍" },
  as: { pageTitle: "গছৰ তথ্য", reportTitle: "ৰিপোৰ্ট কৰক", reportDesc: "এই গছজোপাৰ যতন লোৱাত আমাক সহায় কৰক।", categoryWater: "পানী লাগে", categoryDamage: "ক্ষতি", categoryDisease: "ৰোগ", categoryMissing: "গছ নাই", categoryOther: "অন্য", notesLabel: "টোকা", notesPlaceholder: "বিৱৰণ?", photoLabel: "ফটো", voiceBtn: "মাত", voiceRecording: "ৰেকৰ্ডিং...", submitBtn: "জমা দিয়ক", submitting: "জমা হৈ আছে...", successToast: "ৰিপোৰ্ট কৰা হ'ল — ধন্যবাদ", offlineToast: "অফলাইন ছেভ কৰা হ'ল।", voiceConfirmTitle: "নিশ্চিত কৰক", voiceConfirmDesc: "আমি যি বুজিলোঁ:", confirmBtn: "ঠিক আছে", cancelBtn: "বাতিল কৰক" },
  ur: { pageTitle: "درخت کی معلومات", reportTitle: "رپورٹ کریں", reportDesc: "اس درخت کی دیکھ بھال میں ہماری مدد کریں۔", categoryWater: "پانی درکار ہے", categoryDamage: "نقصان", categoryDisease: "بیماری", categoryMissing: "درخت غائب", categoryOther: "دیگر", notesLabel: "نوٹس", notesPlaceholder: "تفصیل؟", photoLabel: "تصویر", voiceBtn: "آواز", voiceRecording: "ریکارڈنگ...", submitBtn: "جمع کریں", submitting: "جمع ہو رہا ہے...", successToast: "رپورٹ ہو گئی — شکریہ", offlineToast: "آف لائن محفوظ۔", voiceConfirmTitle: "تصدیق کریں", voiceConfirmDesc: "ہم نے کیا سمجھا:", confirmBtn: "ٹھیک ہے", cancelBtn: "منسوخ کریں" },
};
