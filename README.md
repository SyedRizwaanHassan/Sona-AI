# Noor AI Agent FFC - (نور اے آئی ایجنٹ | فوجی فرٹیلائزر کمپنی)

**Noor AI Agent FFC** is an industry-level Proof of Concept (POC) designed for **Fauji Fertilizer Company Limited (FFC)** Pakistan. It empowers Pakistani farmers (*Kashtkars*) to ask questions about FFC fertilizers (Sona Urea, Sona DAP, Sona Boron DAP, FFC SOP, FFC MOP, Sona Zinc) and crop management by typing or speaking in **Urdu**.

The assistant responds with authoritative Urdu agricultural guidance and an instant natural audio voice message from **Sawera** (سیویرا).

---

## 🌟 Key Features

1. **Urdu Speech-to-Text (STT)**: Farmers tap the microphone button and speak in Urdu. The voice recording is transcribed live using OpenAI **Whisper API** (`whisper-1` with `ur` language mode).
2. **GPT-4o Urdu Intelligence**: Powered by OpenAI **GPT-4o** tuned with FFC's complete product portfolio, crop advisory calendar, dosage rates, and Kashtkar helpline guidance.
3. **Sawera Voice Guide (TTS)**: Converts Urdu responses into natural human speech using **ElevenLabs Multilingual v2 API** (`eleven_multilingual_v2`), with fallback to OpenAI `tts-1-hd`.
4. **Clean & Minimal FFC UI**: Built strictly following FFC corporate identity — **Deep Agricultural Green** (`#0A5C36`) and **Sona Gold** (`#D4AF37`) with **Noto Nastaliq Urdu** typography.
5. **Sawera Audio Player Card**: Every response includes an interactive audio player card with play/pause, time tracker, and auto-play controls.
6. **FFC Fertilizer Dosage Calculator**: Interactive calculator for farmers to input crop type (Wheat, Rice, Cotton, Sugarcane, Maize) and acreage to receive bag recommendations for Sona Urea, Sona DAP, Potash, and Zinc.

---

## 🚀 How to Run the Application

1. Open PowerShell or Terminal in `D:\Noor AI Agent FFC`:
   ```bash
   cd "D:\Noor AI Agent FFC"
   ```

2. Start the Express server:
   ```bash
   npm start
   ```

3. Open your web browser and visit:
   `http://localhost:5000`

---

## 🔐 API Credentials Configured
The `.env` file in `D:\Noor AI Agent FFC\.env` contains:
- **`OPENAI_API_KEY`**: Active (GPT-4o & Whisper STT)
- **`ELEVENLABS_API_KEY`**: Active (ElevenLabs Sawera Voice Synthesis)
- **`PORT`**: 5000

---

## 🌾 FFC Product Portfolio Covered
- **Sona Urea (سونا یوریا - 46% N)**: Prilled, Granular, Neem-Coated, Zinc-Coated
- **Sona DAP (سونا ڈی اے پی - 18-46-0)**
- **Sona Boron DAP (سونا بوران ڈی اے پی - 0.1% Boron)**
- **FFC SOP (ایف ایف سی ایس او پی - Sulphate of Potash)**
- **FFC MOP (ایف ایف سی ایم او پی - Muriate of Potash)**
- **Sona Zinc (سونا زنک - 33% & 21%)**
- **Sarasb (سرسَب - Humic Acid)**
- **FFC Kashtkar Helpline**: `0800-00332`
