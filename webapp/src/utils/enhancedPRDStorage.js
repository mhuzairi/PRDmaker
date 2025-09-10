// Enhanced PRD Storage with Hierarchical Support
// Integrates with PRDHierarchyModel for version tracking and parent-child relationships

import {
  createRootPRD,
  createVersionPRD,
  createSubPRD,
  PRDType,
  ChangeType,
  RelationshipReason
} from '../models/PRDHierarchyModel.js';

const PRD_STORAGE_KEY = 'enhanced_prds';
const HIERARCHY_INDEX_KEY = 'prd_hierarchy_index';
const PENDING_UPDATES_KEY = 'pending_prd_updates';

export const enhancedPRDStorage = {
  // Save a new PRD with hierarchy support
  savePRD: (prd) => {
    try {
      const existingPRDs = enhancedPRDStorage.getAllPRDs();
      
      // If this is the first PRD (blank canvas workflow), save it directly as root
      if (existingPRDs.length === 0 && prd.source === 'ProjectPlanner') {
        const newPRDs = [prd];
        localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(newPRDs));
        enhancedPRDStorage.updateHierarchyIndex();
        return prd;
      }
      
      // Enhanced detection: Check for similar titles and content
      let potentialMatch = null;
      let highestSimilarity = 0;
      
      for (const existingPRD of existingPRDs) {
        // Only check against latest versions and root PRDs
        if (!existingPRD.isLatestVersion) continue;
        
        // Check title similarity (exact match or similar patterns)
        const titleMatch = existingPRD.title === prd.title || 
                          enhancedPRDStorage.calculateTitleSimilarity(existingPRD.title, prd.title) > 0.8;
        
        // Check content similarity
        const contentSimilarity = enhancedPRDStorage.calculateContentSimilarity(existingPRD.content, prd.content);
        
        // Consider it a potential update if conditions are met
        const isContentNodeSource = prd.source === 'ContentNode';
        if (titleMatch || 
            (enhancedPRDStorage.calculateTitleSimilarity(existingPRD.title, prd.title) > 0.8 && contentSimilarity > 0.5) ||
            contentSimilarity > 0.7 ||
            (isContentNodeSource && contentSimilarity > 0.3)) {
          
          if (contentSimilarity > highestSimilarity) {
            highestSimilarity = contentSimilarity;
            potentialMatch = existingPRD;
          }
        }
      }
      
      if (potentialMatch && highestSimilarity > 0.3) {
        // Check if the new content is significantly different
        const contentDifference = prd.content.length - potentialMatch.content.length;
        const hasNewFeatures = enhancedPRDStorage.detectNewFeatures(potentialMatch.content, prd.content);
        const isContentNodeSource = prd.source === 'ContentNode';
        const hasNewContent = contentDifference > (isContentNodeSource ? 25 : 50) || 
                             hasNewFeatures ||
                             enhancedPRDStorage.detectAddFeatureIntent(prd.content, prd.source);
        
        if (hasNewContent) {
          // Auto-create new version if it's from ContentNode
          if (isContentNodeSource) {
            const changeDescription = `AI-generated feature addition (${Math.abs(contentDifference)} chars ${contentDifference > 0 ? 'added' : 'removed'})`;
            const newVersion = createVersionPRD(potentialMatch, prd.content, changeDescription);
            
            // Mark old version as not latest
            potentialMatch.isLatestVersion = false;
            potentialMatch.nextVersionId = newVersion.id;
            
            // Update storage
            const updatedPRDs = existingPRDs.map(existingPRD => 
              existingPRD.id === potentialMatch.id ? potentialMatch : existingPRD
            );
            updatedPRDs.unshift(newVersion);
            
            localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
            enhancedPRDStorage.updateHierarchyIndex();
            
            return newVersion;
          } else {
            // For non-ContentNode sources, store pending update
            const pendingUpdate = {
              existingPRDId: potentialMatch.id,
              newContent: prd.content,
              newSource: prd.source,
              detectedAt: new Date().toISOString(),
              type: 'content_addition',
              similarity: highestSimilarity
            };
            
            enhancedPRDStorage.storePendingUpdate(pendingUpdate);
            
            return {
              ...potentialMatch,
              hasPendingUpdate: true,
              pendingUpdate: pendingUpdate
            };
          }
        }
      }
      
      // Create new root PRD if no similar existing PRD found
      const newRootPRD = createRootPRD({
        title: prd.title || `PRD ${new Date().toLocaleDateString()}`,
        content: prd.content,
        source: prd.source || 'unknown',
        size: prd.content.length,
        isEnhancement: prd.isEnhancement || false,
        parentProject: prd.parentProject || null,
        enhancedFeature: prd.enhancedFeature || null,
        enhancedFeatureId: prd.enhancedFeatureId || null
      });
      
      const updatedPRDs = [newRootPRD, ...existingPRDs];
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      enhancedPRDStorage.updateHierarchyIndex();
      
      return newRootPRD;
    } catch (error) {
      console.error('Error saving PRD:', error);
      return null;
    }
  },

  // Create a new version of an existing PRD
  createNewVersion: (basePRD, newContent, changeDescription = '') => {
    try {
      const existingPRDs = enhancedPRDStorage.getAllPRDs();
      const newVersion = createVersionPRD(basePRD, newContent, changeDescription);
      
      // Mark old version as not latest
      basePRD.isLatestVersion = false;
      basePRD.nextVersionId = newVersion.id;
      
      // Update storage
      const updatedPRDs = existingPRDs.map(existingPRD => 
        existingPRD.id === basePRD.id ? basePRD : existingPRD
      );
      updatedPRDs.unshift(newVersion);
      
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      enhancedPRDStorage.updateHierarchyIndex();
      
      return newVersion;
    } catch (error) {
      console.error('Error creating new version:', error);
      return null;
    }
  },

  // Create a sub-PRD from selected features
  createSubPRD: (parentPRD, selectedFeatures, subTitle) => {
    try {
      const existingPRDs = enhancedPRDStorage.getAllPRDs();
      const subPRD = createSubPRD(parentPRD, selectedFeatures, subTitle);
      
      // Update parent PRD to include this sub-PRD
      parentPRD.hasSubPRDs = true;
      parentPRD.childIds.push(subPRD.id);
      parentPRD.subPRDs.push({
        id: subPRD.id,
        title: subTitle,
        baseFeatures: selectedFeatures,
        createdAt: subPRD.createdAt,
        reason: 'feature_specialization'
      });
      
      // Update storage
      const updatedPRDs = existingPRDs.map(existingPRD => 
        existingPRD.id === parentPRD.id ? parentPRD : existingPRD
      );
      updatedPRDs.unshift(subPRD);
      
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      enhancedPRDStorage.updateHierarchyIndex();
      
      return subPRD;
    } catch (error) {
      console.error('Error creating sub-PRD:', error);
      return null;
    }
  },

  // Get all PRDs
  getAllPRDs: () => {
    try {
      const stored = localStorage.getItem(PRD_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving PRDs:', error);
      return [];
    }
  },

  // Get PRD by ID
  getPRDById: (id) => {
    const prds = enhancedPRDStorage.getAllPRDs();
    return prds.find(prd => prd.id === id);
  },

  // Get PRD hierarchy (root PRDs with their children)
  getPRDHierarchy: () => {
    const allPRDs = enhancedPRDStorage.getAllPRDs();
    const rootPRDs = allPRDs.filter(prd => prd.type === PRDType.ROOT);
    
    return rootPRDs.map(rootPRD => {
      return enhancedPRDStorage.buildPRDTree(rootPRD, allPRDs);
    });
  },

  // Build a complete tree structure for a PRD
  buildPRDTree: (prd, allPRDs) => {
    const children = allPRDs.filter(p => p.parentId === prd.id);
    const versions = allPRDs.filter(p => 
      p.rootId === prd.rootId && 
      p.type === PRDType.VERSION && 
      p.parentId === null
    ).sort((a, b) => b.version - a.version);
    
    return {
      ...prd,
      children: children.map(child => enhancedPRDStorage.buildPRDTree(child, allPRDs)),
      versions: versions,
      totalDescendants: enhancedPRDStorage.countDescendants(prd, allPRDs)
    };
  },

  // Count total descendants of a PRD
  countDescendants: (prd, allPRDs) => {
    const directChildren = allPRDs.filter(p => p.parentId === prd.id);
    let count = directChildren.length;
    
    for (const child of directChildren) {
      count += enhancedPRDStorage.countDescendants(child, allPRDs);
    }
    
    return count;
  },

  // Get version chain for a PRD
  getVersionChain: (prd) => {
    const allPRDs = enhancedPRDStorage.getAllPRDs();
    const versions = [];
    
    // Find all versions in the same root
    const sameRootPRDs = allPRDs.filter(p => p.rootId === prd.rootId && p.type !== PRDType.SUB_PRD);
    
    // Sort by version number
    return sameRootPRDs.sort((a, b) => a.version - b.version);
  },

  // Get latest version of a PRD
  getLatestVersion: (prd) => {
    const allPRDs = enhancedPRDStorage.getAllPRDs();
    return allPRDs.find(p => p.rootId === prd.rootId && p.isLatestVersion);
  },

  // Update hierarchy index for faster lookups
  updateHierarchyIndex: () => {
    try {
      const allPRDs = enhancedPRDStorage.getAllPRDs();
      const index = {
        roots: [],
        byParent: {},
        byRoot: {},
        versions: {}
      };
      
      for (const prd of allPRDs) {
        // Index roots
        if (prd.type === PRDType.ROOT) {
          index.roots.push(prd.id);
        }
        
        // Index by parent
        if (prd.parentId) {
          if (!index.byParent[prd.parentId]) {
            index.byParent[prd.parentId] = [];
          }
          index.byParent[prd.parentId].push(prd.id);
        }
        
        // Index by root
        if (!index.byRoot[prd.rootId]) {
          index.byRoot[prd.rootId] = [];
        }
        index.byRoot[prd.rootId].push(prd.id);
        
        // Index versions
        if (prd.type === PRDType.VERSION || prd.type === PRDType.ROOT) {
          if (!index.versions[prd.rootId]) {
            index.versions[prd.rootId] = [];
          }
          index.versions[prd.rootId].push({
            id: prd.id,
            version: prd.version,
            isLatest: prd.isLatestVersion
          });
        }
      }
      
      // Sort versions
      Object.keys(index.versions).forEach(rootId => {
        index.versions[rootId].sort((a, b) => b.version - a.version);
      });
      
      localStorage.setItem(HIERARCHY_INDEX_KEY, JSON.stringify(index));
      return index;
    } catch (error) {
      console.error('Error updating hierarchy index:', error);
      return null;
    }
  },

  // Get hierarchy index
  getHierarchyIndex: () => {
    try {
      const stored = localStorage.getItem(HIERARCHY_INDEX_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving hierarchy index:', error);
      return null;
    }
  },

  // Legacy compatibility methods
  calculateContentSimilarity: (content1, content2) => {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  },

  calculateTitleSimilarity: (title1, title2) => {
    const normalize = (title) => {
      return title.toLowerCase()
        .replace(/^prd\s*-?\s*/i, '')
        .replace(/\s*enhancement\s*-?\s*/i, '')
        .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);
    
    if (!norm1 && !norm2) return 0.9;
    if (!norm1 || !norm2) return 0.1;
    
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  },

  detectNewFeatures: (oldContent, newContent) => {
    const featureKeywords = [
      'feature', 'functionality', 'capability', 'enhancement', 'improvement',
      'module', 'component', 'system', 'integration', 'api', 'endpoint',
      'authentication', 'authorization', 'dashboard', 'interface', 'ui', 'ux',
      'database', 'storage', 'cache', 'search', 'filter', 'sort',
      'notification', 'email', 'sms', 'push', 'alert',
      'payment', 'billing', 'subscription', 'pricing',
      'analytics', 'reporting', 'metrics', 'tracking'
    ];
    
    const oldWords = new Set(oldContent.toLowerCase().split(/\s+/));
    const newWords = new Set(newContent.toLowerCase().split(/\s+/));
    
    let newFeatureWords = 0;
    for (const keyword of featureKeywords) {
      if (newWords.has(keyword) && !oldWords.has(keyword)) {
        newFeatureWords++;
      }
    }
    
    const oldSections = (oldContent.match(/^#+\s+/gm) || []).length;
    const newSections = (newContent.match(/^#+\s+/gm) || []).length;
    const oldBullets = (oldContent.match(/^\s*[-*+]\s+/gm) || []).length;
    const newBullets = (newContent.match(/^\s*[-*+]\s+/gm) || []).length;
    
    return newFeatureWords >= 1 || newSections > oldSections || newBullets > oldBullets + 1;
  },

  detectAddFeatureIntent: (content, source) => {
    const addFeaturePatterns = [
      /add\s+feature/i,
      /new\s+.*?feature/i,
      /additional\s+.*?feature/i,
      /implement\s+.*?feature/i,
      /feature\s+addition/i,
      /enhance\s+with/i,
      /extend\s+functionality/i,
      /add\s+functionality/i,
      /\bnew\s+\w+\s+feature/i,
      /with\s+.*?feature/i,
      /including\s+.*?feature/i,
      /added\s+.*?feature/i,
      /enhancement/i
    ];
    
    const hasAddFeatureLanguage = addFeaturePatterns.some(pattern => pattern.test(content));
    const isEnhancementSource = source && (
      source.includes('enhancement') ||
      source.includes('feature') ||
      source.includes('ContentNode') ||
      source === 'ContentNode'
    );
    
    return hasAddFeatureLanguage || isEnhancementSource;
  },

  // Pending updates management
  storePendingUpdate: (pendingUpdate) => {
    try {
      const pendingUpdates = enhancedPRDStorage.getPendingUpdates();
      const updatedPendingUpdates = [pendingUpdate, ...pendingUpdates.filter(p => p.existingPRDId !== pendingUpdate.existingPRDId)];
      localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updatedPendingUpdates));
    } catch (error) {
      console.error('Error storing pending update:', error);
    }
  },

  getPendingUpdates: () => {
    try {
      const stored = localStorage.getItem(PENDING_UPDATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving pending updates:', error);
      return [];
    }
  },

  applyPendingUpdate: (pendingUpdate, changes = '') => {
    try {
      const basePRD = enhancedPRDStorage.getPRDById(pendingUpdate.existingPRDId);
      if (!basePRD) return null;
      
      const changeDescription = changes || `Applied pending update: ${pendingUpdate.type}`;
      const newVersion = enhancedPRDStorage.createNewVersion(basePRD, pendingUpdate.newContent, changeDescription);
      
      enhancedPRDStorage.removePendingUpdate(pendingUpdate.existingPRDId);
      return newVersion;
    } catch (error) {
      console.error('Error applying pending update:', error);
      return null;
    }
  },

  removePendingUpdate: (existingPRDId) => {
    try {
      const pendingUpdates = enhancedPRDStorage.getPendingUpdates();
      const updatedPendingUpdates = pendingUpdates.filter(p => p.existingPRDId !== existingPRDId);
      localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updatedPendingUpdates));
    } catch (error) {
      console.error('Error removing pending update:', error);
    }
  },

  // Utility methods
  deletePRD: (id) => {
    try {
      const prds = enhancedPRDStorage.getAllPRDs();
      const prdToDelete = prds.find(p => p.id === id);
      
      if (!prdToDelete) return false;
      
      // If deleting a parent, also delete all children
      const toDelete = [id];
      if (prdToDelete.childIds && prdToDelete.childIds.length > 0) {
        const collectChildren = (parentId) => {
          const children = prds.filter(p => p.parentId === parentId);
          for (const child of children) {
            toDelete.push(child.id);
            collectChildren(child.id);
          }
        };
        collectChildren(id);
      }
      
      const filteredPRDs = prds.filter(prd => !toDelete.includes(prd.id));
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(filteredPRDs));
      enhancedPRDStorage.updateHierarchyIndex();
      
      return true;
    } catch (error) {
      console.error('Error deleting PRD:', error);
      return false;
    }
  },

  clearAllPRDs: () => {
    try {
      localStorage.removeItem(PRD_STORAGE_KEY);
      localStorage.removeItem(HIERARCHY_INDEX_KEY);
      localStorage.removeItem(PENDING_UPDATES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing PRDs:', error);
      return false;
    }
  },

  downloadPRD: (prd) => {
    try {
      const blob = new Blob([prd.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prd.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${prd.version}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading PRD:', error);
      return false;
    }
  },

  getStorageStats: () => {
    const prds = enhancedPRDStorage.getAllPRDs();
    const hierarchy = enhancedPRDStorage.getPRDHierarchy();
    
    return {
      totalPRDs: prds.length,
      rootPRDs: prds.filter(p => p.type === PRDType.ROOT).length,
      versions: prds.filter(p => p.type === PRDType.VERSION).length,
      subPRDs: prds.filter(p => p.type === PRDType.SUB_PRD).length,
      totalSize: prds.reduce((sum, prd) => sum + prd.size, 0),
      hierarchies: hierarchy.length,
      oldestPRD: prds.length > 0 ? prds[prds.length - 1].createdAt : null,
      newestPRD: prds.length > 0 ? prds[0].createdAt : null
    };
  }
};

// Named exports for convenience and backward compatibility
export const savePRD = enhancedPRDStorage.savePRD;
export const getAllPRDs = enhancedPRDStorage.getAllPRDs;
export const getPRDById = enhancedPRDStorage.getPRDById;
export const createNewVersion = enhancedPRDStorage.createNewVersion;
export const getPRDHierarchy = enhancedPRDStorage.getPRDHierarchy;
export const deletePRD = enhancedPRDStorage.deletePRD;
export const clearAllPRDs = enhancedPRDStorage.clearAllPRDs;
export const downloadPRD = enhancedPRDStorage.downloadPRD;
export const getStorageStats = enhancedPRDStorage.getStorageStats;
export const getPendingUpdates = enhancedPRDStorage.getPendingUpdates;
export const applyPendingUpdate = enhancedPRDStorage.applyPendingUpdate;
export const removePendingUpdate = enhancedPRDStorage.removePendingUpdate;

export default enhancedPRDStorage;