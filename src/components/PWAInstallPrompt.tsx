import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt after a delay
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show iOS instructions
  if (isIOS && !isInstalled) {
    return showPrompt ? (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="p-4 shadow-lg border-2 border-primary bg-gradient-to-br from-green-50 to-blue-50">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-gray-900">Install Chirp App</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">
            Install Chirp on your iPhone for the best experience!
          </p>
          
          <div className="text-sm text-gray-600 space-y-2 bg-white p-3 rounded-lg">
            <p>1. Tap the <strong>Share</strong> button (box with arrow)</p>
            <p>2. Scroll and tap <strong>"Add to Home Screen"</strong></p>
            <p>3. Tap <strong>Add</strong> in the top right</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={handleDismiss}
          >
            Got it!
          </Button>
        </Card>
      </div>
    ) : null;
  }

  // Show Android/Desktop install button
  return showPrompt && deferredPrompt ? (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="p-4 shadow-lg border-2 border-primary bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">Install Chirp App</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-700 mb-4">
          Install Chirp for quick access and offline use!
        </p>
        
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
          >
            Later
          </Button>
        </div>
      </Card>
    </div>
  ) : null;
}
