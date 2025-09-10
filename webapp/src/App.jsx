import React, { useState, useCallback, useEffect } from 'react'
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import FloatingToolbar from './components/FloatingToolbar'
import ChatWindow from './components/ChatWindow'
import ChatNode from './components/ChatNode'
import TextEditorNode from './components/TextEditorNode'
import CardNode from './components/CardNode'
import ContentNode from './components/ContentNode'
import FeatureCard from './components/FeatureCard'
import TechStackCard from './components/TechStackCard'
import SummaryNode from './components/SummaryNode'
import ContextMenu from './components/ContextMenu'
import ProjectPlanner from './components/ProjectPlanner'
import HelpModal from './components/HelpModal'
import PRDDownloadModal from './components/PRDDownloadModal'
import NotificationSystem from './components/NotificationSystem'
import { HotkeyProvider, useHotkeys } from './contexts/HotkeyContext'
import './App.css'

const nodeTypes = {
  chatNode: ChatNode,
  textEditorNode: TextEditorNode,
  cardNode: CardNode,
  contentNode: ContentNode,
  featureCard: FeatureCard,
  techStackCard: TechStackCard,
  summaryNode: SummaryNode,
};

const initialNodes = []

const initialEdges = []

function AppContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [isInteractive, setIsInteractive] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [showProjectPlanner, setShowProjectPlanner] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 200, y: 200 })
  

  const { registerAction, unregisterAction } = useHotkeys()

  const onConnect = useCallback(
    (params) => {
      console.log('onConnect called with params:', params);
      
      // Validate handle types before creating edge
      if (params.sourceHandle && params.sourceHandle.includes('-target')) {
        console.error('ERROR: Trying to use target handle as source:', params.sourceHandle);
        console.error('Full params:', params);
        alert(`Connection Error: Cannot use target handle "${params.sourceHandle}" as source. Please try connecting from a source handle (right side of nodes).`);
        return; // Prevent creating invalid edge
      }
      
      if (params.targetHandle && params.targetHandle.includes('-source')) {
        console.error('ERROR: Trying to use source handle as target:', params.targetHandle);
        console.error('Full params:', params);
        alert(`Connection Error: Cannot use source handle "${params.targetHandle}" as target. Please try connecting to a target handle (left side of nodes).`);
        return; // Prevent creating invalid edge
      }
      
      console.log('Creating valid edge with params:', params);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  )

  const handleContextMenu = useCallback((event) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY
    })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleToggleToolbar = useCallback(() => {
    setToolbarVisible(prev => !prev)
  }, [])

  const findNonOverlappingPosition = useCallback((targetPosition, nodeWidth = 400, nodeHeight = 200) => {
    const padding = 20;
    const searchRadius = 50;
    const maxAttempts = 20;
    
    // Check if a position overlaps with existing nodes
    const isOverlapping = (pos) => {
      return nodes.some(node => {
        const nodePos = node.position;
        // Get node dimensions based on type
        const nodeDimensions = {
          chatNode: { width: 400, height: 200 },
          textEditorNode: { width: 500, height: 350 },
          cardNode: { width: 500, height: 400 },
          contentNode: { width: 350, height: 300 },
          featureCard: { width: 600, height: 500 },
          techStackCard: { width: 600, height: 500 },
          summaryNode: { width: 400, height: 400 }
        };
        const existingNodeDim = nodeDimensions[node.type] || { width: 400, height: 300 };
        
        return (
          pos.x < nodePos.x + existingNodeDim.width + padding &&
          pos.x + nodeWidth + padding > nodePos.x &&
          pos.y < nodePos.y + existingNodeDim.height + padding &&
          pos.y + nodeHeight + padding > nodePos.y
        );
      });
    };
    
    // Try the original position first
    if (!isOverlapping(targetPosition)) {
      return targetPosition;
    }
    
    // Search in expanding circles around the target position
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const radius = searchRadius * attempt;
      const angleStep = Math.PI / 4; // 8 directions
      
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const testPos = {
          x: targetPosition.x + Math.cos(angle) * radius,
          y: targetPosition.y + Math.sin(angle) * radius
        };
        
        if (!isOverlapping(testPos)) {
          return testPos;
        }
      }
    }
    
    // Fallback: place it far to the right
    return {
      x: targetPosition.x + 500,
      y: targetPosition.y
    };
  }, [nodes]);

  const handleAddNode = useCallback((nodeType, position) => {
    let finalPosition;
    
    if (position) {
      // Position provided (from context menu) - convert to flow coordinates
      const flowPosition = reactFlowInstance 
        ? reactFlowInstance.screenToFlowPosition(position)
        : position;
      
      // Get node dimensions for proper centering
      const nodeDimensions = {
        chatNode: { width: 400, height: 200 },
        textEditorNode: { width: 500, height: 350 },
        cardNode: { width: 500, height: 400 },
        contentNode: { width: 350, height: 300 },
        featureCard: { width: 600, height: 500 },
        techStackCard: { width: 600, height: 500 },
        summaryNode: { width: 400, height: 400 }
      };
      
      const nodeDim = nodeDimensions[nodeType] || { width: 400, height: 200 };
      
      const centeredPosition = {
        x: flowPosition.x - nodeDim.width / 2,
        y: flowPosition.y - nodeDim.height / 2,
      };
      
      // Find non-overlapping position
      finalPosition = findNonOverlappingPosition(centeredPosition, nodeDim.width, nodeDim.height);
    } else {
      // No position provided (from toolbar) - use mouse position
      const flowPosition = reactFlowInstance 
        ? reactFlowInstance.screenToFlowPosition(mousePosition)
        : { x: mousePosition.x, y: mousePosition.y };
      
      const centeredPosition = {
        x: flowPosition.x - 200, // Default to chatNode dimensions
        y: flowPosition.y - 100,
      };
      
      finalPosition = findNonOverlappingPosition(centeredPosition);
    }
    
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: finalPosition,
      data: { label: `New ${nodeType}` }
    }
    setNodes(nds => [...nds, newNode])
  }, [setNodes, reactFlowInstance, mousePosition, findNonOverlappingPosition])

  const handleOpenProjectPlanner = () => {
    setShowProjectPlanner(true);
  };

  const handleCloseProjectPlanner = () => {
    setShowProjectPlanner(false);
  };

  const handleGenerateNodes = useCallback((generatedNodes, generatedEdges) => {
    // Add generated nodes to the canvas
    setNodes(nds => [...nds, ...generatedNodes]);
    
    // Add generated edges to the canvas
    if (generatedEdges && generatedEdges.length > 0) {
      setEdges(eds => [...eds, ...generatedEdges]);
    }
    
    // Keep the project planner open but it will auto-minimize after generation
    // The ProjectPlanner component will handle its own minimize state
  }, [setNodes, setEdges]);

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      console.log('onConnectEnd called:', {
        isValid: connectionState.isValid,
        fromNode: connectionState.fromNode?.id,
        fromHandle: connectionState.fromHandle?.id,
        toNode: connectionState.toNode?.id,
        toHandle: connectionState.toHandle?.id
      });
      
      // If connection was dropped on empty space (no target node)
      if (!connectionState.isValid && reactFlowInstance) {
        const { clientX, clientY } = event
        const position = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY })
        
        // Create a new ContentNode at the drop position
        const newNode = {
          id: `content_${Date.now()}`,
          type: 'contentNode',
          position: {
            x: position.x - 100, // Offset to center the node
            y: position.y - 60
          },
          data: { 
            title: 'Content Creator'
          },
        }
        
        setNodes((nds) => nds.concat(newNode))
        
        // Create the connection to the new node
        if (connectionState.fromNode) {
          const sourceHandle = connectionState.fromHandle?.id || null;
          
          // Validate handle type before creating edge
          if (sourceHandle && sourceHandle.includes('-target')) {
            console.error('ERROR in onConnectEnd: Trying to use target handle as source:', sourceHandle);
            console.error('Connection state:', connectionState);
            return; // Prevent creating invalid edge
          }
          
          const newEdge = {
            id: `e${connectionState.fromNode.id}-${newNode.id}`,
            source: connectionState.fromNode.id,
            target: newNode.id,
            sourceHandle: sourceHandle,
          }
          console.log('Creating edge:', newEdge);
          setEdges((eds) => eds.concat(newEdge))
        }
      }
    },
    [reactFlowInstance, setNodes, setEdges]
  )

  const onAddNode = useCallback(() => {
    // Call handleAddNode without position to use mouse tracking
    handleAddNode('chatNode');
  }, [handleAddNode])

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected))
    setEdges((eds) => eds.filter((edge) => !edge.selected))
  }, [setNodes, setEdges])

  const onDeleteAll = useCallback(() => {
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  const onZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn()
    }
  }, [reactFlowInstance])

  const onZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut()
    }
  }, [reactFlowInstance])

  const onFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView()
    }
  }, [reactFlowInstance])

  const onAutoLayout = useCallback(() => {
    // Node dimension mapping based on actual CSS dimensions
    const nodeDimensions = {
      chatNode: { width: 400, height: 200 },
      textEditorNode: { width: 500, height: 350 },
      cardNode: { width: 500, height: 400 },
      contentNode: { width: 350, height: 300 },
      featureCard: { width: 600, height: 500 },
      techStackCard: { width: 600, height: 500 },
      summaryNode: { width: 400, height: 400 }
    };
    
    // Calculate dynamic columns based on number of nodes
    const nodeCount = nodes.length;
    let maxColumns;
    if (nodeCount <= 4) {
      maxColumns = 2;
    } else if (nodeCount <= 9) {
      maxColumns = 3;
    } else if (nodeCount <= 16) {
      maxColumns = 4;
    } else {
      maxColumns = 5;
    }
    
    const horizontalPadding = 100;
    const verticalPadding = 80;
    const startX = 50;
    const startY = 50;
    
    // Calculate row heights based on tallest node in each row
    const rowHeights = [];
    for (let row = 0; row < Math.ceil(nodeCount / maxColumns); row++) {
      let maxHeightInRow = 0;
      for (let col = 0; col < maxColumns; col++) {
        const nodeIndex = row * maxColumns + col;
        if (nodeIndex < nodeCount) {
          const node = nodes[nodeIndex];
          const dimensions = nodeDimensions[node.type] || { width: 400, height: 300 };
          maxHeightInRow = Math.max(maxHeightInRow, dimensions.height);
        }
      }
      rowHeights[row] = maxHeightInRow;
    }
    
    setNodes((nds) => 
      nds.map((node, index) => {
        const row = Math.floor(index / maxColumns);
        const col = index % maxColumns;
        const dimensions = nodeDimensions[node.type] || { width: 400, height: 300 };
        
        // Calculate Y position based on cumulative row heights
        let yPosition = startY;
        for (let i = 0; i < row; i++) {
          yPosition += rowHeights[i] + verticalPadding;
        }
        
        return {
          ...node,
          position: {
            x: startX + col * (Math.max(...Object.values(nodeDimensions).map(d => d.width)) + horizontalPadding),
            y: yPosition
          }
        };
      })
    );
    
    // Fit view after layout
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.1 });
      }
    }, 100);
  }, [nodes, setNodes, reactFlowInstance])

  // Track mouse position for adding nodes at cursor
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Update interactive button class based on lock state
  useEffect(() => {
    const interactiveButton = document.querySelector('.react-flow__controls-interactive')
    if (interactiveButton) {
      if (isInteractive) {
        interactiveButton.classList.remove('locked')
      } else {
        interactiveButton.classList.add('locked')
      }
    }
  }, [isInteractive])

  // Register hotkey actions
  useEffect(() => {
    registerAction('Delete Selected', onDeleteSelected)
    registerAction('showHelp', () => setShowHelpModal(true))

    return () => {
      unregisterAction('Delete Selected')
      unregisterAction('showHelp')
    }
  }, [registerAction, unregisterAction, onDeleteSelected])

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Block Delete key unless used with Ctrl/Cmd (let hotkey system handle Ctrl+Delete)
      if (event.key === 'Delete' && !(event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }

    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.context-menu')) {
        setContextMenu(null)
      }
    }

    // Add event listener with capture to intercept Delete key early
    document.addEventListener('keydown', handleKeyPress, true)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyPress, true)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Fit view on load
  useEffect(() => {
    if (reactFlowInstance) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.1 })
      }, 100)
    }
  }, [reactFlowInstance])

  // Handle node resize events
  const onNodeResize = useCallback((event, node) => {
    // Update the node's style with new dimensions
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? {
              ...n,
              style: {
                ...n.style,
                width: node.style?.width || n.style?.width,
                height: node.style?.height || n.style?.height,
              },
            }
          : n
      )
    );
  }, [setNodes]);

  return (
    <div className="app">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isInteractive ? onNodesChange : () => {}}
        onEdgesChange={isInteractive ? onEdgesChange : () => {}}
        onConnect={isInteractive ? onConnect : () => {}}
        onConnectEnd={isInteractive ? onConnectEnd : () => {}}
        onNodesDelete={() => {}} // Explicitly prevent any delete operations
        onPaneContextMenu={handleContextMenu}
        onPaneClick={handleCloseContextMenu}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        nodesDraggable={isInteractive}
        nodesConnectable={isInteractive}
        elementsSelectable={isInteractive}
        connectionMode="loose"
        connectOnClick={false}
        minZoom={0.001}
        deleteKeyCode={[]}
        fitView
      >
        <Background />
        <Controls 
          onInteractiveChange={() => setIsInteractive(!isInteractive)}
          isInteractive={isInteractive}
        />
        <MiniMap pannable onDoubleClick={onFitView} />
      </ReactFlow>
      
      {toolbarVisible && (
        <FloatingToolbar
          onAddNode={onAddNode}
          onDeleteSelected={onDeleteSelected}
          onDeleteAll={onDeleteAll}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitView={onFitView}
          onToggleChat={() => setShowChat(!showChat)}
          onAutoLayout={onAutoLayout}
          onHelp={() => setShowHelpModal(true)}
          onDownload={() => setShowDownloadModal(true)}
        />
      )}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onToggleToolbar={handleToggleToolbar}
          onAddNode={handleAddNode}
          onOpenProjectPlanner={handleOpenProjectPlanner}
        />
      )}
      
      {showChat && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.1)',
          padding: '20px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <ChatWindow />
          <button 
            onClick={() => setShowChat(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <ProjectPlanner 
        isVisible={showProjectPlanner}
        onClose={handleCloseProjectPlanner}
        onGenerateNodes={handleGenerateNodes}
      />
      
      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}
      
      <PRDDownloadModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
      
      <NotificationSystem 
        onOpenPRDModal={() => setShowDownloadModal(true)}
      />
    </div>
  )
}

function App() {
  return (
    <HotkeyProvider>
      <AppContent />
    </HotkeyProvider>
  )
}

export default App