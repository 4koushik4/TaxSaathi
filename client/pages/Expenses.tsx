import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
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
import { Home, Zap, Users, Wifi, Trash2, MoreHorizontal, Plus } from 'lucide-react';

interface Expense {
  id: string;
  category: 'rent' | 'electricity' | 'salary' | 'internet' | 'other';
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    category: 'rent',
    description: 'Office Rent',
    amount: 25000,
    date: '2024-07-01',
    recurring: true,
  },
  {
    id: '2',
    category: 'electricity',
    description: 'Electricity Bill',
    amount: 3500,
    date: '2024-07-05',
    recurring: true,
  },
  {
    id: '3',
    category: 'salary',
    description: 'Employee Salary - John',
    amount: 15000,
    date: '2024-07-01',
    recurring: true,
  },
  {
    id: '4',
    category: 'salary',
    description: 'Employee Salary - Jane',
    amount: 12000,
    date: '2024-07-01',
    recurring: true,
  },
  {
    id: '5',
    category: 'internet',
    description: 'Internet/Broadband',
    amount: 1500,
    date: '2024-07-01',
    recurring: true,
  },
  {
    id: '6',
    category: 'other',
    description: 'Office Supplies',
    amount: 2300,
    date: '2024-07-08',
    recurring: false,
  },
  {
    id: '7',
    category: 'other',
    description: 'Equipment Maintenance',
    amount: 5000,
    date: '2024-07-12',
    recurring: false,
  },
];

const categoryColors: Record<string, string> = {
  rent: '#211DFF',
  electricity: '#2563EB',
  salary: '#3B82F6',
  internet: '#60A5FA',
  other: '#93C5FD',
};

const categoryIcons: Record<string, any> = {
  rent: Home,
  electricity: Zap,
  salary: Users,
  internet: Wifi,
  other: MoreHorizontal,
};

export default function Expenses() {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState('2024-07');

  const filteredExpenses =
    filterCategory === 'all'
      ? expenses.filter((e) => e.date.startsWith(selectedMonth))
      : expenses.filter((e) => e.category === filterCategory && e.date.startsWith(selectedMonth));

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const recurringExpenses = filteredExpenses
    .filter((e) => e.recurring)
    .reduce((sum, e) => sum + e.amount, 0);
  const oneTimeExpenses = filteredExpenses
    .filter((e) => !e.recurring)
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = [
    {
      name: 'Rent',
      value: filteredExpenses
        .filter((e) => e.category === 'rent')
        .reduce((sum, e) => sum + e.amount, 0),
    },
    {
      name: 'Electricity',
      value: filteredExpenses
        .filter((e) => e.category === 'electricity')
        .reduce((sum, e) => sum + e.amount, 0),
    },
    {
      name: 'Salary',
      value: filteredExpenses
        .filter((e) => e.category === 'salary')
        .reduce((sum, e) => sum + e.amount, 0),
    },
    {
      name: 'Internet',
      value: filteredExpenses
        .filter((e) => e.category === 'internet')
        .reduce((sum, e) => sum + e.amount, 0),
    },
    {
      name: 'Other',
      value: filteredExpenses
        .filter((e) => e.category === 'other')
        .reduce((sum, e) => sum + e.amount, 0),
    },
  ].filter((e) => e.value > 0);

  const monthlyData = [
    { month: 'January', expenses: 58500 },
    { month: 'February', expenses: 58500 },
    { month: 'March', expenses: 60800 },
    { month: 'April', expenses: 58500 },
    { month: 'May', expenses: 58500 },
    { month: 'June', expenses: 58500 },
    { month: 'July', expenses: 64300 },
  ];

  const deletExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      rent: 'Rent',
      electricity: 'Electricity',
      salary: 'Salary',
      internet: 'Internet',
      other: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
          <p className="text-muted-foreground mt-2">Track and categorize your business expenses.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Month and Category Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm">Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recurring Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{recurringExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fixed costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              One-Time Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{oneTimeExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Variable costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Trend</CardTitle>
            <CardDescription>Last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="expenses" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {expensesByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}K`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(categoryColors)[index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expenses in{' '}
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses recorded for this period</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const Icon = categoryIcons[expense.category];
                  return (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-medium text-sm">
                            {getCategoryLabel(expense.category)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{expense.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {expense.recurring ? (
                          <Badge className="bg-primary/10 text-primary">Recurring</Badge>
                        ) : (
                          <Badge variant="outline">One-time</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletExpense(expense.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Net Profit Calculation */}
      <Card className="bg-success/5 border-success/20">
        <CardHeader>
          <CardTitle>Net Profit Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-success/20">
              <span className="text-foreground">Gross Profit (YTD)</span>
              <span className="font-medium">₹3,50,000</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-success/20">
              <span className="text-foreground">Less: Operating Expenses (YTD)</span>
              <span className="font-medium">-₹4,10,100</span>
            </div>
            <div className="flex items-center justify-between py-2 bg-success/10 px-3 rounded-lg">
              <span className="font-semibold text-foreground">Net Profit/Loss (YTD)</span>
              <span className="font-bold text-lg text-success">-₹60,100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: This calculation includes only recorded expenses. Make sure all expenses are
              logged for accurate profit analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
