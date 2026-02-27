import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Percent,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

interface GSTR1Row {
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const GSTR1_DATA: GSTR1Row[] = [];

export default function GSTReports() {
  const { user, loading: userLoading, isDemoUser } = useUser();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [gstData, setGstData] = useState<GSTR1Row[]>([]);
  const [totalITC, setTotalITC] = useState(0);
  const [gstTrendData, setGstTrendData] = useState<{ month: string; payable: number; filed: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate year options dynamically (current year + 2 previous)
  const yearOptions = Array.from({ length: 3 }, (_, i) => String(currentDate.getFullYear() - i));

  // Fetch GST transactions from Supabase - filtered by month/year
  const fetchGSTData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const monthIndex = MONTHS.indexOf(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
      const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];

      // Fetch SALES transactions for selected period (GSTR1)
      const { data: salesTransactions, error: salesError } = await supabase
        .from('gst_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'sales')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (salesError) {
        console.error('Error fetching sales GST data:', salesError);
        setGstData([]);
      } else if (salesTransactions) {
        // Get related invoice info
        const invoiceIds = salesTransactions.map(t => t.source_id).filter(Boolean);
        let invoiceMap: Record<string, any> = {};
        
        if (invoiceIds.length > 0) {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, vendor_gst')
            .in('id', invoiceIds);
          
          if (invoices) {
            invoiceMap = Object.fromEntries(invoices.map(inv => [inv.id, inv]));
          }
        }

        const transformedData = salesTransactions.map(item => {
          const invoice = invoiceMap[item.source_id];
          return {
            gstin: invoice?.vendor_gst || '',
            invoiceNumber: invoice?.invoice_number || '',
            invoiceDate: item.transaction_date,
            taxableValue: parseFloat(item.amount) || 0,
            cgst: parseFloat(item.cgst) || 0,
            sgst: parseFloat(item.sgst) || 0,
            igst: parseFloat(item.igst) || 0,
            total: (parseFloat(item.amount) || 0) + parseFloat(item.cgst || 0) + parseFloat(item.sgst || 0) + parseFloat(item.igst || 0),
          };
        });
        setGstData(transformedData);
      }

      // Fetch PURCHASE transactions for ITC (Input Tax Credit)
      const { data: purchaseTransactions, error: purchaseError } = await supabase
        .from('gst_transactions')
        .select('cgst, sgst, igst, gst_amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'purchases')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (!purchaseError && purchaseTransactions) {
        const itc = purchaseTransactions.reduce((sum, t) => {
          return sum + (parseFloat(t.cgst || '0') + parseFloat(t.sgst || '0') + parseFloat(t.igst || '0'));
        }, 0);
        setTotalITC(itc);
      } else {
        setTotalITC(0);
      }

      // Fetch trend data - last 6 months + current month
      await fetchTrendData(year, monthIndex);
    } catch (error) {
      console.error('Error fetching GST data:', error);
      setGstData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real monthly trend data from database
  const fetchTrendData = async (year: number, currentMonthIndex: number) => {
    if (!user?.id) return;

    try {
      const trendResults: { month: string; payable: number; filed: boolean }[] = [];

      // Get data for the last 7 months
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(year, currentMonthIndex - i, 1);
        const mStart = targetDate.toISOString().split('T')[0];
        const mEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];
        const monthLabel = MONTHS[targetDate.getMonth()].substring(0, 3);

        // Get sales GST for this month
        const { data: salesData } = await supabase
          .from('gst_transactions')
          .select('cgst, sgst, igst')
          .eq('user_id', user.id)
          .eq('transaction_type', 'sales')
          .gte('transaction_date', mStart)
          .lte('transaction_date', mEnd);

        // Get purchase GST (ITC) for this month
        const { data: purchaseData } = await supabase
          .from('gst_transactions')
          .select('cgst, sgst, igst')
          .eq('user_id', user.id)
          .eq('transaction_type', 'purchases')
          .gte('transaction_date', mStart)
          .lte('transaction_date', mEnd);

        const salesGST = (salesData || []).reduce((sum, t) =>
          sum + (parseFloat(t.cgst || '0') + parseFloat(t.sgst || '0') + parseFloat(t.igst || '0')), 0);
        
        const purchaseGST = (purchaseData || []).reduce((sum, t) =>
          sum + (parseFloat(t.cgst || '0') + parseFloat(t.sgst || '0') + parseFloat(t.igst || '0')), 0);

        const netPayable = Math.max(0, salesGST - purchaseGST);

        trendResults.push({
          month: monthLabel,
          payable: Math.round(netPayable),
          filed: i > 0, // Past months assumed filed, current month not
        });
      }

      setGstTrendData(trendResults);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setGstTrendData([]);
    }
  };

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchGSTData();
    }
  }, [user?.id, userLoading, selectedMonth, selectedYear]);

  const totalTaxableSales = gstData.reduce((sum, row) => sum + row.taxableValue, 0);
  const totalCGST = gstData.reduce((sum, row) => sum + row.cgst, 0);
  const totalSGST = gstData.reduce((sum, row) => sum + row.sgst, 0);
  const totalIGST = gstData.reduce((sum, row) => sum + row.igst, 0);
  const netGSTPayable = Math.max(0, totalCGST + totalSGST + totalIGST - totalITC);

  const monthIndex = MONTHS.indexOf(selectedMonth);
  const currentTrendEntry = gstTrendData.find(t => t.month === selectedMonth.substring(0, 3));
  const isFilingDue = !currentTrendEntry?.filed;
  const filingDeadline = 20;
  const today = new Date();
  const daysLeft = Math.max(0, filingDeadline - today.getDate());

  // Download GSTR1 report as CSV
  const downloadGSTR1CSV = () => {
    const headers = ['Buyer GSTIN', 'Invoice Number', 'Invoice Date', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'];
    const rows = gstData.map(row => [
      row.gstin,
      row.invoiceNumber,
      row.invoiceDate,
      row.taxableValue.toFixed(2),
      row.cgst.toFixed(2),
      row.sgst.toFixed(2),
      row.igst.toFixed(2),
      row.total.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      ['Total Taxable Sales', totalTaxableSales.toFixed(2)].join(','),
      ['Total CGST', totalCGST.toFixed(2)].join(','),
      ['Total SGST', totalSGST.toFixed(2)].join(','),
      ['Total IGST', totalIGST.toFixed(2)].join(','),
      ['Total ITC', totalITC.toFixed(2)].join(','),
      ['Net GST Payable', netGSTPayable.toFixed(2)].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1-${selectedMonth}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Download GSTR1 report as JSON
  const downloadGSTR1JSON = () => {
    const gstr1Report = {
      period: `${selectedMonth} ${selectedYear}`,
      taxpayer: {
        gstin: user?.gst_number || '',
        name: user?.full_name || '',
      },
      summary: {
        totalTaxableSales,
        totalCGST,
        totalSGST,
        totalIGST,
        totalITC,
        netGSTPayable,
      },
      transactions: gstData,
    };

    const blob = new Blob([JSON.stringify(gstr1Report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1-${selectedMonth}-${selectedYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">GST Reports</h1>
        <p className="text-muted-foreground mt-2">View and manage your GST filings and reports.</p>
      </div>

      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      {isFilingDue && (
        <Alert className="border-warning bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <strong>Filing Due Soon!</strong> Your GST filing for {selectedMonth} is due in{' '}
            <strong>{daysLeft}</strong> days (by {filingDeadline}th of next month). Late filing may
            incur penalties.
          </AlertDescription>
        </Alert>
      )}

      {!isFilingDue && (
        <Alert className="border-success bg-success/5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>
            <strong>GST Filing Completed!</strong> Your GSTR-1 for {selectedMonth} has been
            successfully filed.
          </AlertDescription>
        </Alert>
      )}

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Taxable Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalTaxableSales / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              CGST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalCGST / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              SGST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalSGST / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              IGST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{(totalIGST / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ITC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{totalITC > 1000 ? (totalITC / 1000).toFixed(1) + 'K' : totalITC.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              ₹{(netGSTPayable / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GST Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>GST Payable Trend</CardTitle>
          <CardDescription>Last 7 months</CardDescription>
        </CardHeader>
        <CardContent>
          {gstTrendData.length === 0 || gstTrendData.every(d => d.payable === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trend data available. Upload invoices to see GST trends.</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gstTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Line
                type="monotone"
                dataKey="payable"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="GST Payable"
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* GSTR-1 Preview */}
      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <div>
            <CardTitle>GSTR-1 Preview ({selectedMonth} {selectedYear})</CardTitle>
            <CardDescription>B2B supplies summary</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadGSTR1CSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button onClick={downloadGSTR1JSON} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading GST data...</span>
            </div>
          ) : gstData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No sales transactions for {selectedMonth} {selectedYear}</p>
              <p className="text-sm mt-2">Upload sales invoices to see GSTR1 data here.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer GSTIN</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Taxable Value</TableHead>
                <TableHead className="text-right">CGST</TableHead>
                <TableHead className="text-right">SGST</TableHead>
                <TableHead className="text-right">IGST</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gstData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{row.gstin}</TableCell>
                  <TableCell className="font-medium">{row.invoiceNumber}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(row.invoiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">₹{row.taxableValue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{row.cgst.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{row.sgst.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{row.igst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{row.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-right">
                  ₹{totalTaxableSales.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">₹{totalCGST.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totalSGST.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totalIGST.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ₹{(totalTaxableSales + totalCGST + totalSGST + totalIGST).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Late Fee Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Late Fee Calculator</CardTitle>
          <CardDescription>Estimate potential late fees for this filing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Net GST Payable</p>
                <p className="text-2xl font-bold text-foreground">₹{netGSTPayable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Late (if not filed by {filingDeadline}th)</p>
                <p className="text-2xl font-bold text-warning">30 days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Late Fee</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{Math.round((netGSTPayable * 0.25) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">@0.25% per day</p>
              </div>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> File on time to avoid late fees. Filing deadline is{' '}
                <strong>{filingDeadline}th</strong> of the following month.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
