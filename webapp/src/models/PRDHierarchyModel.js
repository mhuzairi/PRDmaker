// Enhanced PRD Data Model for Hierarchical Version Management
// This model supports parent-child relationships, version tracking, and change history

/**
 * Enhanced PRD Structure with Hierarchy Support
 * 
 * @typedef {Object} EnhancedPRD
 * @property {string} id - Unique identifier for this PRD
 * @property {string} title - PRD title
 * @property {string} content - PRD content
 * @property {number} version - Version number (starts at 1)
 * @property {string} source - Source of creation (manual, ContentNode, etc.)
 * @property {number} size - Content size in characters
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * 
 * // Hierarchy Properties
 * @property {string|null} parentId - ID of parent PRD (null for root PRDs)
 * @property {string[]} childIds - Array of child PRD IDs
 * @property {string} rootId - ID of the root PRD in this hierarchy
 * @property {number} depth - Depth level in hierarchy (0 for root)
 * @property {string} hierarchyPath - Path from root (e.g., "root/1.1/1.1.2")
 * 
 * // Version Tracking
 * @property {string|null} previousVersionId - ID of previous version of this PRD
 * @property {string|null} nextVersionId - ID of next version of this PRD
 * @property {boolean} isLatestVersion - Whether this is the latest version
 * @property {VersionChange[]} versionHistory - History of changes made
 * 
 * // Feature Tracking
 * @property {string[]} features - List of features in this PRD
 * @property {FeatureChange[]} featureChanges - Changes made to features
 * @property {string[]} selectedFeatures - Features selected for sub-PRD creation
 * 
 * // Relationship Metadata
 * @property {PRDType} type - Type of PRD (root, version, sub_prd, feature_branch)
 * @property {string} relationshipReason - Reason for creation (feature_addition, enhancement, etc.)
 * @property {boolean} hasSubPRDs - Whether this PRD has child PRDs
 * @property {SubPRDInfo[]} subPRDs - Information about sub-PRDs
 */

/**
 * @typedef {Object} VersionChange
 * @property {string} id - Unique change ID
 * @property {string} timestamp - ISO timestamp of change
 * @property {string} type - Type of change (content_update, feature_add, feature_remove)
 * @property {string} description - Human-readable description of change
 * @property {Object} details - Detailed change information
 * @property {string} author - Who made the change (system, user, etc.)
 */

/**
 * @typedef {Object} FeatureChange
 * @property {string} featureId - Unique feature identifier
 * @property {string} featureName - Name of the feature
 * @property {string} action - Action taken (added, modified, removed, selected)
 * @property {string} timestamp - ISO timestamp of change
 * @property {string} description - Description of the change
 * @property {Object} beforeState - State before change
 * @property {Object} afterState - State after change
 */

/**
 * @typedef {Object} SubPRDInfo
 * @property {string} id - Sub-PRD ID
 * @property {string} title - Sub-PRD title
 * @property {string[]} baseFeatures - Features from parent that this sub-PRD is based on
 * @property {string} createdAt - Creation timestamp
 * @property {string} reason - Reason for sub-PRD creation
 */

/**
 * @enum {string}
 */
export const PRDType = {
  ROOT: 'root',           // Original PRD (version 1)
  VERSION: 'version',     // New version of existing PRD
  SUB_PRD: 'sub_prd',    // Sub-PRD created from parent features
  FEATURE_BRANCH: 'feature_branch' // Branch focused on specific features
};

/**
 * @enum {string}
 */
export const ChangeType = {
  CONTENT_UPDATE: 'content_update',
  FEATURE_ADD: 'feature_add',
  FEATURE_REMOVE: 'feature_remove',
  FEATURE_MODIFY: 'feature_modify',
  SUB_PRD_CREATE: 'sub_prd_create',
  VERSION_CREATE: 'version_create'
};

/**
 * @enum {string}
 */
export const RelationshipReason = {
  FEATURE_ADDITION: 'feature_addition',
  CONTENT_ENHANCEMENT: 'content_enhancement',
  FEATURE_SPECIALIZATION: 'feature_specialization',
  USER_CUSTOMIZATION: 'user_customization',
  AUTOMATIC_UPDATE: 'automatic_update'
};

/**
 * Factory function to create a new root PRD
 * @param {Object} basicPRD - Basic PRD data
 * @returns {EnhancedPRD}
 */
export const createRootPRD = (basicPRD) => {
  const id = basicPRD.id || generateId();
  return {
    ...basicPRD,
    id,
    version: 1,
    
    // Hierarchy Properties
    parentId: null,
    childIds: [],
    rootId: id,
    depth: 0,
    hierarchyPath: 'root',
    
    // Version Tracking
    previousVersionId: null,
    nextVersionId: null,
    isLatestVersion: true,
    versionHistory: [{
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: ChangeType.VERSION_CREATE,
      description: 'Initial PRD creation',
      details: { version: 1 },
      author: 'system'
    }],
    
    // Feature Tracking
    features: extractFeatures(basicPRD.content),
    featureChanges: [],
    selectedFeatures: [],
    
    // Relationship Metadata
    type: PRDType.ROOT,
    relationshipReason: RelationshipReason.FEATURE_ADDITION,
    hasSubPRDs: false,
    subPRDs: []
  };
};

/**
 * Factory function to create a new version of existing PRD
 * @param {EnhancedPRD} parentPRD - Parent PRD
 * @param {string} newContent - New content
 * @param {string} changeDescription - Description of changes
 * @returns {EnhancedPRD}
 */
export const createVersionPRD = (parentPRD, newContent, changeDescription) => {
  const id = generateId();
  const newVersion = parentPRD.version + 1;
  const newFeatures = extractFeatures(newContent);
  const featureChanges = compareFeatures(parentPRD.features, newFeatures);
  
  return {
    ...parentPRD,
    id,
    content: newContent,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    
    // Version Tracking
    previousVersionId: parentPRD.id,
    nextVersionId: null,
    isLatestVersion: true,
    versionHistory: [
      ...parentPRD.versionHistory,
      {
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: ChangeType.VERSION_CREATE,
        description: changeDescription,
        details: { 
          version: newVersion,
          previousVersion: parentPRD.version,
          featuresAdded: featureChanges.added.length,
          featuresRemoved: featureChanges.removed.length
        },
        author: 'user'
      }
    ],
    
    // Feature Tracking
    features: newFeatures,
    featureChanges: [...parentPRD.featureChanges, ...featureChanges.changes],
    
    // Relationship Metadata
    type: PRDType.VERSION,
    relationshipReason: RelationshipReason.CONTENT_ENHANCEMENT
  };
};

/**
 * Factory function to create a sub-PRD from selected features
 * @param {EnhancedPRD} parentPRD - Parent PRD
 * @param {string[]} selectedFeatures - Selected features for sub-PRD
 * @param {string} subTitle - Title for sub-PRD
 * @returns {EnhancedPRD}
 */
export const createSubPRD = (parentPRD, selectedFeatures, subTitle) => {
  const id = generateId();
  const subContent = generateSubPRDContent(parentPRD.content, selectedFeatures);
  
  return {
    id,
    title: subTitle,
    content: subContent,
    version: 1,
    source: 'sub_prd_creation',
    size: subContent.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Hierarchy Properties
    parentId: parentPRD.id,
    childIds: [],
    rootId: parentPRD.rootId,
    depth: parentPRD.depth + 1,
    hierarchyPath: `${parentPRD.hierarchyPath}/${parentPRD.childIds.length + 1}`,
    
    // Version Tracking
    previousVersionId: null,
    nextVersionId: null,
    isLatestVersion: true,
    versionHistory: [{
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: ChangeType.SUB_PRD_CREATE,
      description: `Sub-PRD created from ${selectedFeatures.length} selected features`,
      details: { 
        parentId: parentPRD.id,
        selectedFeatures,
        baseVersion: parentPRD.version
      },
      author: 'user'
    }],
    
    // Feature Tracking
    features: selectedFeatures,
    featureChanges: [],
    selectedFeatures: [],
    
    // Relationship Metadata
    type: PRDType.SUB_PRD,
    relationshipReason: RelationshipReason.FEATURE_SPECIALIZATION,
    hasSubPRDs: false,
    subPRDs: []
  };
};

// Utility Functions
const generateId = () => {
  return 'prd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const extractFeatures = (content) => {
  // Extract features from PRD content
  const featureRegex = /(?:^|\n)[-*]\s+(.+?)(?=\n|$)/gm;
  const features = [];
  let match;
  let id = 1;
  
  while ((match = featureRegex.exec(content)) !== null) {
    const feature = match[1].trim();
    if (feature.length > 5) { // Filter out very short items
      features.push({
        id: `feature_${id++}`,
        title: feature,
        description: feature.length > 50 ? feature.substring(0, 50) + '...' : feature
      });
    }
  }
  
  // If no bullet points found, try to extract from headings
  if (features.length === 0) {
    const headingRegex = /(?:^|\n)#{1,6}\s+(.+?)(?=\n|$)/gm;
    while ((match = headingRegex.exec(content)) !== null) {
      const heading = match[1].trim();
      if (heading.length > 5) {
        features.push({
          id: `heading_${id++}`,
          title: heading,
          description: heading.length > 50 ? heading.substring(0, 50) + '...' : heading
        });
      }
    }
  }
  
  return features;
};

const compareFeatures = (oldFeatures, newFeatures) => {
  const added = newFeatures.filter(f => !oldFeatures.includes(f));
  const removed = oldFeatures.filter(f => !newFeatures.includes(f));
  const changes = [];
  
  added.forEach(feature => {
    changes.push({
      featureId: generateId(),
      featureName: feature,
      action: 'added',
      timestamp: new Date().toISOString(),
      description: `Feature added: ${feature}`,
      beforeState: null,
      afterState: { feature }
    });
  });
  
  removed.forEach(feature => {
    changes.push({
      featureId: generateId(),
      featureName: feature,
      action: 'removed',
      timestamp: new Date().toISOString(),
      description: `Feature removed: ${feature}`,
      beforeState: { feature },
      afterState: null
    });
  });
  
  return { added, removed, changes };
};

const generateSubPRDContent = (parentContent, selectedFeatures) => {
  // Generate focused content based on selected features
  const lines = parentContent.split('\n');
  const relevantLines = [];
  let inRelevantSection = false;
  
  for (const line of lines) {
    // Check if line contains any selected feature
    const containsFeature = selectedFeatures.some(feature => 
      line.toLowerCase().includes(feature.toLowerCase())
    );
    
    if (containsFeature || line.startsWith('#') || line.startsWith('##')) {
      inRelevantSection = true;
      relevantLines.push(line);
    } else if (inRelevantSection && line.trim() === '') {
      relevantLines.push(line);
    } else if (line.startsWith('#')) {
      inRelevantSection = false;
    } else if (inRelevantSection) {
      relevantLines.push(line);
    }
  }
  
  return relevantLines.join('\n');
};

export default {
  PRDType,
  ChangeType,
  RelationshipReason,
  createRootPRD,
  createVersionPRD,
  createSubPRD,
  extractFeatures
};