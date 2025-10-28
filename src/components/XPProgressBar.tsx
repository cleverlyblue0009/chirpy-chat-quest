import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp } from 'lucide-react';
import { XPService } from '@/lib/firebase/xpService';
import { UserService } from '@/lib/firebase/userService';
import { useAuth } from '@/contexts/AuthContext';

interface XPProgressBarProps {
  className?: string;
  showDetails?: boolean;
}

export function XPProgressBar({ className = '', showDetails = true }: XPProgressBarProps) {
  const { currentUser } = useAuth();
  const [xpData, setXPData] = useState<{
    totalXP: number;
    currentLevel: number;
    nextLevel: number;
    xpProgress: number;
    xpNeeded: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const loadXPData = async () => {
      try {
        const user = await UserService.getUser(currentUser.uid);
        if (!user) return;

        const totalXP = user.total_xp || 0;
        const levelInfo = XPService.getXPForNextLevel(totalXP);
        
        setXPData({
          totalXP,
          ...levelInfo,
        });
      } catch (error) {
        console.error('Error loading XP data:', error);
      }
    };

    loadXPData();
    // Reload every 5 seconds to catch updates
    const interval = setInterval(loadXPData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!xpData) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Loading XP...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-gradient-to-r from-purple-50 to-blue-50 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span className="font-bold text-lg">Level {xpData.currentLevel}</span>
          </div>
          <div className="text-sm font-medium text-gray-600">
            {xpData.totalXP.toLocaleString()} XP
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress value={xpData.percentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{xpData.xpProgress} / {xpData.xpNeeded} XP</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {xpData.percentage}%
            </span>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{xpData.xpNeeded - xpData.xpProgress} XP</span> until Level {xpData.nextLevel}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
