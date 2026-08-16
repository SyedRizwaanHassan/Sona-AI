/**
 * FFC Knowledge Base & Fertilizer Advisor Offline Dataset
 * Sourced from Fauji Fertilizer Company (FFC) Pakistan
 */

const FFC_DATABASE = {
  company: {
    name: "Fauji Fertilizer Company Limited (FFC)",
    nameUrdu: "فوجی فرٹیلائزر کمپنی لمیٹڈ",
    helpline: "0800-00332",
    website: "https://www.ffc.com.pk",
    services: "مفت مٹی اور پانی کا تجزیہ، ایف ایف سی فارمر ایڈوائزری سروسز"
  },

  products: [
    {
      id: "sona-urea",
      name: "Sona Urea (سونا یوریا)",
      composition: "46% Nitrogen (نائٹروجن)",
      types: ["Prilled (پرلڈ)", "Granular (گرینولر)", "Neem Coated (نیم کوٹڈ)", "Zinc Coated (زنک کوٹڈ)"],
      descriptionUrdu: "سونا یوریا نائٹروجن کی سب سے زیادہ مقدار (46٪) فراہم کرتی ہے۔ یہ پودوں میں شگوفے بنانے، سبز رنگ بحال رکھنے اور تیزی سے بڑھوتری کے لیے ضروری ہے۔",
      bestPracticesUrdu: "ہمیشہ آبپاشی سے فوراً پہلے یا بعد میں استعمال کریں۔ خشک زمین پر ڈالنے سے گریز کریں۔"
    },
    {
      id: "sona-dap",
      name: "Sona DAP (سونا ڈی اے پی)",
      composition: "18% Nitrogen, 46% Phosphorus (18-46-0)",
      descriptionUrdu: "سونا ڈی اے پی پودے کی ابتدائی زندگی اور جڑوں کے مضبوط قیام کے لیے بنیادی کھاد ہے۔ یہ بوائی کے وقت مٹی میں ملائی جاتی ہے۔",
      bestPracticesUrdu: "بوائی کے وقت زمین کی آخری تیاری میں استعمال کریں تاکہ فاسفورس جڑوں کی پہنچ میں ہو۔"
    },
    {
      id: "sona-boron-dap",
      name: "Sona Boron DAP (سونا بوران ڈی اے پی)",
      composition: "18% N, 46% P, 0.1% Boron",
      descriptionUrdu: "پاکستان کی پہلی ویلیو ایڈڈ ڈی اے پی کھاد جس میں 0.1٪ بوران شامل ہے۔ یہ پھول سے پھل اور دانے بننے کے عمل (Pollination) کو تیز کرتی ہے اور دانے کا سائز بڑھاتی ہے۔",
      bestPracticesUrdu: "گندم، کپاس اور مکئی میں عام ڈی اے پی کے بدلے بہترین نتائج دیتی ہے۔"
    },
    {
      id: "ffc-sop",
      name: "FFC SOP (ایف ایف سی ایس او پی - Sulphate of Potash)",
      composition: "50% K2O (پوٹاشیم) + 17% Sulphur",
      descriptionUrdu: "اعلیٰ معیار کی پوٹاش کھاد جو بیماریوں اور خشک سالی کے خلاف مدافعت پیدا کرتی ہے۔ کلورین سے حساس فصلوں (کماد، آلو، پھل، سبزیاں) کے لیے انتہائی موزوں۔",
      bestPracticesUrdu: "بوائی کے وقت یا آخری جڑی بوٹی کی گوڈی پر استعمال کریں۔"
    },
    {
      id: "ffc-mop",
      name: "FFC MOP (ایف ایف سی ایم او پی - Muriate of Potash)",
      composition: "60% K2O",
      descriptionUrdu: "اقتصادی پوٹاش کھاد جو گندم، دھان اور مکئی میں دانوں کا وزن اور چمک بڑھاتی ہے۔"
    },
    {
      id: "sona-zinc",
      name: "Sona Zinc (سونا زنک)",
      composition: "33% Monohydrate / 21% Heptahydrate Zinc Sulfate",
      descriptionUrdu: "دھان میں پیلا پن (خائرہ بیماری) ختم کرنے اور کپاس/گندم کی پیداوار بڑھانے کے لیے ضروری مائیکرو نیوٹرینٹ۔",
      bestPracticesUrdu: "دھان کی منتقلی کے 15 تا 20 دن بعد 5 کلوگرام فی ایکڑ استعمال کریں۔"
    }
  ]
};

// Expose globally
window.FFC_DATABASE = FFC_DATABASE;
