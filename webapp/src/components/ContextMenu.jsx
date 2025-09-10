import React from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, onToggleToolbar, onAddNode, onOpenProjectPlanner }) => {
  const nodeTypes = [
    { type: 'chatNode', label: 'Chat Node', icon: '💬' },
    { type: 'textEditorNode', label: 'Text Editor', icon: '📝' },
    { type: 'cardNode', label: 'Card Node', icon: '🃏' },
    { type: 'contentNode', label: 'Content Node', icon: '📄' },
    { type: 'featureCard', label: 'Feature Card', icon: '📋' },
    { type: 'techStackCard', label: 'Tech Stack Card', icon: '⚙️' },
    { type: 'summaryNode', label: 'Summary Node', icon: '📋' }
  ];

  const handleAddNode = (nodeType) => {
    onAddNode(nodeType, { x: x - 100, y: y - 50 }); // Position near click
    onClose();
  };

  const handleToggleToolbar = () => {
    onToggleToolbar();
    onClose();
  };

  const handleOpenProjectPlanner = () => {
    onOpenProjectPlanner();
    onClose();
  };

  return (
    <div 
      className="context-menu" 
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-section">
        <div className="context-menu-title">Start Your Project</div>
        <button className="context-menu-item primary-action" onClick={handleOpenProjectPlanner}>
          <span className="context-menu-icon">🚀</span>
          <span>Project Planner</span>
          <span className="context-menu-subtitle">Describe your project & generate PRD</span>
        </button>
      </div>
      
      <div className="context-menu-divider"></div>
      
      <div className="context-menu-section">
        <div className="context-menu-title">Tools</div>
        <button className="context-menu-item" onClick={handleToggleToolbar}>
          <span className="context-menu-icon">🔧</span>
          <span>Toggle Toolbar</span>
        </button>
      </div>
      
      <div className="context-menu-divider"></div>
      
      <div className="context-menu-section">
        <div className="context-menu-title">Add Node</div>
        {nodeTypes.map((node) => (
          <button 
            key={node.type}
            className="context-menu-item" 
            onClick={() => handleAddNode(node.type)}
          >
            <span className="context-menu-icon">{node.icon}</span>
            <span>{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu;