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
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const yearlySalesData = [
  { month: 'Jan', sales: 45000, cost: 25000, profit: 20000 },
  { month: 'Feb', sales: 52000, cost: 28000, profit: 24000 },
  { month: 'Mar', sales: 48000, cost: 26000, profit: 22000 },
  { month: 'Apr', sales: 61000, cost: 35000, profit: 26000 },
  { month: 'May', sales: 58000, cost: 32000, profit: 26000 },
  { month: 'Jun', sales: 72000, cost: 42000, profit: 30000 },
  { month: 'Jul', sales: 65000, cost: 38000, profit: 27000 },
  { month: 'Aug', sales: 78000, cost: 45000, profit: 33000 },
  { month: 'Sep', sales: 82000, cost: 48000, profit: 34000 },
  { month: 'Oct', sales: 88000, cost: 51000, profit: 37000 },
  { month: 'Nov', sales: 95000, cost: 55000, profit: 40000 },
  { month: 'Dec', sales: 102000, cost: 60000, profit: 42000 },
];

const categoryData = [
  { name: 'Electronics', value: 35, sales: 382000 },
  { name: 'Accessories', value: 28, sales: 306000 },
  { name: 'Software', value: 22, sales: 241000 },
  { name: 'Services', value: 15, sales: 164000 },
];

const COLORS = ['#211DFF', '#2563EB', '#3B82F6', '#60A5FA'];

const profitMarginData = [
  { month: 'Jan', margin: 44.4 },
  { month: 'Feb', margin: 46.2 },
  { month: 'Mar', margin: 45.8 },
  { month: 'Apr', margin: 42.6 },
  { month: 'May', margin: 44.8 },
  { month: 'Jun', margin: 41.7 },
  { month: 'Jul', margin: 41.5 },
  { month: 'Aug', margin: 42.3 },
  { month: 'Sep', margin: 41.5 },
  { month: 'Oct', margin: 42.0 },
  { month: 'Nov', margin: 42.1 },
  { month: 'Dec', margin: 41.2 },
];

export default function Analytics() {
  const { user, loading: userLoading, isDemoUser } = useUser();
  const [yearlySalesData, setYearlySalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch analytics data from Supabase
  const fetchAnalyticsData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: true });

      if (error || !data) {
        console.error('Error fetching analytics data:', error);
        if (isDemoUser) {
          setYearlySalesData([
            { month: 'Jan', sales: 45000, cost: 25000, profit: 20000 },
            { month: 'Feb', sales: 52000, cost: 28000, profit: 24000 },
            { month: 'Mar', sales: 48000, cost: 26000, profit: 22000 },
            { month: 'Apr', sales: 61000, cost: 35000, profit: 26000 },
            { month: 'May', sales: 58000, cost: 32000, profit: 26000 },
            { month: 'Jun', sales: 72000, cost: 42000, profit: 30000 },
            { month: 'Jul', sales: 65000, cost: 38000, profit: 27000 },
            { month: 'Aug', sales: 78000, cost: 45000, profit: 33000 },
            { month: 'Sep', sales: 82000, cost: 48000, profit: 34000 },
            { month: 'Oct', sales: 88000, cost: 51000, profit: 37000 },
            { month: 'Nov', sales: 95000, cost: 55000, profit: 40000 },
            { month: 'Dec', sales: 102000, cost: 60000, profit: 42000 },
          ]);
        }
        return;
      }

      // Group sales by month
      const monthlyData: Record<string, { sales: number; cost: number; profit: number }> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      data.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        
        const sales = parseFloat(transaction.sales_amount) || 0;
        const cost = parseFloat(transaction.cost_amount) || 0;
        const profit = sales - cost;

        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { sales: 0, cost: 0, profit: 0 };
        }

        monthlyData[monthName].sales += sales;
        monthlyData[monthName].cost += cost;
        monthlyData[monthName].profit += profit;
      });

      // Convert to array format
      const analyticsData = months.map(month => ({
        month,
        sales: monthlyData[month]?.sales || 0,
        cost: monthlyData[month]?.cost || 0,
        profit: monthlyData[month]?.profit || 0,
      }));

      setYearlySalesData(analyticsData);
    } catch (error) {
      console.error('Error processing analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user?.id) {
      setYearlySalesData(isDemoUser ? [
        { month: 'Jan', sales: 45000, cost: 25000, profit: 20000 },
        { month: 'Feb', sales: 52000, cost: 28000, profit: 24000 },
        { month: 'Mar', sales: 48000, cost: 26000, profit: 22000 },
        { month: 'Apr', sales: 61000, cost: 35000, profit: 26000 },
        { month: 'May', sales: 58000, cost: 32000, profit: 26000 },
        { month: 'Jun', sales: 72000, cost: 42000, profit: 30000 },
        { month: 'Jul', sales: 65000, cost: 38000, profit: 27000 },
        { month: 'Aug', sales: 78000, cost: 45000, profit: 33000 },
        { month: 'Sep', sales: 82000, cost: 48000, profit: 34000 },
        { month: 'Oct', sales: 88000, cost: 51000, profit: 37000 },
        { month: 'Nov', sales: 95000, cost: 55000, profit: 40000 },
        { month: 'Dec', sales: 102000, cost: 60000, profit: 42000 },
      ] : []);
      fetchAnalyticsData();
    }
  }, [user?.id, userLoading, isDemoUser]);

  const totalSales = yearlySalesData.reduce((sum, item) => sum + item.sales, 0);
  const totalCost = yearlySalesData.reduce((sum, item) => sum + item.cost, 0);
  const totalProfit = yearlySalesData.reduce((sum, item) => sum + item.profit, 0);
  const avgMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

  const categoryData = [
    { name: 'Electronics', value: 35, sales: 382000 },
    { name: 'Accessories', value: 28, sales: 306000 },
    { name: 'Software', value: 22, sales: 241000 },
    { name: 'Services', value: 15, sales: 164000 },
  ];

  const COLORS = ['#211DFF', '#2563EB', '#3B82F6', '#60A5FA'];

  const profitMarginData = yearlySalesData.map(item => ({
    month: item.month,
    margin: item.sales > 0 ? ((item.profit / item.sales) * 100) : 0,
  }));

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
              <span className="gradient-text">Total Sales (YTD)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalSales / 100000).toFixed(2)}L
            </div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ↑ 28% YoY
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Total Cost</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalCost / 100000).toFixed(2)}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">46.6% of sales</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Total Profit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ₹{(totalProfit / 100000).toFixed(2)}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">{avgMargin}% margin</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="gradient-text">Avg Order Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{Math.round(totalSales / 450)}</div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ↑ 12% from last year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly Sales Chart */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Sales & Cost Trend</CardTitle>
            <CardDescription>Monthly comparison throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearlySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
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
                  dataKey="cost"
                  stroke="hsl(var(--muted-foreground))"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="Cost"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Trend */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Profit Trend</CardTitle>
            <CardDescription>Monthly profit throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Margin */}
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
                <YAxis domain={[35, 50]} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
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

        {/* Category Breakdown */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Revenue by Category</CardTitle>
            <CardDescription>Product category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
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
                  <th className="text-right py-3 px-4 font-medium">Avg Sale</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category) => (
                  <tr key={category.name} className="border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-colors">
                    <td className="py-3 px-4 font-medium">{category.name}</td>
                    <td className="text-right py-3 px-4 font-medium">{category.value}%</td>
                    <td className="text-right py-3 px-4 font-medium">
                      <span className="gradient-text">₹{(category.sales / 1000).toFixed(0)}K</span>
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      ₹{Math.round(category.sales / 50)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
