# Inventory Management System

This implementation adds comprehensive inventory management functionality to the TaxSathi application with Supabase integration.

## Features Implemented

### 🎯 Core Functionality
- **Add Product Modal** with 3 entry methods:
  1. **Upload Invoice** - Upload purchase invoices for automatic data extraction
  2. **Manual Entry** - Complete form with all required fields for GST compliance
  3. **QR Code Scan** - Scan product QR codes for unique identification

### 📋 Comprehensive Product Schema
All required fields for Indian GST compliance and inventory tracking:

#### 🟢 Basic Product Information (Mandatory)
- Product ID / SKU (unique)
- Product Name
- Category
- Brand
- Description
- Product Image URL
- Barcode / QR Code
- Unit Type (pcs, kg, litre, box, etc.)

#### 🟢 Pricing Details (Very Important for GST)
- Purchase Price
- Selling Price
- MRP
- GST % (5%, 12%, 18%, 28%)
- HSN Code (Very important for GST filing)
- Discount %
- Profit Margin
- Currency (₹)

#### 🟢 Stock & Quantity Management
- Current Stock
- Minimum Stock Level (Reorder Level)
- Maximum Stock Level
- Reserved Stock
- Available Stock
- Low Stock Alert (boolean)
- Last Restocked Date

#### 🟢 Supplier Information
- Supplier Name
- Supplier ID
- Supplier Contact
- Purchase Invoice Number
- Batch Number
- Purchase Date

#### 🟢 Sales & Performance Metrics (For Analytics AI)
- Total Units Sold
- Total Revenue Generated
- Total GST Collected
- Total Profit
- Last Sold Date
- Best Selling Flag
- Return Rate
- Damage Count

#### 🟢 Expiry & Compliance
- Manufacturing Date
- Expiry Date
- Is Expirable (boolean)
- Compliance Notes

## Database Schema

### Supabase SQL Schema
Execute the SQL in `supabase-schema.sql` to create the complete database structure:

```sql
-- Run this SQL in your Supabase SQL Editor
-- File: supabase-schema.sql
```

### Key Database Features
- **Automatic Calculations**: Profit margin, available stock, low stock alerts
- **Triggers**: Automatic timestamp updates and business logic
- **Indexes**: Optimized for common queries (product_id, category, brand, low stock)
- **Row Level Security**: Configured for authenticated users
- **Constraints**: Data validation and referential integrity

## API Endpoints

### Product Management Endpoints
- `GET /api/products` - Get all products with filtering and pagination
- `GET /api/products/:id` - Get specific product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search by name, SKU, or brand
- `category` - Filter by category
- `lowStock` - Filter low stock items

## Frontend Components

### Main Components
1. **Inventory Page** (`client/pages/Inventory.tsx`)
   - Product listing with search and filters
   - Key metrics dashboard
   - Stock alerts and analytics
   - Interactive product table

2. **Add Product Modal** (`client/components/AddProductModal.tsx`)
   - Three product entry options
   - Step-by-step workflow
   - Toast notifications

3. **Manual Entry Form** (`client/components/ManualEntryForm.tsx`)
   - Comprehensive form with validation
   - Tabbed interface for organization
   - GST-compliant field structure
   - Real-time validation feedback

### Form Features
- **Zod Validation**: Comprehensive client-side validation
- **React Hook Form**: Efficient form state management
- **Tabbed Interface**: Organized into Basic Info, Pricing & GST, Stock, Supplier
- **Conditional Fields**: Expiry dates only show for expirable products
- **Error Handling**: Clear error messages for all validation failures

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the database schema by running the SQL from `supabase-schema.sql`
3. Set up authentication (email/password or social logins)
4. Configure Row Level Security policies as needed

### 3. Environment Variables
Ensure your `.env` file has the correct Supabase credentials:
```env
VITE_REACT_SUPABASE_URL=https://your-project.supabase.co
VITE_REACT_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the Application
```bash
pnpm dev
```

## Usage

### Adding Products
1. Click "Add Product" button on the Inventory page
2. Choose your preferred entry method:
   - **Upload Invoice**: For bulk imports and automatic data extraction
   - **Manual Entry**: For complete control over all product details
   - **QR Code Scan**: For products with existing QR codes

3. Fill in the required information
4. Submit the form to save to Supabase

### Managing Inventory
- **Search**: Find products by name, SKU, or brand
- **Filter**: Show only low stock items or filter by category
- **Sort**: Organize by profit, stock level, or name
- **Analytics**: View key metrics and performance charts

### Stock Management
- **Low Stock Alerts**: Automatic notifications when stock is below minimum
- **Dead Stock Detection**: Identify products not sold in 60+ days
- **Fast Moving Products**: Track best-selling items
- **Reorder Suggestions**: Based on minimum stock levels

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **React Router 6** for navigation
- **Radix UI** for accessible components
- **TailwindCSS** for styling
- **React Hook Form** for form management
- **Zod** for validation
- **Sonner** for toast notifications
- **Recharts** for data visualization

### Backend
- **Express.js** server
- **Supabase** for database and authentication
- **CORS** for cross-origin requests
- **Environment-based configuration**

### Database
- **PostgreSQL** with Supabase
- **Automatic triggers** for business logic
- **Computed columns** for derived data
- **Indexes** for performance optimization

## Validation & Error Handling

### Client-Side Validation
- Required field validation
- Numeric range validation (prices, percentages, stock levels)
- Date validation for manufacturing/expiry dates
- GST percentage validation (0-100%)
- HSN code validation

### Server-Side Validation
- Database constraints and triggers
- Business logic validation
- Authentication checks
- Input sanitization

### Error Handling
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks to mock data
- Clear error messages for validation failures

## Future Enhancements

### Planned Features
- **Invoice Upload Processing**: OCR integration for automatic data extraction
- **QR Code Scanner**: Camera integration for real-time scanning
- **Bulk Import**: CSV upload for multiple products
- **Inventory Reports**: PDF export functionality
- **Supplier Management**: Dedicated supplier management interface
- **Purchase Orders**: Integration with supplier ordering system

### Integration Opportunities
- **Accounting Software**: Integration with Tally, QuickBooks, etc.
- **E-commerce Platforms**: Sync with Shopify, WooCommerce
- **Barcode Scanners**: Hardware integration for warehouse management
- **Mobile App**: React Native companion application

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Check environment variables and network connectivity
2. **CORS Errors**: Ensure Supabase project allows your domain
3. **Authentication**: Verify user is logged in before accessing protected routes
4. **Validation Errors**: Check required fields and data formats

### Debug Tips
- Check browser console for JavaScript errors
- Verify Supabase project settings and permissions
- Test API endpoints with curl or Postman
- Review server logs for backend errors

## Security Considerations

### Data Protection
- **Row Level Security**: Database-level access control
- **Input Validation**: Both client and server-side validation
- **Authentication**: Required for all product operations
- **HTTPS**: Ensure secure connections in production

### Best Practices
- Never expose service role keys in frontend code
- Use environment variables for sensitive configuration
- Implement proper error handling without exposing internal details
- Regular security audits and updates

## Support

For issues, questions, or feature requests:
1. Check this README for common solutions
2. Review the code comments for implementation details
3. Test with the provided mock data
4. Verify Supabase configuration and permissions

This implementation provides a solid foundation for inventory management with room for growth and customization based on specific business needs.