import React, { useState } from 'react';
import './CreateVersionModal.css';

const CreateVersionModal = ({ isOpen, basePRD, onConfirm, onCancel }) => {
  const [newContent, setNewContent] = useState(basePRD?.content || '');
  const [changeDescription, setChangeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !basePRD) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changeDescription.trim()) {
      alert('Please provide a description of the changes');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(newContent, changeDescription.trim());
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Failed to create version. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewContent(basePRD?.content || '');
    setChangeDescription('');
    onCancel();
  };

  return (
    <div className="create-version-modal-overlay">
      <div className="create-version-modal">
        <div className="create-version-header">
          <h3>Create New Version</h3>
          <p className="base-prd-info">
            Creating version {(basePRD.version || 1) + 1} of "{basePRD.title}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-version-form">
          <div className="form-group">
            <label htmlFor="change-description">Change Description *</label>
            <textarea
              id="change-description"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Describe what changes you made in this version..."
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prd-content">PRD Content</label>
            <textarea
              id="prd-content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Edit the PRD content..."
              rows={12}
              className="content-textarea"
            />
          </div>

          <div className="version-actions">
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
              disabled={isSubmitting || !changeDescription.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVersionModal;