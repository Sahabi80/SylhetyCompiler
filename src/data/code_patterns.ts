/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodePattern {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  category: 'variables' | 'conditionals' | 'loops' | 'functions' | 'builtins' | 'practical';
  description: string;
  tags: string[];
  sylhetiCode: string;
  banglaCode: string;
  cursorOffset?: number; // Cursor placement relative to start
}

export interface PatternCategory {
  id: string;
  titleBangla: string;
  titleEnglish: string;
  iconName: string;
}

export const PATTERN_CATEGORIES: PatternCategory[] = [
  { id: 'all', titleBangla: 'সব প্যাটার্ন', titleEnglish: 'All Patterns', iconName: 'Layers' },
  { id: 'variables', titleBangla: 'চলক ও ধ্রুবক', titleEnglish: 'Variables & Constants', iconName: 'Hash' },
  { id: 'conditionals', titleBangla: 'শর্ত ও সিদ্ধান্ত', titleEnglish: 'Conditionals (If-Else)', iconName: 'GitFork' },
  { id: 'loops', titleBangla: 'লুপ ও পুনরাবৃত্তি', titleEnglish: 'Loops (For / While)', iconName: 'RefreshCw' },
  { id: 'functions', titleBangla: 'ফাংশন ও কাম', titleEnglish: 'Functions & Returns', iconName: 'Code' },
  { id: 'builtins', titleBangla: 'বিল্ট-ইন মেথড', titleEnglish: 'Math & Built-ins', iconName: 'Zap' },
  { id: 'practical', titleBangla: 'ব্যবহারিক অ্যালগরিদম', titleEnglish: 'Practical Algorithms', iconName: 'Sparkles' },
];

export const CODE_PATTERNS: CodePattern[] = [
  // Variables
  {
    id: 'var_simple',
    nameBangla: 'সাধারণ চলক ঘোষণা',
    nameEnglish: 'Variable Declaration',
    category: 'variables',
    description: 'নতুন চলক ডিক্লেয়ার করা এবং প্রাথমিক মান নির্ধারণ।',
    tags: ['let', 'var', 'variable', 'ধরি', 'রাখইন'],
    sylhetiCode: `ধরি নাম = "সিলেট"\nধরি বয়স = ২৫\n`,
    banglaCode: `ধরি নাম = "ঢাকা"\nধরি বয়স = ২৫\n`,
  },
  {
    id: 'var_typed',
    nameBangla: 'টাইপসহ চলক ঘোষণা (Semantic Types)',
    nameEnglish: 'Typed Variable Declaration',
    category: 'variables',
    description: 'আস্তা (int), ভাংতি (float), বা লেখা (string) টাইপ নির্দিষ্ট করে চলক তৈরি।',
    tags: ['type', 'int', 'float', 'string', 'আস্তা', 'ভাংতি'],
    sylhetiCode: `ধরি গণনা: আস্তা = ১০০\nধরি তাপমাত্রা: ভাংতি = ৯৮.৬\nধরি বার্তা: লেখা = "স্বাগতম"\n`,
    banglaCode: `ধরি গণনা: পূর্ণসংখ্যা = ১০০\nধরি তাপমাত্রা: ভগ্নাংশ = ৯৮.৬\nধরি বার্তা: বাক্য = "স্বাগতম"\n`,
  },
  {
    id: 'const_decl',
    nameBangla: 'ধ্রুবক (Constant) ঘোষণা',
    nameEnglish: 'Constant Value Declaration',
    category: 'variables',
    description: 'অপরিবর্তনযোগ্য ধ্রুবক মান ডিক্লেয়ার করা।',
    tags: ['const', 'constant', 'ধ্রুবক', 'স্থির'],
    sylhetiCode: `ধ্রুবক পাই = ৩.১৪১৫৯\nধ্রুবক সর্বোচ্চ_সীমা = ১০০০\n`,
    banglaCode: `ধ্রুবক পাই = ৩.১৪১৫৯\nধ্রুবক সর্বোচ্চ_সীমা = ১০০০\n`,
  },

  // Conditionals
  {
    id: 'if_else_simple',
    nameBangla: 'যদি - নইলে (If-Else) ব্লক',
    nameEnglish: 'If-Else Condition Block',
    category: 'conditionals',
    description: 'শর্ত পূরণ হলে প্রথম অংশ, না হলে বিকল্প অংশ এক্সিকিউট করা।',
    tags: ['if', 'else', 'যদি', 'নইলে', 'শর্ত'],
    sylhetiCode: `যদি (স্কোর বেশি_বা_সমান ৪০) {\n    কও("আপনি পাস করছেন (হাছা)!")\n} নইলে {\n    কও("আবার চেষ্টা করুন!")\n}\n`,
    banglaCode: `যদি (স্কোর >= ৪০) {\n    ছাপাও("আপনি পাস করেছেন (সত্য)!")\n} নইলে {\n    ছাপাও("আবার চেষ্টা করুন!")\n}\n`,
  },
  {
    id: 'if_elseif_ladder',
    nameBangla: 'যদি - অথবা_যদি - নইলে মই',
    nameEnglish: 'If-Else If-Else Ladder',
    category: 'conditionals',
    description: 'একাধিক বিকল্প শর্ত ক্রমান্বয়ে যাচাই করার স্ট্রাকচার।',
    tags: ['if', 'else if', 'ladder', 'অথবা_যদি', 'গ্রেডিং'],
    sylhetiCode: `যদি (মার্ক বেশি_বা_সমান ৮০) {\n    কও("গ্রেড: A+")\n} অথবা_যদি (মার্ক বেশি_বা_সমান ৭০) {\n    কও("গ্রেড: A")\n} অথবা_যদি (মার্ক বেশি_বা_সমান ৬০) {\n    কও("গ্রেড: B")\n} নইলে {\n    কও("গ্রেড: F")\n}\n`,
    banglaCode: `যদি (মার্ক >= ৮০) {\n    ছাপাও("গ্রেড: A+")\n} অথবা_যদি (মার্ক >= ৭০) {\n    ছাপাও("গ্রেড: A")\n} অথবা_যদি (মার্ক >= ৬০) {\n    ছাপাও("গ্রেড: B")\n} নইলে {\n    ছাপাও("গ্রেড: F")\n}\n`,
  },
  {
    id: 'logical_ops',
    nameBangla: 'যৌক্তিক অপারেটর (Logical AND / OR)',
    nameEnglish: 'Logical Operations (AND / OR)',
    category: 'conditionals',
    description: 'আর (&&), বা (||), এবং না (!) অপারেটর দিয়ে জটিল শর্ত।',
    tags: ['logic', 'and', 'or', 'not', 'আর', 'বা'],
    sylhetiCode: `যদি (বয়স বেশি ১৮ আর জাতীয়তা সমান "বাংলাদেশি") {\n    কও("ভোটের নিবন্ধন সম্পন্ন")\n}\n`,
    banglaCode: `যদি (বয়স > ১৮ এবং জাতীয়তা == "বাংলাদেশি") {\n    ছাপাও("ভোটের নিবন্ধন সম্পন্ন")\n}\n`,
  },

  // Loops
  {
    id: 'for_loop',
    nameBangla: 'ঘুরো (For) লুপ কাউন্টার',
    nameEnglish: 'For Loop Counter',
    category: 'loops',
    description: 'নির্দিষ্ট সংখ্যক বার লুপ চালানোর জন্য প্রমিত ফর লুপ।',
    tags: ['for', 'loop', 'ঘুরো', 'পুনরাবৃত্তি'],
    sylhetiCode: `ঘুরো (ধরি i = ১; i <= ১০; i++) {\n    কও("গণনা ক্রম:", i)\n}\n`,
    banglaCode: `ঘুরুন (ধরি i = ১; i <= ১০; i++) {\n    ছাপাও("গণনা ক্রম:", i)\n}\n`,
  },
  {
    id: 'while_loop',
    nameBangla: 'যতক্ষণ (While) লুপ',
    nameEnglish: 'While Loop Condition',
    category: 'loops',
    description: 'শর্ত সত্য থাকা পর্যন্ত স্টেটমেন্টসমূহ বারবার এক্সিকিউট করা।',
    tags: ['while', 'যতক্ষণ', 'চলে', 'loop'],
    sylhetiCode: `ধরি কাউন্টার = ৫\nযতক্ষণ (কাউন্টার বেশি ০) {\n    কও("কাউন্টডাউন:", কাউন্টার)\n    কাউন্টার--\n}\nকও("শুরু অইলো!")\n`,
    banglaCode: `ধরি কাউন্টার = ৫\nযতক্ষণ (কাউন্টার > ০) {\n    ছাপাও("কাউন্টডাউন:", কাউন্টার)\n    কাউন্টার--\n}\nছাপাও("শুরু হলো!")\n`,
  },
  {
    id: 'loop_accumulator',
    nameBangla: 'লুপ দিয়ে যোগফল নির্ণয় (Summation)',
    nameEnglish: 'Loop Sum Accumulator',
    category: 'loops',
    description: '১ থেকে N পর্যন্ত ক্রমিক সংখ্যার যোগফল গণনার লুপ।',
    tags: ['sum', 'accumulator', 'যোগফল', 'গণনা'],
    sylhetiCode: `ধরি N = ১০০\nধরি মোট_যোগফল = ০\nঘুরো (ধরি সংখ্যা = ১; সংখ্যা <= N; সংখ্যা++) {\n    মোট_যোগফল += সংখ্যা\n}\nকও("১ থেকে", N, "পর্যন্ত যোগফল:", মোট_যোগফল)\n`,
    banglaCode: `ধরি N = ১০০\nধরি মোট_যোগফল = ০\nঘুরুন (ধরি সংখ্যা = ১; সংখ্যা <= N; সংখ্যা++) {\n    মোট_যোগফল += সংখ্যা\n}\nছাপাও("১ থেকে", N, "পর্যন্ত যোগফল:", মোট_যোগফল)\n`,
  },
  {
    id: 'break_continue',
    nameBangla: 'লুপ ব্রেক ও কন্টিনিউ (থামো / পরেরটা)',
    nameEnglish: 'Break & Continue in Loop',
    category: 'loops',
    description: 'থামো (break) এবং পরেরটা (continue) কি-ওয়ার্ডের সঠিক ব্যবহার।',
    tags: ['break', 'continue', 'থামো', 'পরেরটা'],
    sylhetiCode: `ঘুরো (ধরি x = ১; x <= ১০; x++) {\n    যদি (x সমান ৫) {\n        পরেরটা // ৫ নম্বর এড়িয়ে যাও\n    }\n    যদি (x বেশি ৮) {\n        থামো // ৮ এর বেশি হলে লুপ বন্ধ\n    }\n    কও("মান:", x)\n}\n`,
    banglaCode: `ঘুরুন (ধরি x = ১; x <= ১০; x++) {\n    যদি (x == ৫) {\n        পরবর্তী // ৫ নম্বর এড়িয়ে যাও\n    }\n    যদি (x > ৮) {\n        থামো // ৮ এর বেশি হলে লুপ বন্ধ\n    }\n    ছাপাও("মান:", x)\n}\n`,
  },

  // Functions
  {
    id: 'function_simple',
    nameBangla: 'সাধারণ কাম / ফাংশন ডিক্লারেশন',
    nameEnglish: 'Function with Parameters & Return',
    category: 'functions',
    description: 'প্যারামিটার গ্রহণকারী ও ফলাফল ফেরত প্রদানকারী ফাংশন।',
    tags: ['func', 'function', 'কাম', 'ফাংশন', 'ফেরত'],
    sylhetiCode: `কাম ক্ষেত্রফল_নির্ণয়(দৈর্ঘ্য, প্রস্থ) {\n    ধরি ক্ষেত্রফল = দৈর্ঘ্য * প্রস্থ\n    ফেরত ক্ষেত্রফল\n}\n\nধরি ফলাফল = ক্ষেত্রফল_নির্ণয়(১২, ৮)\nকও("আয়তক্ষেত্রের ক্ষেত্রফল:", ফলাফল)\n`,
    banglaCode: `ফাংশন ক্ষেত্রফল_নির্ণয়(দৈর্ঘ্য, প্রস্থ) {\n    ধরি ক্ষেত্রফল = দৈর্ঘ্য * প্রস্থ\n    ফেরত ক্ষেত্রফল\n}\n\nধরি ফলাফল = ক্ষেত্রফল_নির্ণয়(১২, ৮)\nছাপাও("আয়তক্ষেত্রের ক্ষেত্রফল:", ফলাফল)\n`,
  },
  {
    id: 'function_recursive_fact',
    nameBangla: 'রিকার্সিভ ফ্যাক্টোরিয়াল (Factorial)',
    nameEnglish: 'Recursive Factorial Function',
    category: 'functions',
    description: 'রিকার্সিভ কল স্ট্যাক এবং বেস কেস যাচাইয়ের ক্লাসিক উদাহরণ।',
    tags: ['recursion', 'factorial', 'রিকার্শন', 'ফ্যাক্টোরিয়াল'],
    sylhetiCode: `কাম ফ্যাক্টোরিয়াল(n) {\n    যদি (n কম_বা_সমান ১) {\n        ফেরত ১\n    }\n    ফেরত n * ফ্যাক্টোরিয়াল(n - ১)\n}\n\nকও("৫ এর ফ্যাক্টোরিয়াল অইলো:", ফ্যাক্টোরিয়াল(৫))\n`,
    banglaCode: `ফাংশন ফ্যাক্টোরিয়াল(n) {\n    যদি (n <= ১) {\n        ফেরত ১\n    }\n    ফেরত n * ফ্যাক্টোরিয়াল(n - ১)\n}\n\nছাপাও("৫ এর ফ্যাক্টোরিয়াল হলো:", ফ্যাক্টোরিয়াল(৫))\n`,
  },
  {
    id: 'function_max_three',
    nameBangla: 'তিনটি সংখ্যার মধ্যে বৃহত্তম নির্ণয়',
    nameEnglish: 'Find Maximum of Three Numbers',
    category: 'functions',
    description: 'নেস্টেড কন্ডিশন যাচাই করে বৃহত্তম সংখ্যা ফেরত দেওয়া।',
    tags: ['max', 'maximum', 'বৃহত্তম', 'তুলনা'],
    sylhetiCode: `কাম সর্বোচ্চ(ক, খ, গ) {\n    ধরি বড় = ক\n    যদি (খ বেশি বড়) {\n        বড় = খ\n    }\n    যদি (গ বেশি বড়) {\n        বড় = গ\n    }\n    ফেরত বড়\n}\n\nকও("সর্বোচ্চ মান:", সর্বোচ্চ(৪৫, ৯২, ১৮))\n`,
    banglaCode: `ফাংশন সর্বোচ্চ(ক, খ, গ) {\n    ধরি বড় = ক\n    যদি (খ > বড়) {\n        বড় = খ\n    }\n    যদি (গ > বড়) {\n        বড় = গ\n    }\n    ফেরত বড়\n}\n\nছাপাও("সর্বোচ্চ মান:", সর্বোচ্চ(৪৫, ৯২, ১৮))\n`,
  },

  // Built-ins
  {
    id: 'math_builtins',
    nameBangla: 'গণিত ও বিল্ট-ইন মেথড (বর্গমূল, পরমমান)',
    nameEnglish: 'Math Functions (Square Root, Absolute)',
    category: 'builtins',
    description: 'বর্গমূল (sqrt) এবং পরমমান (abs) অন্তর্নির্মিত ফাংশনের ব্যবহার।',
    tags: ['math', 'sqrt', 'abs', 'বর্গমূল', 'পরমমান'],
    sylhetiCode: `ধরি অতিভুজ_বর্গ = ১৬ + ৯\nধরি অতিভুজ = বর্গমূল(অতিভুজ_বর্গ)\nকও("অতিভুজ দৈর্ঘ্য:", অতিভুজ)\n\nধরি ব্যবধান = পরমমান(-৭৫)\nকও("পরম মান:", ব্যবধান)\n`,
    banglaCode: `ধরি অতিভুজ_বর্গ = ১৬ + ৯\nধরি অতিভুজ = বর্গমূল(অতিভুজ_বর্গ)\nছাপাও("অতিভুজ দৈর্ঘ্য:", অতিভুজ)\n\nধরি ব্যবধান = পরমমান(-৭৫)\nছাপাও("পরম মান:", ব্যবধান)\n`,
  },
  {
    id: 'string_length_builtin',
    nameBangla: 'দৈর্ঘ্য (String Length) ও বাক্য অপারেশন',
    nameEnglish: 'String Length & Manipulation',
    category: 'builtins',
    description: 'বাক্যের মোট অক্ষর সংখ্যা নির্ণয় ও সংযুক্তিকরণ।',
    tags: ['string', 'length', 'দৈর্ঘ্য', 'লেখা'],
    sylhetiCode: `ধরি শুভেচ্ছা = "সিলেটি ভাষায় কোডিং"\nধরি মোট_অক্ষর = দৈর্ঘ্য(শুভেচ্ছা)\nকও("বাক্য:", শুভেচ্ছা)\nকও("মোট দৈর্ঘ্য:", মোট_অক্ষর)\n`,
    banglaCode: `ধরি শুভেচ্ছা = "বাংলা ভাষায় কোডিং"\nধরি মোট_অক্ষর = দৈর্ঘ্য(শুভেচ্ছা)\nছাপাও("বাক্য:", শুভেচ্ছা)\nছাপাও("মোট দৈর্ঘ্য:", মোট_অক্ষর)\n`,
  },

  // Practical Algorithms
  {
    id: 'market_bill_calc',
    nameBangla: 'আঞ্চলিক বাজার ও ডিসকাউন্ট হিসাব',
    nameEnglish: 'Regional Market & Discount Calculator',
    category: 'practical',
    description: 'আইটেমের দর, ভ্যাট, ডেলিভারি চার্জ ও বিশেষ ছাড়ের বাস্তবভিত্তিক হিসাব।',
    tags: ['market', 'calculator', 'হিসাব', 'বাজার', 'বিল'],
    sylhetiCode: `// আঞ্চলিক বাজার হিসাবরক্ষণ\nধরি পণ্যের_দর = ৬৫০\nধরি পরিমাণ = ৪\nধ্রুবক ডেলিভারি = ৫০\n\nকাম মোট_হিসাব(দর, কেজি) {\n    ধরি মূল_বিল = দর * কেজি\n    ধরি ভ্যাট = মূল_বিল * ০.০৫ // ৫% ভ্যাট\n    ফেরত মূল_বিল + ভ্যাট + ডেলিভারি\n}\n\nধরি বিল = মোট_হিসাব(পণ্যের_দর, পরিমাণ)\nকও("সর্বমোট পরিশোধযোগ্য টাকা:", বিল)\n`,
    banglaCode: `// বাজার হিসাবরক্ষণ\nধরি পণ্যের_দর = ৬৫০\nধরি পরিমাণ = ৪\nধ্রুবক ডেলিভারি = ৫০\n\nফাংশন মোট_হিসাব(দর, কেজি) {\n    ধরি মূল_বিল = দর * কেজি\n    ধরি ভ্যাট = মূল_বিল * ০.০৫ // ৫% ভ্যাট\n    ফেরত মূল_বিল + ভ্যাট + ডেলিভারি\n}\n\nধরি বিল = মোট_হিসাব(পণ্যের_দর, পরিমাণ)\nছাপাও("সর্বমোট পরিশোধযোগ্য টাকা:", বিল)\n`,
  },
  {
    id: 'gcd_algorithm',
    nameBangla: 'গ.সা.গু (GCD / Euclidean Algorithm)',
    nameEnglish: 'Greatest Common Divisor (GCD)',
    category: 'practical',
    description: 'ইউক্লিডীয় অ্যালগরিদম ব্যবহার করে দুটি সংখ্যার গরিষ্ঠ সাধারণ গুণনীয়ক নির্ণয়।',
    tags: ['gcd', 'euclid', 'গসাগু', 'অ্যালগরিদম'],
    sylhetiCode: `// গ.সা.গু নির্ণয়ের কাম\nকাম গসাগু(ক, খ) {\n    যতক্ষণ (খ != ০) {\n        ধরি ভাগশেষ = ক % খ\n        ক = খ\n        খ = ভাগশেষ\n    }\n    ফেরত ক\n}\n\nকও("৪৮ এবং ১৮ এর গ.সা.গু:", গসাগু(৪৮, ১৮))\n`,
    banglaCode: `// গ.সা.গু নির্ণয়ের ফাংশন\nফাংশন গসাগু(ক, খ) {\n    যতক্ষণ (খ != ০) {\n        ধরি ভাগশেষ = ক % খ\n        ক = খ\n        খ = ভাগশেষ\n    }\n    ফেরত ক\n}\n\nছাপাও("৪৮ এবং ১৮ এর গ.সা.গু:", গসাগু(৪৮, ১৮))\n`,
  },
];
