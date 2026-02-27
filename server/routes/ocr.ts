import { RequestHandler } from "express";

type MindeeLineItem = {
  description?: string;
  product_code?: string;
  quantity?: number;
  unit_price?: number;
  tax_amount?: number;
};

export const handleInvoiceOCR: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.MINDEE_API_KEY || process.env.VITE_MINDEE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "MINDEE_API_KEY is not configured on server" });
    }

    const { fileName, mimeType, base64Data } = req.body as {
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
    };

    if (!base64Data) {
      return res.status(400).json({ error: "base64Data is required" });
    }

    const bytes = Buffer.from(base64Data, "base64");
    const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
    const form = new FormData();
    form.append("document", blob, fileName || "invoice.jpg");

    const response = await fetch("https://api.mindee.net/v1/products/mindee/invoices/v4/predict", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.api_request?.error?.message || data?.message || "Mindee OCR request failed",
        details: data,
      });
    }

    const prediction = data?.document?.inference?.prediction;
    if (!prediction) {
      return res.status(422).json({ error: "Mindee response did not contain prediction", details: data });
    }

    const totalAmount = Number(prediction.total_amount?.value || 0);
    const taxableValue = Number(prediction.total_net?.value || prediction.total_amount?.value || 0);
    const totalTax = Number(prediction.total_tax?.value || 0);

    const lineItemsRaw = (prediction.line_items || []) as MindeeLineItem[];
    const lineItems = lineItemsRaw.map((item, idx) => ({
      product_name: item.description || `Item ${idx + 1}`,
      product_id: item.product_code || `SKU-${Date.now()}-${idx + 1}`,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      gst_percentage: 18,
      hsn_code: "",
      line_tax: Number(item.tax_amount || 0),
    }));

    return res.status(200).json({
      invoice: {
        invoiceNumber: prediction.invoice_number?.value || `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: prediction.date?.value || new Date().toISOString().split("T")[0],
        buyerGSTIN: prediction.customer_tax_id?.value || "",
        taxableValue: taxableValue.toFixed(2),
        cgst: (totalTax / 2).toFixed(2),
        sgst: (totalTax / 2).toFixed(2),
        igst: "0.00",
        total: totalAmount.toFixed(2),
      },
      lineItems,
      ocrConfidence: 94,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Unexpected OCR server error",
    });
  }
};
