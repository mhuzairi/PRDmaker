import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import './CardNode.css';

const CardNode = ({ data, selected, id }) => {
  const reactFlowInstance = useReactFlow();
  const [cards, setCards] = useState(data.cards || [
    {
      id: 1,
      title: 'React.js (Frontend Framework)',
      description: 'User interface library for component-based design.',
      category: 'frontend'
    },
    {
      id: 2,
      title: 'TypeScript (Type Safety)',
      description: 'Ensures type-checking and better developer experience.',
      category: 'language'
    },
    {
      id: 3,
      title: 'Tailwind CSS (Utility Styling)',
      description: 'Fast styling with utility-first CSS classes.',
      category: 'styling'
    },
    {
      id: 4,
      title: 'Vite (Build Tool)',
      description: 'Ultra-fast development and build process.',
      category: 'build'
    },
    {
      id: 5,
      title: 'Express.js (Backend Framework)',
      description: 'Minimal Node.js server framework.',
      category: 'backend'
    },
    {
      id: 6,
      title: 'SQLite (Embedded Database)',
      description: 'Lightweight relational database for MVP.',
      category: 'database'
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', description: '', category: 'frontend' });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const addCard = () => {
    if (newCard.title && newCard.description) {
      const card = {
        id: Date.now(),
        title: newCard.title,
        description: newCard.description,
        category: newCard.category
      };
      const updatedCards = [...cards, card];
      setCards(updatedCards);
      updateNodeData(updatedCards);
      setNewCard({ title: '', description: '', category: 'frontend' });
      setShowAddForm(false);
    }
  };

  const removeCard = (cardId) => {
    const updatedCards = cards.filter(card => card.id !== cardId);
    setCards(updatedCards);
    updateNodeData(updatedCards);
  };

  const updateNodeData = (updatedCards) => {
    if (reactFlowInstance) {
      const nodes = reactFlowInstance.getNodes();
      const updatedNodes = nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, cards: updatedCards } }
          : node
      );
      reactFlowInstance.setNodes(updatedNodes);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      frontend: '#3b82f6',
      language: '#10b981',
      styling: '#8b5cf6',
      build: '#f59e0b',
      backend: '#ef4444',
      database: '#06b6d4',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className={`card-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={500}
        minHeight={400}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="node-handle"
        style={{ left: '-6px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="node-handle"
        style={{ right: '-6px', top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Header */}
      <div className="node-header">
        <div className="window-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="window-title">
          <span>{data.title || 'Technology Stack'}</span>
        </div>
        <div className="header-actions">
          <button 
            className="header-btn collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button 
            className="header-btn add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add Card"
          >
            +
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-container">
        <div className="cards-grid">
          {(isCollapsed ? cards.slice(0, 4) : cards).map((card) => (
            <div key={card.id} className="tech-card">
              <div className="card-header">
                <div 
                  className="category-indicator"
                  style={{ backgroundColor: getCategoryColor(card.category) }}
                ></div>
                <button 
                  className="remove-card-btn"
                  onClick={() => removeCard(card.id)}
                  title="Remove card"
                >
                  ×
                </button>
              </div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </div>
          ))}
          
          {/* Add Card Form */}
          {showAddForm && !isCollapsed && (
            <div className="tech-card add-card-form">
              <input
                type="text"
                placeholder="Card title"
                value={newCard.title}
                onChange={(e) => setNewCard({...newCard, title: e.target.value})}
                className="card-input"
              />
              <textarea
                placeholder="Description"
                value={newCard.description}
                onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                className="card-textarea"
                rows="2"
              />
              <select
                value={newCard.category}
                onChange={(e) => setNewCard({...newCard, category: e.target.value})}
                className="card-select"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="database">Database</option>
                <option value="language">Language</option>
                <option value="styling">Styling</option>
                <option value="build">Build Tool</option>
                <option value="other">Other</option>
              </select>
              <div className="form-actions">
                <button onClick={addCard} className="add-btn-confirm">Add</button>
                <button onClick={() => setShowAddForm(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Add Card Button */}
        {!showAddForm && !isCollapsed && (
          <div className="add-card-placeholder" onClick={() => setShowAddForm(true)}>
            <div className="add-icon">+</div>
            <span>Add Card</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardNode;