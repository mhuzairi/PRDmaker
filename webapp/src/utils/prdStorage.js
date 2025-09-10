// PRD Storage Utility
// Manages PRD persistence using localStorage

const PRD_STORAGE_KEY = 'generated_prds';

export const prdStorage = {
  // Save a new PRD or detect potential updates
  savePRD: (prd) => {
    try {
      const existingPRDs = prdStorage.getAllPRDs();
      
      // Enhanced detection: Check for similar titles and content
      let potentialMatch = null;
      let highestSimilarity = 0;
      
      for (const existingPRD of existingPRDs) {
        // Check title similarity (exact match or similar patterns)
        const titleMatch = existingPRD.title === prd.title || 
                          prdStorage.calculateTitleSimilarity(existingPRD.title, prd.title) > 0.8;
        
        // Check content similarity
        const contentSimilarity = prdStorage.calculateContentSimilarity(existingPRD.content, prd.content);
        
        // Consider it a potential update if:
        // 1. Same title, OR
        // 2. High title similarity (>80%) AND moderate content similarity (>50%), OR
        // 3. Very high content similarity (>70%) regardless of title, OR
        // 4. ContentNode source with any reasonable similarity (>30%)
        const isContentNodeSource = prd.source === 'ContentNode';
        if (titleMatch || 
            (prdStorage.calculateTitleSimilarity(existingPRD.title, prd.title) > 0.8 && contentSimilarity > 0.5) ||
            contentSimilarity > 0.7 ||
            (isContentNodeSource && contentSimilarity > 0.3)) {
          
          if (contentSimilarity > highestSimilarity) {
            highestSimilarity = contentSimilarity;
            potentialMatch = existingPRD;
          }
        }
      }
      
      if (potentialMatch && highestSimilarity > 0.3) { // Lowered from 0.5 to 0.3 for better detection
        // Check if the new content is significantly different (indicates new features)
        const contentDifference = prd.content.length - potentialMatch.content.length;
        const hasNewFeatures = prdStorage.detectNewFeatures(potentialMatch.content, prd.content);
        const isContentNodeSource = prd.source === 'ContentNode';
        const hasNewContent = contentDifference > (isContentNodeSource ? 25 : 50) || // Lower threshold for ContentNode
                             hasNewFeatures ||
                             prdStorage.detectAddFeatureIntent(prd.content, prd.source);
        
        if (hasNewContent) {
          // Auto-update PRD if it's from ContentNode (AI-generated features)
          if (isContentNodeSource) {
            // Directly update the existing PRD with new content
            const updatedPRD = {
              ...potentialMatch,
              content: prd.content,
              updatedAt: new Date().toISOString(),
              source: prd.source,
              lastEnhancement: {
                addedAt: new Date().toISOString(),
                similarity: highestSimilarity,
                type: 'ai_feature_addition'
              }
            };
            
            // Update in storage
            const existingPRDs = prdStorage.getAllPRDs();
            const updatedPRDs = existingPRDs.map(existingPRD => 
              existingPRD.id === potentialMatch.id ? updatedPRD : existingPRD
            );
            localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
            
            return updatedPRD;
          } else {
            // For non-ContentNode sources, keep the pending update behavior
            const pendingUpdate = {
              existingPRDId: potentialMatch.id,
              newContent: prd.content,
              newSource: prd.source,
              detectedAt: new Date().toISOString(),
              type: 'content_addition',
              similarity: highestSimilarity
            };
            
            // Store pending update
            prdStorage.storePendingUpdate(pendingUpdate);
            
            return {
              ...potentialMatch,
              hasPendingUpdate: true,
              pendingUpdate: pendingUpdate
            };
          }
        }
      }
      
      // Create new PRD if no similar existing PRD found
      const newPRD = {
        id: Date.now().toString(),
        title: prd.title || `PRD ${new Date().toLocaleDateString()}`,
        content: prd.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: prd.source || 'unknown',
        size: prd.content.length,
        version: 1,
        hasPendingUpdate: false,
        isEnhancement: prd.isEnhancement || false,
        parentProject: prd.parentProject || null,
        enhancedFeature: prd.enhancedFeature || null,
        enhancedFeatureId: prd.enhancedFeatureId || null
      };
      
      const updatedPRDs = [newPRD, ...existingPRDs];
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      
      return newPRD;
    } catch (error) {
      console.error('Error saving PRD:', error);
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
    const prds = prdStorage.getAllPRDs();
    return prds.find(prd => prd.id === id);
  },

  // Calculate content similarity using simple word overlap
  calculateContentSimilarity: (content1, content2) => {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  },

  // Calculate title similarity
  calculateTitleSimilarity: (title1, title2) => {
    // Normalize titles by removing common prefixes and dates
    const normalize = (title) => {
      return title.toLowerCase()
        .replace(/^prd\s*-?\s*/i, '') // Remove "PRD -" prefix
        .replace(/\s*enhancement\s*-?\s*/i, '') // Remove "Enhancement -" suffix
        .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '') // Remove dates
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };
    
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);
    
    // Check for enhancement relationships
    const isEnhancement1 = title1.toLowerCase().includes('enhancement');
    const isEnhancement2 = title2.toLowerCase().includes('enhancement');
    
    // If one is an enhancement and they share similar base names, high similarity
    if ((isEnhancement1 || isEnhancement2) && norm1 && norm2) {
      const words1 = new Set(norm1.split(/\s+/));
      const words2 = new Set(norm2.split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      
      // Higher threshold for enhancement relationships
      if (intersection.size > 0) {
        return Math.min(0.85, intersection.size / Math.min(words1.size, words2.size));
      }
    }
    
    // If both titles are empty after normalization (generic PRD titles), consider them similar
    if (!norm1 && !norm2) return 0.9;
    if (!norm1 || !norm2) return 0.1;
    
    // Calculate word-based similarity
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  },

  // Detect if new content contains additional features
  detectNewFeatures: (oldContent, newContent) => {
    // Look for feature-indicating keywords in the new content that aren't in the old
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
    
    // Count new feature-related words
    let newFeatureWords = 0;
    for (const keyword of featureKeywords) {
      if (newWords.has(keyword) && !oldWords.has(keyword)) {
        newFeatureWords++;
      }
    }
    
    // Also check for new sections or bullet points
    const oldSections = (oldContent.match(/^#+\s+/gm) || []).length;
    const newSections = (newContent.match(/^#+\s+/gm) || []).length;
    const oldBullets = (oldContent.match(/^\s*[-*+]\s+/gm) || []).length;
    const newBullets = (newContent.match(/^\s*[-*+]\s+/gm) || []).length;
    
    // Lowered threshold: any new feature word or structural changes trigger detection
    return newFeatureWords >= 1 || newSections > oldSections || newBullets > oldBullets + 1;
  },

  // Detect explicit "add feature" intent
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
    
    // Check content for explicit add feature language
    const hasAddFeatureLanguage = addFeaturePatterns.some(pattern => pattern.test(content));
    
    // Check source for enhancement indicators
    const isEnhancementSource = source && (
      source.includes('enhancement') ||
      source.includes('feature') ||
      source.includes('ContentNode') ||
      source === 'ContentNode'
    );
    
    // Also check for common feature addition keywords
    const featureAdditionKeywords = [
      'shopping cart', 'payment processing', 'user dashboard', 'admin panel',
      'search functionality', 'notification system', 'reporting module',
      'analytics dashboard', 'user management', 'content management'
    ];
    
    const hasFeatureKeywords = featureAdditionKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return hasAddFeatureLanguage || isEnhancementSource || hasFeatureKeywords;
  },

  // Store pending update
  storePendingUpdate: (pendingUpdate) => {
    try {
      const pendingUpdates = prdStorage.getPendingUpdates();
      const updatedPendingUpdates = [pendingUpdate, ...pendingUpdates.filter(p => p.existingPRDId !== pendingUpdate.existingPRDId)];
      localStorage.setItem('pending_prd_updates', JSON.stringify(updatedPendingUpdates));
    } catch (error) {
      console.error('Error storing pending update:', error);
    }
  },

  // Get all pending updates
  getPendingUpdates: () => {
    try {
      const stored = localStorage.getItem('pending_prd_updates');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving pending updates:', error);
      return [];
    }
  },

  // Apply pending update to create new version
  applyPendingUpdate: (pendingUpdate, changes = '') => {
    try {
      const existingPRDs = prdStorage.getAllPRDs();
      const basePRD = existingPRDs.find(p => p.id === pendingUpdate.existingPRDId);
      
      if (!basePRD) return null;
      
      const newVersion = {
        ...basePRD,
        id: Date.now().toString(),
        content: pendingUpdate.newContent,
        updatedAt: new Date().toISOString(),
        version: (basePRD.version || 1) + 1,
        changes: changes,
        baseVersion: basePRD.id,
        size: pendingUpdate.newContent.length,
        hasPendingUpdate: false
      };
      
      const updatedPRDs = [newVersion, ...existingPRDs];
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      
      // Remove the pending update
      prdStorage.removePendingUpdate(pendingUpdate.existingPRDId);
      
      return newVersion;
    } catch (error) {
      console.error('Error applying pending update:', error);
      return null;
    }
  },

  // Remove pending update
  removePendingUpdate: (existingPRDId) => {
    try {
      const pendingUpdates = prdStorage.getPendingUpdates();
      const updatedPendingUpdates = pendingUpdates.filter(p => p.existingPRDId !== existingPRDId);
      localStorage.setItem('pending_prd_updates', JSON.stringify(updatedPendingUpdates));
    } catch (error) {
      console.error('Error removing pending update:', error);
    }
  },

  // Create new version of existing PRD
  createNewVersion: (basePRD, newContent, changes = '') => {
    try {
      const existingPRDs = prdStorage.getAllPRDs();
      const newVersion = {
        ...basePRD,
        id: Date.now().toString(),
        content: newContent,
        updatedAt: new Date().toISOString(),
        version: (basePRD.version || 1) + 1,
        changes: changes,
        baseVersion: basePRD.id
      };
      
      const updatedPRDs = [newVersion, ...existingPRDs];
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(updatedPRDs));
      return newVersion;
    } catch (error) {
      console.error('Error creating new version:', error);
      return null;
    }
  },

  // Get all versions of a PRD by title
  getPRDVersions: (title) => {
    const prds = prdStorage.getAllPRDs();
    return prds.filter(prd => prd.title === title).sort((a, b) => b.version - a.version);
  },

  // Delete PRD by ID
  deletePRD: (id) => {
    try {
      const prds = prdStorage.getAllPRDs();
      const filteredPRDs = prds.filter(prd => prd.id !== id);
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(filteredPRDs));
      return true;
    } catch (error) {
      console.error('Error deleting PRD:', error);
      return false;
    }
  },

  // Clear all PRDs
  clearAllPRDs: () => {
    try {
      localStorage.removeItem(PRD_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing PRDs:', error);
      return false;
    }
  },

  // Download PRD as file
  downloadPRD: (prd) => {
    try {
      const blob = new Blob([prd.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prd.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
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

  // Get storage stats
  getStorageStats: () => {
    const prds = prdStorage.getAllPRDs();
    return {
      totalPRDs: prds.length,
      totalSize: prds.reduce((sum, prd) => sum + prd.size, 0),
      oldestPRD: prds.length > 0 ? prds[prds.length - 1].createdAt : null,
      newestPRD: prds.length > 0 ? prds[0].createdAt : null
    };
  }
};

// Named exports for convenience
export const savePRD = prdStorage.savePRD;
export const getAllPRDs = prdStorage.getAllPRDs;
export const getPRDById = prdStorage.getPRDById;
export const createNewVersion = prdStorage.createNewVersion;
export const getPRDVersions = prdStorage.getPRDVersions;
export const deletePRD = prdStorage.deletePRD;
export const clearAllPRDs = prdStorage.clearAllPRDs;
export const downloadPRD = prdStorage.downloadPRD;
export const getStorageStats = prdStorage.getStorageStats;
export const getPendingUpdates = prdStorage.getPendingUpdates;
export const applyPendingUpdate = prdStorage.applyPendingUpdate;
export const removePendingUpdate = prdStorage.removePendingUpdate;

export default prdStorage;