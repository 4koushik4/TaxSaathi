import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const productSchema = z.object({
  product_id: z.string().min(1, "SKU is required"),
  product_name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  description: z.string().optional(),
  product_image_url: z.string().optional(),
  barcode: z.string().optional(),
  qr_code: z.string().optional(),
  unit_type: z.string().min(1, "Unit type is required"),
  
  // Pricing Details
  purchase_price: z.number().min(0, "Purchase price must be positive"),
  selling_price: z.number().min(0, "Selling price must be positive"),
  mrp: z.number().min(0, "MRP must be positive"),
  gst_percentage: z.number().min(0).max(100, "GST must be between 0 and 100"),
  hsn_code: z.string().min(1, "HSN Code is required"),
  discount_percentage: z.number().min(0).max(100, "Discount must be between 0 and 100"),
  
  // Stock Management
  current_stock: z.number().min(0, "Current stock must be non-negative"),
  minimum_stock_level: z.number().min(0, "Minimum stock must be non-negative"),
  maximum_stock_level: z.number().min(0, "Maximum stock must be non-negative"),
  reserved_stock: z.number().min(0, "Reserved stock must be non-negative"),
  
  // Supplier Information
  supplier_name: z.string().min(1, "Supplier name is required"),
  supplier_id: z.string().optional(),
  supplier_contact: z.string().optional(),
  purchase_invoice_number: z.string().min(1, "Purchase invoice number is required"),
  batch_number: z.string().optional(),
  purchase_date: z.string().min(1, "Purchase date is required"),
  
  // Expiry & Compliance
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().optional(),
  is_expirable: z.boolean().default(false),
  compliance_notes: z.string().optional(),
});

type FormData = z.infer<typeof productSchema>;

interface ManualEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
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

export function ManualEntryForm({ onSuccess, onCancel, userId }: ManualEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_id: '',
      product_name: '',
      category: '',
      brand: '',
      description: '',
      product_image_url: '',
      barcode: '',
      qr_code: '',
      unit_type: 'pcs',
      purchase_price: 0,
      selling_price: 0,
      mrp: 0,
      gst_percentage: 5,
      hsn_code: '',
      discount_percentage: 0,
      current_stock: 0,
      minimum_stock_level: 0,
      maximum_stock_level: 999999,
      reserved_stock: 0,
      supplier_name: '',
      supplier_id: '',
      supplier_contact: '',
      purchase_invoice_number: '',
      batch_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      manufacturing_date: '',
      expiry_date: '',
      is_expirable: false,
      compliance_notes: '',
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = form;

  const watchIsExpirable = watch('is_expirable');

  const onSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    
    try {
      if (!userId) {
        toast.error('User not authenticated');
        setIsSubmitting(false);
        return;
      }

      await ensureUserProfileExists(userId);

      // Build product data with only defined fields
      const productData: any = {
        user_id: userId,
        product_id: data.product_id,
        product_name: data.product_name,
        category: data.category,
        unit_type: data.unit_type,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        mrp: data.mrp,
        gst_percentage: data.gst_percentage,
        hsn_code: data.hsn_code,
        discount_percentage: data.discount_percentage || 0,
        currency: 'INR',
        current_stock: data.current_stock,
        minimum_stock_level: data.minimum_stock_level,
        maximum_stock_level: data.maximum_stock_level,
        reserved_stock: data.reserved_stock || 0,
        supplier_name: data.supplier_name,
        purchase_invoice_number: data.purchase_invoice_number,
        purchase_date: data.purchase_date,
        is_expirable: data.is_expirable || false,
      };

      // Add optional fields only if they have values
      if (data.brand) productData.brand = data.brand;
      if (data.description) productData.description = data.description;
      if (data.product_image_url) productData.product_image_url = data.product_image_url;
      if (data.barcode) productData.barcode = data.barcode;
      if (data.qr_code) productData.qr_code = data.qr_code;
      if (data.supplier_id) productData.supplier_id = data.supplier_id;
      if (data.supplier_contact) productData.supplier_contact = data.supplier_contact;
      if (data.batch_number) productData.batch_number = data.batch_number;
      if (data.manufacturing_date) productData.manufacturing_date = data.manufacturing_date;
      if (data.expiry_date) productData.expiry_date = data.expiry_date;
      if (data.compliance_notes) productData.compliance_notes = data.compliance_notes;

      const { data: product, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      toast.success('Product created successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating product:', error);
      // Log the full error object to see what's wrong
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      if (error?.code === '42501') {
        toast.error('Database permission missing for products table. Please apply Supabase RLS policies.');
        return;
      }
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to create product. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors);
    toast.error('Please fill in all required fields correctly');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manual Product Entry</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* Show validation errors if any */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</p>
          <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error?.message as string}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & GST</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
        </TabsList>

        {/* Basic Product Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Product Information</CardTitle>
              <CardDescription>Core details about your product</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  {...register('product_name')}
                  placeholder="e.g., Wireless Headphones"
                />
                {errors.product_name && (
                  <p className="text-red-500 text-sm">{errors.product_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_id">SKU *</Label>
                <Input
                  id="product_id"
                  {...register('product_id')}
                  placeholder="e.g., WH-001"
                />
                {errors.product_id && (
                  <p className="text-red-500 text-sm">{errors.product_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Electronics"
                />
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  {...register('brand')}
                  placeholder="e.g., Sony"
                />
                {errors.brand && (
                  <p className="text-red-500 text-sm">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_image_url">Product Image URL</Label>
                <Input
                  id="product_image_url"
                  {...register('product_image_url')}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type *</Label>
                <Select
                  value={watch('unit_type')}
                  onValueChange={(value) => setValue('unit_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="litre">Litres</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit_type && (
                  <p className="text-red-500 text-sm">{errors.unit_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  {...register('barcode')}
                  placeholder="e.g., 1234567890123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr_code">QR Code</Label>
                <Input
                  id="qr_code"
                  {...register('qr_code')}
                  placeholder="QR code identifier"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing & GST */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details & GST</CardTitle>
              <CardDescription>Set pricing and GST information for compliance</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  {...register('purchase_price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.purchase_price && (
                  <p className="text-red-500 text-sm">{errors.purchase_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  {...register('selling_price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.selling_price && (
                  <p className="text-red-500 text-sm">{errors.selling_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mrp">MRP *</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.mrp && (
                  <p className="text-red-500 text-sm">{errors.mrp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_percentage">GST % *</Label>
                <Select
                  value={(watch('gst_percentage') || 5).toString()}
                  onValueChange={(value) => setValue('gst_percentage', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Tax Free)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gst_percentage && (
                  <p className="text-red-500 text-sm">{errors.gst_percentage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN Code *</Label>
                <Input
                  id="hsn_code"
                  {...register('hsn_code')}
                  placeholder="e.g., 8517"
                />
                {errors.hsn_code && (
                  <p className="text-red-500 text-sm">{errors.hsn_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  step="0.01"
                  {...register('discount_percentage', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.discount_percentage && (
                  <p className="text-red-500 text-sm">{errors.discount_percentage.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Management */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>Set stock levels and management settings</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  {...register('current_stock', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.current_stock && (
                  <p className="text-red-500 text-sm">{errors.current_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_stock_level">Minimum Stock Level *</Label>
                <Input
                  id="minimum_stock_level"
                  type="number"
                  {...register('minimum_stock_level', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.minimum_stock_level && (
                  <p className="text-red-500 text-sm">{errors.minimum_stock_level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum_stock_level">Maximum Stock Level</Label>
                <Input
                  id="maximum_stock_level"
                  type="number"
                  {...register('maximum_stock_level', { valueAsNumber: true })}
                  placeholder="999999"
                />
                {errors.maximum_stock_level && (
                  <p className="text-red-500 text-sm">{errors.maximum_stock_level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reserved_stock">Reserved Stock</Label>
                <Input
                  id="reserved_stock"
                  type="number"
                  {...register('reserved_stock', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.reserved_stock && (
                  <p className="text-red-500 text-sm">{errors.reserved_stock.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="purchase_date">Last Restocked Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...register('purchase_date')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watchIsExpirable}
                    onCheckedChange={(checked) => setValue('is_expirable', checked)}
                  />
                  <Label htmlFor="is_expirable">This product is expirable</Label>
                </div>
              </div>

              {watchIsExpirable && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
                    <Input
                      id="manufacturing_date"
                      type="date"
                      {...register('manufacturing_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      {...register('expiry_date')}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="compliance_notes">Compliance Notes</Label>
                <Textarea
                  id="compliance_notes"
                  {...register('compliance_notes')}
                  placeholder="Any compliance notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Information */}
        <TabsContent value="supplier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>Details about your supplier and purchase</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  {...register('supplier_name')}
                  placeholder="e.g., ABC Electronics"
                />
                {errors.supplier_name && (
                  <p className="text-red-500 text-sm">{errors.supplier_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier ID</Label>
                <Input
                  id="supplier_id"
                  {...register('supplier_id')}
                  placeholder="e.g., SUP-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_contact">Supplier Contact</Label>
                <Input
                  id="supplier_contact"
                  {...register('supplier_contact')}
                  placeholder="e.g., +91-9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_invoice_number">Purchase Invoice Number *</Label>
                <Input
                  id="purchase_invoice_number"
                  {...register('purchase_invoice_number')}
                  placeholder="e.g., INV-2024-001"
                />
                {errors.purchase_invoice_number && (
                  <p className="text-red-500 text-sm">{errors.purchase_invoice_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  {...register('batch_number')}
                  placeholder="e.g., B12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...register('purchase_date')}
                />
                {errors.purchase_date && (
                  <p className="text-red-500 text-sm">{errors.purchase_date.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}