import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const HotkeyContext = createContext();

export const useHotkeys = () => {
  const context = useContext(HotkeyContext);
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeyProvider');
  }
  return context;
};

export const HotkeyProvider = ({ children }) => {
  const [hotkeys, setHotkeys] = useState([]);
  const [actions, setActions] = useState({});

  // Load hotkeys from localStorage
  useEffect(() => {
    const savedHotkeys = localStorage.getItem('appHotkeys');
    if (savedHotkeys) {
      setHotkeys(JSON.parse(savedHotkeys));
    }
  }, []);

  // Register action handlers
  const registerAction = useCallback((actionName, handler) => {
    setActions(prev => ({ ...prev, [actionName]: handler }));
  }, []);

  // Unregister action handlers
  const unregisterAction = useCallback((actionName) => {
    setActions(prev => {
      const newActions = { ...prev };
      delete newActions[actionName];
      return newActions;
    });
  }, []);

  // Parse key combination
  const parseKeyCombo = (keyCombo) => {
    const parts = keyCombo.split('+');
    return {
      ctrl: parts.includes('Ctrl'),
      shift: parts.includes('Shift'),
      alt: parts.includes('Alt'),
      key: parts[parts.length - 1]
    };
  };

  // Check if key event matches hotkey
  const matchesHotkey = (event, hotkey) => {
    const combo = parseKeyCombo(hotkey.key);
    
    // Handle special keys
    let eventKey = event.key;
    if (eventKey === ' ') eventKey = 'Space';
    if (eventKey === 'ArrowUp') eventKey = '↑';
    if (eventKey === 'ArrowDown') eventKey = '↓';
    if (eventKey === 'ArrowLeft') eventKey = '←';
    if (eventKey === 'ArrowRight') eventKey = '→';
    
    return (
      (event.ctrlKey || event.metaKey) === combo.ctrl &&
      event.shiftKey === combo.shift &&
      event.altKey === combo.alt &&
      eventKey === combo.key
    );
  };

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger hotkeys when typing in inputs
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true'
      ) {
        return;
      }

      // Find matching hotkey
      const matchingHotkey = hotkeys.find(hotkey => matchesHotkey(event, hotkey));
      
      if (matchingHotkey && actions[matchingHotkey.action]) {
        event.preventDefault();
        event.stopPropagation();
        actions[matchingHotkey.action]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, actions]);

  // Update hotkeys
  const updateHotkeys = (newHotkeys) => {
    setHotkeys(newHotkeys);
    localStorage.setItem('appHotkeys', JSON.stringify(newHotkeys));
  };

  const value = {
    hotkeys,
    updateHotkeys,
    registerAction,
    unregisterAction,
    actions
  };

  return (
    <HotkeyContext.Provider value={value}>
      {children}
    </HotkeyContext.Provider>
  );
};

export default HotkeyProvider;