import React, { useState, useEffect } from 'react';
import { extractFeatures } from '../models/PRDHierarchyModel';
import './CreateSubPRDModal.css';

const CreateSubPRDModal = ({ isOpen, parentPRD, onConfirm, onCancel }) => {
  const [subTitle, setSubTitle] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && parentPRD) {
      const features = extractFeatures(parentPRD.content);
      setAvailableFeatures(features);
      setSelectedFeatures(new Set());
      setSubTitle(`${parentPRD.title} - Feature Subset`);
    }
  }, [isOpen, parentPRD]);

  if (!isOpen || !parentPRD) return null;

  const handleFeatureToggle = (featureId) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFeatures.size === availableFeatures.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(availableFeatures.map(f => f.id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subTitle.trim()) {
      alert('Please provide a title for the sub-PRD');
      return;
    }
    if (selectedFeatures.size === 0) {
      alert('Please select at least one feature');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedFeatureObjects = availableFeatures.filter(f => 
        selectedFeatures.has(f.id)
      );
      await onConfirm(selectedFeatureObjects, subTitle.trim());
    } catch (error) {
      console.error('Error creating sub-PRD:', error);
      alert('Failed to create sub-PRD. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSubTitle('');
    setSelectedFeatures(new Set());
    onCancel();
  };

  return (
    <div className="create-sub-prd-modal-overlay">
      <div className="create-sub-prd-modal">
        <div className="create-sub-prd-header">
          <h3>Create Sub-PRD</h3>
          <p className="parent-prd-info">
            Creating sub-PRD from "{parentPRD.title}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-sub-prd-form">
          <div className="form-group">
            <label htmlFor="sub-title">Sub-PRD Title *</label>
            <input
              id="sub-title"
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="Enter title for the new sub-PRD..."
              required
            />
          </div>

          <div className="form-group">
            <div className="features-header">
              <label>Select Features to Include *</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="select-all-btn"
              >
                {selectedFeatures.size === availableFeatures.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {availableFeatures.length === 0 ? (
              <div className="no-features">
                <p>No features detected in the parent PRD content.</p>
                <p className="hint">Features are typically identified by headings, bullet points, or numbered lists.</p>
              </div>
            ) : (
              <div className="features-list">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="feature-item">
                    <label className="feature-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.has(feature.id)}
                        onChange={() => handleFeatureToggle(feature.id)}
                      />
                      <span className="checkmark"></span>
                      <div className="feature-content">
                        <div className="feature-title">{feature.title}</div>
                        {feature.description && (
                          <div className="feature-description">{feature.description}</div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            <div className="selection-summary">
              {selectedFeatures.size} of {availableFeatures.length} features selected
            </div>
          </div>

          <div className="sub-prd-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting || !subTitle.trim() || selectedFeatures.size === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Sub-PRD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubPRDModal;