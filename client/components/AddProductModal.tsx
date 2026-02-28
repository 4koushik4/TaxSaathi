import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  QrCode,
  ArrowLeft,
  Plus,
  X,
  Barcode,
  AlertCircle,
  Check,
} from 'lucide-react';
import { ManualEntryForm } from './ManualEntryForm';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
  userId?: string;
}

async function ensureUserProfileExists(userId: string) {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const email = authUser?.email || `${userId}@taxsathi.local`;
  const fullName =
    (authUser?.user_metadata?.full_name as string) ||
    (authUser?.user_metadata?.name as string) ||
    email.split('@')[0] ||
    'User';

  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      is_demo_user: false,
      last_login: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}

export function AddProductModal({ open, onOpenChange, onProductAdded, userId }: AddProductModalProps) {
  const [step, setStep] = useState<'select' | 'upload' | 'manual' | 'qr'>('select');

  // Reset to select screen whenever modal is opened
  useEffect(() => {
    if (open) {
      setStep('select');
    }
  }, [open]);

  const handleOptionSelect = (option: 'upload' | 'manual' | 'qr') => {
    setStep(option);
  };

  const handleBack = () => {
    if (step === 'select') {
      onOpenChange(false);
    } else {
      setStep('select');
    }
  };

  const handleProductCreated = () => {
    toast.success('Product added successfully!');
    onProductAdded?.();
    onOpenChange(false);
    setStep('select');
  };

  const handleCancel = () => {
    setStep('select');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Choose how you want to add your product to the inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'select' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Upload Invoice Option */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => handleOptionSelect('upload')}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Upload Invoice</CardTitle>
                  <CardDescription>
                    Upload a purchase invoice or bill to automatically extract product details
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Invoice
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Entry Option */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => handleOptionSelect('manual')}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Manual Entry</CardTitle>
                  <CardDescription>
                    Enter product details manually with full control over all fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </CardContent>
              </Card>

              {/* QR Code Scan Option */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => handleOptionSelect('qr')}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Scan QR Code</CardTitle>
                  <CardDescription>
                    Scan QR code on product packaging to get unique product identifier
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {step !== 'select' && (
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">
                Step 2 of 2: Fill in product details
              </div>
            </div>
          )}

          {step === 'upload' && <UploadInvoiceForm onProductAdded={handleProductCreated} userId={userId || ''} />}
          {step === 'manual' && <ManualEntryForm onSuccess={handleProductCreated} onCancel={handleCancel} userId={userId} />}
          {step === 'qr' && (
            <QrCodeForm
              onProductAdded={handleProductCreated}
              onCreateNew={() => setStep('manual')}
              userId={userId || ''}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Upload Invoice Form with OCR extraction
function UploadInvoiceForm({ onProductAdded, userId }: { onProductAdded?: () => void; userId: string; }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
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

      // Safely parse response - Vercel may return non-JSON on crashes
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server returned non-JSON:', text.slice(0, 200));
        throw new Error(`Server error (${response.status}): ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to process invoice');
      }

      const products = Array.isArray(data.lineItems) ? data.lineItems : [];

      if (products.length === 0) {
        toast.error('No line items found in invoice');
        return;
      }

      setExtractedProducts(products);
      // Select all products by default
      setSelectedProducts(new Set(products.map((_, idx) => idx)));
      toast.success(`Extracted ${products.length} products from invoice`);
    } catch (error) {
      console.error('Error processing invoice:', error);
      toast.error('Failed to process invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const updateExtractedProduct = (index: number, field: string, value: any) => {
    setExtractedProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const saveProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await ensureUserProfileExists(userId);

      const productsToSave = extractedProducts
        .filter((_, idx) => selectedProducts.has(idx))
        .map(product => {
          const purchasePrice = product.unit_price || 0;
          const sellingPrice = product.selling_price || (purchasePrice ? Math.round(purchasePrice * 1.2) : 0);
          return {
            user_id: userId,
            product_id: product.product_id || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product_name: product.product_name || 'Unnamed Product',
            category: product.category || 'General',
            unit_type: 'pcs',
            current_stock: product.quantity || 0,
            minimum_stock_level: 5,
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            mrp: sellingPrice > 0 ? Math.round(sellingPrice * 1.1) : 0,
            hsn_code: product.hsn_code || '0000',
            gst_percentage: product.gst_percentage || 18,
            supplier_name: 'Invoice Upload',
            purchase_invoice_number: `OCR-${Date.now().toString().slice(-6)}`,
            purchase_date: new Date().toISOString().split('T')[0],
            last_sold_date: new Date().toISOString(),
          };
        });

      const { error } = await supabase
        .from('products')
        .insert(productsToSave);

      if (error) throw error;

      toast.success(`${productsToSave.length} products added to inventory`);
      onProductAdded?.();
    } catch (error: any) {
      console.error('Error saving products:', error);
      toast.error(error.message || 'Failed to save products');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload Invoice</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Upload your purchase invoice or bill. We'll extract product details automatically.
      </p>

      {!file && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-400 mt-2">PDF, JPG, PNG up to 10MB</p>
        </div>
      )}

      {file && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
          </AlertDescription>
        </Alert>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Extracting products from invoice...</p>
          </div>
        </div>
      )}

      {extractedProducts.length > 0 && !isProcessing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Extracted Products ({extractedProducts.length})</h4>
            <Button onClick={saveProducts} disabled={selectedProducts.size === 0}>
              Save {selectedProducts.size} Selected
            </Button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {extractedProducts.map((product, index) => (
              <Card key={index} className={selectedProducts.has(index) ? 'border-primary' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(index)}
                      onChange={() => toggleProductSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Product Name</Label>
                          <Input
                            value={product.product_name || ''}
                            onChange={(e) => updateExtractedProduct(index, 'product_name', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">SKU / Product ID</Label>
                          <Input
                            value={product.product_id || ''}
                            onChange={(e) => updateExtractedProduct(index, 'product_id', e.target.value)}
                            placeholder="Auto-generated if empty"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={product.quantity || 0}
                            onChange={(e) => updateExtractedProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Purchase Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.unit_price || 0}
                            onChange={(e) => updateExtractedProduct(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Selling Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.selling_price || Math.round((product.unit_price || 0) * 1.2)}
                            onChange={(e) => updateExtractedProduct(index, 'selling_price', parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">GST %</Label>
                          <Select
                            value={String(product.gst_percentage || 18)}
                            onValueChange={(val) => updateExtractedProduct(index, 'gst_percentage', parseFloat(val))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">HSN Code</Label>
                          <Input
                            value={product.hsn_code || ''}
                            onChange={(e) => updateExtractedProduct(index, 'hsn_code', e.target.value)}
                            placeholder="e.g., 8471"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={product.category || 'General'}
                            onValueChange={(val) => updateExtractedProduct(index, 'category', val)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Clothing">Clothing</SelectItem>
                              <SelectItem value="Food">Food & Beverages</SelectItem>
                              <SelectItem value="Health">Health & Beauty</SelectItem>
                              <SelectItem value="Home">Home & Kitchen</SelectItem>
                              <SelectItem value="Stationery">Stationery</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QrCodeForm({ onProductAdded, onCreateNew, userId }: { onProductAdded?: () => void; onCreateNew?: () => void; userId: string; }) {
  return (
    <QrScannerUI onProductAdded={onProductAdded} onCreateNew={onCreateNew} userId={userId} />
  );
}

function QrScannerUI({ onProductAdded, onCreateNew, userId }: { onProductAdded?: () => void; onCreateNew?: () => void; userId: string; }) {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    purchase_price: 0,
    selling_price: 0,
    category: 'General',
    unit_type: 'pcs',
    hsn_code: '',
    gst_percentage: 18,
    description: '',
  });

  // Start camera for scanning
  const startCamera = async () => {
    try {
      setScanError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error: any) {
      setScanError('Cannot access camera. Please use manual entry instead.');
      console.error('Camera error:', error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  // Detect barcode from video
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    const detectBarcode = async () => {
      if (!window.BarcodeDetector) {
        setScanError('Barcode detection not supported on this browser');
        return;
      }

      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'],
        });

        const detectedBarcodes = await barcodeDetector.detect(videoRef.current!);
        if (detectedBarcodes.length > 0) {
          const detectedCode = detectedBarcodes[0].rawValue;
          setCode(detectedCode);
          stopCamera();
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 2000);
          // Auto-lookup after scan
          lookupProduct(detectedCode);
        }
      } catch (error) {
        console.error('Barcode detection error:', error);
      }

      // Continue polling
      if (isCameraActive) {
        requestAnimationFrame(detectBarcode);
      }
    };

    detectBarcode();
  }, [isCameraActive]);

  const lookupProduct = async (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (!codeToSearch) return toast.error('Enter or scan a code first');
    setLoading(true);
    try {
      // Search by product_id first
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', codeToSearch)
        .maybeSingle();

      if (error) throw error;

      // If not found by product_id, search by barcode column
      if (!data) {
        const barcodeResult = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .eq('barcode', codeToSearch)
          .maybeSingle();

        if (barcodeResult.error) throw barcodeResult.error;
        data = barcodeResult.data;
      }

      if (!data) {
        setProduct(null);
        toast.warning('No product found for this code. You can create a new product or add stock to a new entry.');
      } else {
        setProduct(data);
        toast.success(`Product found: ${data.product_name}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setScanSuccess(false);

    // Display the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      let detectedCode: string | null = null;

      // Try BarcodeDetector first (if supported)
      if (window.BarcodeDetector) {
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });

          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'],
          });
          const detectedBarcodes = await barcodeDetector.detect(img);
          
          if (detectedBarcodes.length > 0) {
            detectedCode = detectedBarcodes[0].rawValue;
          }
        } catch (error) {
          console.log('BarcodeDetector failed, trying Groq Vision fallback:', error);
        }
      }

      // If BarcodeDetector didn't work, use Groq Vision API
      if (!detectedCode) {
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const ocrReader = new FileReader();
            ocrReader.onload = () => {
              const result = ocrReader.result as string;
              resolve(result.split(',')[1]);
            };
            ocrReader.onerror = reject;
            ocrReader.readAsDataURL(file);
          });

          const response = await fetch('/api/ocr/barcode', {
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

          // Safely parse response - Vercel may return non-JSON on crashes
          const respText = await response.text();
          let data: any;
          try {
            data = JSON.parse(respText);
          } catch {
            throw new Error(`Server error (${response.status}): ${respText.slice(0, 100)}`);
          }

          if (!response.ok) {
            throw new Error(data?.error || 'Barcode detection failed');
          }

          if (data.code) {
            detectedCode = data.code;
          }
        } catch (error: any) {
          console.error('Groq barcode detection failed:', error);
          toast.error(error.message || 'Failed to detect barcode from image');
        }
      }

      // If we found a code, use it
      if (detectedCode) {
        setCode(detectedCode);
        setScanSuccess(true);
        setTimeout(() => setScanSuccess(false), 3000);
        toast.success(`Code detected: ${detectedCode}`);
        await lookupProduct(detectedCode);
      } else {
        toast.warning('No barcode detected. Please enter code manually.');
      }
    } catch (error: any) {
      console.error('Image processing error:', error);
      toast.error(error.message || 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addStock = async () => {
    if (product) {
      // Update existing product
      setLoading(true);
      try {
        const newStock = (product.current_stock || 0) + (amount || 0);
        const { data, error } = await supabase
          .from('products')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', product.id)
          .select()
          .single();

        if (error) throw error;

        toast.success(`Stock updated: ${product.product_name} +${amount}`);
        onProductAdded?.();
      } catch (err) {
        console.error(err);
        toast.error('Failed to update stock');
      } finally {
        setLoading(false);
      }
    } else if (code) {
      // Show new product form if not already shown
      if (!showNewProductForm) {
        setShowNewProductForm(true);
        setNewProduct(prev => ({ ...prev, product_name: code.trim() }));
        return;
      }

      // Validate required fields
      if (!newProduct.product_name.trim()) {
        toast.error('Product name is required');
        return;
      }

      // Create new product with form data
      setLoading(true);
      try {
        await ensureUserProfileExists(userId);

        const sellingPrice = newProduct.selling_price || (newProduct.purchase_price ? Math.round(newProduct.purchase_price * 1.2) : 0);
        const { error: insertError } = await supabase.from('products').insert([
          {
            user_id: userId,
            product_id: code.trim(),
            product_name: newProduct.product_name.trim(),
            category: newProduct.category || 'General',
            unit_type: newProduct.unit_type || 'pcs',
            description: newProduct.description || null,
            current_stock: amount,
            minimum_stock_level: 5,
            purchase_price: newProduct.purchase_price || 0,
            selling_price: sellingPrice,
            mrp: sellingPrice > 0 ? Math.round(sellingPrice * 1.1) : 0,
            hsn_code: newProduct.hsn_code || '0000',
            gst_percentage: newProduct.gst_percentage || 18,
            supplier_name: 'Barcode Scan',
            purchase_invoice_number: `SCAN-${Date.now().toString().slice(-6)}`,
            purchase_date: new Date().toISOString().split('T')[0],
            last_sold_date: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;

        toast.success(`Product "${newProduct.product_name.trim()}" added with ${amount} units`);
        setShowNewProductForm(false);
        onProductAdded?.();
      } catch (error: any) {
        console.error('Error adding product:', error);
        toast.error(error.message || 'Failed to add product');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scan / Lookup QR or Barcode</h3>
      </div>

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan" onClick={() => setScanError('')}>
            <QrCode className="w-4 h-4 mr-2" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload" onClick={() => stopCamera()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="manual" onClick={() => stopCamera()}>
            <Barcode className="w-4 h-4 mr-2" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-4">
          {!isCameraActive ? (
            <Button onClick={startCamera} className="w-full" variant="outline">
              <QrCode className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} className="w-full" variant="secondary">
              Stop Camera
            </Button>
          )}

          {/* Camera Preview - Always visible */}
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-64 bg-black rounded-lg"
            playsInline
            style={{ display: isCameraActive ? 'block' : 'none' }}
          />

          {scanError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scanError}</AlertDescription>
            </Alert>
          )}

          {scanSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Code scanned: {code}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Upload Image Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={loading}
            />
            <Button 
              onClick={() => imageInputRef.current?.click()} 
              className="w-full" 
              variant="outline"
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Upload Barcode/QR Image'}
            </Button>
          </div>

          {uploadedImage && (
            <div className="border rounded-lg p-2">
              <img 
                src={uploadedImage} 
                alt="Uploaded barcode" 
                className="w-full h-64 object-contain bg-gray-50 rounded"
              />
            </div>
          )}

          {loading && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Detecting barcode from image...
              </AlertDescription>
            </Alert>
          )}

          {scanSuccess && !loading && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Code detected: {code}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Upload an image containing a barcode or QR code. We'll automatically detect and extract the code.
          </p>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div>
            <Label>Product Code / SKU / Barcode</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="e.g., PROD-001 or 9876543210123" 
              />
              <Button onClick={() => lookupProduct()} disabled={loading}>
                {loading ? 'Searching...' : 'Lookup'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quantity Input (Common to both tabs) */}
      <div>
        <Label>Quantity to Add</Label>
        <Input 
          type="number" 
          min="1"
          value={amount} 
          onChange={(e) => setAmount(parseInt(e.target.value || '1'))} 
        />
      </div>

      {/* Product Display - Existing product found */}
      {product ? (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{product.product_name}</div>
                <div className="text-sm text-muted-foreground">SKU: {product.product_id}</div>
                <div className="text-sm text-muted-foreground">Current Stock: {product.current_stock}</div>
                <div className="text-sm text-muted-foreground">Price: ₹{product.selling_price}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={addStock} disabled={loading}>
                  {loading ? 'Adding...' : `Add ${amount}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : code && !showNewProductForm ? (
        <div className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No product found for code <strong>{code}</strong>. Fill in details to create it.
            </AlertDescription>
          </Alert>
          <Button onClick={() => { setShowNewProductForm(true); setNewProduct(prev => ({ ...prev, product_name: code.trim() })); }} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create New Product
          </Button>
        </div>
      ) : null}

      {/* New Product Form */}
      {showNewProductForm && !product && code && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Product Details</CardTitle>
            <CardDescription>Fill in the product information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Product Name *</Label>
                <Input
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="Enter product name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Purchase Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.purchase_price || ''}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Selling Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.selling_price || ''}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(val) => setNewProduct(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Food">Food & Beverages</SelectItem>
                    <SelectItem value="Health">Health & Beauty</SelectItem>
                    <SelectItem value="Home">Home & Kitchen</SelectItem>
                    <SelectItem value="Stationery">Stationery</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Unit Type</Label>
                <Select
                  value={newProduct.unit_type}
                  onValueChange={(val) => setNewProduct(prev => ({ ...prev, unit_type: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="litre">Litre</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">HSN Code</Label>
                <Input
                  value={newProduct.hsn_code}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, hsn_code: e.target.value }))}
                  placeholder="e.g., 8471"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">GST %</Label>
                <Select
                  value={String(newProduct.gst_percentage)}
                  onValueChange={(val) => setNewProduct(prev => ({ ...prev, gst_percentage: parseFloat(val) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief product description"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowNewProductForm(false)}>
                Cancel
              </Button>
              <Button onClick={addStock} disabled={loading}>
                {loading ? 'Creating...' : `Create & Add ${amount} to Stock`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onCreateNew?.()}>
          Full Manual Entry Form
        </Button>
      </div>
    </div>
  );
}
