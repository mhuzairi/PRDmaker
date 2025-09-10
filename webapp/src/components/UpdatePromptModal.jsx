import React, { useState } from 'react';
import './UpdatePromptModal.css';

const UpdatePromptModal = ({ prd, pendingUpdate, onApply, onDismiss, onClose }) => {
  const [changes, setChanges] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const handleApply = () => {
    onApply(changes);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getContentPreview = (content, maxLength = 200) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt-modal">
        <div className="update-prompt-header">
          <h3>🔄 New Content Detected</h3>
          <button className="update-prompt-close" onClick={onClose}>×</button>
        </div>
        
        <div className="update-prompt-content">
          <div className="update-info">
            <h4>{prd.title}</h4>
            <p className="update-description">
              New content has been detected that appears to be an enhancement or addition to this PRD.
              Detected on {formatDate(pendingUpdate.detectedAt)} from {pendingUpdate.newSource}.
            </p>
          </div>

          <div className="content-comparison">
            <div className="content-section">
              <h5>Current Content (v{prd.version})</h5>
              <div className="content-preview current">
                {getContentPreview(prd.content)}
              </div>
            </div>
            
            <div className="content-section">
              <h5>New Content</h5>
              <div className="content-preview new">
                {getContentPreview(pendingUpdate.newContent)}
              </div>
            </div>
          </div>

          <div className="diff-toggle">
            <button 
              className="toggle-diff-btn"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? 'Hide' : 'Show'} Full Content Comparison
            </button>
          </div>

          {showDiff && (
            <div className="full-content-diff">
              <div className="diff-section">
                <h6>Current Version</h6>
                <pre className="diff-content current">{prd.content}</pre>
              </div>
              <div className="diff-section">
                <h6>New Version</h6>
                <pre className="diff-content new">{pendingUpdate.newContent}</pre>
              </div>
            </div>
          )}

          <div className="changes-input">
            <label htmlFor="changes">Describe the changes (optional):</label>
            <textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="e.g., Added new user authentication features, Enhanced payment processing..."
              rows={3}
            />
          </div>
        </div>
        
        <div className="update-prompt-actions">
          <button className="btn-dismiss" onClick={onDismiss}>
            Dismiss Update
          </button>
          <button className="btn-apply" onClick={handleApply}>
            Apply as New Version (v{(prd.version || 1) + 1})
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePromptModal;