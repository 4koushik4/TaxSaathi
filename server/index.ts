import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "./routes/products";
import { handleTranslate } from "./routes/translate";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function parseInvoiceText(text: string) {
  // Extract invoice number
  const invoiceNumberMatch = text.match(/(?:invoice|inv|bill)[\s#:\.no-]*(\w+[-\/]?\w*)/i);
  const invoiceNumber = invoiceNumberMatch?.[1] || `INV-${Date.now().toString().slice(-6)}`;

  // Extract date (various formats)
  const dateMatch = text.match(/(?:date|dated)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i);
  let invoiceDate = new Date().toISOString().split("T")[0];
  if (dateMatch?.[1]) {
    try {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        invoiceDate = parsedDate.toISOString().split("T")[0];
      }
    } catch (e) {
      // Keep default date
    }
  }

  // Extract GSTIN
  const gstinMatch = text.match(/(?:gstin|gst\s*no)[\s:]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i);
  const buyerGSTIN = gstinMatch?.[1] || "";

  // Extract amounts (look for total, subtotal, tax)
  const totalMatch = text.match(/(?:total|grand\s*total|net\s*amount)[\s:₹rs.]*(\d+(?:[,\.]\d+)*)/i);
  const taxMatch = text.match(/(?:tax|gst|vat)[\s:₹rs.]*(\d+(?:[,\.]\d+)*)/i);
  
  const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
  const tax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;
  const taxableValue = total > 0 ? (total - tax) : 0;

  // Enhanced line item extraction with multiple patterns
  const lineItems: any[] = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines and total lines
    if (/^(?:s\.?no|sr\.?no|item|description|qty|quantity|rate|price|amount|total|subtotal|tax|gst)/i.test(line.trim())) {
      continue;
    }
    
    // Pattern 1: Name Qty Price (e.g., "Product Name 5 100")
    let itemMatch = line.match(/^(.+?)\s+(\d+)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:[,\.]\d+)*)\s*$/i);
    
    // Pattern 2: Name Price Qty (e.g., "Product Name 100 5")
    if (!itemMatch) {
      itemMatch = line.match(/^(.+?)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:[,\.]\d+)*)\s+(\d+)\s*$/i);
      if (itemMatch) {
        // Swap qty and price
        [itemMatch[2], itemMatch[3]] = [itemMatch[3], itemMatch[2]];
      }
    }
    
    // Pattern 3: Name with price anywhere (e.g., "Product Name - Rs. 100 x 5")
    if (!itemMatch) {
      const priceQtyMatch = line.match(/^(.+?)(?:[-:]|\s+)(?:₹|rs\.?|inr)?\s*(\d+(?:[,\.]\d+)*)\s*[x×*]\s*(\d+)/i);
      if (priceQtyMatch) {
        itemMatch = [priceQtyMatch[0], priceQtyMatch[1], priceQtyMatch[3], priceQtyMatch[2]];
      }
    }
    
    // Pattern 4: Just name and price (assume qty = 1)
    if (!itemMatch) {
      const simplePriceMatch = line.match(/^(.+?)\s+(?:₹|rs\.?|inr)\s*(\d+(?:[,\.]\d+)*)\s*$/i);
      if (simplePriceMatch && simplePriceMatch[1].length > 3) {
        itemMatch = [simplePriceMatch[0], simplePriceMatch[1], '1', simplePriceMatch[2]];
      }
    }
    
    // Pattern 5: Table-like format with tabs/spaces (Name   Qty   Rate   Amount)
    if (!itemMatch) {
      const parts = line.split(/\s{2,}|\t+/);
      if (parts.length >= 3) {
        const possibleName = parts[0];
        const numbers = parts.slice(1).map(p => p.replace(/[^\d.]/g, '')).filter(p => p && !isNaN(parseFloat(p)));
        
        if (possibleName.length > 2 && numbers.length >= 2) {
          itemMatch = [line, possibleName, numbers[0], numbers[1]];
        }
      }
    }
    
    if (itemMatch && itemMatch[1].length > 2) {
      const productName = itemMatch[1].trim().replace(/^\d+[\.\)]\s*/, ''); // Remove leading numbers like "1. " or "1)"
      const quantity = parseInt(itemMatch[2]) || 1;
      const unitPrice = parseFloat(String(itemMatch[3]).replace(/,/g, '')) || 0;
      
      // Skip if this looks like a summary line or has invalid data
      if (
        !/total|subtotal|amount paid|tax|gst|cgst|sgst|igst|discount|balance|due|grand/i.test(productName) &&
        productName.length > 2 &&
        quantity > 0 &&
        unitPrice > 0
      ) {
        lineItems.push({
          product_name: productName,
          product_id: `SKU-${Date.now()}-${lineItems.length + 1}`,
          quantity,
          unit_price: unitPrice,
          gst_percentage: 18,
          hsn_code: "",
          line_tax: (unitPrice * quantity * 0.18),
        });
      }
    }
  }

  return {
    invoice: {
      invoiceNumber,
      invoiceDate,
      buyerGSTIN,
      taxableValue: taxableValue.toFixed(2),
      cgst: (tax / 2).toFixed(2),
      sgst: (tax / 2).toFixed(2),
      igst: "0.00",
      total: total.toFixed(2),
    },
    lineItems,
  };
}

// Use Groq AI to intelligently parse invoice text into structured data
async function parseInvoiceWithGroq(text: string): Promise<{ invoice: any; lineItems: any[] } | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `You are an invoice data extraction expert. Extract structured data from invoice text.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "invoice": {
    "invoiceNumber": "string",
    "invoiceDate": "YYYY-MM-DD",
    "buyerGSTIN": "string or empty",
    "sellerGSTIN": "string or empty",
    "vendorName": "string or empty",
    "taxableValue": "number as string",
    "cgst": "number as string",
    "sgst": "number as string",
    "igst": "number as string",
    "total": "number as string"
  },
  "lineItems": [
    {
      "product_name": "string",
      "product_id": "SKU or serial",
      "quantity": number,
      "unit_price": number,
      "gst_percentage": number,
      "hsn_code": "string or empty",
      "line_tax": number
    }
  ]
}
If no line items are found, return at least one item using the total amount. Always return valid JSON.`,
          },
          {
            role: "user",
            content: `Extract invoice data from this OCR text:\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[Groq Invoice Parse] API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    console.log("[Groq Invoice Parse] Raw response length:", content.length);

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    // Also try to find raw JSON object
    const rawJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      jsonStr = rawJsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    if (parsed?.invoice && Array.isArray(parsed?.lineItems)) {
      // Ensure line items have required fields and generate IDs
      parsed.lineItems = parsed.lineItems.map((item: any, idx: number) => ({
        product_name: item.product_name || item.name || `Item ${idx + 1}`,
        product_id: item.product_id || `SKU-${Date.now()}-${idx + 1}`,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        gst_percentage: Number(item.gst_percentage) || 18,
        hsn_code: item.hsn_code || "",
        line_tax: Number(item.line_tax) || (Number(item.unit_price || 0) * Number(item.quantity || 1) * (Number(item.gst_percentage || 18) / 100)),
      }));

      // Ensure invoice fields are strings
      parsed.invoice.taxableValue = String(parsed.invoice.taxableValue || "0");
      parsed.invoice.cgst = String(parsed.invoice.cgst || "0");
      parsed.invoice.sgst = String(parsed.invoice.sgst || "0");
      parsed.invoice.igst = String(parsed.invoice.igst || "0");
      parsed.invoice.total = String(parsed.invoice.total || "0");
      parsed.invoice.invoiceNumber = parsed.invoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      parsed.invoice.invoiceDate = parsed.invoice.invoiceDate || new Date().toISOString().split("T")[0];
      parsed.invoice.buyerGSTIN = parsed.invoice.buyerGSTIN || "";

      return parsed;
    }

    return null;
  } catch (error: any) {
    console.error("[Groq Invoice Parse] Error:", error?.message);
    return null;
  }
}

const handleInvoiceOCR: express.RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OCR_SPACE_API_KEY is not configured on server",
      });
    }

    const { base64Data, mimeType } = req.body as {
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
    };

    if (!base64Data) {
      return res.status(400).json({ error: "base64Data is required" });
    }

    // OCR.space expects base64 with data URI prefix
    const base64Image = `data:${mimeType || "image/jpeg"};base64,${base64Data}`;

    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("base64Image", base64Image);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.IsErroredOnProcessing) {
      throw new Error(
        data.ErrorMessage?.[0] || data.ErrorDetails || "OCR.space processing failed"
      );
    }

    const parsedText = data.ParsedResults?.[0]?.ParsedText || "";
    if (!parsedText) {
      throw new Error("No text extracted from image");
    }

    // First try regex-based parsing
    let invoiceData = parseInvoiceText(parsedText);
    let confidence = data.ParsedResults?.[0]?.FileParseExitCode === 1 ? 85 : 70;
    let usedAI = false;

    // If regex found no line items, use Groq AI for smart parsing
    if (invoiceData.lineItems.length === 0) {
      console.log("[Invoice OCR] No items from regex, trying Groq AI parsing...");
      const groqResult = await parseInvoiceWithGroq(parsedText);
      if (groqResult && groqResult.lineItems.length > 0) {
        invoiceData = groqResult;
        confidence = 90;
        usedAI = true;
        console.log(`[Invoice OCR] Groq extracted ${groqResult.lineItems.length} items`);
      }
    }

    return res.status(200).json({
      ...invoiceData,
      ocrConfidence: confidence,
      extractedText: parsedText,
      parsingMethod: usedAI ? "ai" : "regex",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "OCR processing error",
    });
  }
};

const handleBarcodeOCR: express.RequestHandler = async (req, res) => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured on server",
      });
    }

    const { base64Data, mimeType } = req.body as {
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
    };

    if (!base64Data) {
      return res.status(400).json({ error: "base64Data is required" });
    }

    // Use Groq Vision API to detect barcode
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'This image contains a barcode or QR code on a product. Read the number printed below or near the barcode. Return ONLY the digits/characters of the barcode. Example response: 8901063011014. Do not include any other text, explanation, or formatting. Just the code.',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("[Barcode OCR] Groq response status:", response.status);
    console.log("[Barcode OCR] Groq raw content:", JSON.stringify(data?.choices?.[0]?.message?.content));

    if (!response.ok) {
      const errMsg = data?.error?.message || "Groq Vision API failed";
      console.error("[Barcode OCR] Groq error:", errMsg);
      throw new Error(errMsg);
    }

    const content = (data?.choices?.[0]?.message?.content || "").trim();
    
    let detectedCode: string | null = null;
    
    if (content && !/^none$/i.test(content) && content.length > 0) {
      // Strategy 1: Extract any numeric sequence of 8-14 digits from anywhere in the text
      const allNumbers = content.match(/\d{8,14}/g);
      if (allNumbers && allNumbers.length > 0) {
        detectedCode = allNumbers[0];
      }
      
      // Strategy 2: Extract any sequence of 4+ digits
      if (!detectedCode) {
        const shortNumbers = content.match(/\d{4,}/g);
        if (shortNumbers && shortNumbers.length > 0) {
          detectedCode = shortNumbers[0];
        }
      }

      // Strategy 3: Alphanumeric code (e.g., SKU, QR code content)
      if (!detectedCode) {
        const alphanumericMatch = content.match(/[A-Z0-9][-A-Z0-9_.]{4,}/gi);
        if (alphanumericMatch) {
          detectedCode = alphanumericMatch[0];
        }
      }

      // Strategy 4: If the whole response is short and clean, use it as-is
      if (!detectedCode && content.length <= 30 && content.length >= 4) {
        detectedCode = content.replace(/[^A-Z0-9\-_.]/gi, '');
        if (detectedCode.length < 4) detectedCode = null;
      }
    }

    console.log("[Barcode OCR] Detected code:", detectedCode);

    return res.status(200).json({
      code: detectedCode,
      text: content,
      confidence: detectedCode ? 90 : 0,
    });
  } catch (error: any) {
    console.error("[Barcode OCR] Error:", error?.message);
    return res.status(500).json({
      error: error?.message || "Barcode detection error",
    });
  }
};

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Product routes
  app.get("/api/products", getProducts);
  app.get("/api/products/:id", getProductById);
  app.post("/api/products", createProduct);
  app.put("/api/products/:id", updateProduct);
  app.delete("/api/products/:id", deleteProduct);

  // OCR routes
  app.post("/api/ocr/invoice", handleInvoiceOCR);
  app.post("/api/ocr/barcode", handleBarcodeOCR);

  // Translation route
  app.post("/api/translate", handleTranslate);


  return app;
}
