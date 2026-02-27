import { useState } from 'react';
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
} from 'lucide-react';

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

const GSTR1_DATA: GSTR1Row[] = [
  {
    gstin: '27ABCDE1234F2Z0',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-07-01',
    taxableValue: 50000,
    cgst: 4500,
    sgst: 4500,
    igst: 0,
    total: 59000,
  },
  {
    gstin: '27ABCDE1234F2Z0',
    invoiceNumber: 'INV-2024-002',
    invoiceDate: '2024-07-05',
    taxableValue: 75000,
    cgst: 6750,
    sgst: 6750,
    igst: 0,
    total: 88500,
  },
  {
    gstin: '27XYZAB5678C1D0',
    invoiceNumber: 'INV-2024-003',
    invoiceDate: '2024-07-10',
    taxableValue: 60000,
    cgst: 0,
    sgst: 0,
    igst: 9000,
    total: 69000,
  },
];

const gstTrendData = [
  { month: 'Jan', payable: 15000, filed: true },
  { month: 'Feb', payable: 18000, filed: true },
  { month: 'Mar', payable: 16500, filed: true },
  { month: 'Apr', payable: 22000, filed: true },
  { month: 'May', payable: 19500, filed: true },
  { month: 'Jun', payable: 28500, filed: true },
  { month: 'Jul', payable: 25200, filed: false },
];

export default function GSTReports() {
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedYear, setSelectedYear] = useState('2024');

  const totalTaxableSales = GSTR1_DATA.reduce((sum, row) => sum + row.taxableValue, 0);
  const totalCGST = GSTR1_DATA.reduce((sum, row) => sum + row.cgst, 0);
  const totalSGST = GSTR1_DATA.reduce((sum, row) => sum + row.sgst, 0);
  const totalIGST = GSTR1_DATA.reduce((sum, row) => sum + row.igst, 0);
  const totalITC = 8400; // Mock ITC
  const netGSTPayable = totalCGST + totalSGST + totalIGST - totalITC;

  const monthIndex = MONTHS.indexOf(selectedMonth);
  const currentMonthGST = gstTrendData[monthIndex];
  const isFilingDue = !currentMonthGST.filed;
  const daysSinceFiling = 5;
  const filingDeadline = 20;
  const daysLeft = filingDeadline - daysSinceFiling;

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
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
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
            <div className="text-2xl font-bold text-foreground">₹{(totalITC / 1000).toFixed(1)}K</div>
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
        </CardContent>
      </Card>

      {/* GSTR-1 Preview */}
      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <div>
            <CardTitle>GSTR-1 Preview ({selectedMonth} {selectedYear})</CardTitle>
            <CardDescription>B2B supplies summary</CardDescription>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {GSTR1_DATA.map((row, idx) => (
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
