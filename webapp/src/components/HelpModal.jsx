import React, { useState, useEffect } from 'react';
import './HelpModal.css';

const HelpModal = ({ onClose }) => {
  const [hotkeys, setHotkeys] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [newHotkey, setNewHotkey] = useState({ action: '', key: '', description: '' });
  const [isRecording, setIsRecording] = useState(false);

  // Default hotkeys
  const defaultHotkeys = [
    { id: 1, action: 'Add Node', key: 'Ctrl+N', description: 'Create a new node' },
    { id: 2, action: 'Delete Selected', key: 'Ctrl+Delete', description: 'Delete selected nodes' },
    { id: 3, action: 'Delete All', key: 'Ctrl+Shift+D', description: 'Delete all nodes' },
    { id: 4, action: 'Zoom In', key: 'Ctrl+=', description: 'Zoom into the canvas' },
    { id: 5, action: 'Zoom Out', key: 'Ctrl+-', description: 'Zoom out of the canvas' },
    { id: 6, action: 'Fit View', key: 'Ctrl+0', description: 'Fit all nodes in view' },
    { id: 7, action: 'Toggle Chat', key: 'Ctrl+/', description: 'Open/close chat window' },
    { id: 8, action: 'Auto Layout', key: 'Ctrl+L', description: 'Automatically arrange nodes' },
    { id: 9, action: 'Save', key: 'Ctrl+S', description: 'Save current workspace' },
    { id: 10, action: 'Undo', key: 'Ctrl+Z', description: 'Undo last action' },
    { id: 11, action: 'Redo', key: 'Ctrl+Y', description: 'Redo last undone action' },
    { id: 12, action: 'Select All', key: 'Ctrl+A', description: 'Select all nodes' },
    { id: 13, action: 'Copy', key: 'Ctrl+C', description: 'Copy selected nodes' },
    { id: 14, action: 'Paste', key: 'Ctrl+V', description: 'Paste copied nodes' },
    { id: 15, action: 'Help', key: 'F1', description: 'Show this help dialog' }
  ];

  // Load hotkeys from localStorage or use defaults
  useEffect(() => {
    // Force clear localStorage and use new defaults to ensure Delete key is disabled
    localStorage.removeItem('appHotkeys');
    setHotkeys(defaultHotkeys);
    localStorage.setItem('appHotkeys', JSON.stringify(defaultHotkeys));
  }, []);

  // Save hotkeys to localStorage
  const saveHotkeys = (updatedHotkeys) => {
    setHotkeys(updatedHotkeys);
    localStorage.setItem('appHotkeys', JSON.stringify(updatedHotkeys));
  };

  // Handle key recording
  const handleKeyDown = (e) => {
    if (!isRecording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName === 'ArrowUp') keyName = '↑';
      if (keyName === 'ArrowDown') keyName = '↓';
      if (keyName === 'ArrowLeft') keyName = '←';
      if (keyName === 'ArrowRight') keyName = '→';
      keys.push(keyName);
    }
    
    if (keys.length > 0 && keys[keys.length - 1] !== 'Ctrl' && keys[keys.length - 1] !== 'Shift' && keys[keys.length - 1] !== 'Alt') {
      const keyCombo = keys.join('+');
      setNewHotkey(prev => ({ ...prev, key: keyCombo }));
      setIsRecording(false);
    }
  };

  // Start recording hotkey
  const startRecording = () => {
    setIsRecording(true);
    setNewHotkey(prev => ({ ...prev, key: 'Press keys...' }));
  };

  // Edit hotkey
  const editHotkey = (hotkey) => {
    setEditingKey(hotkey.id);
    setNewHotkey({ action: hotkey.action, key: hotkey.key, description: hotkey.description });
  };

  // Save edited hotkey
  const saveEditedHotkey = () => {
    if (!newHotkey.action || !newHotkey.key || !newHotkey.description) return;
    
    const updatedHotkeys = hotkeys.map(hotkey => 
      hotkey.id === editingKey 
        ? { ...hotkey, action: newHotkey.action, key: newHotkey.key, description: newHotkey.description }
        : hotkey
    );
    
    saveHotkeys(updatedHotkeys);
    setEditingKey(null);
    setNewHotkey({ action: '', key: '', description: '' });
  };

  // Remove hotkey
  const removeHotkey = (id) => {
    const updatedHotkeys = hotkeys.filter(hotkey => hotkey.id !== id);
    saveHotkeys(updatedHotkeys);
  };

  // Add new hotkey
  const addNewHotkey = () => {
    if (!newHotkey.action || !newHotkey.key || !newHotkey.description) return;
    
    const newId = Math.max(...hotkeys.map(h => h.id), 0) + 1;
    const updatedHotkeys = [...hotkeys, { id: newId, ...newHotkey }];
    
    saveHotkeys(updatedHotkeys);
    setNewHotkey({ action: '', key: '', description: '' });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    saveHotkeys(defaultHotkeys);
    setEditingKey(null);
    setNewHotkey({ action: '', key: '', description: '' });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingKey(null);
    setNewHotkey({ action: '', key: '', description: '' });
    setIsRecording(false);
  };



  return (
    <div className="help-modal-overlay" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-modal-content">
          <div className="hotkeys-list">
            {hotkeys.map((hotkey) => (
              <div key={hotkey.id} className="hotkey-item">
                {editingKey === hotkey.id ? (
                  <div className="hotkey-edit-form">
                    <input
                      type="text"
                      value={newHotkey.action}
                      onChange={(e) => setNewHotkey(prev => ({ ...prev, action: e.target.value }))}
                      placeholder="Action name"
                      className="hotkey-input"
                    />
                    <div className="key-input-container">
                      <input
                        type="text"
                        value={newHotkey.key}
                        readOnly
                        placeholder="Click to record"
                        className={`hotkey-input key-input ${isRecording ? 'recording' : ''}`}
                        onClick={startRecording}
                      />
                      {isRecording && <span className="recording-indicator">Recording...</span>}
                    </div>
                    <input
                      type="text"
                      value={newHotkey.description}
                      onChange={(e) => setNewHotkey(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                      className="hotkey-input"
                    />
                    <div className="hotkey-actions">
                      <button className="save-btn" onClick={saveEditedHotkey}>Save</button>
                      <button className="cancel-btn" onClick={cancelEditing}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="hotkey-display">
                    <div className="hotkey-info">
                      <div className="hotkey-action">{hotkey.action}</div>
                      <div className="hotkey-key">{hotkey.key}</div>
                      <div className="hotkey-description">{hotkey.description}</div>
                    </div>
                    <div className="hotkey-controls">
                      <button className="edit-btn" onClick={() => editHotkey(hotkey)}>Edit</button>
                      <button className="remove-btn" onClick={() => removeHotkey(hotkey.id)}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="add-hotkey-section">
            <h3>Add New Hotkey</h3>
            <div className="hotkey-edit-form">
              <input
                type="text"
                value={newHotkey.action}
                onChange={(e) => setNewHotkey(prev => ({ ...prev, action: e.target.value }))}
                placeholder="Action name"
                className="hotkey-input"
              />
              <div className="key-input-container">
                <input
                  type="text"
                  value={newHotkey.key}
                  readOnly
                  placeholder="Click to record"
                  className={`hotkey-input key-input ${isRecording ? 'recording' : ''}`}
                  onClick={startRecording}
                />
                {isRecording && <span className="recording-indicator">Recording...</span>}
              </div>
              <input
                type="text"
                value={newHotkey.description}
                onChange={(e) => setNewHotkey(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="hotkey-input"
              />
              <button className="add-btn" onClick={addNewHotkey}>Add Hotkey</button>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="reset-btn" onClick={resetToDefaults}>Reset to Defaults</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;