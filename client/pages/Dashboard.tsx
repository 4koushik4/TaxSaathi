import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Zap,
  Upload,
  FileText,
  MessageSquare,
  DollarSign,
  Percent,
  Package,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const COLORS = ['#211DFF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  gstCollected: number;
  gstPaid: number;
  gstPayable: number;
  inventoryValue: number;
  grossProfit: number;
  monthlySalesData: any[];
  gstTrendData: any[];
  topProducts: any[];
  categoryBreakdown: any[];
  alerts: { title: string; message: string; type: 'warning' | 'info' | 'error' }[];
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
  totalInvoices: number;
  gsrFilingDue: string;
  profitMargin: number;
}

const emptyMetrics: DashboardMetrics = {
  totalSales: 0,
  totalPurchases: 0,
  totalExpenses: 0,
  gstCollected: 0,
  gstPaid: 0,
  gstPayable: 0,
  inventoryValue: 0,
  grossProfit: 0,
  monthlySalesData: [],
  gstTrendData: [],
  topProducts: [],
  categoryBreakdown: [],
  alerts: [],
  lowStockCount: 0,
  outOfStockCount: 0,
  totalProducts: 0,
  totalInvoices: 0,
  gsrFilingDue: '',
  profitMargin: 0,
};

export default function Dashboard() {
  const { user, isDemoUser } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // For demo users, use mock data
        if (isDemoUser) {
          setMetrics({
            ...emptyMetrics,
            totalSales: 358000,
            totalPurchases: 188000,
            totalExpenses: 47300,
            gstCollected: 64440,
            gstPaid: 33840,
            gstPayable: 30600,
            inventoryValue: 82500,
            grossProfit: 170000,
            monthlySalesData: generateMockMonthlyData(),
            gstTrendData: generateMockGSTTrend(),
            topProducts: generateMockTopProducts(),
            categoryBreakdown: generateMockCategoryBreakdown(),
            lowStockCount: 3,
            outOfStockCount: 1,
            totalProducts: 12,
            totalInvoices: 24,
            gsrFilingDue: getNextFilingDate(),
            profitMargin: 47.5,
          });
          setLoading(false);
          return;
        }

        // ── Fetch all data in parallel ──
        const [
          { data: gstTransactions },
          { data: products },
          { data: expenses },
          { data: invoices },
        ] = await Promise.all([
          supabase.from('gst_transactions').select('*').eq('user_id', user.id),
          supabase.from('products').select('*').eq('user_id', user.id),
          supabase.from('expenses').select('*').eq('user_id', user.id),
          supabase.from('invoices').select('*').eq('user_id', user.id),
        ]);

        // ── Sales & Purchases from gst_transactions ──
        const salesTxns = gstTransactions?.filter(t => t.transaction_type === 'sales') || [];
        const purchaseTxns = gstTransactions?.filter(t => t.transaction_type === 'purchases') || [];

        const totalSales = salesTxns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const totalPurchases = purchaseTxns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

        // GST collected (from sales) and paid (from purchases)
        const gstCollected = salesTxns.reduce((s, t) =>
          s + (parseFloat(t.cgst || 0)) + (parseFloat(t.sgst || 0)) + (parseFloat(t.igst || 0)), 0);
        const gstPaid = purchaseTxns.reduce((s, t) =>
          s + (parseFloat(t.cgst || 0)) + (parseFloat(t.sgst || 0)) + (parseFloat(t.igst || 0)), 0);
        const gstPayable = Math.max(0, gstCollected - gstPaid);

        // ── Expenses total ──
        const totalExpenses = expenses?.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) || 0;

        // ── Inventory metrics from products ──
        const allProducts = products || [];
        const inventoryValue = allProducts.reduce((s, p) =>
          s + ((Number(p.current_stock) || 0) * (Number(p.purchase_price) || 0)), 0);
        const lowStockCount = allProducts.filter(p =>
          (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) < (Number(p.minimum_stock_level) || 0)).length;
        const outOfStockCount = allProducts.filter(p => (Number(p.current_stock) || 0) === 0).length;

        // ── Monthly trend data (last 6 months) ──
        const now = new Date();
        const monthlySalesData: any[] = [];
        const gstTrendData: any[] = [];

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mStart = targetDate.toISOString().split('T')[0];
          const mEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];
          const label = MONTH_LABELS[targetDate.getMonth()];

          const monthSales = salesTxns.filter(t => t.transaction_date >= mStart && t.transaction_date <= mEnd);
          const monthPurch = purchaseTxns.filter(t => t.transaction_date >= mStart && t.transaction_date <= mEnd);
          const monthExp = (expenses || []).filter(e => e.expense_date >= mStart && e.expense_date <= mEnd);

          const salesAmt = monthSales.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
          const purchAmt = monthPurch.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
          const expAmt = monthExp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

          monthlySalesData.push({ month: label, sales: salesAmt, purchases: purchAmt, expenses: expAmt });

          const mCgst = monthSales.reduce((s, t) => s + (parseFloat(t.cgst || 0)), 0);
          const mSgst = monthSales.reduce((s, t) => s + (parseFloat(t.sgst || 0)), 0);
          const mIgst = monthSales.reduce((s, t) => s + (parseFloat(t.igst || 0)), 0);
          gstTrendData.push({ month: label, cgst: Math.round(mCgst), sgst: Math.round(mSgst), igst: Math.round(mIgst) });
        }

        // ── Top products by stock value (selling_price * current_stock) ──
        const topProducts = allProducts
          .map(p => ({
            name: p.product_name || 'Unnamed',
            sales: (Number(p.selling_price) || 0) * (Number(p.current_stock) || 0),
          }))
          .filter(p => p.sales > 0)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        // ── Category breakdown from products ──
        const catMap: Record<string, number> = {};
        allProducts.forEach(p => {
          const cat = p.category || 'General';
          catMap[cat] = (catMap[cat] || 0) + ((Number(p.selling_price) || 0) * (Number(p.current_stock) || 0));
        });
        const categoryBreakdown = Object.entries(catMap)
          .map(([name, sales]) => ({ name, sales }))
          .filter(c => c.sales > 0)
          .sort((a, b) => b.sales - a.sales);

        // ── Profit calculations ──
        const grossProfit = totalSales - totalPurchases;
        const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        // ── Alerts ──
        const alerts: DashboardMetrics['alerts'] = [];
        if (lowStockCount > 0) {
          alerts.push({ title: 'Low Stock', message: `${lowStockCount} products below minimum threshold`, type: 'warning' });
        }
        if (outOfStockCount > 0) {
          alerts.push({ title: 'Out of Stock', message: `${outOfStockCount} products have zero stock`, type: 'error' });
        }
        if (gstPayable > 0) {
          alerts.push({ title: 'GST Payable', message: `₹${gstPayable.toLocaleString()} net GST payable`, type: 'info' });
        }

        setMetrics({
          totalSales,
          totalPurchases,
          totalExpenses,
          gstCollected,
          gstPaid,
          gstPayable,
          inventoryValue,
          grossProfit,
          monthlySalesData,
          gstTrendData,
          topProducts,
          categoryBreakdown,
          alerts,
          lowStockCount,
          outOfStockCount,
          totalProducts: allProducts.length,
          totalInvoices: invoices?.length || 0,
          gsrFilingDue: getNextFilingDate(),
          profitMargin,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (!isDemoUser) {
          setMetrics(emptyMetrics);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isDemoUser]);

  // Format currency smartly
  const fmt = (val: number) => {
    if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{t.dashboard.loadingDashboard}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          {t.dashboard.welcomeBack} {user?.full_name || 'User'}
          {isDemoUser && <span className="text-sm font-normal text-muted-foreground ml-2">{t.dashboard.demoAccount}</span>}
        </h1>
        <p className="text-muted-foreground mt-2">{t.dashboard.subtitle}</p>
      </div>

      {/* Summary Cards - Row 1: Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="gradient-text">{t.dashboard.totalRevenue}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.totalInvoices} {t.dashboard.invoices}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <span className="gradient-text">{t.dashboard.totalPurchases}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.totalPurchases)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.dashboard.costOfGoods}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-warning" />
              <span className="gradient-text">{t.dashboard.totalExpenses}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.dashboard.operatingCosts}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="gradient-text">{t.dashboard.netProfit}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {fmt(metrics.grossProfit)}
            </div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metrics.profitMargin.toFixed(1)}% {t.dashboard.margin}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2: Tax & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              <span className="gradient-text">{t.dashboard.gstCollected}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.gstCollected)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.dashboard.outputTax}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-accent" />
              <span className="gradient-text">{t.dashboard.itcGstPaid}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.gstPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.dashboard.inputTaxCredit}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="gradient-text">{t.dashboard.netGstPayable}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{fmt(metrics.gstPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.dashboard.afterItcDeduction}</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <span className="gradient-text">{t.dashboard.inventoryValue}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(metrics.inventoryValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalProducts} {t.dashboard.products}{metrics.lowStockCount > 0 ? ` · ${metrics.lowStockCount} ${t.dashboard.lowStock}` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="gradient-text">{t.dashboard.alertsReminders}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.gsrFilingDue && (
            <Alert className="border-info bg-gradient-to-r from-info/10 to-transparent">
              <AlertCircle className="h-4 w-4 text-info" />
              <AlertDescription>
                <strong>{t.dashboard.gstFilingDue}</strong> {t.dashboard.nextGstrFiling} {metrics.gsrFilingDue}
              </AlertDescription>
            </Alert>
          )}
          {metrics.outOfStockCount > 0 && (
            <Alert className="border-destructive bg-gradient-to-r from-destructive/10 to-transparent">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <strong>{t.dashboard.outOfStock}</strong> {metrics.outOfStockCount} {t.dashboard.productsZeroStock}
              </AlertDescription>
            </Alert>
          )}
          {metrics.lowStockCount > 0 && (
            <Alert className="border-warning bg-gradient-to-r from-warning/10 to-transparent">
              <Zap className="h-4 w-4 text-warning" />
              <AlertDescription>
                <strong>{t.dashboard.lowStockAlert}</strong> {metrics.lowStockCount} {t.dashboard.productsBelowThreshold}
              </AlertDescription>
            </Alert>
          )}
          {metrics.gstPayable > 0 && (
            <Alert className="border-warning bg-gradient-to-r from-warning/10 to-transparent">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription>
                <strong>{t.dashboard.gstPayable}</strong> {fmt(metrics.gstPayable)} {t.dashboard.netGstPayableThisPeriod}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue & Expenses */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">{t.dashboard.monthlyRevenueExpenses}</CardTitle>
            <CardDescription>{t.dashboard.last6MonthsTrend}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} name={t.dashboard.sales} />
                <Line type="monotone" dataKey="purchases" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name={t.dashboard.purchases} />
                <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} name={t.dashboard.expenses} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GST Trend Chart */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">{t.dashboard.gstBreakdownTrend}</CardTitle>
            <CardDescription>{t.dashboard.cgstSgstIgst6Months}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.gstTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Bar dataKey="cgst" stackId="a" fill="hsl(var(--primary))" name="CGST" />
                <Bar dataKey="sgst" stackId="a" fill="hsl(var(--info))" name="SGST" />
                <Bar dataKey="igst" stackId="a" fill="hsl(var(--muted))" name="IGST" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Products */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">{t.dashboard.topProductsByValue}</CardTitle>
            <CardDescription>{t.dashboard.stockValue}</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t.dashboard.noProductsYet}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">{t.dashboard.categoryBreakdown}</CardTitle>
            <CardDescription>{t.dashboard.inventoryByCategory}</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${fmt(value)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sales"
                  >
                    {metrics.categoryBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t.dashboard.noCategoryData}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
        <CardHeader>
            <CardTitle className="gradient-text">{t.dashboard.quickActions}</CardTitle>
            <CardDescription>{t.dashboard.quickActionsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => navigate('/upload')}
              className="btn-primary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs text-center">{t.dashboard.uploadInvoice}</span>
            </Button>
            <Button
              onClick={() => navigate('/inventory')}
              className="btn-secondary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <Package className="w-5 h-5" />
              <span className="text-xs text-center">{t.dashboard.manageInventory}</span>
            </Button>
            <Button
              onClick={() => navigate('/gst-reports')}
              className="btn-primary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs text-center">{t.dashboard.gstReports}</span>
            </Button>
            <Button
              onClick={() => navigate('/chatbot')}
              className="btn-secondary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs text-center">{t.dashboard.taxChatbot}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper functions for mock/demo data ──
function getNextFilingDate(): string {
  const now = new Date();
  const day = now.getDate();
  const filingDay = 20;
  let target: Date;
  if (day <= filingDay) {
    target = new Date(now.getFullYear(), now.getMonth(), filingDay);
  } else {
    target = new Date(now.getFullYear(), now.getMonth() + 1, filingDay);
  }
  return target.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
}

function generateMockMonthlyData() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: MONTH_LABELS[d.getMonth()],
      sales: 40000 + Math.round(Math.random() * 35000),
      purchases: 20000 + Math.round(Math.random() * 22000),
      expenses: 5000 + Math.round(Math.random() * 12000),
    };
  });
}

function generateMockGSTTrend() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: MONTH_LABELS[d.getMonth()],
      cgst: 3000 + Math.round(Math.random() * 5000),
      sgst: 3000 + Math.round(Math.random() * 5000),
      igst: 1000 + Math.round(Math.random() * 3000),
    };
  });
}

function generateMockTopProducts() {
  return [
    { name: 'Product A', sales: 45000 },
    { name: 'Product B', sales: 32000 },
    { name: 'Product C', sales: 28000 },
    { name: 'Product D', sales: 18000 },
    { name: 'Product E', sales: 12000 },
  ];
}

function generateMockCategoryBreakdown() {
  return [
    { name: 'Electronics', sales: 65000 },
    { name: 'Clothing', sales: 42000 },
    { name: 'Food', sales: 28000 },
    { name: 'General', sales: 15000 },
  ];
}
