import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Lock, Bell } from 'lucide-react';

export default function Settings() {
  const [businessName, setBusinessName] = useState('ABC Business Ltd.');
  const [ownerName, setOwnerName] = useState('John Doe');
  const [gstin, setGstin] = useState('27ABCDE1234F2Z0');
  const [filingType, setFilingType] = useState('monthly');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveBusinessSettings = () => {
    setSaveMessage('success');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setSaveMessage('password');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your business settings and preferences.</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and GST settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveMessage === 'success' && (
                <Alert className="border-success bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>Business settings updated successfully!</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="businessName" className="text-sm font-medium">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ownerName" className="text-sm font-medium">
                  Owner Name
                </Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gstin" className="text-sm font-medium">
                  GSTIN
                </Label>
                <Input
                  id="gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="mt-1 font-mono"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your GSTIN is verified and cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div>
                <Label htmlFor="filingType" className="text-sm font-medium">
                  GST Filing Type
                </Label>
                <Select value={filingType} onValueChange={setFilingType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (GSTR-1, GSTR-2, GSTR-3B)</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveBusinessSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Preferences</CardTitle>
              <CardDescription>Configure inventory and stock management settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
                  Low Stock Alert Threshold
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    min="1"
                  />
                  <span className="flex items-center text-muted-foreground">units</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get alerts when product stock falls below this threshold
                </p>
              </div>

              <Button>Save Inventory Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-sm">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive browser notifications for important alerts
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-sm">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get email notifications for GST deadlines and stock alerts
                  </p>
                </div>
              </label>

              <Button onClick={() => alert('Notification settings updated!')}>
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveMessage === 'password' && (
                <Alert className="border-success bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>Password changed successfully!</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleChangePassword}>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Delete Account</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive">Delete My Account</Button>
              </div>

              <div className="border-t border-destructive/20 pt-4">
                <p className="text-sm font-medium text-foreground mb-2">Logout</p>
                <Button variant="outline">Logout from All Devices</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
