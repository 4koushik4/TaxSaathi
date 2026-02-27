import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Barcode, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface ScanProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onProductAdded: () => void;
}

async function ensureUserProfileExists(userId: string) {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const email = authUser?.email || `${userId}@taxsaathi.local`;
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

export function ScanProductModal({
  open,
  onOpenChange,
  userId,
  onProductAdded,
}: ScanProductModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

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
          const code = detectedBarcodes[0].rawValue;
          setManualCode(code);
          stopCamera();
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 2000);
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

  // Handle adding product
  const handleAddProduct = async () => {
    if (!manualCode.trim()) {
      setScanError('Please enter or scan a product code');
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      setScanError('Please enter a valid quantity');
      return;
    }

    setIsLoading(true);
    setScanError('');

    try {
      // Look up product by product_id
      const { data: existingProduct, error: lookupError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', manualCode.trim())
        .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      const quantityNum = parseInt(quantity);

      if (existingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            current_stock: existingProduct.current_stock + quantityNum,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProduct.id);

        if (updateError) throw updateError;

        toast({
          title: 'Product Updated',
          description: `Added ${quantityNum} units to ${existingProduct.product_name}`,
        });
      } else {
        // Create new product
        await ensureUserProfileExists(userId);

        const { error: insertError } = await supabase.from('products').insert([
          {
            user_id: userId,
            product_id: manualCode.trim(),
            product_name: manualCode.trim(),
            current_stock: quantityNum,
            minimum_stock_level: 5,
            purchase_price: 0,
            selling_price: 0,
            last_sold_date: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;

        toast({
          title: 'Product Added',
          description: `New product ${manualCode.trim()} added with ${quantityNum} units`,
        });
      }

      // Reset form
      setManualCode('');
      setQuantity('1');
      setScanSuccess(false);
      onProductAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      setScanError(error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setManualCode('');
    setQuantity('1');
    setScanError('');
    setScanSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Product to Inventory</DialogTitle>
          <DialogDescription>
            Scan a barcode/QR code or manually enter the product code
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" onClick={() => setScanError('')}>
              <QrCode className="w-4 h-4 mr-2" />
              Scan
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
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-64 bg-black rounded-lg"
                  playsInline
                />
                <Button onClick={stopCamera} className="w-full" variant="secondary">
                  Stop Camera
                </Button>
              </>
            )}

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
                  Code scanned: {manualCode}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label htmlFor="product-code">Product Code / SKU</Label>
              <Input
                id="product-code"
                placeholder="e.g., PROD-001 or 9876543210123"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="mt-1"
              />
            </div>

            {scanError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Quantity Input (Common to both tabs) */}
        <div>
          <Label htmlFor="quantity">Quantity to Add</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddProduct} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add to Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
