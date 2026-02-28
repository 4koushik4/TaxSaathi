import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// helper that calls OCR.space API for invoice text extraction
async function runInvoiceOCR(file: File): Promise<{ invoice: InvoiceData; lineItems: any[]; ocrConfidence: number; extractedText: string }> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch('/api/ocr/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to extract invoice data');
    }

    return {
      invoice: data.invoice as InvoiceData,
      lineItems: Array.isArray(data.lineItems) ? data.lineItems : [],
      ocrConfidence: data.ocrConfidence || 70,
      extractedText: data.extractedText || '',
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, XCircle, Upload, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  buyerGSTIN: string;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'sales' | 'purchase';
  file: File;
  preview?: string;
  processing: boolean;
  extractedData?: InvoiceData;
  lineItems?: any[];
  ocrConfidence?: number;
  extractedText?: string;
  validated: boolean;
  validationStatus?: 'valid' | 'warning' | 'error';
}

export default function InvoiceUpload() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const newFile: UploadedFile = {
        id: Math.random().toString(),
        name: file.name,
        type: activeTab,
        file,
        preview: e.target?.result as string,
        processing: true,
        validated: false,
      };

      setUploadedFiles((prev) => [...prev, newFile]);

      // call OCR service
      try {
        const result = await runInvoiceOCR(file);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  processing: false,
                  extractedData: result.invoice,
                  lineItems: result.lineItems,
                  ocrConfidence: result.ocrConfidence,
                  extractedText: result.extractedText,
                  validated: true,
                  validationStatus: 'valid',
                }
              : f
          )
        );
      } catch (err) {
        console.error('OCR error', err);
        toast({
          title: t.invoiceUpload.ocrFailed || 'OCR failed',
          description: err instanceof Error ? err.message : (t.invoiceUpload.ocrFailedDesc || 'Failed to extract invoice data'),
          variant: 'destructive',
        });
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id ? { ...f, processing: false, validated: false } : f
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        processFile(files[i]);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        processFile(files[i]);
      }
    }
  };

  const handleDataChange = (fileId: string, field: keyof InvoiceData, value: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && f.extractedData
          ? {
              ...f,
              extractedData: { ...f.extractedData, [field]: value },
            }
          : f
      )
    );
  };

  const validateInvoice = (fileId: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId && f.extractedData) {
          const cgst = parseFloat(f.extractedData.cgst) || 0;
          const sgst = parseFloat(f.extractedData.sgst) || 0;
          const igst = parseFloat(f.extractedData.igst) || 0;
          const taxable = parseFloat(f.extractedData.taxableValue) || 0;
          const total = parseFloat(f.extractedData.total) || 0;

          const calculatedTotal = taxable + cgst + sgst + igst;
          const isValid = Math.abs(calculatedTotal - total) < 1;

          return {
            ...f,
            validationStatus: isValid ? 'valid' : cgst + sgst + igst > taxable * 0.5 ? 'warning' : 'error',
          };
        }
        return f;
      })
    );
  };

  const saveInvoice = async (fileId: string) => {
    if (!user?.id) return;

    const file = uploadedFiles.find((f) => f.id === fileId);
    if (!file || !file.extractedData) return;

    try {
      const taxable = parseFloat(file.extractedData.taxableValue) || 0;
      const cgstAmt = parseFloat(file.extractedData.cgst) || 0;
      const sgstAmt = parseFloat(file.extractedData.sgst) || 0;
      const igstAmt = parseFloat(file.extractedData.igst) || 0;
      const gstTotal = cgstAmt + sgstAmt + igstAmt;
      const totalAmount = taxable + gstTotal;

      // Save invoice header to Supabase
      const { data, error } = await supabase.from('invoices').insert([
        {
          user_id: user.id,
          invoice_number: file.extractedData.invoiceNumber,
          invoice_date: file.extractedData.invoiceDate,
          vendor_gst: file.extractedData.buyerGSTIN,
          subtotal: taxable,
          gst_amount: gstTotal,
          total_amount: totalAmount,
          status: 'processed',
          ocr_confidence: file.ocrConfidence || 70,
        },
      ]).select();

      if (error) throw error;

      if (data?.[0]?.id) {
        // Save individual line items from OCR extraction
        const lineItems = file.lineItems && file.lineItems.length > 0
          ? file.lineItems.map(item => ({
              invoice_id: data[0].id,
              item_name: item.product_name || 'Invoice Item',
              hsn_code: item.hsn_code || null,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              gst_percentage: item.gst_percentage || (taxable > 0 ? ((gstTotal / taxable) * 100) : 0),
              item_total: (item.unit_price || 0) * (item.quantity || 1),
            }))
          : [{
              invoice_id: data[0].id,
              item_name: 'Invoice Items',
              quantity: 1,
              unit_price: taxable,
              gst_percentage: taxable > 0 ? ((gstTotal / taxable) * 100) : 0,
              item_total: totalAmount,
            }];

        const { error: itemError } = await supabase.from('invoice_items').insert(lineItems);

        if (itemError) throw itemError;

        // Create GST transaction record for GSTR reporting
        const gstRate = taxable > 0 ? +((gstTotal / taxable) * 100).toFixed(2) : 0;
        const { error: gstError } = await supabase.from('gst_transactions').insert([
          {
            user_id: user.id,
            transaction_type: file.type === 'sales' ? 'sales' : 'purchases',
            amount: taxable,
            gst_rate: gstRate,
            gst_amount: gstTotal,
            source_id: data[0].id,
            cgst: cgstAmt,
            sgst: sgstAmt,
            igst: igstAmt,
            transaction_date: file.extractedData.invoiceDate,
          },
        ]);

        if (gstError) {
          console.warn('GST transaction save failed', gstError);
        }

        toast({
          title: t.common.success,
          description: t.invoiceUpload.invoiceSaved,
        });

        // Remove from UI
        removeFile(fileId);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.common.error,
        description: error?.message || t.invoiceUpload.saveFailed,
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const filteredFiles = uploadedFiles.filter((f) => f.type === activeTab);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.invoiceUpload.title}</h1>
        <p className="text-muted-foreground mt-2">
          {t.invoiceUpload.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sales' | 'purchase')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sales">{t.invoiceUpload.salesInvoice}</TabsTrigger>
          <TabsTrigger value="purchase">{t.invoiceUpload.purchaseInvoice}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <UploadSection dragActive={dragActive} handleDrag={handleDrag} handleDrop={handleDrop} handleFileInput={handleFileInput} />
          <FilesList files={filteredFiles} onDataChange={handleDataChange} onValidate={validateInvoice} onSave={saveInvoice} onRemove={removeFile} />
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          <UploadSection dragActive={dragActive} handleDrag={handleDrag} handleDrop={handleDrop} handleFileInput={handleFileInput} />
          <FilesList files={filteredFiles} onDataChange={handleDataChange} onValidate={validateInvoice} onSave={saveInvoice} onRemove={removeFile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UploadSection({
  dragActive,
  handleDrag,
  handleDrop,
  handleFileInput,
}: {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.invoiceUpload.uploadInvoices}</CardTitle>
        <CardDescription>{t.invoiceUpload.dragAndDrop}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.invoiceUpload.dropHere}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t.invoiceUpload.orClickToSelect}</p>
          <div className="flex gap-3 justify-center">
            <label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button asChild variant="default">
                <span>{t.invoiceUpload.selectFiles}</span>
              </Button>
            </label>
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              {t.invoiceUpload.capturePhoto}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {t.invoiceUpload.supportedFormats}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilesList({
  files,
  onDataChange,
  onValidate,
  onSave,
  onRemove,
}: {
  files: UploadedFile[];
  onDataChange: (fileId: string, field: keyof InvoiceData, value: string) => void;
  onValidate: (fileId: string) => void;
  onSave: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}) {
  const { t } = useLanguage();
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{t.invoiceUpload.processedInvoices}</h2>
      {files.map((file) => (
        <Card key={file.id}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Preview */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">{t.invoiceUpload.preview}</p>
                {file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-40 object-cover rounded-lg border border-border"
                  />
                )}
                {file.processing && (
                  <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-foreground">{t.invoiceUpload.extractedData}</p>
                  {file.processing && <span className="text-xs text-muted-foreground">{t.invoiceUpload.processing}</span>}
                  {!file.processing && file.ocrConfidence && (
                    <span className="text-xs font-medium text-success">
                      {t.invoiceUpload.ocrConfidence} {file.ocrConfidence}%
                    </span>
                  )}
                </div>

                {file.extractedData && (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.invoiceNumber}</Label>
                        <Input
                          value={file.extractedData.invoiceNumber}
                          onChange={(e) =>
                            onDataChange(file.id, 'invoiceNumber', e.target.value)
                          }
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.invoiceDate}</Label>
                        <Input
                          type="date"
                          value={file.extractedData.invoiceDate}
                          onChange={(e) => onDataChange(file.id, 'invoiceDate', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">{t.invoiceUpload.buyerGstin}</Label>
                        <Input
                          value={file.extractedData.buyerGSTIN}
                          onChange={(e) => onDataChange(file.id, 'buyerGSTIN', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.taxableValue}</Label>
                        <Input
                          type="number"
                          value={file.extractedData.taxableValue}
                          onChange={(e) =>
                            onDataChange(file.id, 'taxableValue', e.target.value)
                          }
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.cgst}</Label>
                        <Input
                          type="number"
                          value={file.extractedData.cgst}
                          onChange={(e) => onDataChange(file.id, 'cgst', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.sgst}</Label>
                        <Input
                          type="number"
                          value={file.extractedData.sgst}
                          onChange={(e) => onDataChange(file.id, 'sgst', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.igst}</Label>
                        <Input
                          type="number"
                          value={file.extractedData.igst}
                          onChange={(e) => onDataChange(file.id, 'igst', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.invoiceUpload.total}</Label>
                        <Input
                          type="number"
                          value={file.extractedData.total}
                          onChange={(e) => onDataChange(file.id, 'total', e.target.value)}
                          className="mt-1"
                          
                        />
                      </div>
                    </div>

                    {/* Extracted Line Items */}
                    {file.lineItems && file.lineItems.length > 0 && (
                      <div className="mt-4 border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">{t.invoiceUpload.extractedLineItems} ({file.lineItems.length})</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {file.lineItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                              <div className="flex-1">
                                <span className="font-medium">{item.product_name}</span>
                                {item.hsn_code && <span className="text-xs text-muted-foreground ml-2">{t.invoiceUpload.hsn || 'HSN'}: {item.hsn_code}</span>}
                              </div>
                              <div className="flex gap-4 text-muted-foreground">
                                <span>{t.invoiceUpload.qty || 'Qty'}: {item.quantity}</span>
                                <span>₹{item.unit_price}</span>
                                <span className="font-medium text-foreground">₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Status */}
                    {file.validationStatus && (
                      <Alert
                        className={
                          file.validationStatus === 'valid'
                            ? 'border-success bg-success/5'
                            : file.validationStatus === 'warning'
                              ? 'border-warning bg-warning/5'
                              : 'border-destructive bg-destructive/5'
                        }
                      >
                        {file.validationStatus === 'valid' && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                        {file.validationStatus === 'warning' && (
                          <AlertCircle className="h-4 w-4 text-warning" />
                        )}
                        {file.validationStatus === 'error' && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <AlertDescription>
                          {file.validationStatus === 'valid' && t.invoiceUpload.taxValid}
                          {file.validationStatus === 'warning' && t.invoiceUpload.taxMismatch}
                          {file.validationStatus === 'error' && t.invoiceUpload.invalidGstin}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {!file.processing && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      
                      onClick={() => onValidate(file.id)}
                      variant="outline"
                    >
                      {t.invoiceUpload.validate}
                    </Button>
                    <Button  onClick={() => onSave(file.id)}>
                      {t.invoiceUpload.saveInvoice}
                    </Button>
                    <Button
                      
                      variant="ghost"
                      onClick={() => onRemove(file.id)}
                    >
                      {t.invoiceUpload.discard}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
