import React, { useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import './ChatNode.css';

const ChatNode = ({ data, selected, id }) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-2024-08-06');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Node message:', message);
      // Handle message submission here
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className={`chat-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={400}
        minHeight={200}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="node-handle"
        style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <div className="node-header">
        <div className="window-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="window-title">
          <svg className="title-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>{data.title || 'untitled'}</span>
        </div>
        <div className="header-actions">
          <button className="header-btn close-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <button className="header-btn delete-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="node-content">
        <div className="node-messages">
          <div className="message-placeholder">
            <span>Ask a question...</span>
          </div>
        </div>
      </div>

      <div className="node-input-container">
        <form onSubmit={handleSubmit} className="node-form">
          <div className="node-input-wrapper">
            <div className="node-model-selector">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="node-model-select"
              >
                <option value="openai/gpt-4o-2024-08-06">openai/gpt-4o-2024-08-06</option>
                <option value="openai/gpt-4-turbo">openai/gpt-4-turbo</option>
                <option value="anthropic/claude-3-sonnet">anthropic/claude-3-sonnet</option>
              </select>
              <svg className="node-dropdown-icon" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>

            <div className="node-action-buttons">
              <button type="button" className="node-action-btn search-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <span>Search</span>
              </button>

              <button type="button" className="node-action-btn system-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span>System</span>
              </button>

              <button type="button" className="node-action-btn think-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Think</span>
              </button>

              <button type="submit" className="node-ask-btn">
                Ask <kbd>⌘↵</kbd>
              </button>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question..."
            className="node-message-input"
            rows={1}
          />
        </form>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="node-handle"
        style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />
    </div>
  );
};

export default ChatNode;