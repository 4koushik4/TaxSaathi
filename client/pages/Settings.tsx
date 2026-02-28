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
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

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
  const { t } = useLanguage();

  const handleSaveBusinessSettings = () => {
    setSaveMessage('success');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert(t.settings.passwordsDoNotMatch);
      return;
    }
    setSaveMessage('password');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-2">{t.settings.subtitle}</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="business">{t.settings.businessTab}</TabsTrigger>
          <TabsTrigger value="preferences">{t.settings.preferencesTab}</TabsTrigger>
          <TabsTrigger value="account">{t.settings.accountTab}</TabsTrigger>
          <TabsTrigger value="language">{t.settings.languageTab}</TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.businessInfo}</CardTitle>
              <CardDescription>{t.settings.businessInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveMessage === 'success' && (
                <Alert className="border-success bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>{t.settings.savedSuccess}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="businessName" className="text-sm font-medium">
                  {t.settings.businessName}
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
                  {t.settings.ownerName}
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
                  {t.settings.gstin}
                </Label>
                <Input
                  id="gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="mt-1 font-mono"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t.settings.gstinNote}
                </p>
              </div>

              <div>
                <Label htmlFor="filingType" className="text-sm font-medium">
                  {t.settings.gstFilingType}
                </Label>
                <Select value={filingType} onValueChange={setFilingType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t.settings.monthly}</SelectItem>
                    <SelectItem value="quarterly">{t.settings.quarterly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveBusinessSettings}>{t.settings.saveChanges}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.inventoryPrefs}</CardTitle>
              <CardDescription>{t.settings.inventoryPrefsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
                  {t.settings.lowStockThreshold}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    min="1"
                  />
                  <span className="flex items-center text-muted-foreground">{t.settings.units}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.settings.lowStockNote}
                </p>
              </div>

              <Button>{t.settings.saveInventory}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settings.notificationSettings}</CardTitle>
              <CardDescription>{t.settings.notificationSettingsDesc}</CardDescription>
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
                  <p className="font-medium text-sm">{t.settings.enableNotifications}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.enableNotificationsDesc}
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
                  <p className="font-medium text-sm">{t.settings.emailAlerts}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.emailAlertsDesc}
                  </p>
                </div>
              </label>

              <Button onClick={() => alert(t.settings.notificationUpdated)}>
                {t.settings.saveNotificationPrefs}
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
                {t.settings.changePassword}
              </CardTitle>
              <CardDescription>{t.settings.changePasswordDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveMessage === 'password' && (
                <Alert className="border-success bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>{t.settings.passwordChanged}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  {t.settings.currentPassword}
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
                  {t.settings.newPassword}
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
                  {t.settings.confirmNewPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleChangePassword}>{t.settings.updatePassword}</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t.settings.dangerZone}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t.settings.deleteAccount}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t.settings.deleteAccountDesc}
                </p>
                <Button variant="destructive">{t.settings.deleteMyAccount}</Button>
              </div>

              <div className="border-t border-destructive/20 pt-4">
                <p className="text-sm font-medium text-foreground mb-2">{t.settings.logout}</p>
                <Button variant="outline">{t.settings.logoutAll}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value="language" className="space-y-6">
          <LanguageSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
