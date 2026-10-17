export type Language = "en" | "hi";
const en = {
  skip: "Skip to main content", brand: "RozMitra", tagline: "Your work. Your earnings. Your companion.",
  language: "Switch to Hindi", signOut: "Sign out", signingOut: "Signing out…",
  welcome: "A little clarity for your working day.", intro: "Keep track of what you receive, what you spend, and what is still unpaid.",
  private: "Your records are private to your account.", signIn: "Sign in", signUp: "Create account",
  authTitle: "Your work, in one place", authIntro: "Sign in to save your earnings and return to them anytime.",
  email: "Email address", password: "Password", passwordHint: "Use at least 8 characters. Never reuse an important password.",
  wait: "Please wait…", authError: "We could not sign you in. Check your details and email confirmation, then try again.",
  signupError: "We could not create the account. Try again, or sign in if you already registered.",
  confirmEmail: "Check your email to confirm your account. Then return here and sign in.",
  invalidAuth: "Enter a valid email and a password of 8–128 characters.",
  setupTitle: "Connect your database first", setupText: "Add your Supabase project URL and publishable key to .env.local, then restart the app. Follow SETUP.md in the project folder.",
  earnings: "My earnings", earningsIntro: "A clear view of your money. No guesswork.", month: "Choose month",
  received: "Money received", expenses: "Work expenses", net: "Money after expenses", pending: "Still unpaid",
  netHelp: "Received minus expenses. Unpaid money is not included.", hours: "Hours worked", summary: "Monthly summary",
  addTitle: "Add your work entry", editTitle: "Edit your work entry", date: "Work date", minutes: "Minutes worked",
  timeHint: "For example, 8 hours = 480 minutes. Maximum 1,440 minutes.", amountHint: "Amounts in ₹. Enter 0 if none. Up to two decimal places.",
  pendingHint: "Enter only unpaid money for this entry. Do not also count it as received.",
  note: "Work note (optional)", noteHint: "Up to 500 characters. Avoid passwords, Aadhaar numbers, and bank details.",
  save: "Save entry", update: "Save changes", cancel: "Cancel", saving: "Saving…", saved: "Entry saved.", updated: "Changes saved.",
  invalidEntry: "Check the date, amounts, and minutes. Add at least one amount or working time. Future dates are not allowed.",
  history: "Your entries", emptyTitle: "No entries this month", emptyText: "Add your first entry. Only the information you save will appear here.",
  loading: "Loading your records…", retry: "Try again", edit: "Edit", remove: "Delete", deleteQuestion: "Delete this entry permanently?",
  confirmDelete: "Yes, delete entry", deleting: "Deleting…", deleted: "Entry deleted.",
  previous: "Previous", next: "Next", page: "Page", of: "of", entries: "entries", recordActions: "Entry actions",
  footer: "Built for working people. Keep it simple.", sessionExpired: "Your session expired. Sign in again to continue.",
  networkError: "Could not connect. Check your internet and try again. Your form has been kept.",
  databaseError: "Could not access your records. Check that the SQL setup is complete, then try again.",
  duplicate: "This entry may already be saved. Refresh your records before adding it again.",
  notFound: "This entry no longer exists. Refresh your records.", genericError: "Something went wrong. Please try again.",
  loadFailed: "Your records could not be loaded. Totals are unavailable until loading succeeds.",
  refreshed: "Records refreshed.", refresh: "Refresh records", loginLoading: "Checking your sign-in…",
  signoutError: "Could not sign out. Please try again.", units: "₹", countLabel: "Saved entries"
};
type Messages = { [Key in keyof typeof en]: string };
const hi: Messages = {
  skip: "मुख्य जानकारी पर जाएँ", brand: "RozMitra", tagline: "आपका काम। आपकी कमाई। आपका साथी।",
  language: "Switch to English", signOut: "साइन आउट", signingOut: "साइन आउट हो रहा है…",
  welcome: "अपने काम और कमाई का आसान हिसाब।", intro: "कितना पैसा मिला, कितना खर्च हुआ और कितना बाकी है—एक जगह देखें।",
  private: "आपके रिकॉर्ड केवल आपके खाते में दिखते हैं।", signIn: "साइन इन", signUp: "खाता बनाएँ",
  authTitle: "आपके काम का हिसाब, एक जगह", authIntro: "अपनी कमाई सहेजने और दोबारा देखने के लिए साइन इन करें।",
  email: "ईमेल पता", password: "पासवर्ड", passwordHint: "कम से कम 8 अक्षर रखें। किसी ज़रूरी खाते वाला पासवर्ड दोबारा न रखें।",
  wait: "कृपया रुकें…", authError: "साइन इन नहीं हुआ। ईमेल, पासवर्ड और ईमेल की पुष्टि जाँचकर फिर कोशिश करें।",
  signupError: "खाता नहीं बना। फिर कोशिश करें या पहले से खाता है तो साइन इन करें।",
  confirmEmail: "ईमेल में आए लिंक से खाते की पुष्टि करें। फिर यहाँ आकर साइन इन करें।",
  invalidAuth: "सही ईमेल और 8–128 अक्षरों का पासवर्ड डालें।",
  setupTitle: "पहले डेटाबेस जोड़ें", setupText: ".env.local में Supabase प्रोजेक्ट URL और publishable key डालें, फिर ऐप दोबारा चलाएँ। प्रोजेक्ट की SETUP.md फ़ाइल देखें।",
  earnings: "मेरी कमाई", earningsIntro: "पैसों का साफ़ हिसाब, आसानी से।", month: "महीना चुनें",
  received: "मिला हुआ पैसा", expenses: "काम का खर्च", net: "खर्च के बाद बचा पैसा", pending: "मिलना बाकी है",
  netHelp: "मिले पैसों में से खर्च घटाया गया है। बाकी भुगतान इसमें शामिल नहीं है।", hours: "काम के घंटे", summary: "महीने का हिसाब",
  addTitle: "काम का हिसाब जोड़ें", editTitle: "काम का हिसाब बदलें", date: "काम की तारीख", minutes: "काम का समय (मिनट)",
  timeHint: "जैसे, 8 घंटे = 480 मिनट। अधिकतम 1,440 मिनट।", amountHint: "रकम ₹ में डालें। नहीं है तो 0 डालें। दशमलव के बाद अधिकतम दो अंक।",
  pendingHint: "केवल इस रिकॉर्ड का बाकी भुगतान लिखें। उसी रकम को मिले पैसों में भी न जोड़ें।",
  note: "काम के बारे में नोट (ज़रूरी नहीं)", noteHint: "अधिकतम 500 अक्षर। पासवर्ड, आधार या बैंक की जानकारी न लिखें।",
  save: "हिसाब सहेजें", update: "बदलाव सहेजें", cancel: "रद्द करें", saving: "सहेज रहे हैं…", saved: "हिसाब सहेज लिया गया।", updated: "बदलाव सहेज लिए गए।",
  invalidEntry: "तारीख, रकम और मिनट जाँचें। कम से कम एक रकम या काम का समय डालें। आने वाली तारीख न चुनें।",
  history: "आपके रिकॉर्ड", emptyTitle: "इस महीने कोई रिकॉर्ड नहीं है", emptyText: "अपना पहला हिसाब जोड़ें। यहाँ केवल आपका सहेजा हुआ हिसाब दिखेगा।",
  loading: "आपके रिकॉर्ड आ रहे हैं…", retry: "फिर कोशिश करें", edit: "बदलें", remove: "मिटाएँ", deleteQuestion: "क्या यह रिकॉर्ड हमेशा के लिए मिटाना है?",
  confirmDelete: "हाँ, रिकॉर्ड मिटाएँ", deleting: "मिटा रहे हैं…", deleted: "रिकॉर्ड मिटा दिया गया।",
  previous: "पिछला", next: "अगला", page: "पेज", of: "में से", entries: "रिकॉर्ड", recordActions: "रिकॉर्ड के विकल्प",
  footer: "काम करने वालों के लिए, आसान भाषा में।", sessionExpired: "सत्र समाप्त हो गया। आगे बढ़ने के लिए फिर साइन इन करें।",
  networkError: "कनेक्शन नहीं हुआ। इंटरनेट जाँचकर फिर कोशिश करें। फ़ॉर्म की जानकारी रखी गई है।",
  databaseError: "रिकॉर्ड नहीं मिले। SQL सेटअप पूरा है या नहीं जाँचकर फिर कोशिश करें।",
  duplicate: "यह रिकॉर्ड शायद पहले ही सहेजा गया है। दोबारा जोड़ने से पहले रिकॉर्ड रीफ़्रेश करें।",
  notFound: "यह रिकॉर्ड अब मौजूद नहीं है। रिकॉर्ड रीफ़्रेश करें।", genericError: "कुछ गड़बड़ हुई। फिर कोशिश करें।",
  loadFailed: "रिकॉर्ड नहीं आए। रिकॉर्ड आने तक कुल रकम नहीं दिखाई जा सकती।",
  refreshed: "रिकॉर्ड रीफ़्रेश हो गए।", refresh: "रिकॉर्ड रीफ़्रेश करें", loginLoading: "साइन इन जाँच रहे हैं…",
  signoutError: "साइन आउट नहीं हुआ। फिर कोशिश करें।", units: "₹", countLabel: "सहेजे गए रिकॉर्ड"
};
export const messages: Record<Language, Messages> = { en, hi };
export type MessageKey = keyof Messages;

export function errorMessage(code: string): MessageKey {
  const mapping: Record<string, MessageKey> = {
    UNAUTHORIZED: "sessionExpired", INVALID_INPUT: "invalidEntry", DATABASE_ERROR: "databaseError",
    NOT_CONFIGURED: "databaseError", DUPLICATE_ENTRY: "duplicate", NOT_FOUND: "notFound", NETWORK_ERROR: "networkError"
  };
  return mapping[code] ?? "genericError";
}
