import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  avgCost: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
  lastSoldDate: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    currentStock: 5,
    minStock: 10,
    avgCost: 800,
    sellingPrice: 1299,
    profit: 499,
    profitMargin: 38.4,
    lastSoldDate: '2024-07-15',
  },
  {
    id: '2',
    name: 'USB Cable',
    sku: 'USB-002',
    currentStock: 45,
    minStock: 20,
    avgCost: 50,
    sellingPrice: 149,
    profit: 99,
    profitMargin: 66.4,
    lastSoldDate: '2024-07-16',
  },
  {
    id: '3',
    name: 'Phone Case',
    sku: 'CASE-003',
    currentStock: 2,
    minStock: 15,
    avgCost: 150,
    sellingPrice: 349,
    profit: 199,
    profitMargin: 57.0,
    lastSoldDate: '2024-07-10',
  },
  {
    id: '4',
    name: 'Screen Protector',
    sku: 'SP-004',
    currentStock: 0,
    minStock: 25,
    avgCost: 30,
    sellingPrice: 79,
    profit: 49,
    profitMargin: 62.0,
    lastSoldDate: '2024-06-20',
  },
  {
    id: '5',
    name: 'Charger',
    sku: 'CHR-005',
    currentStock: 18,
    minStock: 10,
    avgCost: 400,
    sellingPrice: 799,
    profit: 399,
    profitMargin: 49.9,
    lastSoldDate: '2024-07-15',
  },
  {
    id: '6',
    name: 'Keyboard',
    sku: 'KB-006',
    currentStock: 3,
    minStock: 8,
    avgCost: 1200,
    sellingPrice: 1999,
    profit: 799,
    profitMargin: 40.0,
    lastSoldDate: '2024-07-12',
  },
];

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'profit' | 'stock' | 'name'>('profit');

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.includes(searchTerm);

    const matchLowStock = !filterLowStock || product.currentStock < product.minStock;

    return matchSearch && matchLowStock;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.profit - a.profit;
      case 'stock':
        return a.currentStock - b.currentStock;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalInventoryValue = MOCK_PRODUCTS.reduce(
    (sum, p) => sum + p.avgCost * p.currentStock,
    0
  );

  const lowStockCount = MOCK_PRODUCTS.filter(
    (p) => p.currentStock < p.minStock
  ).length;

  const fastMovingProducts = MOCK_PRODUCTS.filter(
    (p) => new Date(p.lastSoldDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const deadStockProducts = MOCK_PRODUCTS.filter(
    (p) => new Date(p.lastSoldDate).getTime() < Date.now() - 60 * 24 * 60 * 60 * 1000
  );

  const topProductsByProfit = MOCK_PRODUCTS.slice()
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-2">Manage products, stock levels, and inventory insights.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalInventoryValue / 100000).toFixed(2)}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">{MOCK_PRODUCTS.length} products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fast Moving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{fastMovingProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dead Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{deadStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">60+ days not sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <Alert className="border-warning bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <strong>{lowStockCount} products</strong> are below minimum stock threshold. Consider
            reordering soon.
          </AlertDescription>
        </Alert>
      )}

      {deadStockProducts.length > 0 && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>{deadStockProducts.length} products</strong> haven't been sold in 60+ days.
            Review pricing or consider removing them.
          </AlertDescription>
        </Alert>
      )}

      {/* Top Products by Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Profit</CardTitle>
          <CardDescription>Best performing products this month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsByProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm">Search Product</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Product name, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label className="text-sm">Sort By</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="profit">Profit (High to Low)</option>
                <option value="stock">Stock (Low to High)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Low Stock Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.currentStock < product.minStock;
                  const isDeadStock =
                    new Date(product.lastSoldDate).getTime() <
                    Date.now() - 60 * 24 * 60 * 60 * 1000;

                  return (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isLowStock ? 'font-semibold text-destructive' : 'font-medium'
                          }
                        >
                          {product.currentStock}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          (Min: {product.minStock})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{product.avgCost}</TableCell>
                      <TableCell className="text-right">₹{product.sellingPrice}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-success">₹{product.profit}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.profitMargin.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.currentStock === 0 ? (
                          <Badge className="bg-destructive/10 text-destructive">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-warning/10 text-warning flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        ) : isDeadStock ? (
                          <Badge className="bg-destructive/10 text-destructive">Dead Stock</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="w-4 h-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
