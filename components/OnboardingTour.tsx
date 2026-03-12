'use client'

import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STORAGE_KEY = 'signalist-tour-completed';
const TOUR_RESTART_EVENT = 'signalist-restart-tour';

const tourSteps: DriveStep[] = [
  {
    element: '#tour-quick-actions',
    popover: {
      title: 'Quick Actions',
      description:
        'Start here — browse top signals, read market news, create custom alerts, or ask the AI assistant for insights.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-heatmap',
    popover: {
      title: 'Market Heatmap',
      description:
        'See the entire market at a glance. Toggle between stocks, crypto, ETFs, and forex to spot trends instantly.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-signals',
    popover: {
      title: 'Signal Leaderboard',
      description:
        'Our scoring model ranks stocks from 0 to 100 based on momentum, volume, sentiment, and more. Click any symbol for a deep breakdown.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-alerts',
    popover: {
      title: 'Smart Alerts',
      description:
        'Set custom alert rules on score, sentiment, or volume spikes. Choose a template or build your own — you\'ll be notified when conditions hit.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-ai-chat',
    popover: {
      title: 'AI Assistant',
      description:
        'Ask our AI for an educational breakdown on any stock — risks, valuation, trend analysis, and upcoming catalysts.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '#tour-search',
    popover: {
      title: 'Search Stocks',
      description:
        'Search for any stock symbol to jump straight to its detailed signal page.',
      side: 'bottom',
      align: 'end',
    },
  },
];

const OnboardingTour = () => {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      stagePadding: 8,
      stageRadius: 0,
      popoverClass: 'signalist-tour-popover',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      steps: tourSteps,
      onDestroyed: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  };

  useEffect(() => {
    // Auto-start for first-time users
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timeout = setTimeout(startTour, 800);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    // Listen for restart event from UserDropdown
    const handleRestart = () => {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      startTour();
    };

    window.addEventListener(TOUR_RESTART_EVENT, handleRestart);
    return () => window.removeEventListener(TOUR_RESTART_EVENT, handleRestart);
  }, []);

  return null;
};

export default OnboardingTour;
export { TOUR_RESTART_EVENT };
