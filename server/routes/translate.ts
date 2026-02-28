import { RequestHandler } from "express";

// Flatten nested object to dot-notation keys
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key]);
    }
  }
  return result;
}

// Unflatten dot-notation keys back to nested object
function unflattenObject(flat: Record<string, string>): any {
  const result: any = {};
  for (const key in flat) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = flat[key];
  }
  return result;
}

export const handleTranslate: RequestHandler = async (req, res) => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const { translations, targetLanguage } = req.body;
    if (!translations || !targetLanguage) {
      return res.status(400).json({ error: "translations and targetLanguage are required" });
    }

    // Flatten the translation object for batch translation
    const flat = flattenObject(translations);
    const entries = Object.entries(flat);

    // Split into chunks to fit within token limits (batches of 80 keys)
    const CHUNK_SIZE = 80;
    const chunks: [string, string][][] = [];
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      chunks.push(entries.slice(i, i + CHUNK_SIZE));
    }

    const translatedFlat: Record<string, string> = {};

    for (const chunk of chunks) {
      const textsToTranslate = Object.fromEntries(chunk);

      const prompt = `Translate ALL the following UI text strings to ${targetLanguage}. 
These are interface labels for a tax/GST management application used in India.

IMPORTANT RULES:
1. Return ONLY valid JSON with the exact same keys
2. Translate the VALUES only, keep keys unchanged
3. Keep technical terms like GST, GSTR, CGST, SGST, IGST, ITC, HSN, SKU, OCR, CSV, AI, PDF, JPG, PNG as-is
4. Keep email placeholders like "your@email.com" as-is
5. Keep currency symbols like ₹ as-is
6. Keep special characters like ••••••••, © as-is
7. Do NOT add any explanation or markdown
8. Translate naturally for the target language, not word-by-word

JSON to translate:
${JSON.stringify(textsToTranslate, null, 2)}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.1,
          max_tokens: 4000,
          messages: [
            {
              role: "system",
              content: `You are a professional translator specializing in Indian languages and UI localization. You translate UI strings for a tax management application. Return only valid JSON.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Translation] Groq API error:", response.status, errorData);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";

      // Extract JSON from response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      const rawJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) {
        jsonStr = rawJsonMatch[0];
      }

      try {
        const parsed = JSON.parse(jsonStr);
        Object.assign(translatedFlat, parsed);
      } catch (parseErr) {
        console.error("[Translation] Failed to parse chunk response:", parseErr);
        // Use original values for failed chunks
        Object.assign(translatedFlat, textsToTranslate);
      }
    }

    // Unflatten back to nested structure
    const translatedNested = unflattenObject(translatedFlat);

    return res.status(200).json({ translations: translatedNested });
  } catch (error: any) {
    console.error("[Translation] Error:", error?.message);
    return res.status(500).json({ error: error?.message || "Translation failed" });
  }
};
