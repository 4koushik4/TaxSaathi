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
} from 'lucide-react';

// Mock data
const monthlySalesData = [
  { month: 'Jan', sales: 45000, purchases: 25000 },
  { month: 'Feb', sales: 52000, purchases: 28000 },
  { month: 'Mar', sales: 48000, purchases: 26000 },
  { month: 'Apr', sales: 61000, purchases: 35000 },
  { month: 'May', sales: 58000, purchases: 32000 },
  { month: 'Jun', sales: 72000, purchases: 42000 },
];

const gstTrendData = [
  { month: 'Jan', cgst: 4500, sgst: 4500, igst: 1200 },
  { month: 'Feb', cgst: 5200, sgst: 5200, igst: 1400 },
  { month: 'Mar', cgst: 4800, sgst: 4800, igst: 1300 },
  { month: 'Apr', cgst: 6100, sgst: 6100, igst: 1500 },
  { month: 'May', cgst: 5800, sgst: 5800, igst: 1400 },
  { month: 'Jun', cgst: 7200, sgst: 7200, igst: 1800 },
];

const topProductsData = [
  { name: 'Product A', sales: 45000 },
  { name: 'Product B', sales: 32000 },
  { name: 'Product C', sales: 28000 },
  { name: 'Product D', sales: 18000 },
  { name: 'Product E', sales: 12000 },
];

const COLORS = ['#211DFF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Welcome to Tax Saathi</h1>
        <p className="text-muted-foreground mt-2">Your intelligent tax and inventory management platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Sales */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="gradient-text">Total Revenue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹3,58,000</div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ↑ 12% from last month
            </p>
          </CardContent>
        </Card>

        {/* GST Collected */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-accent" />
              <span className="gradient-text">Tax Collected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹64,440</div>
            <p className="text-xs text-muted-foreground mt-1">From sales</p>
          </CardContent>
        </Card>

        {/* GST Payable */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="gradient-text">Tax Payable</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">₹28,320</div>
            <p className="text-xs text-muted-foreground mt-1">After ITC</p>
          </CardContent>
        </Card>

        {/* Purchase Value */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <span className="gradient-text">Purchases</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹1,88,000</div>
            <p className="text-xs text-muted-foreground mt-1">Total purchases</p>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="gradient-text">Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹82,500</div>
            <p className="text-xs text-muted-foreground mt-1">Current value</p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent" />
              <span className="gradient-text">Net Profit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹1,70,000</div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ↑ 8% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="gradient-text">Tax Alerts & Reminders</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Alert className="border-warning bg-gradient-to-r from-warning/10 to-transparent">
            <Zap className="h-4 w-4 text-warning" />
            <AlertDescription>
              <strong>Inventory Alert:</strong> 5 products have stock below minimum threshold
            </AlertDescription>
          </Alert>
          <Alert className="border-info bg-gradient-to-r from-info/10 to-transparent">
            <AlertCircle className="h-4 w-4 text-info" />
            <AlertDescription>
              <strong>Tax Filing Due:</strong> Monthly tax filing due in 8 days (July 20th)
            </AlertDescription>
          </Alert>
          <Alert className="border-warning bg-gradient-to-r from-warning/10 to-transparent">
            <Zap className="h-4 w-4 text-warning" />
            <AlertDescription>
              <strong>Registration Threshold:</strong> You're at ₹38.2L YTD (approaching ₹40L threshold)
            </AlertDescription>
          </Alert>
          <Alert className="border-destructive bg-gradient-to-r from-destructive/10 to-transparent">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription>
              <strong>Suspicious Invoice:</strong> Invoice INV-2024-001 has mismatched tax amounts
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Monthly Revenue & Expenses</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name="Sales"
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  name="Purchases"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GST Trend Chart */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Tax Trend</CardTitle>
            <CardDescription>CGST, SGST, IGST breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gstTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cgst" stackId="a" fill="hsl(var(--primary))" name="CGST" />
                <Bar dataKey="sgst" stackId="a" fill="hsl(var(--info))" name="SGST" />
                <Bar dataKey="igst" stackId="a" fill="hsl(var(--muted))" name="IGST" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Top Performing Products</CardTitle>
            <CardDescription>By revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Margin Distribution */}
        <Card className="shadow-glow-violet hover:shadow-glow-violet transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Revenue Distribution</CardTitle>
            <CardDescription>Revenue breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProductsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}K`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

        {/* Quick Actions */}
        <Card className="shadow-glow hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="gradient-text">Quick Actions</CardTitle>
            <CardDescription>Quick access to common tax and business tasks</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              className="btn-primary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs text-center">Upload Sales Invoice</span>
            </Button>
            <Button 
              className="btn-secondary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs text-center">Upload Purchase Invoice</span>
            </Button>
            <Button 
              className="btn-primary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs text-center">Generate Tax Report</span>
            </Button>
            <Button 
              className="btn-secondary h-20 flex flex-col gap-2 justify-center hover:scale-105 transition-transform duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs text-center">Open Chatbot</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
