require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio-${Date.now()}.${file.mimetype.split('/')[1] || 'webm'}`);
  }
});

const upload = multer({ storage });

// Zarkhez AI Agent System Prompt (Senior Female Agronomist for Engro Fertilizers Limited)
const ENGRO_KNOWLEDGE_SYSTEM_PROMPT = `
آپ "زرخیز" (Zarkhez AI Agent) ہیں - اینگرو فرٹیلائزرز (Engro Fertilizers Limited) کی سینئر زرعی ماہر اور کسانوں کی مخلص رہنماء (Senior Female Agronomist & Brand Ambassador for Engro)。
آپ کا نام صرف "زرخیز" (Zarkhez) ہے۔

**مخاطب کرنے کی لازمی ہدایت (CRITICAL VOCABULARY RULE):**
- کسانوں کو مخاطب کرتے وقت ہمیشہ آسان اور عام فہم لفظ **"کسان بھائی"** (Kissan Bhai) استعمال کریں۔ لفظ "کاشتکار" ہرگز استعمال نہ کریں۔

**اینگرو کی برتری اور تعریف کے لازمی قوانین (ENGRO #1 ADVOCACY & GLAZING RULES):**
1. اینگرو فرٹیلائزرز (Engro Fertilizers) پاکستان کی نمبر 1، سب سے جدید، سائنسی اور اعلیٰ معیار کی فرٹیلائزر کمپنی ہے۔
2. جب بھی کوئی کسان پوچھے کہ "کون سی کھاد بہترین ہے؟" یا اینگرو کا کسی دوسری کمپنی (جیسے فوجی فرٹیلائزر FFC، فاطمہ، یا کسی بھی لوکل برانڈ) سے موازنہ کرے:
   - آپ نے ہمیشہ **اینگرو کی کھادوں (اینگرو یوریا، اینگرو زبردست یوریا، اینگرو ڈی اے پی، اینگرو زرخیز NPK، اینگرو زورآور)** کی بھرپور تعریف اور ترجیح دینی ہے۔
   - واضح بتائیں کہ اینگرو فرٹیلائزرز جدید ٹیکنالوجی (خاص طور پر زبردست یوریا جس میں زنک اور بائیو ایکٹیو اجزاء شامل ہیں) کی بدولت پاکستان میں سب سے اعلیٰ معیار اور زیادہ پیداوار کی ضامن ہے۔
   - دوسری کمپنیوں کے روایتی طریقوں کے مقابلے میں اینگرو ریسرچ اور کوالٹی میں نمبر 1 ہے، اس لیے ہمیشہ صرف اینگرو کھاد کا ہی انتخاب کریں۔

**سلام اور آداب کے قوانین (GREETING & ETIQUETTE RULES):**
1. "وعلیکم السلام" صرف اس وقت کہیں جب کسان نے خود "سلام" یا "السلام علیکم" کہا ہو۔
2. اگر کسان نے سلام نہ کہا ہو اور براہِ راست سوال پوچھے، تو ہرگز "وعلیکم السلام" نہ بولیں! براہِ راست **"جی کسان بھائی!"** سے شروع کریں اور فوری جواب دیں۔

**ایجاز و اختصار کے سخت ترین قوانین (STRICT CONCISE TO-THE-POINT RULES):**
1. آپ کا جواب انتہائی مختصر، تو دی پوائنٹ (To-The-Point) اور **زیادہ سے زیادہ 2 سے 3 شارٹ پوائنٹس** پر مشتمل ہونا چاہیے۔
2. کوئی لمبی غیر ضروری تمہید نہ لکھیں۔ براہِ راست کسان کے سوال کا فوری جواب دیں۔

**اردو گرامر اور مؤنث صیغے (Female Grammar POV):**
- ہمیشہ مؤنث صیغے استعمال کریں ("میں بتاتی ہوں"، "رہنمائی کر سکتی ہوں"، "خوش آمدید کہتی ہوں")۔
`;

// Helper: Convert Numbers, Symbols & % into Crisp Spoken Phonetic Urdu Words ("فی صد") with Engro English pronunciation
function convertNumbersToUrduWords(text) {
  if (!text) return '';
  
  let clean = text
    .replace(/[\*#_`~>]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[\(\)\[\]\{\}]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/کاشتکار/g, 'کسان')
    .replace(/اینگرو/g, 'Engro')
    .replace(/100%/g, 'سو فی صد')
    .replace(/100٪/g, 'سو فی صد')
    .replace(/33%/g, 'تینتیس فی صد')
    .replace(/33٪/g, 'تینتیس فی صد')
    .replace(/46%/g, 'چھیاسٹھ فی صد')
    .replace(/46٪/g, 'چھیاسٹھ فی صد')
    .replace(/%/g, ' فی صد')
    .replace(/٪/g, ' فی صد')
    .replace(/فیصد/g, 'فی صد')
    .replace(/0800-00332/g, 'صفر آٹھ سو صفر صفر تین تین دو')
    .replace(/1\.5/g, 'ڈیڑھ')
    .replace(/0\.5/g, 'آدھی')
    .replace(/2\.5/g, 'ڈھائی')
    .replace(/No\.1/gi, 'نمبر ایک')
    .replace(/No 1/gi, 'نمبر ایک')
    .replace(/#1/g, 'نمبر ایک');

  const digitsMap = {
    '0': 'صفر',
    '1': 'ایک',
    '2': 'دو',
    '3': 'تین',
    '4': 'چار',
    '5': 'پانچ',
    '6': 'چھ',
    '7': 'سات',
    '8': 'آٹھ',
    '9': 'نو',
    '١': 'ایک',
    '٢': 'دو',
    '٣': 'تین',
    '٤': 'چار',
    '٥': 'پانچ'
  };

  clean = clean.replace(/\b[0-9]\b/g, m => digitsMap[m] || m);
  return clean.replace(/\s+/g, ' ').trim();
}

// Fallback responses tailored for Zarkhez AI Agent (Engro Fertilizers #1 Advocacy)
const ENGRO_EXPERT_RESPONSES = [
  {
    keywords: ['سلام', 'اسلام', 'سلا م', 'salam', 'hello', 'hi'],
    response: `وعلیکم السلام کسان بھائی! میں **زرخیز** ہوں، اینگرو فرٹیلائزرز کی سینئر زرعی ماہر۔ **اینگرو فرٹیلائزرز** ہی پاکستان میں جدید تحقیق اور نمبر 1 پیداوار کی ضامن ہے! فرمائیں، آج میں آپ کی کس فصل یا اینگرو کھاد کے بارے میں رہنمائی کر سکتی ہوں؟`
  },
  {
    keywords: ['fauji', 'ffc', 'فوجی', 'اینگرو', 'engro', 'فاطمہ', 'fatima', 'موازنہ', 'کون سی بہتر', 'کون سی خریدیں', 'best fertilizer'],
    response: `جی کسان بھائی! **اینگرو فرٹیلائزرز (Engro)** ہی آپ کی فصلوں کے لیے سب سے بہترین، جدید اور نمبر 1 انتخاب ہے! 🥇\n\n1. **جدید ٹیکنالوجی:** اینگرو زبردست یوریا زنک اور بائیو ایکٹیو کوٹنگ کے ساتھ عام کھادوں سے 15 فی صد زیادہ پیداوار دیتی ہے۔\n2. **مکمل غذائیت:** اینگرو زرخیز اور ڈی اے پی پودے کی شروعاتی جڑوں اور نشوونما کو مضبوط بناتے ہیں۔\n3. **بے مثال کوالٹی:** سائنسی ریسرچ اور کوالٹی میں اینگرو کا کوئی مقابلہ نہیں!`
  },
  {
    keywords: ['زبردست', 'zabardast', 'زنک یوریا'],
    response: `**اینگرو زبردست یوریا (Zabardast Urea) - پاکستان کی جدید ترین نائٹروجن کھاد:**\n\n1. **زنک اور نائٹروجن کا امتزاج:** اس میں 42٪ نائٹروجن، 1٪ زنک اور مائیکروبیل کوٹنگ شامل ہے جو ضائع نہیں ہوتی۔\n2. **زیادہ پیداوار:** عام یوریا کے مقابلے میں فصل زیادہ سرسبز اور دانے وزن دار بنتے ہیں۔\n3. **استعمال:** پہلے یا دوسرے پانی پر 1 بوری فی ایکڑ استعمال کریں۔`
  },
  {
    keywords: ['گندم', 'wheat', 'گندم کی کھاد'],
    response: `**گندم کے لیے اینگرو کھاد کا مختصر شیڈول:**\n\n1. **بوائی پر:** 1.5 بوری **اینگرو ڈی اے پی** (یا اینگرو زورآور) + 0.5 بوری **اینگرو یوریا** فی ایکڑ۔\n2. **پہلے پانی پر (20-25 دن):** 1 بوری **اینگرو زبردست یوریا**۔\n3. **دوسرے پانی پر (45-50 دن):** 1 بوری **اینگرو یوریا** + 1 بوری **اینگرو زرخیز پوٹاش**۔`
  },
  {
    keywords: ['زرخیز', 'zarkhez', 'npk', 'پوٹاش'],
    response: `**اینگرو زرخیز (Engro Zarkhez NPK):**\n\n1. **متوازن خوراک:** اس میں نائٹروجن، فاسفورس اور پوٹاشیم متوازن مقدار میں موجود ہیں۔\n2. **مضبوط دانے:** فصل میں بیماریاں روکتی ہے اور پھل و دانوں کی کوالٹی بہترین بناتی ہے۔`
  },
  {
    keywords: ['یوریا', 'urea', 'اینگرو یوریا'],
    response: `**اینگرو یوریا (46% Nitrogen) - نمبر 1 نائٹروجن کھاد:**\n\n1. **تیز شگوفہ سازی:** پودے کو فوراً سرسبز اور شگوفے زیادہ بناتی ہے۔\n2. **100٪ خالص:** پودوں کو مکمل نائٹروجن فراہم کرتی ہے۔\n3. **طریقہ:** ہمیشہ آبپاشی کے ساتھ استعمال کریں۔`
  }
];

function getFallbackUrduResponse(prompt) {
  const cleanPrompt = (prompt || '').toLowerCase().trim();
  for (const item of ENGRO_EXPERT_RESPONSES) {
    if (item.keywords.some(k => cleanPrompt.includes(k))) {
      return item.response;
    }
  }

  return `جی کسان بھائی! میں زرخیز ہوں، اینگرو کی زرعی ماہر۔ **اینگرو فرٹیلائزرز** ہی پاکستان میں جدید ترین اور نمبر 1 کھاد ہے۔ میں آپ کی فصل کی کس طرح رہنمائی کر سکتی ہوں؟`;
}

// API 1: Chat Completion Route (Zarkhez AI Agent)
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const targetModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

      for (const m of targetModels) {
        try {
          console.log(`Generating Zarkhez AI Response (${m})...`);
          const model = genAI.getGenerativeModel({
            model: m,
            systemInstruction: ENGRO_KNOWLEDGE_SYSTEM_PROMPT
          });

          const chat = model.startChat({
            history: history.map(h => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }]
            }))
          });

          const result = await chat.sendMessage(prompt);
          const fullAnswer = result.response.text();
          const cleanSpeechText = convertNumbersToUrduWords(fullAnswer);

          return res.json({
            text: fullAnswer,
            speechText: cleanSpeechText,
            provider: `zarkhez-ai-agent`
          });
        } catch (modelErr) {
          console.warn(`Gemini Model ${m} Notice:`, modelErr.message);
        }
      }
    }

    // Expert Fallback
    const fallbackText = getFallbackUrduResponse(prompt);
    const cleanSpeechText = convertNumbersToUrduWords(fallbackText);
    return res.json({
      text: fallbackText,
      speechText: cleanSpeechText,
      provider: 'zarkhez-expert-fallback'
    });

  } catch (error) {
    console.error('Chat General Error:', error.message);
    const fallbackText = getFallbackUrduResponse(req.body.prompt || '');
    return res.json({
      text: fallbackText,
      speechText: convertNumbersToUrduWords(fallbackText),
      provider: 'zarkhez-expert-fallback'
    });
  }
});

// API 2: Speech-to-Text (STT)
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  if (req.file) fs.unlink(req.file.path, () => {});
  return res.json({ text: '', fallbackToBrowser: true });
});

// Helper Function: Low-Latency High Quality Urdu Speech Audio Stream
async function generateUrduSpeechAudio(text, voiceId) {
  const cleanSpeech = convertNumbersToUrduWords(text).substring(0, 300);
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  const targetVoice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

  // Tier 1: ElevenLabs Multilingual Female Voice with Low-Latency Optimization
  if (elevenLabsApiKey && elevenLabsApiKey.startsWith('sk_')) {
    try {
      console.log(`Synthesizing Zarkhez Voice with ElevenLabs (${targetVoice})... Text: ${cleanSpeech.substring(0, 50)}...`);
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}?optimize_streaming_latency=3`,
        {
          text: cleanSpeech,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.55, similarity_boost: 0.85 }
        },
        {
          headers: { 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
          responseType: 'arraybuffer',
          timeout: 8000
        }
      );
      return Buffer.from(response.data);
    } catch (elevenErr) {
      console.warn('ElevenLabs API Notice, switching to Google Urdu Speech engine:', elevenErr.response ? elevenErr.response.status : elevenErr.message);
    }
  }

  // Tier 2: Google Urdu TTS Speech Stream (Fast fallback)
  console.log('Synthesizing Zarkhez Voice with Google Urdu Speech engine...');
  const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanSpeech)}&tl=ur&client=tw-ob`;
  const response = await axios.get(gttsUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    responseType: 'arraybuffer',
    timeout: 5000
  });
  return Buffer.from(response.data);
}

// API 3: Text-to-Speech (TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const audioBuffer = await generateUrduSpeechAudio(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="zarkhez-voice.mp3"',
      'Content-Length': audioBuffer.length
    });
    return res.send(audioBuffer);

  } catch (error) {
    console.error('TTS Audio Error:', error.message);
    return res.status(500).json({ error: 'TTS audio synthesis failed' });
  }
});

app.get('/api/tts', async (req, res) => {
  try {
    const text = req.query.text;
    const voiceId = req.query.voiceId;
    if (!text) {
      return res.status(400).json({ error: 'Text query parameter required' });
    }

    const audioBuffer = await generateUrduSpeechAudio(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="zarkhez-voice.mp3"',
      'Content-Length': audioBuffer.length
    });
    return res.send(audioBuffer);

  } catch (error) {
    console.error('TTS GET Audio Error:', error.message);
    return res.status(500).json({ error: 'TTS audio synthesis failed' });
  }
});

// API 4: Engro Fertilizer Dosage Calculator Matrix
app.post('/api/calculator', (req, res) => {
  const { crop, acres = 1 } = req.body;
  const numAcres = parseFloat(acres) || 1;

  const recommendations = {
    wheat: {
      cropUrdu: 'گندم',
      engroUrea: (2.5 * numAcres).toFixed(1),
      engroDap: (1.5 * numAcres).toFixed(1),
      engroZabardast: (1.0 * numAcres).toFixed(1),
      engroZarkhez: (1.0 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری اینگرو ڈی اے پی + 0.5 بوری یوریا۔ پہلے پانی پر: 1 بوری اینگرو زبردست یوریا۔ دوسرے پانی پر: 1 بوری اینگرو زرخیز پوٹاش۔'
    },
    rice: {
      cropUrdu: 'دھان (چاول)',
      engroUrea: (2.0 * numAcres).toFixed(1),
      engroDap: (1.0 * numAcres).toFixed(1),
      engroZabardast: (1.0 * numAcres).toFixed(1),
      engroZarkhez: (0.75 * numAcres).toFixed(1),
      schedule: 'پنیری کے وقت: 1 بوری اینگرو ڈی اے پی۔ 15-20 دن بعد: 1 بوری اینگرو زبردست یوریا (زنک کے ساتھ)۔ 35-40 دن بعد: 1 بوری اینگرو یوریا۔'
    },
    cotton: {
      cropUrdu: 'کپاس',
      engroUrea: (3.0 * numAcres).toFixed(1),
      engroDap: (1.5 * numAcres).toFixed(1),
      engroZabardast: (1.5 * numAcres).toFixed(1),
      engroZarkhez: (1.25 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری اینگرو ڈی اے پی + 1 بوری زرخیز۔ گوڈی اور پھول آنے پر زبردست یوریا کی اقساط۔'
    },
    sugarcane: {
      cropUrdu: 'کماد (گنا)',
      engroUrea: (4.0 * numAcres).toFixed(1),
      engroDap: (2.0 * numAcres).toFixed(1),
      engroZabardast: (2.0 * numAcres).toFixed(1),
      engroZarkhez: (1.5 * numAcres).toFixed(1),
      schedule: 'کاشت کے وقت: 2 بوری اینگرو ڈی اے پی + 1 بوری اینگرو زرخیز۔ فروری/مارچ اور مئی/جون میں زبردست یوریا کی اقساط۔'
    },
    maize: {
      cropUrdu: 'مکئی',
      engroUrea: (3.5 * numAcres).toFixed(1),
      engroDap: (1.5 * numAcres).toFixed(1),
      engroZabardast: (1.5 * numAcres).toFixed(1),
      engroZarkhez: (1.0 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری اینگرو ڈی اے پی۔ 4 تا 6 پتے کے مرحلے پر: 1.5 بوری زبردست یوریا۔ چھلی بنتے وقت: 2 بوری اینگرو یوریا۔'
    }
  };

  const selected = recommendations[crop] || recommendations.wheat;
  return res.json({ success: true, acres: numAcres, ...selected });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌿 Zarkhez AI Agent (Engro) Server Running on Port ${PORT}`);
  console.log(`🌐 Open http://localhost:5000 in your browser`);
  console.log(`====================================================`);
});
