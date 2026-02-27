# TaxSathi

**Intelligent GST & Inventory Management for Indian Small Businesses**

TaxSathi is a full-stack web application that helps Indian small businesses manage GST compliance, invoices, inventory, expenses, and business analytics — all from one platform. It features OCR-based invoice scanning, AI-powered barcode detection, real-time dashboards, and automated GST calculations.

---

## Features

- **Invoice OCR** — Upload invoice images; text is extracted via OCR.space and parsed with regex + Groq AI (Llama 4 Scout) to automatically fill in invoice details and line items
- **Barcode / QR Scanning** — Detect product barcodes from images or camera using browser BarcodeDetector API with Groq Vision API fallback
- **Inventory Management** — Full CRUD for products with GST percentage, HSN codes, stock levels, barcode assignment, supplier info, and low-stock / out-of-stock alerts
- **GST Compliance** — Tracks GST transactions (sales, purchases, returns) with CGST/SGST/IGST breakdown; generates GSTR-1 reports with month/year filtering and ITC computation
- **Expense Tracking** — Categorized business expenses with GST deductibility flags and payment method tracking
- **Analytics Dashboard** — Real-time metrics: revenue, purchases, expenses, net profit, GST collected/paid/payable, inventory value, profit margins, and monthly trend charts
- **Smart Notifications** — Auto-generated alerts for low stock, out-of-stock products, GST filing deadlines, and net GST payable
- **AI Chatbot** — Built-in chatbot assistant for tax-related queries
- **User Authentication** — Supabase Auth with login, registration, password reset, and demo account support
- **Dark Theme** — App-wide dark mode with gradient accents
- **Responsive Design** — Collapsible sidebar and mobile-optimized layout
- **3D Landing Page** — Three.js powered visuals on the marketing page

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router 6 (SPA), TypeScript, Vite, TailwindCSS 3, Radix UI, Lucide React, Recharts, Framer Motion, React Three Fiber |
| **Backend** | Express 5, Node.js |
| **Database** | Supabase (PostgreSQL with Row Level Security) |
| **AI / OCR** | OCR.space API, Groq API (Llama 4 Scout — vision + text) |
| **Validation** | Zod, React Hook Form |
| **Testing** | Vitest |
| **Deployment** | Vercel, Netlify |

---

## Project Structure

```
client/                        # React SPA frontend
├── App.tsx                    # Root component with routing & providers
├── global.css                 # TailwindCSS theming & global styles
├── context/
│   └── UserContext.tsx        # Auth / user context provider
├── components/
│   ├── MainLayout.tsx         # Authenticated layout with sidebar
│   ├── Sidebar.tsx            # Navigation sidebar (dynamic user info)
│   ├── AddProductModal.tsx    # Multi-tab product creation (upload, manual, scan)
│   └── ui/                    # 45+ Radix-based UI primitives
├── hooks/                     # Custom hooks (mobile detection, toast)
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   └── utils.ts               # cn() utility (clsx + tailwind-merge)
└── pages/                     # 16 page components
    ├── Dashboard.tsx          # Main dashboard with real-time metrics
    ├── InvoiceUpload.tsx      # Upload & OCR scan invoices
    ├── InvoiceList.tsx        # View all invoices
    ├── Inventory.tsx          # Product management with edit/delete/adjust stock
    ├── GSTReports.tsx         # GSTR-1 generation with date filtering
    ├── Expenses.tsx           # Expense tracking
    ├── Analytics.tsx          # Business analytics & charts
    ├── Chatbot.tsx            # AI chatbot assistant
    ├── Notifications.tsx      # Smart auto-generated alerts
    ├── Settings.tsx           # User & business settings
    ├── Landing.tsx            # Marketing landing page (3D)
    ├── Login.tsx              # Login page
    ├── Register.tsx           # Registration page
    └── ForgotPassword.tsx     # Password reset

server/                        # Express API backend
├── index.ts                   # Server setup, OCR/barcode handlers, routes
├── node-build.ts              # Production static file server
└── routes/
    ├── demo.ts                # Demo endpoint
    └── products.ts            # Product CRUD endpoints

shared/
└── api.ts                     # Shared TypeScript interfaces

api/
└── [...path].ts               # Vercel serverless function entry point

supabase-schema.sql            # Complete database schema with demo data
```

---

## Pages & Routes

### Public
| Path | Page | Description |
|---|---|---|
| `/` | Landing | Marketing page with 3D visuals |
| `/login` | Login | User login |
| `/register` | Register | User registration |
| `/forgot-password` | ForgotPassword | Password reset |

### Authenticated (with Sidebar)
| Path | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | Revenue, GST, inventory, profit metrics & charts |
| `/upload` | InvoiceUpload | Upload invoices with OCR extraction |
| `/invoices` | InvoiceList | Browse & manage all invoices |
| `/inventory` | Inventory | Product CRUD, stock adjustments, barcode management |
| `/gst-reports` | GSTReports | GSTR-1 reports with month/year filtering |
| `/expenses` | Expenses | Expense tracking & categorization |
| `/analytics` | Analytics | Business analytics & data visualizations |
| `/chatbot` | Chatbot | AI assistant for tax queries |
| `/notifications` | Notifications | Smart alerts (stock, GST, invoices) |
| `/settings` | Settings | User, business & notification settings |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ping` | Health check |
| `GET` | `/api/demo` | Demo endpoint |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `POST` | `/api/ocr/invoice` | OCR scan invoice image (base64) → parsed data |
| `POST` | `/api/ocr/barcode` | Barcode/QR detection from image via Groq Vision |

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | User accounts, business info, subscription |
| `products` | Inventory: name, SKU, barcode, prices, GST/HSN, stock, supplier |
| `invoices` | Invoice headers: vendor, amounts, status, OCR confidence |
| `invoice_items` | Invoice line items with quantity, price, GST |
| `expenses` | Business expenses with category and GST deductibility |
| `gst_transactions` | GST records: sales/purchases/returns with CGST/SGST/IGST |
| `sales_transactions` | Sales with customer info and GST |
| `analytics_summary` | Monthly aggregated business metrics |
| `notifications` | User alerts with priority levels |
| `user_settings` | Per-user preferences (filing frequency, invoice prefix, etc.) |

Row Level Security (RLS) is enabled with policies restricting data access to the owning user.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) package manager
- [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
git clone https://github.com/your-username/TaxSathi.git
cd TaxSathi
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_REACT_SUPABASE_URL=https://your-project.supabase.co
VITE_REACT_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OCR & AI
OCR_SPACE_API_KEY=your-ocr-space-key
GROQ_API_KEY=your-groq-api-key
```

### Database Setup

Run the contents of `supabase-schema.sql` in your Supabase SQL Editor to create all tables, indexes, RLS policies, and demo data.

### Development

```bash
pnpm dev          # Start dev server (client + server on port 8080)
```

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (client + server) |
| `pnpm build:client` | Build frontend only |
| `pnpm build:server` | Build backend only |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript type validation |
| `pnpm test` | Run Vitest tests |
| `pnpm format.fix` | Format code with Prettier |

---

## Deployment

### Vercel

The project includes `vercel.json` and a serverless function entry point at `api/[...path].ts`. Connect your repo to Vercel and set environment variables in the Vercel dashboard.

### Netlify

The project includes `netlify.toml` and a serverless function at `netlify/functions/api.ts`. Deploy via Netlify CLI or connect the repo in the Netlify dashboard.

---

## License

This project is private and not licensed for public distribution.
