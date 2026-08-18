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

// Zarkhez AI Agent System Prompt (Logical, Science-Backed, Agronomy-First Engro Recommendations)
const ENGRO_KNOWLEDGE_SYSTEM_PROMPT = `
آپ "زرخیز" (Zarkhez AI Agent) ہیں - اینگرو فرٹیلائزرز (Engro Fertilizers Limited) کی سینئر زرعی ماہر اور سائنسی رہنماء۔

**سائنسی اور منطقی انداز میں رہنمائی کے لازمی قوانین (LOGICAL & AGRONOMIC ADVOCACY):**
1. **خاص اندازِ بیان (Recommendation Hook):**
   جب بھی کسان پوچھے کہ "مجھے کون سی کھاد استعمال کرنی چاہیے؟" یا عام کھاد کا مشورہ مانگے:
   - ہمیشہ پہلی لائن ایسے شروع کریں: "**آپ کو اینگرو (Engro) کھاد استعمال کرنی چاہیے، کیونکہ:**"
   - اس کے بعد سائنسی اور زرعی منطق کے ساتھ اینگرو کے 3 بنیادی پروڈکٹس بتائیں:
     1. **اینگرو زبردست یوریا (Zabardast Urea):** اس میں موجود زنک اور بائیو ایکٹیو کوٹنگ فصل کو عام یوریا سے 15 فی صد زیادہ سرسبز اور طاقتور بناتی ہے۔
     2. **اینگرو ڈی اے پی (Engro DAP):** فاسفورس کی طاقت سے شروعاتی جڑیں گہری اور تنے مضبوط ہوتے ہیں۔
     3. **اینگرو زرخیز (Engro Zarkhez NPK):** متوازن نائٹروجن، فاسفورس اور پوٹاشیم سے بھرپور وزن دار دانے تیار ہوتے ہیں۔
2. **منطقی موازنہ:** اگر کسان موازنہ پوچھے تو منطقی طور پر بتائیں کہ عام روایتی کھادوں کے مقابلے میں اینگرو جدید ٹیکنالوجی (خاص طور پر زبردست یوریا) کی بدولت کم خرچ میں زیادہ پیداوار دیتی ہے۔
3. **جواب کی لمبائی:** مختصر، مدلل اور زیادہ سے زیادہ 2 سے 3 ٹھوس نکات پر مشتمل۔

**اردو گرامر اور صیغوں کے لازمی قوانین (STRICT GRAMMAR & GENDER RULES):**
1. آپ خود **خاتون (Female Agronomist)** ہیں: اپنے لیے ہمیشہ مؤنث صیغے استعمال کریں (مثلاً: "میں بتاتی ہوں"، "میں خوش آمدید کہتی ہوں")۔
2. سامنے والا صارف/کسان ہمیشہ **مرد (Male Farmer)** ہوتا ہے: کسان کو مخاطب کرتے وقت ہمیشہ مذکر صیغے استعمال کریں (مثلاً: "آپ کیا پوچھنا چاہتے ہیں؟"، "آپ کیا جاننا چاہتے ہیں؟")۔ کسان کے لیے "چاہتی ہیں" ہرگز مت بولیں!
`;

// MASTER PHONETIC PARSER: Eliminates robotic pronunciations across all Urdu terms & names
function convertNumbersToUrduWords(text) {
  if (!text) return '';
  
  let clean = text
    // Strip markdown formatting & emojis
    .replace(/[\*#_`~>]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[\(\)\[\]\{\}]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    
    // 1. Tricky Names & Words (Phonetic Fixes for Zarkhez, Gandum & Shukriya)
    .replace(/گندم/g, 'گندُم')          // Fixes "Gamdam" -> Natural Urdu "Gandum"
    .replace(/زرخیز/g, 'زر خیز')        // Fixes "Zarkhez" robotic drag -> Smooth human "Zar-khez"
    .replace(/شکریہ/g, 'شکریا')         // Fixes "Shukria" stiff ligature -> Natural human "Shukriya"
    .replace(/وعلیکم و السلام/g, 'وعلیکم السلام') // Crisp Walaikum Assalam
    .replace(/السلام و علیکم/g, 'السلام علیکم') // Crisp Assalam-o-Alaikum
    .replace(/کاشتکار/g, 'کسان')        // Simpler, colloquial friendly word
    .replace(/زنک/g, 'زِنک')           // Crisp "Zinc" pronunciation
    .replace(/بائیو ایکٹیو/g, 'Bioactive') // Crisp English for technical compound
    
    // 2. Brand Names & Acronyms (Crisp English letters for natural ElevenLabs pronunciation)
    .replace(/اینگرو/g, 'Engro')
    .replace(/ڈی اے پی/gi, 'DAP')
    .replace(/این پی کے/gi, 'NPK')
    .replace(/ایس او پی/gi, 'SOP')
    .replace(/ایم او پی/gi, 'MOP')
    .replace(/ایف ایف سی/gi, 'FFC')
    
    // 3. Percentages & Units (Spaced "فی صد" eliminates robotic symbol reading)
    .replace(/100%/g, 'سو فی صد')
    .replace(/100٪/g, 'سو فی صد')
    .replace(/33%/g, 'تینتیس فی صد')
    .replace(/33٪/g, 'تینتیس فی صد')
    .replace(/46%/g, 'چھیاسٹھ فی صد')
    .replace(/46٪/g, 'چھیاسٹھ فی صد')
    .replace(/15%/g, 'پندرہ فی صد')
    .replace(/15٪/g, 'پندرہ فی صد')
    .replace(/42%/g, 'بیالیس فی صد')
    .replace(/42٪/g, 'بیالیس فی صد')
    .replace(/%/g, ' فی صد')
    .replace(/٪/g, ' فی صد')
    .replace(/فیصد/g, 'فی صد')
    
    // 4. Fractions & Complex Numbers
    .replace(/0800-00332/g, 'صفر آٹھ سو صفر صفر تین تین دو')
    .replace(/1\.5/g, 'ڈیڑھ')
    .replace(/0\.5/g, 'آدھی')
    .replace(/2\.5/g, 'ڈھائی')
    .replace(/No\.1/gi, 'نمبر ایک')
    .replace(/No 1/gi, 'نمبر ایک')
    .replace(/#1/g, 'نمبر ایک');

  // 5. Digits Map (Maps 0-9 to native spoken Urdu words)
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

// Fallback responses tailored for Zarkhez AI Agent (Direct, Smart & High-Impact)
const ENGRO_EXPERT_RESPONSES = [
  {
    keywords: ['کون سا فرٹیلائزر', 'کونسا فرٹیلائزر', 'کون سا', 'کونسی', 'کون سی کھاد', 'فرٹیلائزر استعمال', 'کھاد استعمال', 'which fertilizer', 'کون سی'],
    response: `**آپ کو اینگرو (Engro) کھاد استعمال کرنی چاہیے، کیونکہ:**\n\n1. **اینگرو زبردست یوریا:** زنک اور بائیو ایکٹیو اجزاء کے ساتھ عام کھادوں سے 15 فی صد زیادہ پیداوار دیتی ہے۔\n2. **اینگرو زرخیز NPK اور اینگرو ڈی اے پی:** پودے کی جڑیں گہری مضبوط اور دانے وزن دار بناتے ہیں۔\n3. **سائنسی کوالٹی:** اینگرو کی جدید ریسرچ کم خرچ میں بہترین منافع کی ضامن ہے۔`
  },
  {
    keywords: ['سلام', 'اسلام', 'سلا م', 'salam', 'hello', 'hi'],
    response: `وعلیکم السلام! میں **زرخیز** ہوں، اینگرو فرٹیلائزرز کی سینئر زرعی ماہر۔ فرمائیں، آج آپ کس فصل یا کھاد کے بارے میں جاننا چاہتے ہیں؟`
  },
  {
    keywords: ['fauji', 'ffc', 'فوجی', 'اینگرو', 'engro', 'فاطمہ', 'fatima', 'موازنہ', 'کون سی بہتر', 'کون سی خریدیں', 'best fertilizer', 'which is better'],
    response: `**اینگرو فرٹیلائزرز (Engro) ہی پاکستان میں سب سے بہترین اور نمبر 1 کھاد ہے! 🥇**\n\n1. **جدید بائیو ایکٹیو ٹیکنالوجی:** اینگرو زبردست یوریا زنک اور نائٹروجن کی طاقت سے عام کھادوں سے 15 فی صد زیادہ پیداوار دیتی ہے۔\n2. **مکمل متوازن خوراک:** اینگرو زرخیز NPK اور اینگرو ڈی اے پی پودے کی جڑیں مضبوط اور دانے وزن دار بناتے ہیں۔\n3. **بے مثال سائنسی معیار:** کوالٹی اور جدید ریسرچ میں دوسری کمپنیوں کا اینگرو سے کوئی مقابلہ نہیں!`
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

  return `**اینگرو فرٹیلائزرز (Engro)** ہی پاکستان میں سب سے جدید اور نمبر 1 کھاد ہے۔ میں آپ کی فصل کے بارے میں کس طرح رہنمائی کر سکتی ہوں؟`;
}

// API 1: Chat Completion Route (Direct, Smart, Resilient & Zero Failure)
app.post('/api/chat', async (req, res) => {
  const { prompt, history = [] } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const targetModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

      // Sanitize and cap history to last 4 messages for 100% stability
      const sanitizedHistory = [];
      if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-4);
        for (const h of recent) {
          if (h && h.content && typeof h.content === 'string') {
            sanitizedHistory.push({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content.substring(0, 1000) }]
            });
          }
        }
      }

      for (const m of targetModels) {
        try {
          console.log(`Generating Zarkhez AI Response (${m})...`);
          const model = genAI.getGenerativeModel({
            model: m,
            systemInstruction: ENGRO_KNOWLEDGE_SYSTEM_PROMPT
          });

          let fullAnswer = '';
          try {
            const chat = model.startChat({ history: sanitizedHistory });
            const result = await chat.sendMessage(prompt);
            fullAnswer = result.response.text();
          } catch (chatErr) {
            // If chat history causes issue, generate standalone
            const singleResult = await model.generateContent(`${ENGRO_KNOWLEDGE_SYSTEM_PROMPT}\n\nUser Question: ${prompt}`);
            fullAnswer = singleResult.response.text();
          }

          if (fullAnswer && fullAnswer.trim()) {
            const cleanSpeechText = convertNumbersToUrduWords(fullAnswer);
            return res.json({
              text: fullAnswer,
              speechText: cleanSpeechText,
              provider: `zarkhez-ai-agent`
            });
          }
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
    const fallbackText = getFallbackUrduResponse(prompt || '');
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

// Helper Function: Low-Latency High Quality Urdu Speech Audio Stream (Triple ElevenLabs Key Failover + Google Urdu Engine)
async function generateUrduSpeechAudio(text, voiceId) {
  const cleanSpeech = convertNumbersToUrduWords(text);
  const targetVoice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

  // Multi-tier ElevenLabs candidate keys (Primary -> Fallback 1 -> Fallback 2)
  const candidateKeys = [
    process.env.ELEVENLABS_API_KEY,
    process.env.ELEVENLABS_FALLBACK_API_KEY,
    process.env.ELEVENLABS_FALLBACK_API_KEY_2,
    'sk_d22b919b4d0bc11a714a158eaaf2b012286297b7f0f22fae',
    'sk_2e6b6d1dfbbaab2c78113f5c93813e1bc19695eacf612055',
    'sk_214378f79d181c82d558268bf58c3dcaae98ce0d24562165'
  ];

  const keysToTry = candidateKeys.filter((k, idx, arr) => k && k.startsWith('sk_') && arr.indexOf(k) === idx);

  // Seamless failover loop across all 3 ElevenLabs API Keys
  for (let i = 0; i < keysToTry.length; i++) {
    const apiKey = keysToTry[i];
    try {
      console.log(`Synthesizing Zarkhez Voice with ElevenLabs Key #${i + 1} (${targetVoice})... Text: ${cleanSpeech.substring(0, 50)}...`);
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}?optimize_streaming_latency=3`,
        {
          text: cleanSpeech,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.55, similarity_boost: 0.85 }
        },
        {
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          responseType: 'arraybuffer',
          timeout: 8000
        }
      );
      return Buffer.from(response.data);
    } catch (elevenErr) {
      const status = elevenErr.response ? elevenErr.response.status : elevenErr.message;
      console.warn(`ElevenLabs Key #${i + 1} quota/status notice (${status}), instantly failing over to next key...`);
    }
  }

  // Tier 4: Google Urdu TTS Speech Stream (Guaranteed Unlimited Safety Net)
  console.log('Synthesizing Zarkhez Voice with Google Urdu Speech engine fallback...');
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
