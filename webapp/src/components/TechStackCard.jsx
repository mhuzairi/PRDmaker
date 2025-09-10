import React, { useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import './TechStackCard.css';

const TechStackCard = ({ data, selected, id }) => {
  const [techItems, setTechItems] = useState(data.techItems || [
    {
      id: 1,
      title: 'React.js',
      description: 'Frontend framework for building user interfaces',
      category: 'frontend'
    },
    {
      id: 2,
      title: 'Node.js',
      description: 'JavaScript runtime for backend development',
      category: 'backend'
    },
    {
      id: 3,
      title: 'MongoDB',
      description: 'NoSQL database for flexible data storage',
      category: 'database'
    },
    {
      id: 4,
      title: 'Docker',
      description: 'Containerization platform for deployment',
      category: 'devops'
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTechItem, setNewTechItem] = useState({ title: '', description: '', category: 'frontend' });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const addTechItem = () => {
    if (newTechItem.title && newTechItem.description) {
      const techItem = {
        id: Date.now(),
        title: newTechItem.title,
        description: newTechItem.description,
        category: newTechItem.category
      };
      setTechItems([...techItems, techItem]);
      setNewTechItem({ title: '', description: '', category: 'frontend' });
      setShowAddForm(false);
    }
  };

  const removeTechItem = (techItemId) => {
    setTechItems(techItems.filter(item => item.id !== techItemId));
  };

  const getCategoryColor = (category) => {
    const colors = {
      frontend: '#3b82f6',
      backend: '#ef4444',
      database: '#10b981',
      devops: '#f59e0b',
      mobile: '#8b5cf6',
      testing: '#06b6d4',
      security: '#f97316',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      frontend: '🎨',
      backend: '⚙️',
      database: '🗄️',
      devops: '🚀',
      mobile: '📱',
      testing: '🧪',
      security: '🔒',
      other: '🔧'
    };
    return icons[category] || icons.other;
  };

  return (
    <div className={`techstack-card-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={400}
        minHeight={350}
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
          <span>🔧 {data.title || 'Technology Stack'}</span>
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
            title="Add Technology"
          >
            +
          </button>
        </div>
      </div>

      {/* Tech Stack Container */}
      <div className="techstack-container">
        <div className="techstack-grid">
          {(isCollapsed ? techItems.slice(0, 4) : techItems).map((item) => (
            <div key={item.id} className="tech-item" data-category={item.category}>
              {/* Individual tech item handles */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={`tech-${item.id}-target`}
                className="tech-handle tech-handle-left"
              />
              <Handle 
                type="source" 
                position={Position.Right} 
                id={`tech-${item.id}-source`}
                className="tech-handle tech-handle-right"
              />
              
              <div className="tech-header">
                <div className="tech-icon-wrapper">
                  <span className="tech-icon">{getCategoryIcon(item.category)}</span>
                  <div 
                    className="category-indicator"
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                  ></div>
                </div>
                <button 
                  className="remove-tech-btn"
                  onClick={() => removeTechItem(item.id)}
                  title="Remove technology"
                >
                  ×
                </button>
              </div>
              <h3 className="tech-title">{item.title}</h3>
              <p className="tech-description">{item.description}</p>
              <div className="tech-category">
                <span className="category-tag" style={{ backgroundColor: getCategoryColor(item.category) }}>
                  {item.category}
                </span>
              </div>
            </div>
          ))}
          
          {/* Add Tech Item Form */}
        {showAddForm && !isCollapsed && (
          <div className="tech-item add-tech-form">
              <input
                type="text"
                placeholder="Technology name"
                value={newTechItem.title}
                onChange={(e) => setNewTechItem({...newTechItem, title: e.target.value})}
                className="tech-input"
              />
              <textarea
                placeholder="Technology description"
                value={newTechItem.description}
                onChange={(e) => setNewTechItem({...newTechItem, description: e.target.value})}
                className="tech-textarea"
                rows="3"
              />
              <select
                value={newTechItem.category}
                onChange={(e) => setNewTechItem({...newTechItem, category: e.target.value})}
                className="tech-select"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="database">Database</option>
                <option value="devops">DevOps</option>
                <option value="mobile">Mobile</option>
                <option value="testing">Testing</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
              <div className="form-actions">
                <button onClick={addTechItem} className="add-btn-confirm">Add</button>
                <button onClick={() => setShowAddForm(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Add Tech Item Button */}
        {!showAddForm && !isCollapsed && (
          <div className="add-tech-placeholder" onClick={() => setShowAddForm(true)}>
            <div className="add-icon">+</div>
            <span>Add Technology</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechStackCard;