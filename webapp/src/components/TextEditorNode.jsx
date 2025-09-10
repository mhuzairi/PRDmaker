import React, { useState, useRef } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import './TextEditorNode.css';

const TextEditorNode = ({ data, selected, id }) => {
  const [content, setContent] = useState(data.content || '');
  const [title, setTitle] = useState(data.title || 'Customer Intelligence Hub text Detail');
  const textareaRef = useRef(null);
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

  const formatText = (command, value = null) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = content;

    switch (command) {
      case 'bold':
        if (selectedText) {
          newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        }
        break;
      case 'code':
        if (selectedText) {
          newText = content.substring(0, start) + `\`${selectedText}\`` + content.substring(end);
        }
        break;
      case 'heading':
        const lines = content.split('\n');
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const lineIndex = content.substring(0, start).split('\n').length - 1;
        lines[lineIndex] = '# ' + lines[lineIndex].replace(/^#+\s*/, '');
        newText = lines.join('\n');
        break;
      case 'list':
        const listLines = content.split('\n');
        const listLineStart = content.lastIndexOf('\n', start - 1) + 1;
        const listLineIndex = content.substring(0, start).split('\n').length - 1;
        listLines[listLineIndex] = '• ' + listLines[listLineIndex].replace(/^[•\-\*]\s*/, '');
        newText = listLines.join('\n');
        break;
      case 'link':
        if (selectedText) {
          newText = content.substring(0, start) + `[${selectedText}](url)` + content.substring(end);
        }
        break;
      default:
        break;
    }

    setContent(newText);
    updateNodeData(title, newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = command === 'bold' ? start + 2 : 
                          command === 'italic' ? start + 1 :
                          command === 'code' ? start + 1 :
                          start;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateNodeData(title, newContent);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNodeData(newTitle, content);
  };

  return (
    <div className={`text-editor-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={500}
        minHeight={350}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="node-handle" 
        style={{
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      <div className="node-header">
        <div className="window-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="window-title">
          <input 
            type="text" 
            value={title} 
            onChange={handleTitleChange}
            className="title-input"
          />
        </div>
        <div className="header-actions">
          <button className="header-btn minimize-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>
          <button className="header-btn delete-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="editor-toolbar">
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('italic')}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('code')}
          title="Code"
        >
          <span className="code-icon">&lt;/&gt;</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('heading')}
          title="Heading"
        >
          <strong>H₁</strong>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('list')}
          title="List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => formatText('link')}
          title="Link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
      </div>

      <div className="editor-content">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Add details here..."
          className="editor-textarea"
        />
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="node-handle" 
        style={{
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
};

export default TextEditorNode;