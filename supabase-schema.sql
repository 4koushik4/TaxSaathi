-- ============================================================================
-- TaxSaathi Application - Complete Database Schema
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_demo_user BOOLEAN DEFAULT FALSE,
  business_name VARCHAR(255),
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  phone_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  business_type VARCHAR(100),
  subscription_status VARCHAR(50) DEFAULT 'free', -- free, premium, enterprise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- enable row level security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- policy for insert: allow if matching authenticated user OR allow anyone (needed for signup)
CREATE POLICY "allow insert into users" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'anon'
  );

-- policy for select: allow authenticated or anon (so demo lookup works)
CREATE POLICY "allow select users" ON users
  FOR SELECT
  USING (
    auth.role() = 'anon' OR auth.uid() = id
  );

-- allow filtering by any column for anon reads
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- policy for update: restrict to owner only
CREATE POLICY "allow update own user" ON users
  FOR UPDATE
  USING (auth.uid() = id);



-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL, -- SKU
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  description TEXT,
  product_image_url VARCHAR(500),
  barcode VARCHAR(100),
  qr_code VARCHAR(500),
  unit_type VARCHAR(50) NOT NULL, -- pcs, kg, litre, box, pack, set
  
  -- Pricing
  purchase_price DECIMAL(12, 2) NOT NULL,
  selling_price DECIMAL(12, 2) NOT NULL,
  mrp DECIMAL(12, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  hsn_code VARCHAR(20) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Stock Management
  current_stock INT DEFAULT 0,
  minimum_stock_level INT DEFAULT 0,
  maximum_stock_level INT DEFAULT 999999,
  reserved_stock INT DEFAULT 0,
  
  -- Supplier Information
  supplier_name VARCHAR(255) NOT NULL,
  supplier_id VARCHAR(100),
  supplier_contact VARCHAR(20),
  purchase_invoice_number VARCHAR(100) NOT NULL,
  batch_number VARCHAR(100),
  purchase_date DATE NOT NULL,
  
  -- Expiry & Compliance
  manufacturing_date DATE,
  expiry_date DATE,
  is_expirable BOOLEAN DEFAULT FALSE,
  compliance_notes TEXT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sold_date TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, product_id)
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  vendor_name VARCHAR(255),
  vendor_gst VARCHAR(20),
  vendor_address TEXT,
  
  -- Amounts
  subtotal DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processed, reconciled
  document_url VARCHAR(500),
  ocr_confidence INT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, invoice_number)
);

-- ============================================================================
-- INVOICE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  item_name VARCHAR(255) NOT NULL,
  hsn_code VARCHAR(20),
  quantity DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 0,
  item_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- office, utilities, internet, shipping, etc
  description VARCHAR(500),
  amount DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50), -- cash, card, bank_transfer, check
  reference_number VARCHAR(100),
  receipt_url VARCHAR(500),
  is_gst_deductible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GST TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS gst_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- sales, purchases, return
  amount DECIMAL(12, 2) NOT NULL,
  gst_rate DECIMAL(5, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) NOT NULL,
  source_id UUID, -- invoice_id or expense_id
  igst DECIMAL(12, 2) DEFAULT 0,
  cgst DECIMAL(12, 2) DEFAULT 0,
  sgst DECIMAL(12, 2) DEFAULT 0,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SALES TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255),
  customer_gst VARCHAR(20),
  product_id UUID REFERENCES products(id),
  quantity_sold INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  sale_date DATE NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, transaction_number)
);

-- ============================================================================
-- ANALYTICS SUMMARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  
  -- Revenue Metrics
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_purchases DECIMAL(12, 2) DEFAULT 0,
  gross_profit DECIMAL(12, 2) GENERATED ALWAYS AS (total_sales - total_purchases) STORED,
  
  -- GST Metrics
  sales_gst_collected DECIMAL(12, 2) DEFAULT 0,
  purchase_gst_paid DECIMAL(12, 2) DEFAULT 0,
  gst_payable DECIMAL(12, 2) GENERATED ALWAYS AS (sales_gst_collected - purchase_gst_paid) STORED,
  
  -- Inventory Metrics
  inventory_value DECIMAL(12, 2) DEFAULT 0,
  products_count INT DEFAULT 0,
  low_stock_count INT DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, month_year)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- low_stock, gst_due, invoice_received, etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_item_id UUID,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gst_registration_status VARCHAR(50) DEFAULT 'regular', -- regular, composition, unregistered
  gst_filing_frequency VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual
  financial_year_start INT DEFAULT 4, -- April = 4
  tax_year_end INT DEFAULT 3, -- March = 3
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  invoice_next_number INT DEFAULT 1001,
  currency_code VARCHAR(10) DEFAULT 'INR',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  tax_exemption_limit DECIMAL(12, 2) DEFAULT 2000000, -- ₹20L for regular GST
  composition_limit DECIMAL(12, 2) DEFAULT 5000000, -- ₹50L for composition scheme
  enable_notifications BOOLEAN DEFAULT TRUE,
  enable_auto_gst_calculation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_qr_code ON products(qr_code);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_gst_transactions_user_id ON gst_transactions(user_id);
CREATE INDEX idx_gst_transactions_date ON gst_transactions(transaction_date);
CREATE INDEX idx_sales_user_id ON sales_transactions(user_id);
CREATE INDEX idx_sales_date ON sales_transactions(sale_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_analytics_user_id ON analytics_summary(user_id);

-- ============================================================================
-- INSERT DEMO USER AND DATA
-- ============================================================================

-- Create demo user
INSERT INTO users (id, email, full_name, is_demo_user, business_name, gst_number, pan_number, phone_number, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@taxsaathi.com',
  'Demo User',
  TRUE,
  'Demo Electronics Retail',
  '18AABCA9999A1Z5',
  'ABCDE1234F',
  '+91-9876543210',
  'premium'
);

-- Create demo user settings
INSERT INTO user_settings (user_id, gst_registration_status, gst_filing_frequency, invoice_prefix)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'regular',
  'monthly',
  'INV'
);

-- Insert demo products
INSERT INTO products (
  user_id, product_id, product_name, category, brand, description,
  unit_type, purchase_price, selling_price, mrp, gst_percentage, hsn_code,
  current_stock, minimum_stock_level, supplier_name, purchase_invoice_number,
  purchase_date, last_sold_date
)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WH-001', 'Wireless Headphones', 'Electronics', 'Sony', 'Noise cancelling wireless headphones',
  'pcs', 800.00, 1299.00, 1499.00, 18, '8517', 5, 10, 'ABC Electronics', 'INV-2024-001', '2024-06-15', '2024-07-15'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'USB-002', 'USB Cable', 'Accessories', 'Generic', 'High speed USB 3.0 cable',
  'pcs', 50.00, 149.00, 199.00, 18, '8544', 45, 20, 'ABC Electronics', 'INV-2024-001', '2024-06-15', '2024-07-16'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'CASE-003', 'Phone Case', 'Accessories', 'Generic', 'Premium silicone phone case',
  'pcs', 150.00, 349.00, 499.00, 18, '3926', 2, 15, 'XYZ Supplies', 'INV-2024-002', '2024-06-20', '2024-07-10'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SP-004', 'Screen Protector', 'Accessories', 'Generic', 'Tempered glass screen protector',
  'pcs', 30.00, 79.00, 99.00, 12, '3916', 0, 25, 'XYZ Supplies', 'INV-2024-002', '2024-06-20', '2024-06-20'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'CHR-005', 'Charger', 'Electronics', 'Samsung', 'Fast charging adapter',
  'pcs', 400.00, 799.00, 999.00, 18, '8504', 18, 10, 'ABC Electronics', 'INV-2024-003', '2024-07-01', '2024-07-15'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'KB-006', 'Keyboard', 'Electronics', 'Logitech', 'Mechanical gaming keyboard',
  'pcs', 1200.00, 1999.00, 2499.00, 18, '8471', 3, 8, 'Tech Distributors', 'INV-2024-004', '2024-06-10', '2024-07-12'
);

-- Insert demo invoices
INSERT INTO invoices (user_id, invoice_number, invoice_date, vendor_name, vendor_gst, subtotal, gst_amount, total_amount, status)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-2024-001', '2024-06-15', 'ABC Electronics', '18AABCA9999A1Z5',
  100000.00, 18000.00, 118000.00, 'processed'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-2024-002', '2024-06-20', 'XYZ Supplies', '28AABCA9999A1Z5',
  50000.00, 6000.00, 56000.00, 'processed'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-2024-003', '2024-07-01', 'ABC Electronics', '18AABCA9999A1Z5',
  80000.00, 14400.00, 94400.00, 'processed'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-2024-004', '2024-06-10', 'Tech Distributors', '18AABCA9999A1Z5',
  68000.00, 12240.00, 80240.00, 'processed'
);

-- Insert demo expenses
INSERT INTO expenses (user_id, category, description, amount, gst_amount, expense_date, is_gst_deductible)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'office', 'Office rent', 25000.00, 0.00, '2024-07-01', FALSE
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'utilities', 'Electricity bill', 5000.00, 0.00, '2024-07-05', FALSE
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'internet', 'Internet subscription', 1500.00, 270.00, '2024-07-10', TRUE
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'shipping', 'Courier charges', 8000.00, 1440.00, '2024-07-12', TRUE
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'office', 'Office supplies', 3000.00, 540.00, '2024-07-15', TRUE
);

-- Insert demo sales transactions
INSERT INTO sales_transactions (user_id, transaction_number, customer_name, quantity_sold, unit_price, total_amount, gst_amount, sale_date)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SAL-2024-001', 'Customer A', 2, 1299.00, 2598.00, 467.64, '2024-07-15'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SAL-2024-002', 'Customer B', 5, 149.00, 745.00, 134.10, '2024-07-16'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SAL-2024-003', 'Customer C', 3, 799.00, 2397.00, 431.46, '2024-07-17'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SAL-2024-004', 'Customer D', 1, 1999.00, 1999.00, 359.82, '2024-07-18'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SAL-2024-005', 'Customer E', 10, 79.00, 790.00, 94.80, '2024-07-16'
);

-- Insert demo GST transactions
INSERT INTO gst_transactions (user_id, transaction_type, amount, gst_rate, gst_amount, transaction_date)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'sales', 10000.00, 18, 1800.00, '2024-07-15'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'sales', 5000.00, 18, 900.00, '2024-07-16'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'purchases', 50000.00, 18, 9000.00, '2024-06-15'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'purchases', 30000.00, 18, 5400.00, '2024-06-20'
);

-- Insert demo notifications
INSERT INTO notifications (user_id, type, title, message, is_read, priority)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'low_stock', 'Low Stock Alert: Screen Protector', 'Screen Protector is out of stock. Consider reordering.', FALSE, 'high'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'low_stock', 'Low Stock Alert: Wireless Headphones', 'Wireless Headphones stock is below minimum level (5 units).', FALSE, 'high'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'gst_due', 'GST Filing Due Next Week', 'Your GST return is due on July 20th. Please ensure all invoices are recorded.', FALSE, 'urgent'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'invoice_received', 'New Invoice Received', 'Invoice INV-2024-004 from Tech Distributors has been received and processed.', TRUE, 'normal'
);

-- Insert demo analytics summary
INSERT INTO analytics_summary (user_id, month_year, total_sales, total_purchases, sales_gst_collected, purchase_gst_paid, inventory_value, products_count, low_stock_count)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '2024-07-01'::date,
  358000.00, 188000.00, 64440.00, 36000.00, 82500.00, 6, 3
);
