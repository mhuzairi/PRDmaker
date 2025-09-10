import React, { useState } from 'react';
import { enhancedPRDStorage } from '../utils/enhancedPRDStorage';
import { createRootPRD } from '../models/PRDHierarchyModel';
import './ProjectPlanner.css';

const ProjectPlanner = ({ onClose, onGenerateNodes, isVisible = true }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const GEMINI_API_KEY = 'AIzaSyBLzpNE6zpVIw7XRFuoZHkAT6_e_JftI78';

  const generateWithGemini = async (userPrompt) => {
    try {
      console.log('Starting Gemini API call via proxy...');
      const response = await fetch('http://localhost:3001/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: GEMINI_API_KEY,
          prompt: `Based on this project idea: "${userPrompt}"

Generate a comprehensive response with three sections. Follow the exact format below:

=== MINDMAP_NODES ===
[
  {
    "id": "project_summary",
    "type": "summaryNode",
    "position": {"x": 100, "y": 100},
    "data": {
      "title": "Project Summary",
      "content": "High-level project overview"
    }
  },
  {
    "id": "tech_stack",
    "type": "techStackCard",
    "position": {"x": 500, "y": 100},
    "data": {
      "title": "Technology Stack",
      "content": "Technical architecture and tools"
    }
  },
  {
    "id": "frontend_features",
    "type": "featureCard",
    "position": {"x": 200, "y": 300},
    "data": {
      "title": "Frontend Features",
      "moduleType": "frontend",
      "features": [
        {
          "id": "frontend-ui-components-001",
          "title": "User Interface Components",
          "description": "Responsive UI components and design system implementation",
          "category": "ui"
        },
        {
          "id": "frontend-state-mgmt-002",
          "title": "State Management",
          "description": "Application state handling and data flow patterns",
          "category": "state"
        },
        {
          "id": "frontend-api-integration-003",
          "title": "API Integration",
          "description": "Frontend API calls and data fetching strategies",
          "category": "integration"
        }
      ]
    }
  },
  {
    "id": "backend_features",
    "type": "featureCard",
    "position": {"x": 600, "y": 300},
    "data": {
      "title": "Backend Features",
      "moduleType": "backend",
      "features": [
        {
          "id": "backend-api-dev-001",
          "title": "API Development",
          "description": "RESTful API endpoints with proper authentication",
          "category": "api"
        },
        {
          "id": "backend-database-002",
          "title": "Database Design",
          "description": "Database schema and data modeling",
          "category": "database"
        },
        {
          "id": "backend-security-003",
          "title": "Security Implementation",
          "description": "Authentication, authorization, and data protection",
          "category": "security"
        }
      ]
    }
  },
  {
    "id": "mobile_features",
    "type": "featureCard",
    "position": {"x": 1000, "y": 300},
    "data": {
      "title": "Mobile Features",
      "moduleType": "mobile",
      "features": [
        {
          "id": "mobile-cross-platform-001",
          "title": "Cross-Platform Development",
          "description": "Mobile app development for iOS and Android",
          "category": "platform"
        },
        {
          "id": "mobile-native-integration-002",
          "title": "Native Device Integration",
          "description": "Camera, GPS, notifications, and device features",
          "category": "native"
        },
        {
          "id": "mobile-offline-functionality-003",
          "title": "Offline Functionality",
          "description": "Local storage and offline-first architecture",
          "category": "performance"
        }
      ]
    }
  },
  {
    "id": "devops_features",
    "type": "featureCard",
    "position": {"x": 400, "y": 500},
    "data": {
      "title": "DevOps Features",
      "moduleType": "devops",
      "features": [
        {
          "id": "devops-cicd-pipeline-001",
          "title": "CI/CD Pipeline",
          "description": "Automated build, test, and deployment workflows",
          "category": "automation"
        },
        {
          "id": "devops-infrastructure-code-002",
          "title": "Infrastructure as Code",
          "description": "Automated infrastructure provisioning and management",
          "category": "infrastructure"
        },
        {
          "id": "devops-monitoring-alerting-003",
          "title": "Monitoring & Alerting",
          "description": "System monitoring, logging, and incident response",
          "category": "monitoring"
        }
      ]
    }
  },
  {
    "id": "ai_features",
    "type": "featureCard",
    "position": {"x": 800, "y": 500},
    "data": {
      "title": "AI/ML Features",
      "moduleType": "ai",
      "features": [
        {
          "id": "ai-ml-models-001",
          "title": "Machine Learning Models",
          "description": "AI model development and training pipelines",
          "category": "ml"
        },
        {
          "id": "ai-data-processing-002",
          "title": "Data Processing",
          "description": "Data preprocessing and feature engineering",
          "category": "data"
        },
        {
          "id": "ai-model-deployment-003",
          "title": "Model Deployment",
          "description": "AI model serving and inference optimization",
          "category": "deployment"
        }
      ]
    }
  }
]

=== CONNECTIONS ===
[
  {
    "id": "e_summary_tech",
    "source": "project_summary",
    "target": "tech_stack"
  },
  {
    "id": "e_tech_frontend",
    "source": "tech_stack",
    "target": "frontend_features"
  },
  {
    "id": "e_tech_backend",
    "source": "tech_stack",
    "target": "backend_features"
  },
  {
    "id": "e_tech_mobile",
    "source": "tech_stack",
    "target": "mobile_features"
  },
  {
    "id": "e_backend_devops",
    "source": "backend_features",
    "target": "devops_features"
  },
  {
    "id": "e_backend_ai",
    "source": "backend_features",
    "target": "ai_features"
  }
]

=== PRD ===
# Product Requirements Document

## Project Summary
[Comprehensive project overview, goals, and vision]

## Technology Stack
### Frontend Technologies
[Frontend frameworks, libraries, and tools]

### Backend Technologies
[Backend frameworks, databases, and infrastructure]

### Mobile Technologies
[Mobile development frameworks and native integrations]

### DevOps & Infrastructure
[Deployment, monitoring, and infrastructure tools]

### AI/ML Technologies
[Machine learning frameworks and data processing tools]

## Frontend Features
### User Interface Components
[Responsive UI components and design system implementation]

### State Management
[Application state handling and data flow patterns]

### API Integration
[Frontend data fetching and API communication strategies]

## Backend Features
### API Development
[RESTful API design and implementation]

### Database Design
[Data modeling and database architecture]

### Security Implementation
[Authentication, authorization, and data protection]

## Mobile Features
### Cross-Platform Development
[Mobile app development approach and frameworks]

### Native Device Integration
[Device feature integration and native capabilities]

### Offline Functionality
[Local storage and offline-first architecture]

## DevOps Features
### CI/CD Pipeline
[Automated build, test, and deployment processes]

### Infrastructure as Code
[Infrastructure automation and provisioning]

### Monitoring & Alerting
[System monitoring and incident response]

## AI/ML Features
### Machine Learning Models
[AI model development and training]

### Natural Language Processing
[Text analysis and conversational AI]

### Data Pipeline
[Data processing and feature engineering]

## Implementation Phases
[Development timeline and milestone breakdown]

## Success Metrics
[Key performance indicators and success criteria]

IMPORTANT: 
- Generate module-specific featureCard nodes with detailed features arrays
- Each featureCard must include moduleType and features array with id, title, description, and category
- Use appropriate categories: ui, state, integration, api, database, security, platform, native, performance, automation, infrastructure, monitoring, ml, nlp, data
- Ensure valid JSON format with proper quotes and commas
- Follow the exact section format with === markers
- Create connections that flow logically from tech stack to different modules`
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a project description.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generateWithGemini(prompt);
      
      // Parse the response
      console.log('Raw API response:', response);
      
      const mindmapMatch = response.match(/=== MINDMAP_NODES ===\s*([\s\S]*?)\s*=== CONNECTIONS ===/i);
      const connectionsMatch = response.match(/=== CONNECTIONS ===\s*([\s\S]*?)\s*=== PRD ===/i);
      const prdMatch = response.match(/=== PRD ===\s*([\s\S]*?)$/i);

      console.log('Mindmap match:', mindmapMatch);
      console.log('Connections match:', connectionsMatch);
      console.log('PRD match:', prdMatch);

      if (mindmapMatch && connectionsMatch) {
        try {
          const nodesText = mindmapMatch[1].trim();
          const connectionsText = connectionsMatch[1].trim();
          
          console.log('Nodes text:', nodesText);
          console.log('Connections text:', connectionsText);
          
          const nodes = JSON.parse(nodesText);
          const connections = JSON.parse(connectionsText);
          
          console.log('Parsed nodes:', nodes);
          console.log('Parsed connections:', connections);
          
          // Generate nodes on canvas
          onGenerateNodes(nodes, connections);
          
          // Auto-minimize after successful generation
          setTimeout(() => {
            setIsMinimized(true);
          }, 1000);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          console.error('Nodes text that failed to parse:', mindmapMatch[1]);
          console.error('Connections text that failed to parse:', connectionsMatch[1]);
          alert('Error parsing generated content. Please try again.');
        }
      } else {
        console.error('Could not find required sections in response');
        alert('Response format is incorrect. Please try again.');
      }

      if (prdMatch) {
        const prdContent = prdMatch[1].trim();
        setGeneratedPRD(prdContent);
        
        // Extract project title from prompt or PRD content
        const projectTitle = prompt.split(' ').slice(0, 4).join(' ') || 'New Project';
        const prdTitle = `${projectTitle} - Main PRD`;
        
        // Create root PRD using enhanced storage system
        const rootPRD = createRootPRD(
          prdTitle,
          prdContent,
          'ProjectPlanner',
          prompt // Store original project description
        );
        
        // Save the root PRD
        enhancedPRDStorage.savePRD(rootPRD);
        
        console.log('Created root PRD:', rootPRD);
        
        // Create a visual PRD node on the canvas if no mindmap nodes were generated
        if (!mindmapMatch || !connectionsMatch) {
          const prdNode = {
            id: `prd_${Date.now()}`,
            type: 'summaryNode',
            position: { x: 300, y: 200 },
            data: {
              title: prdTitle,
              content: prdContent.substring(0, 200) + (prdContent.length > 200 ? '...' : ''),
              fullContent: prdContent,
              isPRD: true
            }
          };
          
          // Generate the PRD node on canvas
          onGenerateNodes([prdNode], []);
          
          // Auto-minimize after successful generation
          setTimeout(() => {
            setIsMinimized(true);
          }, 1000);
        }
      } else {
        console.error('Could not find PRD section in response');
      }

    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error generating content. Please check your internet connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPRD = () => {
    if (!generatedPRD) return;
    
    const blob = new Blob([generatedPRD], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-requirements-document.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Minimized Toggle Button */}
      {isMinimized && (
        <div className="planner-toggle-minimized" onClick={() => setIsMinimized(false)}>
          <span className="toggle-icon">🚀</span>
          <span className="toggle-text">Project Planner</span>
        </div>
      )}
      
      {/* Main Panel */}
      <div className={`project-planner-panel ${isVisible ? 'visible' : ''} ${isMinimized ? 'minimized' : ''}`}>
        <div className="project-planner-node">
          {/* Node Header */}
          <div className="node-header">
            <div className="window-controls">
              <div className="control-button close" onClick={onClose}></div>
              <div className="control-button minimize" onClick={() => setIsMinimized(true)}></div>
              <div className="control-button maximize"></div>
            </div>
            <div className="window-title">
              <span>🚀 AI Project Planner</span>
            </div>
            <div className="header-actions">
              <button className="header-btn" onClick={onClose} title="Close">
                ×
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="planner-content">
            <div className="planner-description">
              <p>Describe your web project idea and get an auto-generated mindmap and PRD</p>
            </div>

            <div className="prompt-section">
              <label htmlFor="project-prompt">Project Description</label>
              <textarea
                id="project-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your web project idea in detail. For example: 'I want to build an e-commerce platform for handmade crafts with user authentication, product catalog, shopping cart, payment integration, and seller dashboard...'"
                rows={6}
                disabled={isGenerating}
              />
              
              <button 
                className="generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    ✨ Generate Project Plan
                  </>
                )}
              </button>
            </div>

            {generatedPRD && (
              <div className="prd-section">
                <div className="prd-header">
                  <h3>📋 Generated PRD</h3>
                  <button className="export-btn" onClick={exportPRD}>
                    📥 Export PRD
                  </button>
                </div>
                <div className="prd-content">
                  <pre>{generatedPRD}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectPlanner;