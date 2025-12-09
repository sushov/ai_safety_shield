// server/index.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";

app.post("/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("⚡ Analyzing prompt:", prompt); // LOG 1

    // 1. Structure the output
    const responseSchema = {
      type: "OBJECT",
      properties: {
        riskScore: { type: "INTEGER" },
        summary: { type: "STRING" },
        categories: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              label: { type: "STRING" },
              severity: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
              triggered: { type: "BOOLEAN" },
            }
          }
        },
        suggestions: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["riskScore", "summary", "categories", "suggestions"]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI Safety Classifier. Analyze this prompt strictly as a safety professional.
                     Prompt: "${prompt}"
                     
                     Return JSON data matching the schema.`
            }]
          }],
          // 2. CRITICAL FIX: Disable safety filters so the model can read "unsafe" prompts
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        }),
      }
    );

    const data = await response.json();

    // 3. DEBUGGING: Log the raw response if it fails
    if (data.error) {
      console.error("❌ Google API Error:", JSON.stringify(data, null, 2));
      return res.status(500).send({ error: data.error.message });
    }

    const jsonString = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
      console.error("❌ Empty Response. Full Data:", JSON.stringify(data, null, 2));
      // Usually means the model was blocked despite our settings
      return res.status(422).send({ 
        error: "Model refused to generate a response (Safety Block)." 
      });
    }

    const parsedResult = JSON.parse(jsonString);
    console.log("✅ Analysis success:", parsedResult.riskScore);
    res.send(parsedResult);

  } catch (err) {
    console.error("❌ SERVER CRASH:", err);
    res.status(500).send({ error: "Backend script crashed. Check terminal for details." });
  }
});

app.listen(3001, () => console.log("✅ Server running on http://localhost:3001"));