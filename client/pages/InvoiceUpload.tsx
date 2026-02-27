import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, XCircle, Upload, Camera, Loader2 } from 'lucide-react';

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
  ocrConfidence?: number;
  validated: boolean;
  validationStatus?: 'valid' | 'warning' | 'error';
}

export default function InvoiceUpload() {
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

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
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

      // Simulate OCR processing
      setTimeout(() => {
        const mockData: InvoiceData = {
          invoiceNumber: 'INV-2024-001',
          invoiceDate: '2024-07-01',
          buyerGSTIN: '27ABCDE1234F2Z0',
          taxableValue: '50000',
          cgst: '4500',
          sgst: '4500',
          igst: '0',
          total: '59000',
        };

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  processing: false,
                  extractedData: mockData,
                  ocrConfidence: 94,
                  validated: true,
                  validationStatus: 'valid',
                }
              : f
          )
        );
      }, 2000);
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

  const saveInvoice = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      // Simulate save
      alert(`Invoice ${file.extractedData?.invoiceNumber} saved successfully!`);
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
        <h1 className="text-3xl font-bold text-foreground">Invoice Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload invoices and let our AI extract and validate the data automatically.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sales' | 'purchase')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sales">Sales Invoice</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Invoice</TabsTrigger>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoices</CardTitle>
        <CardDescription>Drag & drop images or click to select</CardDescription>
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
          <h3 className="text-lg font-semibold text-foreground mb-2">Drop invoices here</h3>
          <p className="text-muted-foreground text-sm mb-4">or click to select files</p>
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
                <span>Select Files</span>
              </Button>
            </label>
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Supports JPG, PNG, and PDF • Max 5MB per file
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
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Processed Invoices</h2>
      {files.map((file) => (
        <Card key={file.id}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Preview */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Preview</p>
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
                  <p className="text-sm font-medium text-foreground">Extracted Data</p>
                  {file.processing && <span className="text-xs text-muted-foreground">Processing...</span>}
                  {!file.processing && file.ocrConfidence && (
                    <span className="text-xs font-medium text-success">
                      OCR Confidence: {file.ocrConfidence}%
                    </span>
                  )}
                </div>

                {file.extractedData && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Invoice Number</Label>
                        <Input
                          value={file.extractedData.invoiceNumber}
                          onChange={(e) =>
                            onDataChange(file.id, 'invoiceNumber', e.target.value)
                          }
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Invoice Date</Label>
                        <Input
                          type="date"
                          value={file.extractedData.invoiceDate}
                          onChange={(e) => onDataChange(file.id, 'invoiceDate', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Buyer GSTIN</Label>
                        <Input
                          value={file.extractedData.buyerGSTIN}
                          onChange={(e) => onDataChange(file.id, 'buyerGSTIN', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Taxable Value</Label>
                        <Input
                          type="number"
                          value={file.extractedData.taxableValue}
                          onChange={(e) =>
                            onDataChange(file.id, 'taxableValue', e.target.value)
                          }
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CGST</Label>
                        <Input
                          type="number"
                          value={file.extractedData.cgst}
                          onChange={(e) => onDataChange(file.id, 'cgst', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SGST</Label>
                        <Input
                          type="number"
                          value={file.extractedData.sgst}
                          onChange={(e) => onDataChange(file.id, 'sgst', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">IGST</Label>
                        <Input
                          type="number"
                          value={file.extractedData.igst}
                          onChange={(e) => onDataChange(file.id, 'igst', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          type="number"
                          value={file.extractedData.total}
                          onChange={(e) => onDataChange(file.id, 'total', e.target.value)}
                          className="mt-1"
                          size="sm"
                        />
                      </div>
                    </div>

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
                          {file.validationStatus === 'valid' && 'Tax calculation is valid'}
                          {file.validationStatus === 'warning' && 'Tax mismatch detected. Please verify.'}
                          {file.validationStatus === 'error' && 'Invalid GSTIN or tax calculation error'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {!file.processing && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => onValidate(file.id)}
                      variant="outline"
                    >
                      Validate
                    </Button>
                    <Button size="sm" onClick={() => onSave(file.id)}>
                      Save Invoice
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(file.id)}
                    >
                      Discard
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
