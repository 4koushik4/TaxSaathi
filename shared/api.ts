/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Product schema for inventory management
 * Includes all required fields for Indian GST compliance and inventory tracking
 */

export interface Product {
  id: string;
  product_id: string; // SKU
  product_name: string;
  category: string;
  brand: string;
  description: string;
  product_image_url: string | null;
  barcode: string | null;
  qr_code: string | null;
  unit_type: string;
  
  // Pricing Details (GST Important)
  purchase_price: number;
  selling_price: number;
  mrp: number;
  gst_percentage: number;
  hsn_code: string;
  discount_percentage: number;
  profit_margin: number;
  currency: string;
  
  // Stock Management
  current_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_alert: boolean;
  last_restocked_date: string | null;
  
  // Supplier Information
  supplier_name: string;
  supplier_id: string;
  supplier_contact: string;
  purchase_invoice_number: string;
  batch_number: string;
  purchase_date: string;
  
  // Sales & Performance Metrics
  total_units_sold: number;
  total_revenue_generated: number;
  total_gst_collected: number;
  total_profit: number;
  last_sold_date: string | null;
  best_selling_flag: boolean;
  return_rate: number;
  damage_count: number;
  
  // Expiry & Compliance
  manufacturing_date: string | null;
  expiry_date: string | null;
  is_expirable: boolean;
  compliance_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  user_id: string;
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  description: string;
  product_image_url?: string;
  barcode?: string;
  qr_code?: string;
  unit_type: string;
  
  // Pricing Details
  purchase_price: number;
  selling_price: number;
  mrp: number;
  gst_percentage: number;
  hsn_code: string;
  discount_percentage: number;
  currency?: string;
  
  // Stock Management
  current_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reserved_stock?: number;
  
  // Supplier Information
  supplier_name: string;
  supplier_id: string;
  supplier_contact: string;
  purchase_invoice_number: string;
  batch_number: string;
  purchase_date: string;
  
  // Expiry & Compliance
  manufacturing_date?: string;
  expiry_date?: string;
  is_expirable?: boolean;
  compliance_notes?: string;
}

export interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

export interface ProductsResponse {
  success: boolean;
  data?: Product[];
  error?: string;
  total?: number;
}
