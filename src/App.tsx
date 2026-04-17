/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import AlarmScreen from './components/AlarmScreen';
import { Droplets, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { alarmManager } from './lib/alarm';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { profile, theme, isAlarmRinging, isAlarmUIVisible, setAlarmRinging, alarmTune, activeTab, setActiveTab } = useStore();

  // Request notification permission and register service worker
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-blue');
    document.documentElement.classList.add(`theme-${theme}`);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle alarm state changes (Audio/Vibration)
  useEffect(() => {
    if (isAlarmRinging) {
      alarmManager.play(alarmTune);
      // Show notification if in background
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Water Reminder', {
              body: 'Time to drink water! Tap to log.',
              icon: '/favicon.ico',
              tag: 'water-alarm'
            });
          });
        } else {
          new Notification('Water Reminder', {
            body: 'Time to drink water! Tap to log.',
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
      }
    } else {
      alarmManager.stop();
    }
    return () => alarmManager.stop();
  }, [isAlarmRinging, alarmTune]);

  // Real alarm trigger
  useEffect(() => {
    if (!profile) return;
    
    const interval = setInterval(() => {
      const state = useStore.getState();
      if (!state.isAlarmRinging) {
        const nextAlarm = state.getNextAlarmTime();
        if (nextAlarm && Date.now() >= nextAlarm) {
          state.setAlarmRinging(true);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [profile]);

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Alarm Screen Overlay */}
      <AnimatePresence>
        {isAlarmUIVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <AlarmScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-card border-t border-border/50 px-6 py-4 flex justify-between items-center z-10">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <Droplets className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Today</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
        </button>
      </nav>
    </div>
  );
}
