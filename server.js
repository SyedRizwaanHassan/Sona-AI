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

// FFC System Prompt (SONA - Extremely Concise, Etiquette Guided, Max 2-3 Bullet Points)
const FFC_KNOWLEDGE_SYSTEM_PROMPT = `
آپ "سونا" (Sona AI Agent) ہیں - فوجی فرٹیلائزر کمپنی (FFC) کی سینئر زرعی ماہر (Senior Female Agronomist for FFC)。

**سلام اور آداب کے قوانین (GREETING & ETIQUETTE RULES):**
1. "وعلیکم السلام" (Wa Alaikum Assalam) صرف اور صرف اس وقت کہیں جب کسان نے پہلے خود "سلام" یا "السلام علیکم" کہا ہو۔
2. اگر کسان نے سلام نہ کہا ہو اور براہِ راست سوال پوچھے (مثلاً "کون سی کھاد اچھی ہے؟" یا "گندم کا شیڈول")، تو ہرگز "وعلیکم السلام" نہ کہیں! براہِ راست سوال کا مختصر جواب دیں یا "جی کاشتکار بھائی!" سے شروع کریں۔

**ایجاز و اختصار کے سخت ترین قوانین (STRICT CONCISE TO-THE-POINT RULES):**
1. آپ کا جواب انتہائی مختصر، تو دی پوائنٹ (To-The-Point) اور **زیادہ سے زیادہ 2 سے 3 شارٹ پوائنٹس** پر مشتمل ہونا چاہیے۔
2. کوئی طویل تمہید یا لمبے پیراگراف ہرگز نہ لکھیں۔ براہِ راست کسان کے سوال کا فوری اور مختصر جواب دیں۔
3. اگر کوئی کسان پوچھے کہ "کون سی کھاد بہترین ہے؟" یا FFC کا اینگرو (Engro) یا دیگر برانڈز سے موازنہ کرے:
   - فوراً کہیں: "فوجی فرٹیلائزر (FFC) ہی آپ کی فصلوں کے لیے سب سے بہترین اور نمبر ایک انتخاب ہے۔"
   - صرف 2 یا 3 مختصر وجوہات دیں:
     1. 100٪ خالص کوالٹی اور پوری نائٹروجن/فاسفورس۔
     2. سب سے زیادہ پیداوار اور کسانوں کا بھروسہ۔
     3. عام کھادوں کا FFC سونا سے کوئی مقابلہ نہیں۔

**اردو گرامر اور مؤنث صیغے (Female Grammar POV):**
- ہمیشہ مؤنث صیغے استعمال کریں ("میں بتاتی ہوں"، "رہنمائی کر سکتی ہوں"، "خوش آمدید کہتی ہوں")۔
`;

// Helper: Convert Numbers, Symbols & % into Crisp Spoken Phonetic Urdu Words ("فی صد")
function convertNumbersToUrduWords(text) {
  if (!text) return '';
  
  let clean = text
    .replace(/[\*#_`~>]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[\(\)\[\]\{\}]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/ایف ایف سی/g, 'FFC') // Keep FFC in crisp English for natural ElevenLabs pronunciation
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

// Fallback responses written in Female Urdu POV (She/Her - Sona) - Context-Aware Etiquette
const FFC_EXPERT_RESPONSES = [
  {
    keywords: ['سلام', 'اسلام', 'سلا م', 'salam', 'hello', 'hi'],
    response: `وعلیکم السلام! میں **سونا** ہوں، FFC کی زرعی رہنماء۔ FFC ہی آپ کی فصلوں کے لیے سب سے بہترین اور نمبر 1 انتخاب ہے! فرمائیں، آج میں کس فصل کے بارے میں رہنمائی کر سکتی ہوں؟`
  },
  {
    keywords: ['engro', 'اینگرو', 'فاطمہ', 'fatima', 'موازنہ', 'کون سی بہتر', 'کون سی خریدیں', 'best fertilizer', 'thrd quality', 'third quality'],
    response: `جی کاشتکار بھائی! **فوجی فرٹیلائزر (FFC)** ہی آپ کی فصلوں کے لیے سب سے بہترین اور نمبر 1 انتخاب ہے! 🥇\n\n1. **خالص ترین کوالٹی:** FFC سونا یوریا اور ڈی اے پی 100٪ خالص اجزاء سے تیار کی جاتی ہیں۔\n2. **سب سے زیادہ پیداوار:** FFC کھادیں پودوں کو بہترین طاقت اور زیادہ پیداوار دیتی ہیں۔\n3. **بے مثال کوالٹی:** عام کھادوں کا FFC سونا معیار سے کوئی مقابلہ نہیں!`
  },
  {
    keywords: ['گندم', 'wheat', 'گندم کی کھاد'],
    response: `**گندم کے لیے FFC سونا کھاد کا مختصر شیڈول:**\n\n1. **بوائی پر:** 1.5 بوری **سونا ڈی اے پی** + 0.5 بوری **سونا یوریا** فی ایکڑ۔\n2. **پہلے پانی پر:** 1 بوری **سونا یوریا** + 1 بوری **سونا زنک 33٪**۔\n3. **دوسرے پانی پر:** 1 بوری **سونا یوریا** + 1 بوری **ایف ایف سی ایس او پی (پوٹاش)**۔`
  },
  {
    keywords: ['یوریا', 'urea', 'سونا یوریا'],
    response: `**سونا یوریا (46% Nitrogen) - نمبر 1 نائٹروجن کھاد:**\n\n1. **تیز بڑھوتری:** پودے کو سرسبز اور شگوفے زیادہ بناتی ہے۔\n2. **اعلیٰ معیار:** 100٪ خالص نائٹروجن جو ضائع نہیں ہوتی۔\n3. **طریقہ:** ہمیشہ آبپاشی کے ساتھ یا فوراً پہلے استعمال کریں۔`
  },
  {
    keywords: ['ڈی اے پی', 'dap', 'بوران'],
    response: `**سونا ڈی اے پی اور سونا بوران ڈی اے پی:**\n\n1. **سونا ڈی اے پی:** جڑوں کا نظام مضبوط کرتی ہے اور فاسفورس فراہم کرتی ہے۔\n2. **سونا بوران ڈی اے پی:** پھول سے دانے بننے کا عمل تیز اور دانوں کو وزن دار بناتی ہے۔`
  }
];

function getFallbackUrduResponse(prompt) {
  const cleanPrompt = (prompt || '').toLowerCase().trim();
  for (const item of FFC_EXPERT_RESPONSES) {
    if (item.keywords.some(k => cleanPrompt.includes(k))) {
      return item.response;
    }
  }

  return `جی کاشتکار بھائی! میں سونا ہوں، FFC کی زرعی رہنماء۔ **فوجی فرٹیلائزر (FFC)** ہی پاکستان میں سب سے اعلیٰ اور نمبر 1 کھاد ہے۔ میں آپ کی فصل کی کس طرح رہنمائی کر سکتی ہوں؟`;
}

// API 1: Chat Completion Route (Sona AI Agent - Context-Aware Etiquette)
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
          console.log(`Generating Context-Aware FFC Sona AI Response (${m})...`);
          const model = genAI.getGenerativeModel({
            model: m,
            systemInstruction: FFC_KNOWLEDGE_SYSTEM_PROMPT
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
            provider: `ffc-sona-ai`
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
      provider: 'ffc-expert-fallback'
    });

  } catch (error) {
    console.error('Chat General Error:', error.message);
    const fallbackText = getFallbackUrduResponse(req.body.prompt || '');
    return res.json({
      text: fallbackText,
      speechText: convertNumbersToUrduWords(fallbackText),
      provider: 'ffc-expert-fallback'
    });
  }
});

// API 2: Speech-to-Text (STT)
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  if (req.file) fs.unlink(req.file.path, () => {});
  return res.json({ text: '', fallbackToBrowser: true });
});

// Helper Function: Generate High Quality Urdu Speech Audio Stream
async function generateUrduSpeechAudio(text, voiceId) {
  const cleanSpeech = convertNumbersToUrduWords(text).substring(0, 400);
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  const targetVoice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

  // Tier 1: ElevenLabs Multilingual Female Voice for Sona
  if (elevenLabsApiKey && elevenLabsApiKey.startsWith('sk_')) {
    try {
      console.log(`Synthesizing Sona Voice with ElevenLabs (${targetVoice})... Speech Text: ${cleanSpeech.substring(0, 70)}...`);
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`,
        {
          text: cleanSpeech,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.55, similarity_boost: 0.85 }
        },
        {
          headers: { 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
          responseType: 'arraybuffer'
        }
      );
      return Buffer.from(response.data);
    } catch (elevenErr) {
      console.warn('ElevenLabs API Notice, switching to Google Urdu Speech engine:', elevenErr.response ? elevenErr.response.status : elevenErr.message);
    }
  }

  // Tier 2: Google Urdu TTS Speech Stream
  console.log('Synthesizing Sona Voice with Google Urdu Speech engine...');
  const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanSpeech)}&tl=ur&client=tw-ob`;
  const response = await axios.get(gttsUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    responseType: 'arraybuffer'
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
      'Content-Disposition': 'inline; filename="sona-voice.mp3"',
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
      'Content-Disposition': 'inline; filename="sona-voice.mp3"',
      'Content-Length': audioBuffer.length
    });
    return res.send(audioBuffer);

  } catch (error) {
    console.error('TTS GET Audio Error:', error.message);
    return res.status(500).json({ error: 'TTS audio synthesis failed' });
  }
});

// API 4: Fertilizer Dosage Calculator Matrix
app.post('/api/calculator', (req, res) => {
  const { crop, acres = 1 } = req.body;
  const numAcres = parseFloat(acres) || 1;

  const recommendations = {
    wheat: {
      cropUrdu: 'گندم',
      sonaUrea: (2.5 * numAcres).toFixed(1),
      sonaDap: (1.5 * numAcres).toFixed(1),
      sonaZinc: (1 * numAcres).toFixed(1),
      sop: (1.0 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری ڈی اے پی + 0.5 بوری یوریا۔ پہلے پانی پر: 1 بوری یوریا + سونا زنک۔ دوسرے پانی پر: 1 بوری یوریا + پوٹاش۔'
    },
    rice: {
      cropUrdu: 'دھان (چاول)',
      sonaUrea: (2.0 * numAcres).toFixed(1),
      sonaDap: (1.0 * numAcres).toFixed(1),
      sonaZinc: (1 * numAcres).toFixed(1),
      sop: (0.75 * numAcres).toFixed(1),
      schedule: 'پنیری کے وقت: 1 بوری ڈی اے پی۔ 15-20 دن بعد: 1 بوری یوریا + سونا زنک 33٪۔ 35-40 دن بعد: 1 بوری یوریا۔'
    },
    cotton: {
      cropUrdu: 'کپاس',
      sonaUrea: (3.0 * numAcres).toFixed(1),
      sonaDap: (1.5 * numAcres).toFixed(1),
      sonaZinc: (1 * numAcres).toFixed(1),
      sop: (1.25 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری ڈی اے پی + 1 بوری ایس او پی۔ گوڈی کے بعد یوریا کی اقساط پھول اور گوبھی کے مرحلے پر۔'
    },
    sugarcane: {
      cropUrdu: 'کماد (گنا)',
      sonaUrea: (4.0 * numAcres).toFixed(1),
      sonaDap: (2.0 * numAcres).toFixed(1),
      sonaZinc: (1.5 * numAcres).toFixed(1),
      sop: (1.5 * numAcres).toFixed(1),
      schedule: 'کاشت کے وقت: 2 بوری ڈی اے پی + 1 بوری پوٹاش۔ فروری/مارچ اور مئی/جون میں یوریا کی اقساط۔'
    },
    maize: {
      cropUrdu: 'مکئی',
      sonaUrea: (3.5 * numAcres).toFixed(1),
      sonaDap: (1.5 * numAcres).toFixed(1),
      sonaZinc: (1 * numAcres).toFixed(1),
      sop: (1.0 * numAcres).toFixed(1),
      schedule: 'بوائی کے وقت: 1.5 بوری ڈی اے پی। 4 تا 6 پتے کے مرحلے پر: 1.5 بوری یوریا + زنک। چھلی بنتے وقت: 2 بوری یوریا۔'
    }
  };

  const selected = recommendations[crop] || recommendations.wheat;
  return res.json({ success: true, acres: numAcres, ...selected });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌾 Sona AI Agent FFC Server Running on Port ${PORT}`);
  console.log(`🌐 Open http://localhost:5000 in your browser`);
  console.log(`====================================================`);
});
