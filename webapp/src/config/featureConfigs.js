// Feature configurations for different module types

export const FEATURE_CONFIGS = {
  frontend: {
    title: 'Frontend Features',
    features: []
  },
  
  backend: {
    title: 'Backend Features',
    features: []
  },
  
  mobile: {
    title: 'Mobile Features',
    features: []
  },
  
  devops: {
    title: 'DevOps Features',
    features: []
  },
  
  ai: {
    title: 'AI/ML Features',
    features: []
  },
  
  default: {
    title: 'General Features',
    features: []
  }
};

// Get features for a specific module type
export const getFeaturesByModule = (moduleType) => {
  return FEATURE_CONFIGS[moduleType] || FEATURE_CONFIGS.default;
};

// Get all available module types
export const getAvailableModules = () => {
  return Object.keys(FEATURE_CONFIGS).filter(key => key !== 'default');
};