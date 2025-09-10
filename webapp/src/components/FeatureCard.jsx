import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { getFeaturesByModule } from '../config/featureConfigs';
import EditFeatureModal from './EditFeatureModal';
import './FeatureCard.css';

const FeatureCard = ({ data, selected, id }) => {
  // Get module type from data prop, default to 'default'
  const moduleType = data.moduleType || 'default';
  const moduleConfig = getFeaturesByModule(moduleType);
  
  const [features, setFeatures] = useState(data.features || moduleConfig.features);
  const updateNodeInternals = useUpdateNodeInternals();
  const reactFlowInstance = useReactFlow();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({ title: '', description: '', category: 'core' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Function to update node data in React Flow
  const updateNodeData = (updatedFeatures) => {
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, features: updatedFeatures } } : node
      )
    );
  };
  
  // Update features when moduleType changes
  useEffect(() => {
    if (!data.features) {
      const config = getFeaturesByModule(moduleType);
      setFeatures(config.features);
    }
  }, [moduleType, data.features]);

  const addFeature = () => {
    if (newFeature.title && newFeature.description) {
      // Generate a truly unique ID using timestamp + random number + node ID
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${id}`;
      const feature = {
        id: uniqueId,
        title: newFeature.title,
        description: newFeature.description,
        category: newFeature.category
      };
      const updatedFeatures = [...features, feature];
      setFeatures(updatedFeatures);
      updateNodeData(updatedFeatures);
      setNewFeature({ title: '', description: '', category: 'core' });
      setShowAddForm(false);
      // Notify React Flow about new handles
      setTimeout(() => updateNodeInternals(id), 0);
    }
  };

  // Get parent context for AI generation
  const getParentContext = () => {
    if (!reactFlowInstance) {
      return 'A web application project that needs additional features.';
    }
    
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();
    
    console.log('DEBUG - All edges:', edges);
    console.log('DEBUG - Current node ID:', id);
    
    let context = '';
    
    // Find connected parent nodes
    const parentEdges = edges.filter(edge => edge.target === id);
    console.log('DEBUG - Parent edges for this node:', parentEdges);
    const parentNodes = parentEdges.map(edge => 
      nodes.find(node => node.id === edge.source)
    ).filter(Boolean);
    console.log('DEBUG - Parent nodes:', parentNodes);
    
    // Also check all nodes for general context if no direct connections
    const allRelevantNodes = parentNodes.length > 0 ? parentNodes : nodes.filter(node => 
      node.type === 'summaryNode' || node.type === 'techStackCard'
    );
    
    // Gather context from different node types
    allRelevantNodes.forEach(node => {
      if (node.type === 'summaryNode') {
        const summary = node.data.content || node.data.title || '';
        if (summary && summary !== 'Enter project summary here...') {
          context += `Project Summary: ${summary}\n\n`;
        }
      } else if (node.type === 'techStackCard') {
        const techItems = node.data.techItems || [];
        if (techItems.length > 0) {
          context += `Tech Stack:\n${techItems.map(item => `- ${item.title}: ${item.description}`).join('\n')}\n\n`;
        }
      } else if (node.type === 'featureCard' && node.id !== id) {
        // Check if connection came from a specific feature handle
        const parentEdge = parentEdges.find(edge => edge.source === node.id);
        if (parentEdge && parentEdge.sourceHandle && parentEdge.sourceHandle.startsWith('feature-')) {
          // Extract feature ID from handle (format: feature-{id}-source)
          const handleParts = parentEdge.sourceHandle.split('-');
          const featureId = handleParts.slice(1, -1).join('-'); // Everything between 'feature-' and '-source'
          const specificFeature = node.data.features?.find(f => f.id.toString() === featureId);
          if (specificFeature) {
            context += `Connected Feature: ${specificFeature.title}\nDescription: ${specificFeature.description}\n\n`;
          } else {
            const nodeFeatures = node.data.features || [];
            if (nodeFeatures.length > 0) {
              context += `Related Features:\n${nodeFeatures.map(f => `- ${f.title}: ${f.description}`).join('\n')}\n\n`;
            }
          }
        } else {
          // Connection from main feature card node
          const nodeFeatures = node.data.features || [];
          if (nodeFeatures.length > 0) {
            context += `Related Features:\n${nodeFeatures.map(f => `- ${f.title}: ${f.description}`).join('\n')}\n\n`;
          }
        }
      } else if (node.type === 'textEditorNode') {
        const content = node.data.content || '';
        if (content && content.trim()) {
          context += `Additional Context: ${content}\n\n`;
        }
      }
    });
    
    // Add current features as context
    if (features.length > 0) {
      context += `Current Features:\n${features.map(f => `- ${f.title}: ${f.description}`).join('\n')}\n\n`;
    }
    
    // Fallback context if nothing found
    if (!context.trim()) {
      context = 'A modern web application project that needs additional features to enhance user experience and functionality.';
    }
    
    return context;
  };

  // Check for duplicate or similar features
  const isDuplicateFeature = (newFeature, existingFeatures) => {
    const newTitle = newFeature.title.toLowerCase();
    const newDesc = newFeature.description.toLowerCase();
    
    return existingFeatures.some(existing => {
      const existingTitle = existing.title.toLowerCase();
      const existingDesc = existing.description.toLowerCase();
      
      // Check for exact title match or very similar titles
      if (existingTitle === newTitle) return true;
      
      // Check for similar titles (contains key words)
      const newWords = newTitle.split(' ').filter(word => word.length > 3);
      const existingWords = existingTitle.split(' ').filter(word => word.length > 3);
      const commonWords = newWords.filter(word => existingWords.includes(word));
      if (commonWords.length > 0 && commonWords.length >= Math.min(newWords.length, existingWords.length) * 0.6) {
        return true;
      }
      
      // Check for similar descriptions
      const descWords = newDesc.split(' ').filter(word => word.length > 4);
      const existingDescWords = existingDesc.split(' ').filter(word => word.length > 4);
      const commonDescWords = descWords.filter(word => existingDescWords.includes(word));
      if (commonDescWords.length > 0 && commonDescWords.length >= Math.min(descWords.length, existingDescWords.length) * 0.5) {
        return true;
      }
      
      return false;
    });
  };

  // AI generation function
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const context = getParentContext();
      console.log('Context for AI generation:', context);
      
      // Extract parent name from context for new features
      let parentName = 'Features';
      console.log('DEBUG - Checking for Connected Feature in context:', context.includes('Connected Feature:'));
      if (context.includes('Connected Feature:')) {
        const match = context.match(/Connected Feature: (.+?)\n/);
        console.log('DEBUG - Regex match result:', match);
        if (match) {
          parentName = match[1].trim();
          console.log('DEBUG - Extracted parent name:', parentName);
        }
      }
      console.log('DEBUG - Final parent name:', parentName);
      
      // Get existing feature titles for duplicate prevention
      const existingTitles = features.map(f => f.title.toLowerCase()).join(', ');
      
      const prompt = `Based on the following project context, suggest 1 NEW and UNIQUE feature that would complement this project. Keep it simple and practical.

IMPORTANT: Do NOT suggest features similar to these existing ones: ${existingTitles}

Context:
${context}

If you cannot think of a truly unique feature that hasn't been covered, respond with "NEED_FOCUS" followed by a question asking what specific area the user wants to focus on (e.g., "What specific area would you like to focus on? (e.g., user experience, data management, security, performance, etc.)").

Otherwise, respond with exactly 1 feature in this format:
1. Feature Title - Feature description`;
      
      const GEMINI_API_KEY = 'AIzaSyBLzpNE6zpVIw7XRFuoZHkAT6_e_JftI78';
      
      const response = await fetch('http://localhost:3001/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          apiKey: GEMINI_API_KEY
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Full AI Response:', data);
      
      // Extract text from Gemini API response structure
      let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || data.response || '';
      console.log('AI Response Text:', aiResponse);
      
      // Check if AI is asking for focus area
      if (aiResponse.includes('NEED_FOCUS')) {
        const focusQuestion = aiResponse.replace('NEED_FOCUS', '').trim();
        const userFocus = prompt(focusQuestion || 'What specific area would you like to focus on? (e.g., user experience, data management, security, performance, etc.)');
        
        if (userFocus && userFocus.trim()) {
          // Generate features based on user's focus area
          const focusPrompt = `Based on the project context and focusing specifically on "${userFocus}", suggest 1 unique feature related to this area.

Context:
${context}

Existing features to avoid: ${existingTitles}

Respond with exactly 1 feature in this format:
1. Feature Title - Feature description`;
          
          const focusResponse = await fetch('http://localhost:3001/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: focusPrompt,
              apiKey: GEMINI_API_KEY
            })
          });
          
          if (focusResponse.ok) {
            const focusData = await focusResponse.json();
            const focusAiResponse = focusData.candidates?.[0]?.content?.parts?.[0]?.text || focusData.response || '';
            aiResponse = focusAiResponse;
          }
        } else {
          // User cancelled, exit generation
          return;
        }
      }
      
      let generatedFeatures = [];
      
      // Parse the simple numbered list format
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
        if (match) {
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${id}-${index}`;
          const newFeature = {
            id: uniqueId,
            title: match[1].trim().replace(/\*\*/g, ''),
            description: match[2].trim().replace(/\*\*/g, ''),
            category: 'core'
          };
          
          // Check for duplicates before adding
          if (!isDuplicateFeature(newFeature, features) && !isDuplicateFeature(newFeature, generatedFeatures)) {
            generatedFeatures.push(newFeature);
          }
        } else if (line.includes('-') && generatedFeatures.length < 1) {
          // Fallback parsing
          const parts = line.split('-');
          if (parts.length >= 2) {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${id}-fallback-${index}`;
            const newFeature = {
              id: uniqueId,
              title: parts[0].replace(/^\d+\.\s*/, '').trim().replace(/\*\*/g, ''),
              description: parts.slice(1).join('-').trim().replace(/\*\*/g, ''),
              category: 'core'
            };
            
            // Check for duplicates before adding
            if (!isDuplicateFeature(newFeature, features) && !isDuplicateFeature(newFeature, generatedFeatures)) {
              generatedFeatures.push(newFeature);
            }
          }
        }
      });
      
      // If no unique features were generated, ask user for focus
      if (generatedFeatures.length === 0) {
        const userFocus = prompt('I couldn\'t generate unique features that aren\'t already covered. What specific area would you like to focus on? (e.g., user experience, data management, security, performance, analytics, etc.)');
        
        if (userFocus && userFocus.trim()) {
          // Try again with user's focus
          const focusPrompt = `Generate 1 unique feature specifically for "${userFocus}" that complements this project.

Context:
${context}

Existing features to avoid: ${existingTitles}

Respond with exactly 1 feature in this format:
1. Feature Title - Feature description`;
          
          const focusResponse = await fetch('http://localhost:3001/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: focusPrompt,
              apiKey: GEMINI_API_KEY
            })
          });
          
          if (focusResponse.ok) {
            const focusData = await focusResponse.json();
            const focusAiResponse = focusData.candidates?.[0]?.content?.parts?.[0]?.text || focusData.response || '';
            const focusLines = focusAiResponse.split('\n').filter(line => line.trim());
            
            focusLines.forEach((line, index) => {
              const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
              if (match && generatedFeatures.length < 1) {
                const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${id}-focus-${index}`;
                const newFeature = {
                  id: uniqueId,
                  title: match[1].trim().replace(/\*\*/g, ''),
                  description: match[2].trim().replace(/\*\*/g, ''),
                  category: 'core'
                };
                
                if (!isDuplicateFeature(newFeature, features) && !isDuplicateFeature(newFeature, generatedFeatures)) {
                  generatedFeatures.push(newFeature);
                }
              }
            });
          }
        }
      }
      
      console.log('Generated features:', generatedFeatures);
      
      // Add generated features to the list
      if (generatedFeatures.length > 0) {
        const newFeatures = generatedFeatures.map((feature, index) => ({
          ...feature,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${id}-final-${index}` // Ensure unique IDs
        }));
        const updatedFeatures = [...features, ...newFeatures];
        setFeatures(updatedFeatures);
        updateNodeData(updatedFeatures);
        // Notify React Flow about new handles
        setTimeout(() => updateNodeInternals(id), 0);
      } else {
        alert('No unique features could be generated. Try adding more context or manually add features.');
      }
      
    } catch (error) {
      console.error('Error generating features:', error);
      alert('Error generating features. Please try again or add features manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeFeature = (featureId) => {
    const updatedFeatures = features.filter(feature => feature.id !== featureId);
    setFeatures(updatedFeatures);
    updateNodeData(updatedFeatures);
    // Notify React Flow about removed handles
    setTimeout(() => updateNodeInternals(id), 0);
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
    setShowEditModal(true);
  };

  const handleSaveFeature = (updatedFeature) => {
    const updatedFeatures = features.map(f => 
      f.id === updatedFeature.id ? updatedFeature : f
    );
    setFeatures(updatedFeatures);
    updateNodeData(updatedFeatures);
    setEditingFeature(null);
    setShowEditModal(false);
  };

  const handleCloseEditModal = () => {
    setEditingFeature(null);
    setShowEditModal(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      core: '#3b82f6',
      intelligence: '#10b981',
      ai: '#8b5cf6',
      visual: '#f59e0b',
      collaboration: '#ef4444',
      integration: '#06b6d4',
      security: '#f97316',
      automation: '#22c55e',
      infrastructure: '#a855f7',
      containers: '#0ea5e9',
      monitoring: '#f59e0b',
      ml: '#8b5cf6',
      nlp: '#06b6d4',
      vision: '#10b981',
      data: '#f97316',
      mlops: '#ef4444',
      ui: '#3b82f6',
      state: '#10b981',
      performance: '#f59e0b',
      auth: '#f97316',
      api: '#06b6d4',
      database: '#8b5cf6',
      platform: '#a855f7',
      native: '#22c55e',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      core: '⚡',
      intelligence: '🧠',
      ai: '🤖',
      visual: '📊',
      collaboration: '👥',
      integration: '🔗',
      security: '🔒',
      automation: '🔄',
      infrastructure: '🏗️',
      containers: '📦',
      monitoring: '📈',
      ml: '🧮',
      nlp: '💬',
      vision: '👁️',
      data: '📊',
      mlops: '🚀',
      ui: '🎨',
      state: '🗃️',
      performance: '⚡',
      auth: '🔐',
      api: '🔌',
      database: '🗄️',
      platform: '📱',
      native: '⚙️',
      other: '📋'
    };
    return icons[category] || icons.other;
  };

  return (
    <div className={`feature-card-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={350}
        minHeight={400}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="main-target"
        className="node-handle"
        style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="main-source"
        className="node-handle"
        style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Header */}
      <div className="node-header">
        <div className="window-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="window-title">
          <span>📋 {data.title || moduleConfig.title}</span>
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
            title="Add Feature"
          >
            +
          </button>
        </div>
      </div>

      {/* Features Container */}
      <div className="features-container">
        {/* Empty State */}
        {features.length === 0 && !showAddForm && !isCollapsed && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3 className="empty-title">No Features Yet</h3>
            <p className="empty-description">
              Start building your {moduleConfig.title.toLowerCase()} by adding features.
            </p>
            <button 
              className="empty-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add First Feature
            </button>
          </div>
        )}
        
        {/* Features Grid */}
        {features.length > 0 && (
          <div className="features-grid">
            {(isCollapsed ? features.slice(0, 2) : features).map((feature) => (
              <div 
                key={feature.id} 
                className="feature-item" 
                data-category={feature.category}
                onDoubleClick={() => handleEditFeature(feature)}
                style={{ cursor: 'pointer' }}
                title="Double-click to edit"
              >
                {/* Individual feature handles */}
                <Handle 
                  type="target" 
                  position={Position.Left} 
                  id={`feature-${feature.id}-target`}
                  className="feature-handle feature-handle-left"
                />
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={`feature-${feature.id}-source`}
                  className="feature-handle feature-handle-right"
                />
                
                <div className="feature-header">
                  <div className="feature-icon-wrapper">
                    <span className="feature-icon">{getCategoryIcon(feature.category)}</span>
                    <div 
                      className="category-indicator"
                      style={{ backgroundColor: getCategoryColor(feature.category) }}
                    ></div>
                  </div>
                  <button 
                    className="remove-feature-btn"
                    onClick={() => removeFeature(feature.id)}
                    title="Remove feature"
                  >
                    ×
                  </button>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                 <p className="feature-description">{feature.description}</p>
                <div className="feature-category">
                  <span className="category-tag" style={{ backgroundColor: getCategoryColor(feature.category) }}>
                    {feature.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Feature Form */}
        {showAddForm && !isCollapsed && (
          <div className="add-feature-form-container">
            <div className="feature-item add-feature-form">
              <input
                type="text"
                placeholder="Feature title"
                value={newFeature.title}
                onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
                className="feature-input"
              />
              <textarea
                placeholder="Feature description"
                value={newFeature.description}
                onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                className="feature-textarea"
                rows="3"
              />
              <select
                value={newFeature.category}
                onChange={(e) => setNewFeature({...newFeature, category: e.target.value})}
                className="feature-select"
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
              <div className="form-actions">
                <button onClick={addFeature} className="add-btn-confirm">Add</button>
                <button 
                  onClick={handleAIGenerate} 
                  className="ai-btn"
                  disabled={isGenerating}
                  title="Generate feature with AI"
                >
                  {isGenerating ? '...' : '✨'}
                </button>
                <button onClick={() => setShowAddForm(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Feature Button (only show when there are existing features) */}
        {features.length > 0 && !showAddForm && !isCollapsed && (
          <div className="add-feature-placeholder" onClick={() => setShowAddForm(true)}>
            <div className="add-icon">+</div>
            <span>Add Feature</span>
          </div>
        )}
      </div>
      
      {/* Edit Feature Modal */}
       <EditFeatureModal
         isOpen={showEditModal}
         feature={editingFeature}
         onSave={handleSaveFeature}
         onClose={handleCloseEditModal}
       />
    </div>
  );
};

export default FeatureCard;