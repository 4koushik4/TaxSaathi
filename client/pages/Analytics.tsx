import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Loader2, BarChart3, IndianRupee, FileText, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const COLORS = ['#211DFF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyData {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
}

interface SliceData {
  name: string;
  value: number;
  amount: number;
}

export default function Analytics() {
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  // Raw data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Computed chart data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [vendorData, setVendorData] = useState<SliceData[]>([]);
  const [categoryData, setCategoryData] = useState<SliceData[]>([]);

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchAllData();
    }
  }, [user?.id, userLoading]);

  const fetchAllData = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [invoicesRes, salesRes, expensesRes, productsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_date, subtotal, gst_amount, total_amount, status, vendor_name')
          .eq('user_id', user.id)
          .order('invoice_date', { ascending: true }),
        supabase
          .from('sales_transactions')
          .select('id, sale_date, total_amount, gst_amount, quantity_sold, unit_price, product_id')
          .eq('user_id', user.id)
          .order('sale_date', { ascending: true }),
        supabase
          .from('expenses')
          .select('id, category, amount, gst_amount, expense_date')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: true }),
        supabase
          .from('products')
          .select('id, product_name, category, selling_price, purchase_price, current_stock')
          .eq('user_id', user.id),
      ]);

      const invoiceData = invoicesRes.data || [];
      const salesData = salesRes.data || [];
      const expenseData = expensesRes.data || [];
      const productData = productsRes.data || [];

      setInvoices(invoiceData);
      setSales(salesData);
      setExpenses(expenseData);

      processMonthlyData(invoiceData, salesData, expenseData);
      processVendorData(invoiceData);
      processCategoryData(salesData, productData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---- data processors ---- */

  const processMonthlyData = (invoiceData: any[], salesData: any[], expenseData: any[]) => {
    const monthly: Record<string, { sales: number; purchases: number; expenses: number }> = {};
    MONTHS.forEach(m => {
      monthly[m] = { sales: 0, purchases: 0, expenses: 0 };
    });

    salesData.forEach(sale => {
      const idx = new Date(sale.sale_date).getMonth();
      monthly[MONTHS[idx]].sales += parseFloat(sale.total_amount) || 0;
    });

    invoiceData.forEach(inv => {
      const idx = new Date(inv.invoice_date).getMonth();
      monthly[MONTHS[idx]].purchases += parseFloat(inv.total_amount) || 0;
    });

    expenseData.forEach(exp => {
      const idx = new Date(exp.expense_date).getMonth();
      monthly[MONTHS[idx]].expenses += parseFloat(exp.amount) || 0;
    });

    setMonthlyData(
      MONTHS.map(month => ({
        month,
        sales: monthly[month].sales,
        purchases: monthly[month].purchases,
        expenses: monthly[month].expenses,
        profit: monthly[month].sales - monthly[month].purchases - monthly[month].expenses,
      })),
    );
  };

  const processVendorData = (invoiceData: any[]) => {
    const vendorTotals: Record<string, number> = {};
    invoiceData.forEach(inv => {
      const vendor = inv.vendor_name || 'Unknown';
      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (parseFloat(inv.total_amount) || 0);
    });

    const totalAmount = Object.values(vendorTotals).reduce((a, b) => a + b, 0);
    setVendorData(
      Object.entries(vendorTotals)
        .map(([name, amount]) => ({
          name,
          value: totalAmount > 0 ? parseFloat(((amount / totalAmount) * 100).toFixed(1)) : 0,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
    );
  };

  const processCategoryData = (salesData: any[], productData: any[]) => {
    const productMap: Record<string, string> = {};
    productData.forEach(p => {
      productMap[p.id] = p.category || 'Uncategorised';
    });

    const catTotals: Record<string, number> = {};
    salesData.forEach(sale => {
      const cat = (sale.product_id && productMap[sale.product_id]) || 'General';
      catTotals[cat] = (catTotals[cat] || 0) + (parseFloat(sale.total_amount) || 0);
    });

    const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
    setCategoryData(
      Object.entries(catTotals)
        .map(([name, amount]) => ({
          name,
          value: total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
    );
  };

  /* ---- computed metrics ---- */

  const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
  const totalPurchases = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  const totalExpenseAmt = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalGSTCollected = sales.reduce((sum, s) => sum + (parseFloat(s.gst_amount) || 0), 0);
  const totalGSTPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.gst_amount) || 0), 0);
  const netProfit = totalSales - totalPurchases - totalExpenseAmt;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const profitMarginData = monthlyData.map(item => ({
    month: item.month,
    margin: item.sales > 0 ? parseFloat(((item.profit / item.sales) * 100).toFixed(1)) : 0,
  }));

  const nonZeroMargins = profitMarginData.map(d => d.margin).filter(m => m !== 0);
  const marginMin = nonZeroMargins.length > 0 ? Math.min(...nonZeroMargins) : 0;
  const marginMax = nonZeroMargins.length > 0 ? Math.max(...nonZeroMargins) : 100;
  const yDomainLow = Math.floor(marginMin - 10);
  const yDomainHigh = Math.ceil(marginMax + 10);

  /* ---- format helpers ---- */

  const formatCurrency = (n: number) => {
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  };

  /* ---- loading state ---- */

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  const hasData = invoices.length > 0 || sales.length > 0 || expenses.length > 0;

  if (!hasData) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-muted-foreground mt-2">Deep insights into your business performance and trends.</p>
        </div>
        <Card className="shadow-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Start uploading invoices, recording sales, and tracking expenses to see your business analytics here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
        <p className="text-muted-foreground mt-2">Deep insights into your business performance and trends.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Total Sales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {sales.length} transaction{sales.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Total Purchases</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Net Profit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {profitMargin >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">GST Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalGSTCollected - totalGSTPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              Collected {formatCurrency(totalGSTCollected)} · Paid {formatCurrency(totalGSTPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Purchases Trend */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Sales & Purchases Trend</CardTitle>
            <CardDescription>Monthly comparison throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  name="Sales"
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  stroke="hsl(var(--muted-foreground))"
                  fillOpacity={1}
                  fill="url(#colorPurchases)"
                  name="Purchases"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Trend */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Profit Trend</CardTitle>
            <CardDescription>Monthly profit (sales − purchases − expenses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="profit" fill="hsl(var(--success))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Margin Trend */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Profit Margin Trend</CardTitle>
            <CardDescription>Percentage margin throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitMarginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis domain={[yDomainLow, yDomainHigh]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Line
                  type="monotone"
                  dataKey="margin"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  name="Margin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor / Category Breakdown */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">
              {vendorData.length > 0 ? 'Purchases by Vendor' : 'Sales by Category'}
            </CardTitle>
            <CardDescription>
              {vendorData.length > 0
                ? 'Invoice distribution across vendors'
                : 'Revenue distribution by product category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const chartData = vendorData.length > 0 ? vendorData : categoryData;
              if (chartData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No breakdown data available
                  </div>
                );
              }
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Details Table */}
      {vendorData.length > 0 && (
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Vendor Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Vendor</th>
                    <th className="text-right py-3 px-4 font-medium">% of Purchases</th>
                    <th className="text-right py-3 px-4 font-medium">Total Amount</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorData.map(vendor => {
                    const vendorInvoices = invoices.filter(
                      inv => (inv.vendor_name || 'Unknown') === vendor.name,
                    );
                    const avgVal =
                      vendorInvoices.length > 0 ? vendor.amount / vendorInvoices.length : 0;
                    return (
                      <tr
                        key={vendor.name}
                        className="border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{vendor.name}</td>
                        <td className="text-right py-3 px-4 font-medium">{vendor.value}%</td>
                        <td className="text-right py-3 px-4 font-medium">
                          <span className="gradient-text">{formatCurrency(vendor.amount)}</span>
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {formatCurrency(avgVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Details Table */}
      {categoryData.length > 0 && (
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-right py-3 px-4 font-medium">% of Revenue</th>
                    <th className="text-right py-3 px-4 font-medium">Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map(category => (
                    <tr
                      key={category.name}
                      className="border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="text-right py-3 px-4 font-medium">{category.value}%</td>
                      <td className="text-right py-3 px-4 font-medium">
                        <span className="gradient-text">{formatCurrency(category.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Breakdown */}
      {expenses.length > 0 && (
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                    <th className="text-right py-3 px-4 font-medium">GST Included</th>
                    <th className="text-right py-3 px-4 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const catMap: Record<string, { total: number; gst: number; count: number }> = {};
                    expenses.forEach(e => {
                      const cat = e.category || 'Other';
                      if (!catMap[cat]) catMap[cat] = { total: 0, gst: 0, count: 0 };
                      catMap[cat].total += parseFloat(e.amount) || 0;
                      catMap[cat].gst += parseFloat(e.gst_amount) || 0;
                      catMap[cat].count += 1;
                    });
                    return Object.entries(catMap)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([cat, data]) => (
                        <tr
                          key={cat}
                          className="border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium capitalize">{cat}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            <span className="gradient-text">{formatCurrency(data.total)}</span>
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">
                            {formatCurrency(data.gst)}
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">{data.count}</td>
                        </tr>
                      ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
