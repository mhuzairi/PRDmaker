import React, { useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import './FloatingToolbar.css';

const FloatingToolbar = ({ onAddNode, onDeleteSelected, onDeleteAll, onZoomIn, onZoomOut, onFitView, onToggleChat, onAutoLayout, onHelp, onDownload }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const { refs, floatingStyles } = useFloating({
    placement: 'top-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 10 })
    ]
  });

  const toolbarItems = [
    {
      icon: '➕',
      label: 'Add Node',
      onClick: onAddNode,
      className: 'toolbar-btn add-node'
    },
    {
      icon: '📄',
      label: 'Add Document',
      onClick: () => console.log('Add document'),
      className: 'toolbar-btn add-doc'
    },
    {
      icon: '⬇️',
      label: 'Download',
      onClick: onDownload,
      className: 'toolbar-btn download'
    },
    {
      icon: '🔀',
      label: 'Shuffle',
      onClick: () => console.log('Shuffle'),
      className: 'toolbar-btn shuffle'
    },
    {
      icon: '📋',
      label: 'Notes',
      onClick: () => console.log('Notes'),
      className: 'toolbar-btn notes'
    },
    {
      icon: '❓',
      label: 'Help',
      onClick: onHelp,
      className: 'toolbar-btn help'
    },
    {
      icon: '🗑️',
      label: 'Delete Selected',
      onClick: onDeleteSelected,
      className: 'toolbar-btn delete'
    },
    {
      icon: '🗂️',
      label: 'Delete All',
      onClick: onDeleteAll,
      className: 'toolbar-btn delete-all'
    }
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="floating-toolbar-container">
      <div 
        ref={refs.setFloating}
        style={floatingStyles}
        className="floating-toolbar"
      >
        <div className="toolbar-content">
          {toolbarItems.map((item, index) => (
            <button
              key={index}
              className={item.className}
              onClick={item.onClick}
              title={item.label}
            >
              <span className="toolbar-icon">{item.icon}</span>
            </button>
          ))}
          <div className="toolbar-divider"></div>
          <button
            className="toolbar-btn zoom-in"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <span className="toolbar-icon">🔍</span>
          </button>
          <button
            className="toolbar-btn zoom-out"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <span className="toolbar-icon">🔎</span>
          </button>
          <button
            className="toolbar-btn fit-view"
            onClick={onFitView}
            title="Fit View"
          >
            <span className="toolbar-icon">⊞</span>
          </button>
          <button
            className="toolbar-btn auto-layout"
            onClick={onAutoLayout}
            title="Auto Layout"
          >
            <span className="toolbar-icon">📐</span>
          </button>
          <div className="toolbar-divider"></div>
          <button
            className="toolbar-btn chat-btn"
            onClick={onToggleChat}
            title="Toggle Chat"
          >
            <span className="toolbar-icon">💬</span>
          </button>
          <button
            className="toolbar-btn close"
            onClick={() => setIsVisible(false)}
            title="Hide Toolbar"
          >
            <span className="toolbar-icon">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingToolbar;