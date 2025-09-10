import React, { useState, useEffect } from 'react';
import { enhancedPRDStorage } from '../utils/enhancedPRDStorage';
import './NotificationSystem.css';

const NotificationSystem = ({ onOpenPRDModal }) => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Debug function to check storage state
  const debugStorage = () => {
    console.log('=== DEBUG STORAGE STATE ===');
    console.log('Pending Updates:', enhancedPRDStorage.getPendingUpdates());
    console.log('All PRDs:', enhancedPRDStorage.getAllPRDs());
    console.log('LocalStorage pending_prd_updates:', localStorage.getItem('pending_prd_updates'));
    console.log('LocalStorage generated_prds:', localStorage.getItem('generated_prds'));
  };

  // Test function to create sample data
  const createTestData = () => {
    console.log('Creating test data...');
    
    // Create a base PRD first
    const basePRD = {
      title: 'E-commerce Platform',
      content: 'Basic e-commerce platform with user authentication and product catalog.',
      source: 'test'
    };
    
    const savedPRD = enhancedPRDStorage.savePRD(basePRD);
    console.log('Created base PRD:', savedPRD);
    
    // Create an enhanced version that should trigger notification
    setTimeout(() => {
      const enhancedPRD = {
        title: 'E-commerce Platform',
        content: 'Enhanced e-commerce platform with user authentication, product catalog, shopping cart functionality, payment processing, order management, and advanced search features with filtering capabilities.',
        source: 'test-enhancement'
      };
      
      const result = enhancedPRDStorage.savePRD(enhancedPRD);
      console.log('Created enhanced PRD:', result);
      debugStorage();
    }, 1000);
  };

  // Add debug buttons (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugNotifications = debugStorage;
      window.createTestData = createTestData;
      console.log('Debug functions available: window.debugNotifications(), window.createTestData()');
    }
  }, []);

  useEffect(() => {
    // Check for pending updates and recent AI enhancements
    const checkForUpdates = () => {
      try {
        const pendingUpdates = enhancedPRDStorage.getPendingUpdates();
        const allPRDs = enhancedPRDStorage.getAllPRDs();
        
        // Only show notifications if there are actual pending updates or recent enhancements
        if (pendingUpdates.length === 0 && allPRDs.length === 0) {
          setNotifications([]);
          setIsVisible(false);
          return;
        }
        
        // Notifications for pending updates
        const pendingNotifications = pendingUpdates.map(update => {
          const prd = allPRDs.find(p => p.id === update.existingPRDId);
          return {
            id: `pending-${update.existingPRDId}`,
            type: 'prd_update',
            title: 'New PRD Content Available',
            message: `"${prd?.title || 'Unknown PRD'}" has new content ready to be applied`,
            timestamp: update.detectedAt,
            prdId: update.existingPRDId,
            prdTitle: prd?.title
          };
        });
        
        // Notifications for recently auto-updated PRDs (within last 2 minutes)
        const recentlyUpdated = allPRDs.filter(prd => {
          if (!prd.lastEnhancement) return false;
          const enhancementTime = new Date(prd.lastEnhancement.addedAt);
          const now = new Date();
          return (now - enhancementTime) < 120000; // 2 minutes instead of 30 seconds
        });
        
        const enhancementNotifications = recentlyUpdated.map(prd => ({
          id: `enhanced-${prd.id}`,
          type: 'prd_enhanced',
          title: 'PRD Auto-Updated',
          message: `"${prd.title}" has been automatically updated with new AI-generated features`,
          timestamp: prd.lastEnhancement.addedAt,
          prdId: prd.id,
          prdTitle: prd.title
        }));
        
        const allNotifications = [...pendingNotifications, ...enhancementNotifications];
        
        // Only update state if notifications actually changed
        setNotifications(prevNotifications => {
          const prevIds = prevNotifications.map(n => n.id).sort();
          const newIds = allNotifications.map(n => n.id).sort();
          
          if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
            return allNotifications;
          }
          return prevNotifications;
        });
        
        setIsVisible(allNotifications.length > 0);
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Initial check
    checkForUpdates();
    
    // Set up interval to check periodically (reduced frequency)
    const interval = setInterval(checkForUpdates, 10000); // 10 seconds instead of 5
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification) => {
    if (notification.type === 'prd_update') {
      // Open PRD modal to show the pending update
      onOpenPRDModal();
    } else if (notification.type === 'prd_enhanced') {
      // Open PRD modal to show the enhanced PRD
      onOpenPRDModal();
      // Auto-dismiss enhancement notifications after clicking
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 100);
    }
  };

  const handleDismissAll = () => {
    setIsVisible(false);
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-system">
      <div className="notification-container">
        <div className="notification-header">
          <div className="notification-title">
            <span className="notification-icon">🔔</span>
            <span>Updates Available ({notifications.length})</span>
          </div>
          <button 
            className="notification-dismiss"
            onClick={handleDismissAll}
            title="Dismiss notifications"
          >
            ✕
          </button>
        </div>
        
        <div className="notification-list">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`notification-item ${notification.type === 'prd_enhanced' ? 'enhanced' : 'pending'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon-wrapper">
                <span className="notification-type-icon">
                  {notification.type === 'prd_enhanced' ? '✨' : '📝'}
                </span>
              </div>
              <div className="notification-content">
                <div className="notification-item-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="notification-action">
                <span className="notification-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="notification-footer">
          <button 
            className="notification-view-all"
            onClick={() => onOpenPRDModal()}
          >
            View All PRDs
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;