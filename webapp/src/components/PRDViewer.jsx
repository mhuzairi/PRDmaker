import React, { useState } from 'react';
import { createNewVersion } from '../utils/prdStorage';
import './PRDViewer.css';

const PRDViewer = ({ prd, onClose, onVersionCreated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(prd.content);
  const [changes, setChanges] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const handleSaveNewVersion = async () => {
    if (editedContent === prd.content) {
      alert('No changes detected. Please modify the content before creating a new version.');
      return;
    }

    setIsCreatingVersion(true);
    try {
      const newVersion = await createNewVersion(prd, editedContent, changes);
      if (newVersion) {
        onVersionCreated && onVersionCreated(newVersion);
        onClose();
      } else {
        alert('Failed to create new version. Please try again.');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error creating new version.');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="prd-viewer-overlay" onClick={onClose}>
      <div className="prd-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="prd-viewer-header">
          <div className="prd-viewer-title">
            <h2>{prd.title}</h2>
            <div className="prd-viewer-meta">
              <span className="prd-version">v{prd.version}</span>
              <span className="prd-date">Created: {formatDate(prd.createdAt)}</span>
              {prd.updatedAt !== prd.createdAt && (
                <span className="prd-date">Updated: {formatDate(prd.updatedAt)}</span>
              )}
              <span className="prd-source">{prd.source}</span>
            </div>
          </div>
          <div className="prd-viewer-actions">
            <button 
              className="prd-viewer-btn edit"
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? 'Cancel Edit' : 'Edit PRD'}
            >
              {isEditing ? '✕' : '✏️'}
            </button>
            <button 
              className="prd-viewer-btn close"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="prd-viewer-content">
          {isEditing ? (
            <div className="prd-editor">
              <div className="prd-editor-section">
                <label htmlFor="changes">Changes Description:</label>
                <input
                  id="changes"
                  type="text"
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                  placeholder="Describe what changes you made..."
                  className="prd-changes-input"
                />
              </div>
              <div className="prd-editor-section">
                <label htmlFor="content">PRD Content:</label>
                <textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="prd-content-editor"
                  rows={20}
                />
              </div>
              <div className="prd-editor-actions">
                <button 
                  className="prd-editor-btn save"
                  onClick={handleSaveNewVersion}
                  disabled={isCreatingVersion}
                >
                  {isCreatingVersion ? 'Creating...' : 'Create New Version'}
                </button>
                <button 
                  className="prd-editor-btn cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(prd.content);
                    setChanges('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prd-markdown-content">
              <pre>{prd.content}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRDViewer;