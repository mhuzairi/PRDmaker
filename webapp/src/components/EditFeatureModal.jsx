import React, { useState, useEffect } from 'react';
import './EditFeatureModal.css';

const EditFeatureModal = ({ isOpen, onClose, feature, onSave }) => {
  const [editedFeature, setEditedFeature] = useState({
    title: '',
    description: '',
    category: 'core'
  });

  useEffect(() => {
    if (feature) {
      setEditedFeature({
        title: feature.title || '',
        description: feature.description || '',
        category: feature.category || 'core'
      });
    }
  }, [feature]);

  const handleSave = () => {
    if (editedFeature.title.trim() && editedFeature.description.trim()) {
      onSave({
        ...feature,
        ...editedFeature
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedFeature({
      title: feature?.title || '',
      description: feature?.description || '',
      category: feature?.category || 'core'
    });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={handleCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="edit-modal-header">
          <h3>Edit Feature</h3>
          <button className="edit-modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        
        <div className="edit-modal-body">
          <div className="edit-form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={editedFeature.title}
              onChange={(e) => setEditedFeature({...editedFeature, title: e.target.value})}
              className="edit-input"
              placeholder="Feature title"
              autoFocus
            />
          </div>
          
          <div className="edit-form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={editedFeature.description}
              onChange={(e) => setEditedFeature({...editedFeature, description: e.target.value})}
              className="edit-textarea"
              placeholder="Feature description"
              rows={4}
            />
          </div>
          
          <div className="edit-form-group">
            <label htmlFor="edit-category">Category</label>
            <select
              id="edit-category"
              value={editedFeature.category}
              onChange={(e) => setEditedFeature({...editedFeature, category: e.target.value})}
              className="edit-select"
            >
              <option value="core">Core</option>
              <option value="intelligence">Intelligence</option>
              <option value="ai">AI</option>
              <option value="visual">Visual</option>
              <option value="collaboration">Collaboration</option>
              <option value="integration">Integration</option>
              <option value="security">Security</option>
              <option value="automation">Automation</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="containers">Containers</option>
              <option value="monitoring">Monitoring</option>
              <option value="ml">Machine Learning</option>
              <option value="nlp">Natural Language Processing</option>
              <option value="vision">Computer Vision</option>
              <option value="data">Data Processing</option>
              <option value="mlops">MLOps</option>
              <option value="ui">User Interface</option>
              <option value="state">State Management</option>
              <option value="performance">Performance</option>
              <option value="auth">Authentication</option>
              <option value="api">API</option>
              <option value="database">Database</option>
              <option value="platform">Platform</option>
              <option value="native">Native</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="edit-modal-footer">
          <button className="edit-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="edit-btn-save" 
            onClick={handleSave}
            disabled={!editedFeature.title.trim() || !editedFeature.description.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFeatureModal;