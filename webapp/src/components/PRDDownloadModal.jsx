import React, { useState, useEffect } from 'react';
import { prdStorage, getPendingUpdates, applyPendingUpdate, removePendingUpdate } from '../utils/prdStorage';
import { enhancedPRDStorage } from '../utils/enhancedPRDStorage';
import PRDViewer from './PRDViewer';
import UpdatePromptModal from './UpdatePromptModal';
import PRDTreeView from './PRDTreeView';
import CreateVersionModal from './CreateVersionModal';
import CreateSubPRDModal from './CreateSubPRDModal';
import { PRDType } from '../models/PRDHierarchyModel';
import './PRDDownloadModal.css';

const PRDDownloadModal = ({ isOpen, onClose }) => {
  const [prds, setPrds] = useState([]);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPRDs, setSelectedPRDs] = useState(new Set());
  const [viewingPRD, setViewingPRD] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [showCreateSubPRD, setShowCreateSubPRD] = useState(null);
  const [showCreateVersion, setShowCreateVersion] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPRDs();
    }
  }, [isOpen]);

  const loadPRDs = () => {
    setLoading(true);
    try {
      // Try to load from enhanced storage first, fallback to legacy
      let allPRDs = [];
      let hierarchyData = [];
      
      console.log('🔍 Loading PRDs - checking storage...');
      
      try {
        allPRDs = enhancedPRDStorage.getAllPRDs();
        hierarchyData = enhancedPRDStorage.getPRDHierarchy();
        console.log('✅ Enhanced storage loaded:', allPRDs.length, 'PRDs');
      } catch (enhancedError) {
        console.log('⚠️ Enhanced storage not available, using legacy storage');
        allPRDs = prdStorage.getAllPRDs();
        console.log('📦 Legacy storage loaded:', allPRDs.length, 'PRDs');
        console.log('📋 Raw PRD data:', allPRDs);
        // Convert legacy PRDs to hierarchy format
        hierarchyData = allPRDs.map(prd => ({
          ...prd,
          type: prd.type || PRDType.ROOT,
          children: [],
          versions: [],
          totalDescendants: 0
        }));
      }
      
      const pendingUpdatesData = getPendingUpdates();
      setPendingUpdates(pendingUpdatesData);
      
      // Mark PRDs that have pending updates
      const prdsWithUpdates = allPRDs.map(prd => {
        const hasPendingUpdate = pendingUpdatesData.some(update => update.existingPRDId === prd.id);
        return {
          ...prd,
          hasPendingUpdate
        };
      });
      
      setPrds(prdsWithUpdates);
      setHierarchyData(hierarchyData);
    } catch (error) {
      console.error('Error loading PRDs:', error);
      setPrds([]);
      setHierarchyData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (prd) => {
    prdStorage.downloadPRD(prd);
  };

  const handleDownloadSelected = () => {
    selectedPRDs.forEach(prdId => {
      const prd = prds.find(p => p.id === prdId);
      if (prd) {
        prdStorage.downloadPRD(prd);
      }
    });
    setSelectedPRDs(new Set());
  };

  const handleSelectPRD = (prdId) => {
    const newSelected = new Set(selectedPRDs);
    if (newSelected.has(prdId)) {
      newSelected.delete(prdId);
    } else {
      newSelected.add(prdId);
    }
    setSelectedPRDs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPRDs.size === prds.length) {
      setSelectedPRDs(new Set());
    } else {
      setSelectedPRDs(new Set(prds.map(prd => prd.id)));
    }
  };

  const handleDeletePRD = (prdId) => {
    if (window.confirm('Are you sure you want to delete this PRD?')) {
      prdStorage.deletePRD(prdId);
      loadPRDs();
      setSelectedPRDs(prev => {
        const newSet = new Set(prev);
        newSet.delete(prdId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
    return Math.round(bytes / (1024 * 1024)) + 'MB';
  };

  const handlePRDDoubleClick = (prd) => {
    setViewingPRD(prd);
  };

  const handleVersionCreated = (newVersion) => {
    loadPRDs(); // Refresh the list
    setViewingPRD(null);
  };

  const handleCloseViewer = () => {
    setViewingPRD(null);
  };

  const handleShowUpdatePrompt = (prd) => {
    const pendingUpdate = pendingUpdates.find(update => update.existingPRDId === prd.id);
    if (pendingUpdate) {
      setShowUpdatePrompt({ prd, pendingUpdate });
    }
  };

  const handleApplyUpdate = async (changes = '') => {
    if (!showUpdatePrompt) return;
    
    try {
      const newVersion = applyPendingUpdate(showUpdatePrompt.pendingUpdate, changes);
      if (newVersion) {
        loadPRDs(); // Refresh the list
        setShowUpdatePrompt(null);
      }
    } catch (error) {
      console.error('Error applying update:', error);
    }
  };

  const handleDismissUpdate = () => {
    if (!showUpdatePrompt) return;
    
    try {
      removePendingUpdate(showUpdatePrompt.pendingUpdate.existingPRDId);
      loadPRDs(); // Refresh the list
      setShowUpdatePrompt(null);
    } catch (error) {
      console.error('Error dismissing update:', error);
    }
  };

  // New handlers for hierarchical features
  const handlePRDSelect = (prd) => {
    setViewingPRD(prd);
  };

  const handleCreateVersion = (basePRD) => {
    setShowCreateVersion(basePRD);
  };

  const handleCreateSubPRD = (parentPRD) => {
    setShowCreateSubPRD(parentPRD);
  };

  const handleConfirmCreateVersion = (newContent, changeDescription) => {
    if (!showCreateVersion) return;
    
    try {
      const newVersion = enhancedPRDStorage.createNewVersion(
        showCreateVersion, 
        newContent, 
        changeDescription
      );
      if (newVersion) {
        loadPRDs();
        setShowCreateVersion(null);
        setViewingPRD(newVersion);
      }
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const handleConfirmCreateSubPRD = (selectedFeatures, subTitle) => {
    if (!showCreateSubPRD) return;
    
    try {
      const subPRD = enhancedPRDStorage.createSubPRD(
        showCreateSubPRD,
        selectedFeatures,
        subTitle
      );
      if (subPRD) {
        loadPRDs();
        setShowCreateSubPRD(null);
        setViewingPRD(subPRD);
      }
    } catch (error) {
      console.error('Error creating sub-PRD:', error);
    }
  };

  // Helper function to extract content preview
  const getContentPreview = (content) => {
    // Always return a preview for any non-empty content
    if (!content) {
      return '';
    }
    
    // Convert to string if not already
    const contentStr = String(content).trim();
    if (!contentStr) {
      return '';
    }
    
    // Try to extract executive summary or product overview
    const summaryMatch = contentStr.match(/## Executive Summary[\s\S]*?\n([^#]+)/i) ||
                        contentStr.match(/## Product Overview[\s\S]*?\n([^#]+)/i) ||
                        contentStr.match(/## Overview[\s\S]*?\n([^#]+)/i);
    
    if (summaryMatch && summaryMatch[1]) {
      let preview = summaryMatch[1].trim();
      // Remove markdown formatting
      preview = preview.replace(/\*\*([^*]+)\*\*/g, '$1');
      preview = preview.replace(/\*([^*]+)\*/g, '$1');
      preview = preview.replace(/`([^`]+)`/g, '$1');
      // Limit length
      if (preview.length > 120) {
        preview = preview.substring(0, 117) + '...';
      }
      return preview;
    }
    
    // Fallback 1: get first meaningful paragraph (very relaxed criteria)
    const meaningfulLines = contentStr.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('```') &&
             !trimmed.startsWith('---') &&
             trimmed.length > 5; // Reduced from 10 to 5
    });
    
    if (meaningfulLines.length > 0) {
      let preview = meaningfulLines[0].trim();
      // Remove markdown formatting
      preview = preview.replace(/\*\*([^*]+)\*\*/g, '$1');
      preview = preview.replace(/\*([^*]+)\*/g, '$1');
      preview = preview.replace(/`([^`]+)`/g, '$1');
      if (preview.length > 120) {
        preview = preview.substring(0, 117) + '...';
      }
      return preview;
    }
    
    // Fallback 2: get any non-empty line (even very short ones)
    const anyLines = contentStr.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('```') &&
             !trimmed.startsWith('---') &&
             trimmed.length > 0; // Accept any non-empty line
    });
    
    if (anyLines.length > 0) {
      let preview = anyLines[0].trim();
      // Remove markdown formatting
      preview = preview.replace(/\*\*([^*]+)\*\*/g, '$1');
      preview = preview.replace(/\*([^*]+)\*/g, '$1');
      preview = preview.replace(/`([^`]+)`/g, '$1');
      if (preview.length > 120) {
        preview = preview.substring(0, 117) + '...';
      }
      return preview;
    }
    
    // Final fallback: show first 120 characters of content (cleaned)
    let preview = contentStr.replace(/[#`*\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    if (preview.length > 120) {
      preview = preview.substring(0, 117) + '...';
    }
    
    // Always return something for non-empty content
    return preview || contentStr.substring(0, 50) + (contentStr.length > 50 ? '...' : '');
  };





  if (!isOpen) return null;

  return (
    <div className="prd-modal-overlay" onClick={onClose}>
      <div className="prd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prd-modal-header">
          <div className="prd-modal-title">
            <span className="prd-modal-icon">📥</span>
            <h3>Download PRDs</h3>
            <span className="prd-count">({prds.length})</span>
          </div>
          <div className="view-mode-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          <button className="prd-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="prd-modal-content">
          {loading ? (
            <div className="prd-loading">
              <div className="prd-spinner"></div>
              <span>Loading PRDs...</span>
            </div>
          ) : prds.length === 0 ? (
            <div className="prd-empty">
              <div className="prd-empty-icon">📋</div>
              <p>No PRDs generated yet</p>
              <span>Create PRDs using the Project Planner or Content Nodes</span>
            </div>
          ) : viewMode === 'tree' ? (
            <PRDTreeView
              hierarchyData={hierarchyData}
              onPRDSelect={handlePRDSelect}
              onCreateVersion={handleCreateVersion}
              onCreateSubPRD={handleCreateSubPRD}
              selectedPRDs={selectedPRDs}
              onSelectionChange={setSelectedPRDs}
            />
          ) : (
            <>
              <div className="prd-actions">
                <button 
                  className="prd-action-btn select-all"
                  onClick={handleSelectAll}
                >
                  {selectedPRDs.size === prds.length ? '✓ Deselect All' : '☐ Select All'}
                </button>
                {selectedPRDs.size > 0 && (
                  <button 
                    className="prd-action-btn download-selected"
                    onClick={handleDownloadSelected}
                  >
                    📥 Download Selected ({selectedPRDs.size})
                  </button>
                )}
              </div>

              <div className="prd-list">
                {prds.map((prd) => (
                  <div key={prd.id} className="prd-item" onDoubleClick={() => handlePRDDoubleClick(prd)}>
                    <div className="prd-item-header">
                      <label className="prd-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPRDs.has(prd.id)}
                          onChange={() => handleSelectPRD(prd.id)}
                        />
                        <span className="prd-checkmark"></span>
                      </label>
                      <div className="prd-info">
                        <div className="prd-title-row">
                          <span className="prd-title">{prd.title}</span>
                          <div className="prd-badges">
                            <span className="prd-version">v{prd.version || 1}</span>
                            {prd.isEnhancement && (
                              <span className="prd-enhancement-badge">Enhancement</span>
                            )}
                            {prd.hasPendingUpdate && (
                              <span className="prd-update-badge">New Content Available</span>
                            )}
                          </div>
                        </div>
                        {prd.isEnhancement && prd.parentProject && (
                          <div className="prd-hierarchy">
                            <span className="prd-hierarchy-icon">🔗</span>
                            <span className="prd-hierarchy-text">
                              Enhancement of: <strong>{prd.parentProject}</strong>
                              {prd.enhancedFeature && (
                                <span> → {prd.enhancedFeature}</span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="prd-meta">
                          <span className="prd-date">{formatDate(prd.createdAt)}</span>
                          <span className="prd-size">{formatSize(prd.size)}</span>
                          <span className="prd-source">{prd.source}</span>
                          {prd.updatedAt && prd.updatedAt !== prd.createdAt && (
                            <span className="prd-date">Updated: {formatDate(prd.updatedAt)}</span>
                          )}
                        </div>
                        {(() => {
                          const preview = getContentPreview(prd.content);
                          return preview ? (
                            <div className="prd-content-preview">{preview}</div>
                          ) : null;
                        })()}
                        {prd.hasPendingUpdate ? (
                          <div className="prd-update-hint">New features detected! Click "Update" to review.</div>
                        ) : (
                          <div className="prd-hint">Double-click to view and edit</div>
                        )}
                      </div>
                    </div>
                    <div className="prd-actions-row">
                      {prd.hasPendingUpdate && (
                        <button 
                          className="prd-btn update"
                          onClick={() => handleShowUpdatePrompt(prd)}
                          title="Review and apply new content"
                        >
                          🔄
                        </button>
                      )}
                      <button 
                        className="prd-btn download"
                        onClick={() => handleDownload(prd)}
                        title="Download PRD"
                      >
                        ⬇️
                      </button>
                      <button 
                        className="prd-btn delete"
                        onClick={() => handleDeletePRD(prd.id)}
                        title="Delete PRD"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {prds.length > 0 && (
          <div className="prd-modal-footer">
            <div className="prd-stats">
              <span>{prds.length} PRDs • {formatSize(prds.reduce((sum, prd) => sum + prd.size, 0))}</span>
            </div>
          </div>
        )}
      </div>
      
      {viewingPRD && (
        <PRDViewer
          prd={viewingPRD}
          onClose={handleCloseViewer}
          onVersionCreated={handleVersionCreated}
        />
      )}
      
      {showUpdatePrompt && (
        <UpdatePromptModal
          prd={showUpdatePrompt.prd}
          pendingUpdate={showUpdatePrompt.pendingUpdate}
          onApply={handleApplyUpdate}
          onDismiss={handleDismissUpdate}
          onClose={() => setShowUpdatePrompt(null)}
        />
      )}
      
      {showCreateVersion && (
        <CreateVersionModal
          isOpen={true}
          basePRD={showCreateVersion}
          onConfirm={handleConfirmCreateVersion}
          onCancel={() => setShowCreateVersion(null)}
        />
      )}
      
      {showCreateSubPRD && (
        <CreateSubPRDModal
          isOpen={true}
          parentPRD={showCreateSubPRD}
          onConfirm={handleConfirmCreateSubPRD}
          onCancel={() => setShowCreateSubPRD(null)}
        />
      )}
    </div>
  );
};

export default PRDDownloadModal;