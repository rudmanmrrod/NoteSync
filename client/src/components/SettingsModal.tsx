import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

export function SettingsModal({ isOpen, onClose, syncStatus }: SettingsModalProps) {
  const [autoSync, setAutoSync] = useState(true);
  const { theme, setTheme } = useTheme();
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);

  // Check if Firebase is configured
  const hasFirebaseConfig = !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
            Syncing
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            Offline
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-scroll">
          {/* Firebase Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cloud Sync</CardTitle>
              <CardDescription>
                Sync your notes across devices with Firebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Firebase Status</div>
                  <div className="text-sm text-slate-500">
                    {hasFirebaseConfig ? 'Configuration detected' : 'Not configured'}
                  </div>
                </div>
                {getSyncStatusBadge()}
              </div>
              
              {!hasFirebaseConfig && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm text-amber-800">
                    <strong>Setup Required:</strong> Add your Firebase configuration to environment variables:
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>VITE_FIREBASE_API_KEY</li>
                      <li>VITE_FIREBASE_PROJECT_ID</li>
                      <li>VITE_FIREBASE_APP_ID</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Auto-sync</Label>
                  <div className="text-sm text-slate-500">
                    Automatically sync when online
                  </div>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                  disabled={!hasFirebaseConfig}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Storage</CardTitle>
              <CardDescription>
                Local storage information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Notes stored locally</span>
                  <Badge variant="secondary">Primary</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Cloud backup</span>
                  <Badge variant={hasFirebaseConfig ? "secondary" : "outline"}>
                    {hasFirebaseConfig ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  Your notes are always saved locally first, then synced to the cloud when available.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
