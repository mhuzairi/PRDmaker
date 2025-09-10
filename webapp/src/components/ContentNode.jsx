import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import RefreshIcon from './RefreshIcon';
import { savePRD } from '../utils/prdStorage';
import './ContentNode.css';

const ContentNode = ({ data, selected, id }) => {
  const [showOptions, setShowOptions] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const reactFlowInstance = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  // Auto-resize node based on content using measured property
  useEffect(() => {
    if (!reactFlowInstance) return;

    const contentDimensions = {
      text: { width: 350, height: 300 },
      todo: { width: 300, height: 250 },
      help: { width: 340, height: 320 },
      prd: { width: 360, height: 350 }
    };

    const targetDimensions = selectedContent 
      ? contentDimensions[selectedContent.id] || { width: 200, height: 120 }
      : { width: 200, height: 120 };

    const nodes = reactFlowInstance.getNodes();
    const currentNode = nodes.find(node => node.id === id);
    
    if (currentNode) {
      const updatedNode = {
        ...currentNode,
        measured: {
          width: targetDimensions.width,
          height: targetDimensions.height,
        },
        style: {
          ...currentNode.style,
          width: targetDimensions.width,
          height: targetDimensions.height,
        },
      };
      
      const updatedNodes = nodes.map(node => 
        node.id === id ? updatedNode : node
      );
      
      reactFlowInstance.setNodes(updatedNodes);
      updateNodeInternals(id);
    }
  }, [selectedContent, reactFlowInstance, id, updateNodeInternals]);


  const contentOptions = [
    {
      id: 'text',
      title: 'Text',
      icon: '≡',
      color: '#666',
      description: 'Add text content'
    },
    {
      id: 'todo',
      title: 'To-Do',
      icon: '☑',
      color: '#666',
      description: 'Create task list'
    },
    {
      id: 'help',
      title: 'Get Help',
      icon: '?',
      color: '#ff8c00',
      description: 'Get assistance'
    },
    {
      id: 'prd',
      title: 'Generate PRD',
      icon: '📋',
      color: '#8b5cf6',
      description: 'Product requirements document'
    }
  ];

  const handleOptionSelect = (option) => {
    setSelectedContent(option);
    setShowOptions(false);
  };

  const getParentContext = () => {
    console.log('🚀 GET PARENT CONTEXT CALLED for node:', id, 'refreshTrigger:', refreshTrigger);
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();
    
    // Find the direct parent node (source node that connects TO this ContentNode)
    const parentEdge = edges.find(edge => edge.target === id);
    console.log('📥 Parent edge found:', parentEdge);
    const parentNode = parentEdge ? nodes.find(node => node.id === parentEdge.source) : null;
    console.log('📥 Parent node found:', parentNode);
    
    // Extract context from the direct parent node only
    if (parentNode) {
      switch (parentNode.type) {
        case 'summaryNode':
          return {
            content: [],
            features: [],
            projectSummary: parentNode.data.content || parentNode.data.title || '',
            techStack: []
          };
        case 'techStackCard':
          return {
            content: [],
            features: [],
            projectSummary: '',
            techStack: parentNode.data.techItems || []
          };
        case 'featureCard':
          console.log('🔍 FEATURE CARD PROCESSING - parentEdge:', parentEdge);
          if (parentEdge.sourceHandle && parentEdge.sourceHandle.startsWith('feature-')) {
            // Extract feature ID from handle (format: feature-{id}-source)
            const handleParts = parentEdge.sourceHandle.split('-');
            const featureId = handleParts.slice(1, -1).join('-'); // Everything between 'feature-' and '-source'
            
            // Try multiple matching strategies with comprehensive fallbacks
            let specificFeature = null;
            const features = parentNode.data.features || [];
            
            console.log('🎯 FEATURE MATCHING DEBUG - sourceHandle:', parentEdge.sourceHandle);
            console.log('🎯 Extracted featureId:', featureId);
            console.log('🎯 Available features:', features.map(f => ({ id: f.id, title: f.title })));
            
            // Strategy 1: Exact string match (handles ProjectPlanner simple IDs)
            specificFeature = features.find(f => f.id.toString() === featureId);
            console.log('DEBUG - Strategy 1 result:', specificFeature);
            
            // Strategy 2: Direct comparison (no toString)
            if (!specificFeature) {
              specificFeature = features.find(f => f.id === featureId);
              console.log('DEBUG - Strategy 2 result:', specificFeature);
            }
            
            // Strategy 3: Numeric conversion for simple numeric IDs
            if (!specificFeature && !isNaN(featureId)) {
              const numericFeatureId = parseInt(featureId);
              specificFeature = features.find(f => f.id === numericFeatureId || f.id.toString() === numericFeatureId.toString());
              console.log('DEBUG - Strategy 3 result:', specificFeature);
            }
            
            // Strategy 4: Loose string matching (trim whitespace, case insensitive)
            if (!specificFeature) {
              specificFeature = features.find(f => 
                f.id.toString().trim().toLowerCase() === featureId.toString().trim().toLowerCase()
              );
              console.log('DEBUG - Strategy 4 result:', specificFeature);
            }
            
            // Strategy 5: Partial matching for complex timestamp-based IDs
            if (!specificFeature) {
              specificFeature = features.find(f => 
                f.id.toString().includes(featureId) || featureId.includes(f.id.toString())
              );
              console.log('DEBUG - Strategy 5 result:', specificFeature);
            }
            
            // Strategy 6: Handle case where featureId might be index-based (for ProjectPlanner)
            if (!specificFeature && features.length > 0) {
              const featureIndex = parseInt(featureId);
              if (!isNaN(featureIndex) && featureIndex >= 0 && featureIndex < features.length) {
                specificFeature = features[featureIndex];
                console.log('DEBUG - Strategy 6 (index-based) result:', specificFeature);
              }
            }
            
            console.log('DEBUG - Final matched feature:', specificFeature);

            if (specificFeature) {
              // Simply use the feature title and description as context
              return {
                content: [{
                  title: specificFeature.title,
                  content: specificFeature.description
                }],
                features: [],
                projectSummary: '',
                techStack: []
              };
            } else {
              // If no specific feature matched, include all features
              return {
                content: [],
                features: parentNode.data.features || [],
                projectSummary: '',
                techStack: []
              };
            }
          } else {
            // Connection from main feature card node
            return {
              content: [],
              features: parentNode.data.features || [],
              projectSummary: '',
              techStack: []
            };
          }
          break;
        case 'textEditorNode':
          return {
            content: [{
              title: parentNode.data.title || '',
              content: parentNode.data.content || ''
            }],
            features: [],
            projectSummary: '',
            techStack: []
          };
        case 'chatNode':
          return {
            content: [{
              title: parentNode.data.title || '',
              content: parentNode.data.messages ? parentNode.data.messages.map(m => m.content).join('\n') : ''
            }],
            features: [],
            projectSummary: '',
            techStack: []
          };
        case 'cardNode':
          // Handle CardNode with individual cards
          const cards = parentNode.data.cards || [];
          const cardContent = cards.map(card => 
            `${card.title}: ${card.description} (Category: ${card.category})`
          ).join('\n');
          return {
            content: [{
              title: parentNode.data.title || 'Card Collection',
              content: cardContent
            }],
            features: [],
            projectSummary: '',
            techStack: []
          };
        default:
          return {
            content: [],
            features: [],
            projectSummary: '',
            techStack: []
          };
      }
    }
    
    // Return empty context if no parent node
    return {
      content: [],
      features: [],
      projectSummary: '',
      techStack: []
    };
  };

  const GEMINI_API_KEY = 'AIzaSyBLzpNE6zpVIw7XRFuoZHkAT6_e_JftI78';

  const handleRefreshContext = async () => {
    console.log('🔄 REFRESH CONTEXT TRIGGERED for node:', id);
    setIsRefreshing(true);
    try {
      // Force React Flow to refresh its internal state
      const { getNodes, getEdges } = reactFlowInstance;
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      
      console.log('🔄 Current nodes before refresh:', currentNodes.length);
      console.log('🔄 Current edges before refresh:', currentEdges.length);
      
      // Trigger a re-evaluation by updating the nodes slightly
      // This forces React Flow to recalculate connections and context
      reactFlowInstance.setNodes(currentNodes.map(node => ({ ...node })));
      reactFlowInstance.setEdges(currentEdges.map(edge => ({ ...edge })));
      
      // Force component re-render to refresh parent context
      setRefreshTrigger(prev => {
        console.log('🔄 Updating refresh trigger from', prev, 'to', prev + 1);
        return prev + 1;
      });
      
      // Small delay for UX and to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('🔄 REFRESH CONTEXT COMPLETED for node:', id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateWithGemini = async (prompt) => {
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
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleGeneratePRD = async () => {
    setIsGenerating(true);
    
    try {
      const parentContext = getParentContext();
      
      // Check if this is an enhancement from a specific feature
      const isFeatureEnhancement = parentContext.specificFeature && parentContext.specificFeature.title;
      const mainPRDTitle = parentContext.projectSummary ? 
        `PRD - ${parentContext.projectSummary.split(' ').slice(0, 3).join(' ')}` : 
        'Main PRD';
      
      const contextPrompt = `
Based on the following project context, generate a comprehensive Product Requirements Document (PRD) and related mindmap nodes:

${isFeatureEnhancement ? `**ENHANCEMENT NOTE:**
This PRD is an enhancement/sub-feature of the main project: "${mainPRDTitle}"
Specific Feature Being Enhanced: "${parentContext.specificFeature.title}"
Feature Description: "${parentContext.specificFeature.description}"

` : ''}
**Project Summary:**
${parentContext.projectSummary || 'No project summary available'}

**Technology Stack (Inherit and extend as needed):**
${parentContext.techStack.map(tech => `- ${tech.title}: ${tech.description}`).join('\n') || 'No tech stack defined'}

**Features:**
${parentContext.features.map(feature => `- ${feature.title}: ${feature.description}`).join('\n') || 'No features defined'}

**Additional Content:**
${parentContext.content.map(content => `${content.title}: ${content.content}`).join('\n') || 'No additional content'}

Generate the response in the following format:

=== MINDMAP_NODES ===
[
  {
    "id": "summary_node",
    "type": "summaryNode",
    "position": { "x": 100, "y": 100 },
    "data": {
      "title": "Project Summary",
      "content": "[Generated project summary]"
    }
  },
  {
    "id": "features_node",
    "type": "featureCard",
    "position": { "x": 400, "y": 100 },
    "data": {
      "title": "Core Features",
      "moduleType": "frontend",
      "features": [
        {
          "id": 1,
          "title": "[Feature Title]",
          "description": "[Feature Description]",
          "category": "core"
        }
      ]
    }
  },
  {
    "id": "tech_stack_node",
    "type": "techStackCard",
    "position": { "x": 700, "y": 100 },
    "data": {
      "title": "Technology Stack",
      "techItems": [
        {
          "id": 1,
          "title": "[Tech Title]",
          "description": "[Tech Description]",
          "category": "frontend"
        }
      ]
    }
  }
]

=== CONNECTIONS ===
[
  {
    "id": "e_content_summary",
    "source": "${id}",
    "target": "summary_node"
  },
  {
    "id": "e_summary_features",
    "source": "summary_node",
    "target": "features_node"
  },
  {
    "id": "e_features_tech",
    "source": "features_node",
    "target": "tech_stack_node"
  }
]

=== PRD ===
# Product Requirements Document${isFeatureEnhancement ? ` - ${parentContext.specificFeature.title} Enhancement` : ''}

${isFeatureEnhancement ? `## 🔗 Project Hierarchy
\`\`\`
${mainPRDTitle}
└── ${parentContext.specificFeature.title} Enhancement
    └── This PRD
\`\`\`

**Parent Project:** ${mainPRDTitle}
**Enhanced Feature:** ${parentContext.specificFeature.title}
**Enhancement Type:** Sub-feature/Module Enhancement

` : ''}## Executive Summary
[Comprehensive ${isFeatureEnhancement ? 'enhancement' : 'project'} overview, goals, and vision${isFeatureEnhancement ? ` building upon the ${parentContext.specificFeature.title} feature` : ''}]

## Product Overview
[Detailed ${isFeatureEnhancement ? 'enhancement' : 'product'} description and objectives]

## User Stories
[Key user stories and use cases${isFeatureEnhancement ? ` specific to this enhancement` : ''}]

## Functional Requirements
[Detailed functional requirements${isFeatureEnhancement ? ` for this enhancement` : ''}]

## Technical Requirements
### Technology Stack
${isFeatureEnhancement ? '[Inherit from parent project and specify any new technologies needed for this enhancement]' : '[Technical specifications and technology choices]'}

### Architecture & Integration
${isFeatureEnhancement ? '[How this enhancement integrates with the existing system architecture]' : '[System architecture and design patterns]'}

### Dependencies
${isFeatureEnhancement ? '[Dependencies on parent project components and any new dependencies]' : '[Technical dependencies and constraints]'}

## Success Metrics
[Key performance indicators and success criteria${isFeatureEnhancement ? ` for this enhancement` : ''}]

## Timeline and Milestones
[${isFeatureEnhancement ? 'Enhancement' : 'Project'} timeline and key milestones]

${isFeatureEnhancement ? `## Integration Notes
[Notes on how this enhancement integrates with the main project and affects existing functionality]

` : ''}Generate realistic and detailed content for each section based on the provided context${isFeatureEnhancement ? ' and ensure consistency with the parent project' : ''}.`;
      
      const response = await generateWithGemini(contextPrompt);
      
      // Parse the response
      const mindmapMatch = response.match(/=== MINDMAP_NODES ===\s*([\s\S]*?)\s*=== CONNECTIONS ===/i);
      const connectionsMatch = response.match(/=== CONNECTIONS ===\s*([\s\S]*?)\s*=== PRD ===/i);
      const prdMatch = response.match(/=== PRD ===\s*([\s\S]*?)$/i);
      
      if (prdMatch) {
        const prdContent = prdMatch[1].trim();
        setGeneratedPRD(prdContent);
        
        // Extract meaningful title from PRD content
        const extractTitleFromContent = (content) => {
          // Try to extract title from various patterns
          const titlePatterns = [
            /# Product Requirements Document[\s-]*(.+?)\n/i,
            /# PRD[\s-]*(.+?)\n/i,
            /# (.+?) PRD/i,
            /# (.+?)\n/i,
            /## Executive Summary[\s\S]*?(?:project|product|application|system)\s+(?:for\s+)?([^\n.]+)/i,
            /## Product Overview[\s\S]*?(?:project|product|application|system)\s+(?:for\s+)?([^\n.]+)/i
          ];
          
          for (const pattern of titlePatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
              let title = match[1].trim();
              // Clean up common suffixes and prefixes
              title = title.replace(/^(for|of|the)\s+/i, '');
              title = title.replace(/\s+(project|application|system|platform)$/i, '');
              // Limit length
              if (title.length > 50) {
                title = title.substring(0, 47) + '...';
              }
              return title;
            }
          }
          
          // Fallback: try to extract from project summary in context
          if (parentContext.projectSummary) {
            const summaryWords = parentContext.projectSummary.split(' ').slice(0, 4).join(' ');
            if (summaryWords.length > 5) {
              return summaryWords;
            }
          }
          
          return null;
        };
        
        // Create specific title for enhancement PRDs
        let prdTitle;
        const extractedTitle = extractTitleFromContent(prdContent);
        
        if (isFeatureEnhancement) {
          if (extractedTitle) {
            prdTitle = `${extractedTitle} - ${parentContext.specificFeature.title}`;
          } else {
            prdTitle = `${parentContext.specificFeature.title} Enhancement`;
          }
        } else {
          prdTitle = extractedTitle || `PRD - ${new Date().toLocaleDateString()}`;
        }
        
        // Save PRD to localStorage with enhancement metadata
        savePRD({
          title: prdTitle,
          content: prdContent,
          source: 'ContentNode',
          isEnhancement: isFeatureEnhancement,
          parentProject: isFeatureEnhancement ? mainPRDTitle : null,
          enhancedFeature: isFeatureEnhancement ? parentContext.specificFeature.title : null,
          enhancedFeatureId: isFeatureEnhancement ? parentContext.specificFeature.id : null
        });
      }
      
      // Generate and connect nodes if parsing successful
      if (mindmapMatch && connectionsMatch) {
        try {
          const nodesText = mindmapMatch[1].trim();
          const connectionsText = connectionsMatch[1].trim();
          
          const nodes = JSON.parse(nodesText);
          const connections = JSON.parse(connectionsText);
          
          // Add generated nodes to the canvas
          const currentNodes = reactFlowInstance.getNodes();
          const currentEdges = reactFlowInstance.getEdges();
          
          // Position nodes relative to this ContentNode with proper spacing
          const thisNode = currentNodes.find(node => node.id === id);
          const baseX = thisNode ? thisNode.position.x + 450 : 450;
          const baseY = thisNode ? thisNode.position.y : 100;
          
          // Define estimated node heights for different types
          const nodeHeights = {
            summaryNode: 180,
            featureCard: 300,
            techStackCard: 250,
            contentNode: 200
          };
          
          // Calculate positions with proper vertical spacing
          let currentY = baseY;
          const positionedNodes = nodes.map((node, index) => {
            const nodeHeight = nodeHeights[node.type] || 200;
            const spacing = 50; // Gap between nodes
            
            const position = {
              x: baseX + (index * 400), // Horizontal spacing
              y: currentY
            };
            
            // Update currentY for next node in the same column
            if (index > 0 && index % 2 === 0) {
              currentY = baseY; // Reset for new column
            } else if (index % 2 === 1) {
              currentY = baseY + nodeHeight + spacing; // Position below first node
            }
            
            return {
              ...node,
              position
            };
          });
          
          reactFlowInstance.setNodes([...currentNodes, ...positionedNodes]);
          reactFlowInstance.setEdges([...currentEdges, ...connections]);
          
        } catch (parseError) {
          console.error('Error parsing nodes/connections:', parseError);
        }
      }
      
    } catch (error) {
      console.error('Error generating PRD:', error);
      setGeneratedPRD('Error generating PRD: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setShowOptions(true);
    setSelectedContent(null);
  };

  const renderContent = () => {
    if (!selectedContent) return null;

    switch (selectedContent.id) {
      case 'text':
        return (
          <div className="content-area">
            <textarea 
              className="content-textarea"
              placeholder="Start typing your content..."
              rows={8}
            />
          </div>
        );
      case 'todo':
        return (
          <div className="content-area">
            <div className="todo-list">
              <div className="todo-item">
                <input type="checkbox" className="todo-checkbox" />
                <input type="text" className="todo-input" placeholder="Add a task..." />
              </div>
              <button className="add-todo-btn">+ Add Task</button>
            </div>
          </div>
        );
      case 'help':
        const parentContext = getParentContext();
        const parentTitle = parentContext.content.length > 0 
          ? parentContext.content[0].title 
          : parentContext.projectSummary 
            ? 'Project Summary'
            : parentContext.techStack.length > 0 
              ? 'Tech Stack'
              : parentContext.features.length > 0 
                ? `Features (${parentContext.features.length} items)`
                : 'Connected Node';
        
        const contextDescription = parentContext.content.length > 0
          ? parentContext.content[0].content
          : '';
        
        return (
          <div className="content-area">
            <div className="help-content">
              <h3>Need Help?</h3>
              <p>
                Connected to: <span className="parent-title-highlight">{parentTitle}</span>
                <RefreshIcon 
                  onClick={handleRefreshContext}
                  isRefreshing={isRefreshing}
                  size={16}
                  className="inline"
                />
              </p>
              {contextDescription && (
                <div className="context-preview">
                  <p><strong>Context:</strong> {contextDescription}</p>
                </div>
              )}
              <p>Ask a question or describe what you need assistance with:</p>
              <textarea 
                className="help-textarea"
                placeholder="Describe your question or issue..."
                rows={6}
              />
              <button className="help-submit-btn">Get Help</button>
            </div>
          </div>
        );
      case 'prd':
        return (
          <div className="content-area">
            <div className="prd-content">
              <h3>Generate PRD</h3>
              <div className="prd-form">
                <p className="context-info">Auto-generating PRD based on connected nodes...</p>
                <button 
                  className="prd-generate-btn"
                  onClick={handleGeneratePRD}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner"></span>
                      Generating...
                    </>
                  ) : (
                    '📋 Generate PRD'
                  )}
                </button>
              </div>
              {generatedPRD && (
                <div className="prd-result">
                  <div className="prd-result-header">
                    <h4>Generated PRD</h4>
                    <button 
                      className="export-prd-btn"
                      onClick={() => {
                        const blob = new Blob([generatedPRD], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'product-requirements-document.txt';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📥 Export
                    </button>
                  </div>
                  <div className="prd-result-content">
                    <pre>{generatedPRD}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getNodeClassName = () => {
    let className = 'content-node';
    if (selected) className += ' selected';
    if (selectedContent) {
      className += ` content-${selectedContent.id}`;
    }
    return className;
  };

  return (
    <div className={getNodeClassName()}>
      {/* Custom resize handle */}
      {selected && (
        <div
          className="resize-handle"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '10px',
            height: '10px',
            background: '#3b82f6',
            cursor: 'se-resize',
            borderRadius: '2px',
            zIndex: 1000
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
            
            const startX = e.clientX;
            const startY = e.clientY;
            const nodes = reactFlowInstance.getNodes();
            const currentNode = nodes.find(node => node.id === id);
            const startWidth = currentNode?.style?.width || 200;
            const startHeight = currentNode?.style?.height || 120;
            
            const handleMouseMove = (moveEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              const newWidth = Math.max(200, parseInt(startWidth) + deltaX);
              const newHeight = Math.max(120, parseInt(startHeight) + deltaY);
              
              // Update both style and measured properties during resize
              reactFlowInstance.setNodes((nodes) => 
                nodes.map(node => 
                  node.id === id ? {
                    ...node,
                    width: newWidth,
                    height: newHeight,
                    measured: {
                      width: newWidth,
                      height: newHeight,
                    },
                    style: {
                      ...node.style,
                      width: `${newWidth}px`,
                      height: `${newHeight}px`,
                    },
                  } : node
                )
              );
            };
            
            const handleMouseUp = () => {
                setIsResizing(false);
                
                // Get the current node dimensions after manual resizing
                const nodes = reactFlowInstance.getNodes();
                const currentNode = nodes.find(node => node.id === id);
                const currentWidth = parseInt(currentNode?.style?.width) || 200;
                const currentHeight = parseInt(currentNode?.style?.height) || 120;
                
                console.log('Keeping manual resize dimensions:', { width: currentWidth, height: currentHeight });
                
                // Update the node with the manually resized dimensions
                reactFlowInstance.setNodes((nodes) => 
                  nodes.map(node => {
                    if (node.id === id) {
                      return {
                        ...node,
                        width: currentWidth,
                        height: currentHeight,
                        measured: {
                          width: currentWidth,
                          height: currentHeight,
                        },
                        style: {
                          ...node.style,
                          width: `${currentWidth}px`,
                          height: `${currentHeight}px`,
                        },
                      };
                    }
                    return node;
                  })
                );
                
                // Force React Flow to recalculate with the new dimensions
                updateNodeInternals(id);
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
        style={{
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      

      
      {/* Content Area */}
      <div className="content-container">
        {selectedContent && (
          <div className="back-navigation">
            <button 
              className="back-btn" 
              onClick={handleBack}
            >
              ← Back to Options
            </button>
          </div>
        )}
        {showOptions ? (
          <div className="content-options">
            <div className="options-grid">
              {contentOptions.map((option) => (
                <button
                  key={option.id}
                  className="content-option"
                  onClick={() => handleOptionSelect(option)}
                  style={{ '--option-color': option.color }}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-title">{option.title}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="node-handle"
        style={{
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
    </div>
  );
};

export default ContentNode;