import { RequestHandler } from "express";
import { supabase } from "../../client/lib/supabase";
import { CreateProductRequest, ProductResponse, ProductsResponse } from "@shared/api";

export const getProducts: RequestHandler = async (req, res) => {
  try {
    const { page = "1", limit = "20", search, category, lowStock } = req.query;
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `product_name.ilike.%${search}%,product_id.ilike.%${search}%,brand.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (lowStock === 'true') {
      query = query.lt('current_stock', 'minimum_stock_level');
    }

    // Apply pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ProductsResponse);
    }

    res.json({
      success: true,
      data: data || [],
      total: count || 0
    } as ProductsResponse);

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ProductsResponse);
  }
};

export const getProductById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ProductResponse);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ProductResponse);
    }

    res.json({
      success: true,
      data
    } as ProductResponse);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ProductResponse);
  }
};

export const createProduct: RequestHandler = async (req, res) => {
  try {
    const productData: CreateProductRequest = req.body;

    // Validate required fields
    const requiredFields = [
      'product_id', 'product_name', 'category', 'brand', 'unit_type',
      'purchase_price', 'selling_price', 'mrp', 'gst_percentage', 'hsn_code',
      'current_stock', 'minimum_stock_level', 'supplier_name', 'purchase_invoice_number', 'purchase_date'
    ];

    for (const field of requiredFields) {
      if (!productData[field as keyof CreateProductRequest]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        } as ProductResponse);
      }
    }

    // Validate numeric fields
    if (productData.purchase_price < 0 || productData.selling_price < 0 || productData.mrp < 0) {
      return res.status(400).json({
        success: false,
        error: 'Prices cannot be negative'
      } as ProductResponse);
    }

    if (productData.gst_percentage < 0 || productData.gst_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'GST percentage must be between 0 and 100'
      } as ProductResponse);
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        currency: productData.currency || 'INR',
        reserved_stock: productData.reserved_stock || 0,
        is_expirable: productData.is_expirable || false,
        compliance_notes: productData.compliance_notes || null,
        manufacturing_date: productData.manufacturing_date || null,
        expiry_date: productData.expiry_date || null
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ProductResponse);
    }

    res.status(201).json({
      success: true,
      data
    } as ProductResponse);

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ProductResponse);
  }
};

export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ProductResponse);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ProductResponse);
    }

    res.json({
      success: true,
      data
    } as ProductResponse);

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ProductResponse);
  }
};

export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ProductResponse);
    }

    res.json({
      success: true
    } as ProductResponse);

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ProductResponse);
  }
};