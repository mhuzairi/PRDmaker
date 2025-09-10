import React, { useState } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import './SummaryNode.css';

const SummaryNode = ({ data, selected, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(data.content || 'Enter project summary here...');
  const [title, setTitle] = useState(data.title || 'Project Summary');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Function to update node data in React Flow
  const updateNodeData = (newTitle, newContent) => {
    if (reactFlowInstance) {
      const nodes = reactFlowInstance.getNodes();
      const updatedNodes = nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, title: newTitle, content: newContent } }
          : node
      );
      reactFlowInstance.setNodes(updatedNodes);
    }
  };

  const handleSummaryChange = (e) => {
    const newSummary = e.target.value;
    setSummary(newSummary);
    updateNodeData(title, newSummary);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNodeData(newTitle, summary);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Update the node data in React Flow
    updateNodeData(title, summary);
    // Keep backward compatibility
    if (data.onUpdate) {
      data.onUpdate({ title, content: summary });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSummary(data.content || 'Enter project summary here...');
    setTitle(data.title || 'Project Summary');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className={`summary-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={400}
        minHeight={300}
      />
      {/* Node Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle"
        style={{ right: '-6px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
        style={{ left: '-6px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
        style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
        style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />

      {/* Node Header */}
      <div className="node-header">
        <div className="window-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="window-title">
          <span className="summary-icon">📋</span>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="title-input"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <span>{title}</span>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="header-btn collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          {isEditing ? (
            <>
              <button className="header-btn save-btn" onClick={handleSave} title="Save (Ctrl+Enter)">
                ✓
              </button>
              <button className="header-btn cancel-btn" onClick={handleCancel} title="Cancel (Esc)">
                ✕
              </button>
            </>
          ) : (
            <button className="header-btn edit-btn" onClick={() => setIsEditing(true)} title="Edit Summary">
              ✏️
            </button>
          )}
        </div>
      </div>

      {/* Summary Content */}
      {!isCollapsed && (
        <div className="summary-content">
          {isEditing ? (
            <div className="summary-editor">
              <textarea
                value={summary}
                onChange={handleSummaryChange}
                onKeyDown={handleKeyDown}
                className="summary-textarea"
                placeholder="Enter a comprehensive project summary including goals, vision, target audience, and key objectives..."
                rows={12}
              />
              <div className="editor-help">
                <span>💡 Tip: Use Ctrl+Enter to save, Esc to cancel</span>
              </div>
            </div>
          ) : (
            <div className="summary-display">
              <div className="summary-text">
                {summary.split('\n').map((line, index) => (
                  <p key={index} className={line.trim() === '' ? 'empty-line' : ''}>
                    {line.trim() === '' ? '\u00A0' : line}
                  </p>
                ))}
              </div>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Words:</span>
                  <span className="stat-value">{summary.split(/\s+/).filter(word => word.length > 0).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Characters:</span>
                  <span className="stat-value">{summary.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Sections */}
      {!isEditing && !isCollapsed && (
        <div className="summary-sections">
          <div className="section-indicator">
            <div className="section-dot active"></div>
            <span className="section-label">Overview</span>
          </div>
        </div>
      )}
      
      {/* PRD Footer */}
      <div className="prd-footer">
        <div className="prd-badge">
          <span className="prd-icon">📋</span>
          <span className="prd-text">PRD Summary</span>
        </div>
        <div className="prd-indicator">
          <div className="prd-dot"></div>
          <div className="prd-dot"></div>
          <div className="prd-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SummaryNode;