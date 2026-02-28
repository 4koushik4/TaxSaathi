import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Loader2,
  Camera,
  Upload,
} from 'lucide-react';
import { AddProductModal } from '@/components/AddProductModal';
import { supabase } from '@/lib/supabase';
import { Product } from '@shared/api';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';

interface ProductData {
  id: string;
  product_name: string;
  product_id: string;
  current_stock: number;
  minimum_stock_level: number;
  purchase_price: number;
  selling_price: number;
  profit: number;
  profit_margin: number;
  last_sold_date: string;
}

// Mock data for demonstration
const MOCK_PRODUCTS = [
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
  const { user, loading: userLoading, isDemoUser } = useUser();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'profit' | 'stock' | 'name'>('profit');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  // Edit / Delete / Adjust Stock state
  const [editProduct, setEditProduct] = useState<ProductData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    product_name: '',
    product_id: '',
    purchase_price: '',
    selling_price: '',
    minimum_stock_level: '',
    category: '',
    gst_percentage: '',
    hsn_code: '',
    barcode: '',
  });

  const [adjustProduct, setAdjustProduct] = useState<ProductData | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustMode, setAdjustMode] = useState<'set' | 'add' | 'subtract'>('set');

  const [deleteProduct, setDeleteProduct] = useState<ProductData | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);

  const toProductData = (item: any): ProductData => {
    const purchasePrice = Number(item.purchase_price ?? item.avgCost ?? 0);
    const sellingPrice = Number(item.selling_price ?? item.sellingPrice ?? 0);
    const profit = Number(item.profit ?? (sellingPrice - purchasePrice));
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      id: item.id,
      product_name: item.product_name ?? item.name ?? 'Unnamed Product',
      product_id: item.product_id ?? item.sku ?? 'SKU-NA',
      current_stock: Number(item.current_stock ?? item.currentStock ?? 0),
      minimum_stock_level: Number(item.minimum_stock_level ?? item.minStock ?? 0),
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      profit,
      profit_margin: Number(item.profit_margin ?? profitMargin),
      last_sold_date:
        item.last_sold_date ?? item.lastSoldDate ?? new Date().toISOString().split('T')[0],
    };
  };

  // Fetch products from Supabase
  const fetchProducts = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setProducts(isDemoUser ? MOCK_PRODUCTS.map(toProductData) : []);
      } else if (data) {
        const transformedProducts = data.map(toProductData);
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(MOCK_PRODUCTS.map(toProductData));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user?.id) {
      // reset list based on demo status while fetching
      setProducts(isDemoUser ? MOCK_PRODUCTS.map(toProductData) : []);
      fetchProducts();
    }
  }, [user?.id, userLoading, isDemoUser]);

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      searchTerm === '' ||
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_id.includes(searchTerm);

    const matchLowStock = !filterLowStock || product.current_stock < product.minimum_stock_level;

    return matchSearch && matchLowStock;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.profit - a.profit;
      case 'stock':
        return a.current_stock - b.current_stock;
      case 'name':
        return a.product_name.localeCompare(b.product_name);
      default:
        return 0;
    }
  });

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.purchase_price * p.current_stock,
    0
  );

  const lowStockCount = products.filter(
    (p) => p.current_stock < p.minimum_stock_level
  ).length;

  const fastMovingProducts = products.filter(
    (p) => new Date(p.last_sold_date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const deadStockProducts = products.filter(
    (p) => new Date(p.last_sold_date).getTime() < Date.now() - 60 * 24 * 60 * 60 * 1000
  );

  const topProductsByProfit = products.slice()
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  // ── Edit handler ──
  const openEdit = (product: ProductData) => {
    setEditProduct(product);
    setEditForm({
      product_name: product.product_name,
      product_id: product.product_id,
      purchase_price: String(product.purchase_price),
      selling_price: String(product.selling_price),
      minimum_stock_level: String(product.minimum_stock_level),
      category: '',
      gst_percentage: '',
      hsn_code: '',
      barcode: '',
    });
    // Load extra fields from DB
    if (!isDemoUser && user?.id) {
      supabase.from('products').select('category, gst_percentage, hsn_code, barcode').eq('id', product.id).single()
        .then(({ data }) => {
          if (data) {
            setEditForm(prev => ({
              ...prev,
              category: data.category || '',
              gst_percentage: String(data.gst_percentage ?? ''),
              hsn_code: data.hsn_code || '',
              barcode: data.barcode || '',
            }));
          }
        });
    }
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    setActionLoading(true);
    try {
      if (!isDemoUser && user?.id) {
        const { error } = await supabase
          .from('products')
          .update({
            product_name: editForm.product_name,
            product_id: editForm.product_id,
            purchase_price: parseFloat(editForm.purchase_price) || 0,
            selling_price: parseFloat(editForm.selling_price) || 0,
            minimum_stock_level: parseInt(editForm.minimum_stock_level) || 0,
            category: editForm.category || 'General',
            gst_percentage: parseFloat(editForm.gst_percentage) || 0,
            hsn_code: editForm.hsn_code || '',
            barcode: editForm.barcode.trim() || null,
          })
          .eq('id', editProduct.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating product:', error);
          alert('Failed to update product: ' + error.message);
          return;
        }
      }
      // Update local state
      setProducts(prev => prev.map(p => {
        if (p.id !== editProduct.id) return p;
        const purchasePrice = parseFloat(editForm.purchase_price) || 0;
        const sellingPrice = parseFloat(editForm.selling_price) || 0;
        const profit = sellingPrice - purchasePrice;
        return {
          ...p,
          product_name: editForm.product_name,
          product_id: editForm.product_id,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          minimum_stock_level: parseInt(editForm.minimum_stock_level) || 0,
          profit,
          profit_margin: sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0,
        };
      }));
      setEditOpen(false);
      setEditProduct(null);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Adjust Stock handler ──
  const openAdjustStock = (product: ProductData) => {
    setAdjustProduct(product);
    setAdjustQty(String(product.current_stock));
    setAdjustMode('set');
    setAdjustOpen(true);
  };

  const handleAdjustSave = async () => {
    if (!adjustProduct) return;
    const qty = parseInt(adjustQty) || 0;
    let newStock: number;
    switch (adjustMode) {
      case 'add': newStock = adjustProduct.current_stock + qty; break;
      case 'subtract': newStock = Math.max(0, adjustProduct.current_stock - qty); break;
      default: newStock = Math.max(0, qty);
    }

    setActionLoading(true);
    try {
      if (!isDemoUser && user?.id) {
        const { error } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', adjustProduct.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error adjusting stock:', error);
          alert('Failed to adjust stock: ' + error.message);
          return;
        }
      }
      setProducts(prev => prev.map(p =>
        p.id === adjustProduct.id ? { ...p, current_stock: newStock } : p
      ));
      setAdjustOpen(false);
      setAdjustProduct(null);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete handler ──
  const openDelete = (product: ProductData) => {
    setDeleteProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    setActionLoading(true);
    try {
      if (!isDemoUser && user?.id) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', deleteProduct.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting product:', error);
          alert('Failed to delete product: ' + error.message);
          return;
        }
      }
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setDeleteOpen(false);
      setDeleteProduct(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.inventory.title}</h1>
          <p className="text-muted-foreground mt-2">{t.inventory.subtitle}</p>
        </div>
        <Button className="gap-2" onClick={() => setAddProductOpen(true)}>
          <Plus className="w-4 h-4" />
          {t.inventory.addProduct}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.inventory.totalValue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalInventoryValue / 100000).toFixed(2)}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">{products.length} {t.dashboard.products}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.inventory.lowStockItems}
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
              {t.inventory.fastMoving}
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
              {t.inventory.deadStock}
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
          <CardTitle>{t.inventory.topProductsByProfit}</CardTitle>
          <CardDescription>{t.inventory.topProductsByProfit}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsByProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
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
                  placeholder={t.inventory.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label className="text-sm">{t.inventory.sortBy}</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="profit">{t.inventory.sortByProfit}</option>
                <option value="stock">{t.inventory.sortByStock}</option>
                <option value="name">{t.inventory.sortByName}</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">{t.inventory.filterLowStock}</span>
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
                  <TableHead>{t.inventory.productName}</TableHead>
                  <TableHead>{t.inventory.sku}</TableHead>
                  <TableHead className="text-right">{t.inventory.currentStock}</TableHead>
                  <TableHead className="text-right">{t.inventory.purchasePrice}</TableHead>
                  <TableHead className="text-right">{t.inventory.sellingPrice}</TableHead>
                  <TableHead className="text-right">{t.inventory.profit}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.current_stock < product.minimum_stock_level;
                  const isDeadStock =
                    new Date(product.last_sold_date).getTime() <
                    Date.now() - 60 * 24 * 60 * 60 * 1000;

                  return (
                    <TableRow key={product.product_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.product_id}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isLowStock ? 'font-semibold text-destructive' : 'font-medium'
                          }
                        >
                          {product.current_stock}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          (Min: {product.minimum_stock_level})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{product.purchase_price}</TableCell>
                      <TableCell className="text-right">₹{product.selling_price}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-success">₹{product.profit}</div>
                        <div className="text-xs text-muted-foreground">
                          {Number(product.profit_margin ?? 0).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.current_stock === 0 ? (
                          <Badge className="bg-destructive/10 text-destructive">{t.inventory.outOfStockBadge}</Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-warning/10 text-warning flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t.inventory.lowStockBadge}
                          </Badge>
                        ) : isDeadStock ? (
                          <Badge className="bg-destructive/10 text-destructive">{t.inventory.deadStock}</Badge>
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
                            <DropdownMenuItem onClick={() => openEdit(product)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {t.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjustStock(product)}>
                              <Package className="w-4 h-4 mr-2" />
                              {t.inventory.adjustStock}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openDelete(product)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t.common.delete}
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

      {/* Add Product Modal */}
      <AddProductModal 
        open={addProductOpen} 
        onOpenChange={setAddProductOpen}
        onProductAdded={fetchProducts}
        userId={user?.id || ''}
      />

      {/* ── Edit Product Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.inventory.editProduct}</DialogTitle>
            <DialogDescription>{t.inventory.editProduct}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>{t.inventory.productName}</Label>
              <Input value={editForm.product_name} onChange={e => setEditForm(f => ({ ...f, product_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t.addProduct.sku}</Label>
                <Input value={editForm.product_id} onChange={e => setEditForm(f => ({ ...f, product_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t.inventory.minimumStockLevel}</Label>
                <Input type="number" value={editForm.minimum_stock_level} onChange={e => setEditForm(f => ({ ...f, minimum_stock_level: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t.addProduct.purchasePrice}</Label>
                <Input type="number" value={editForm.purchase_price} onChange={e => setEditForm(f => ({ ...f, purchase_price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t.addProduct.sellingPrice}</Label>
                <Input type="number" value={editForm.selling_price} onChange={e => setEditForm(f => ({ ...f, selling_price: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t.inventory.gstPercentage}</Label>
                <Select value={editForm.gst_percentage} onValueChange={v => setEditForm(f => ({ ...f, gst_percentage: v }))}>
                  <SelectTrigger><SelectValue placeholder={t.inventory.gstPercentage} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t.inventory.hsnCode}</Label>
                <Input value={editForm.hsn_code} onChange={e => setEditForm(f => ({ ...f, hsn_code: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t.common.category}</Label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder={t.addProduct.categoryPlaceholder} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Food">Food & Beverages</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t.inventory.barcode}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter or scan a unique barcode"
                  value={editForm.barcode}
                  onChange={e => setEditForm(f => ({ ...f, barcode: e.target.value }))}
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBarcodeScanning(true);
                      try {
                        // Try BarcodeDetector API first
                        let detected: string | null = null;
                        if ((window as any).BarcodeDetector) {
                          try {
                            const img = new Image();
                            await new Promise<void>((resolve, reject) => {
                              img.onload = () => resolve();
                              img.onerror = reject;
                              img.src = URL.createObjectURL(file);
                            });
                            const bd = new (window as any).BarcodeDetector({ formats: ['ean_13','ean_8','code_128','code_39','qr_code'] });
                            const results = await bd.detect(img);
                            if (results.length > 0) detected = results[0].rawValue;
                          } catch {}
                        }
                        // Fall back to Groq Vision API
                        if (!detected) {
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const r = new FileReader();
                            r.onload = () => resolve((r.result as string).split(',')[1]);
                            r.onerror = reject;
                            r.readAsDataURL(file);
                          });
                          const resp = await fetch('/api/ocr/barcode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64Data: base64 }),
                          });
                          if (resp.ok) {
                            const data = await resp.json();
                            if (data.code) detected = data.code;
                          }
                        }
                        if (detected) {
                          setEditForm(f => ({ ...f, barcode: detected! }));
                        } else {
                          alert('No barcode detected in this image. Try a clearer photo.');
                        }
                      } catch (err) {
                        console.error('Barcode scan error:', err);
                        alert('Failed to detect barcode from image.');
                      } finally {
                        setBarcodeScanning(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" asChild disabled={barcodeScanning}>
                    <span>
                      {barcodeScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Type a barcode or tap the camera icon to scan from an image.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleEditSave} disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Stock Dialog ── */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.inventory.stockAdjustment}</DialogTitle>
            <DialogDescription>
              {adjustProduct?.product_name} — Current stock: <strong>{adjustProduct?.current_stock}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Adjustment Mode</Label>
              <Select value={adjustMode} onValueChange={v => setAdjustMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">{t.inventory.setStock}</SelectItem>
                  <SelectItem value="add">{t.inventory.addStock}</SelectItem>
                  <SelectItem value="subtract">{t.inventory.removeStock}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{adjustMode === 'set' ? 'New Quantity' : adjustMode === 'add' ? 'Quantity to Add' : 'Quantity to Remove'}</Label>
              <Input type="number" min="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
            </div>
            {adjustProduct && (
              <p className="text-sm text-muted-foreground">
                New stock will be:{' '}
                <strong>
                  {adjustMode === 'set'
                    ? Math.max(0, parseInt(adjustQty) || 0)
                    : adjustMode === 'add'
                    ? adjustProduct.current_stock + (parseInt(adjustQty) || 0)
                    : Math.max(0, adjustProduct.current_stock - (parseInt(adjustQty) || 0))}
                </strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleAdjustSave} disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.inventory.deleteProduct}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProduct?.product_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
