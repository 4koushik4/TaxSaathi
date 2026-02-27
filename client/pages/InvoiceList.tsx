import { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Download, MoreHorizontal, Eye, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  type: 'sales' | 'purchase';
  invoiceNumber: string;
  date: string;
  gstin: string;
  total: number;
  status: 'pending' | 'processed' | 'filed';
  createdAt: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    type: 'sales',
    invoiceNumber: 'INV-2024-001',
    date: '2024-07-15',
    gstin: '27ABCDE1234F2Z0',
    total: 59000,
    status: 'filed',
    createdAt: '2024-07-15',
  },
  {
    id: '2',
    type: 'sales',
    invoiceNumber: 'INV-2024-002',
    date: '2024-07-14',
    gstin: '27ABCDE1234F2Z0',
    total: 45000,
    status: 'processed',
    createdAt: '2024-07-14',
  },
  {
    id: '3',
    type: 'purchase',
    invoiceNumber: 'PUR-2024-001',
    date: '2024-07-13',
    gstin: '27XYZAB5678C1D0',
    total: 32000,
    status: 'processed',
    createdAt: '2024-07-13',
  },
  {
    id: '4',
    type: 'sales',
    invoiceNumber: 'INV-2024-003',
    date: '2024-07-12',
    gstin: '27ABCDE1234F2Z0',
    total: 78000,
    status: 'pending',
    createdAt: '2024-07-12',
  },
  {
    id: '5',
    type: 'purchase',
    invoiceNumber: 'PUR-2024-002',
    date: '2024-07-11',
    gstin: '27XYZAB5678C1D0',
    total: 28000,
    status: 'pending',
    createdAt: '2024-07-11',
  },
  {
    id: '6',
    type: 'sales',
    invoiceNumber: 'INV-2024-004',
    date: '2024-07-10',
    gstin: '27ABCDE1234F2Z0',
    total: 65000,
    status: 'filed',
    createdAt: '2024-07-10',
  },
];

export default function InvoiceList() {
  const { user, loading: userLoading, isDemoUser } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'purchase'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'filed'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch invoices from Supabase
  useEffect(() => {
    // reset visible list while new user loads
    setInvoices(isDemoUser ? MOCK_INVOICES : []);

    const fetchInvoices = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('invoice_date', { ascending: false });

        if (error) {
          console.error('Error fetching invoices:', error);
          setInvoices(isDemoUser ? MOCK_INVOICES : []);
        } else if (data) {
          const transformedInvoices = data.map(inv => ({
            id: inv.id,
            type: (inv.type || 'sales') as 'sales' | 'purchase',
            invoiceNumber: inv.invoice_number,
            date: inv.invoice_date,
            gstin: inv.gst_number || '',
            total: inv.total_amount || 0,
            status: (inv.status || 'pending') as 'pending' | 'processed' | 'filed',
            createdAt: inv.created_at,
          }));
          setInvoices(transformedInvoices);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setInvoices(isDemoUser ? MOCK_INVOICES : []);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading && user?.id) {
      fetchInvoices();
    }
  }, [user?.id, userLoading, isDemoUser]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchSearch =
      searchTerm === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.gstin.includes(searchTerm);

    const matchType = filterType === 'all' || invoice.type === filterType;
    const matchStatus = filterStatus === 'all' || invoice.status === filterStatus;

    const invoiceDate = new Date(invoice.date);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    const matchDateRange =
      (!startDate || invoiceDate >= startDate) && (!endDate || invoiceDate <= endDate);

    return matchSearch && matchType && matchStatus && matchDateRange;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filed':
        return (
          <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Filed
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAllInvoices = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map((i) => i.id));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-2">Manage and view all your sales and purchase invoices.</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <Label className="text-sm">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Invoice no, GSTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <Label className="text-sm">From Date</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* End Date */}
            <div>
              <Label className="text-sm">To Date</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results and Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredInvoices.length} invoices
          {selectedInvoices.length > 0 && ` • ${selectedInvoices.length} selected`}
        </p>
        {selectedInvoices.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Selected
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredInvoices.length > 0 &&
                        selectedInvoices.length === filteredInvoices.length
                      }
                      onChange={toggleAllInvoices}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No invoices found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => toggleInvoice(invoice.id)}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            invoice.type === 'sales' ? 'bg-primary/10 text-primary' : ''
                          }
                        >
                          {invoice.type === 'sales' ? 'Sales' : 'Purchase'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {invoice.gstin}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{invoice.total.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
