import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Zap,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'info' | 'warning';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  icon?: any;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'GST Filing Deadline Approaching',
    description: 'Your GST filing for June is due in 3 days (by June 20th)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    icon: AlertTriangle,
  },
  {
    id: '2',
    type: 'alert',
    title: 'Low Stock Alert',
    description: 'Wireless Headphones (WH-001) is running low - 5 units remaining',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    icon: Package,
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Turnover Threshold Reached',
    description: 'Your YTD turnover is ₹38.2L and approaching the ₹40L compliance threshold',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    icon: Zap,
  },
  {
    id: '4',
    type: 'info',
    title: 'Invoice Processed Successfully',
    description: 'Invoice INV-2024-045 has been processed and added to your records',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    icon: CheckCircle2,
  },
  {
    id: '5',
    type: 'warning',
    title: 'Invalid Invoice Format',
    description: 'Invoice INV-2024-043 contains mismatched tax amounts. Please review.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    icon: AlertCircle,
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Monthly Summary Ready',
    description: 'Your May business summary is ready. View your sales, profit, and GST insights.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    read: true,
    icon: CheckCircle2,
  },
  {
    id: '7',
    type: 'alert',
    title: 'Multiple Low Stock Products',
    description: '5 products are below minimum stock threshold',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    read: true,
    icon: Package,
  },
];

export default function Notifications() {
  const { user, loading: userLoading, isDemoUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Generate smart notifications from real data across all tables
  const fetchNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch real data from accessible tables in parallel
      const [
        { data: products },
        { data: gstTransactions },
        { data: invoices },
        { data: expenses },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('gst_transactions').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('expense_date', { ascending: false }).limit(5),
      ]);

      const generated: Notification[] = [];
      let idCounter = 1;

      // ── GST Filing Reminder ──
      const now = new Date();
      const filingDay = 20;
      let nextFiling: Date;
      if (now.getDate() <= filingDay) {
        nextFiling = new Date(now.getFullYear(), now.getMonth(), filingDay);
      } else {
        nextFiling = new Date(now.getFullYear(), now.getMonth() + 1, filingDay);
      }
      const daysUntilFiling = Math.ceil((nextFiling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilFiling <= 7) {
        generated.push({
          id: String(idCounter++),
          type: 'warning',
          title: 'GST Filing Deadline Approaching',
          description: `Your GSTR filing is due in ${daysUntilFiling} day${daysUntilFiling !== 1 ? 's' : ''} (${nextFiling.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })})`,
          timestamp: new Date(),
          read: false,
        });
      } else {
        generated.push({
          id: String(idCounter++),
          type: 'reminder',
          title: 'Next GST Filing Date',
          description: `Your next GSTR filing is due on ${nextFiling.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}`,
          timestamp: new Date(),
          read: true,
        });
      }

      // ── Low Stock & Out of Stock Alerts ──
      const lowStockProducts = (products || []).filter(p =>
        (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) < (Number(p.minimum_stock_level) || 5)
      );
      const outOfStockProducts = (products || []).filter(p => (Number(p.current_stock) || 0) === 0);

      if (outOfStockProducts.length > 0) {
        generated.push({
          id: String(idCounter++),
          type: 'alert',
          title: 'Out of Stock Alert',
          description: `${outOfStockProducts.length} product${outOfStockProducts.length > 1 ? 's are' : ' is'} out of stock: ${outOfStockProducts.slice(0, 3).map(p => p.product_name).join(', ')}${outOfStockProducts.length > 3 ? '...' : ''}`,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          read: false,
        });
      }

      if (lowStockProducts.length > 0) {
        generated.push({
          id: String(idCounter++),
          type: 'warning',
          title: 'Low Stock Warning',
          description: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's are' : ' is'} below minimum stock: ${lowStockProducts.slice(0, 3).map(p => `${p.product_name} (${p.current_stock} left)`).join(', ')}`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
        });
      }

      // ── GST Payable Alert ──
      const salesTxns = (gstTransactions || []).filter(t => t.transaction_type === 'sales');
      const purchaseTxns = (gstTransactions || []).filter(t => t.transaction_type === 'purchases');
      const gstCollected = salesTxns.reduce((s, t) => s + (parseFloat(t.cgst || 0)) + (parseFloat(t.sgst || 0)) + (parseFloat(t.igst || 0)), 0);
      const gstPaid = purchaseTxns.reduce((s, t) => s + (parseFloat(t.cgst || 0)) + (parseFloat(t.sgst || 0)) + (parseFloat(t.igst || 0)), 0);
      const netGST = gstCollected - gstPaid;

      if (netGST > 0) {
        generated.push({
          id: String(idCounter++),
          type: 'info',
          title: 'Net GST Payable',
          description: `You have ₹${netGST.toLocaleString('en-IN', { maximumFractionDigits: 0 })} net GST payable (Collected: ₹${gstCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })} - ITC: ₹${gstPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          read: false,
        });
      }

      // ── Recent Invoices ──
      if (invoices && invoices.length > 0) {
        const latestInv = invoices[0];
        generated.push({
          id: String(idCounter++),
          type: 'info',
          title: 'Recent Invoice',
          description: `Invoice ${latestInv.invoice_number || '#'} — ₹${Number(latestInv.total_amount || 0).toLocaleString('en-IN')} from ${latestInv.vendor_name || 'vendor'}`,
          timestamp: new Date(latestInv.created_at || Date.now()),
          read: true,
        });
      }

      // ── Inventory Summary ──
      const totalProducts = (products || []).length;
      if (totalProducts > 0) {
        const inventoryValue = (products || []).reduce((s, p) =>
          s + ((Number(p.current_stock) || 0) * (Number(p.purchase_price) || 0)), 0);
        generated.push({
          id: String(idCounter++),
          type: 'info',
          title: 'Inventory Summary',
          description: `${totalProducts} products in inventory worth ₹${inventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true,
        });
      }

      // ── Recent Expense ──
      if (expenses && expenses.length > 0) {
        const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        generated.push({
          id: String(idCounter++),
          type: 'info',
          title: 'Recent Expenses',
          description: `${expenses.length} recent expenses totalling ₹${totalExp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          timestamp: new Date(expenses[0].expense_date || Date.now()),
          read: true,
        });
      }

      // If no data at all, show a welcome notification
      if (generated.length <= 1 && totalProducts === 0) {
        generated.push({
          id: String(idCounter++),
          type: 'info',
          title: 'Welcome to TaxSathi!',
          description: 'Start by uploading an invoice or adding products to your inventory to see notifications here.',
          timestamp: new Date(),
          read: false,
        });
      }

      setNotifications(generated);
    } catch (error) {
      console.error('Error generating notifications:', error);
      setNotifications(isDemoUser ? NOTIFICATIONS : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user?.id) {
      setNotifications(isDemoUser ? NOTIFICATIONS : []);
      fetchNotifications();
    }
  }, [user?.id, userLoading, isDemoUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'unread') return !notification.read;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'alert':
        return 'bg-destructive/10 border-destructive/20';
      case 'reminder':
        return 'bg-info/10 border-info/20';
      case 'info':
        return 'bg-success/10 border-success/20';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />;
      case 'alert':
        return <Zap className="w-5 h-5 text-destructive flex-shrink-0" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-info flex-shrink-0" />;
      case 'info':
        return <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-foreground flex-shrink-0" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            {unreadCount > 0 ? (
              <>
                You have <strong>{unreadCount}</strong> unread notifications
              </>
            ) : (
              'You are all caught up!'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {activeTab === 'unread'
                      ? 'No unread notifications'
                      : 'No notifications yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`${getNotificationColor(
                      notification.type
                    )} border transition-opacity ${!notification.read ? 'opacity-100' : 'opacity-75'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-sm">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-8"
                                >
                                  Mark read
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="text-center py-4">
                  <Button variant="ghost" onClick={clearAll} className="text-destructive">
                    Clear All Notifications
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Tips */}
      <Alert className="bg-info/5 border-info/20">
        <AlertCircle className="h-4 w-4 text-info" />
        <AlertDescription>
          <strong>Tip:</strong> Enable notifications in Settings to receive real-time alerts for
          GST deadlines, stock levels, and invoice validations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
