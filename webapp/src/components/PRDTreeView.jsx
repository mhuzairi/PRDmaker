// PRD Tree View Component
// Displays PRD hierarchies with branches, versions, and sub-PRDs

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  DocumentTextIcon,
  TagIcon,
  ClockIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid';
import { PRDType } from '../models/PRDHierarchyModel.js';

const PRDTreeView = ({ 
  hierarchyData, 
  onPRDSelect, 
  onVersionSelect, 
  onCreateSubPRD, 
  onCreateVersion,
  selectedPRDId = null,
  showVersions = true,
  showSubPRDs = true,
  compact = false 
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (prd) => {
    switch (prd.type) {
      case PRDType.ROOT:
        return <DocumentTextIcon className="w-4 h-4 text-blue-600" />;
      case PRDType.VERSION:
        return <TagIcon className="w-4 h-4 text-green-600" />;
      case PRDType.SUB_PRD:
        return <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-600" />;
      case PRDType.FEATURE_BRANCH:
        return <FolderIcon className="w-4 h-4 text-orange-600" />;
      default:
        return <DocumentTextIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNodeColor = (prd) => {
    switch (prd.type) {
      case PRDType.ROOT:
        return 'border-blue-200 bg-blue-50';
      case PRDType.VERSION:
        return 'border-green-200 bg-green-50';
      case PRDType.SUB_PRD:
        return 'border-purple-200 bg-purple-50';
      case PRDType.FEATURE_BRANCH:
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContentPreview = (content, maxLength = 100) => {
    if (!content) return 'No content';
    const cleaned = content.replace(/[#*-]/g, '').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned;
  };

  const TreeNode = ({ prd, depth = 0, isLast = false, parentPath = '' }) => {
    const nodeId = `${prd.id}-${depth}`;
    const isExpanded = expandedNodes.has(nodeId);
    const isSelected = selectedPRDId === prd.id;
    const hasChildren = (prd.children && prd.children.length > 0) || 
                       (showVersions && prd.versions && prd.versions.length > 1) ||
                       (prd.hasSubPRDs && showSubPRDs);

    const indentWidth = depth * (compact ? 16 : 24);
    const currentPath = parentPath ? `${parentPath}.${prd.version || '1'}` : `v${prd.version || '1'}`;

    return (
      <div className="relative">
        {/* Connection Lines */}
        {depth > 0 && (
          <>
            {/* Vertical line from parent */}
            <div 
              className="absolute border-l border-gray-300"
              style={{
                left: `${indentWidth - (compact ? 12 : 16)}px`,
                top: '-8px',
                height: '16px',
                width: '1px'
              }}
            />
            {/* Horizontal line to node */}
            <div 
              className="absolute border-t border-gray-300"
              style={{
                left: `${indentWidth - (compact ? 12 : 16)}px`,
                top: '8px',
                width: `${compact ? 12 : 16}px`,
                height: '1px'
              }}
            />
            {/* Corner connector */}
            {!isLast && (
              <div 
                className="absolute border-l border-gray-300"
                style={{
                  left: `${indentWidth - (compact ? 12 : 16)}px`,
                  top: '8px',
                  height: '100%',
                  width: '1px'
                }}
              />
            )}
          </>
        )}

        {/* Node Content */}
        <div 
          className={`relative flex items-center p-2 rounded-lg border transition-all duration-200 mb-2 ${
            isSelected 
              ? 'ring-2 ring-blue-500 bg-blue-100 border-blue-300' 
              : getNodeColor(prd)
          } ${hoveredNode === prd.id ? 'shadow-md' : 'shadow-sm'}`}
          style={{ marginLeft: `${indentWidth}px` }}
          onMouseEnter={() => setHoveredNode(prd.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(nodeId)}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors mr-2"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Node Icon */}
          <div className="flex-shrink-0 mr-3">
            {getNodeIcon(prd)}
          </div>

          {/* Node Info */}
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onPRDSelect && onPRDSelect(prd)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${
                  compact ? 'text-sm' : 'text-base'
                } text-gray-900`}>
                  {prd.title}
                </h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    prd.type === PRDType.ROOT ? 'bg-blue-100 text-blue-800' :
                    prd.type === PRDType.VERSION ? 'bg-green-100 text-green-800' :
                    prd.type === PRDType.SUB_PRD ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentPath}
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {formatDate(prd.updatedAt || prd.createdAt)}
                  </span>
                  {prd.hasSubPRDs && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {prd.childIds?.length || 0} sub-PRDs
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {getContentPreview(prd.content)}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {hoveredNode === prd.id && (
                <div className="flex items-center space-x-1 ml-2">
                  {prd.type === PRDType.ROOT && onCreateVersion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateVersion(prd);
                      }}
                      className="p-1 rounded hover:bg-white/80 transition-colors"
                      title="Create New Version"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  {(prd.type === PRDType.ROOT || prd.type === PRDType.VERSION) && onCreateSubPRD && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateSubPRD(prd);
                      }}
                      className="p-1 rounded hover:bg-white/80 transition-colors"
                      title="Create Sub-PRD"
                    >
                      <BranchIcon className="w-4 h-4 text-purple-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="ml-2">
            {/* Versions */}
            {showVersions && prd.versions && prd.versions.length > 1 && (
              <div className="mb-2">
                {prd.versions.slice(1).map((version, index) => (
                  <TreeNode
                    key={version.id}
                    prd={version}
                    depth={depth + 1}
                    isLast={index === prd.versions.length - 2 && (!prd.children || prd.children.length === 0)}
                    parentPath={currentPath}
                  />
                ))}
              </div>
            )}

            {/* Sub-PRDs */}
            {showSubPRDs && prd.children && prd.children.length > 0 && (
              <div>
                {prd.children.map((child, index) => (
                  <TreeNode
                    key={child.id}
                    prd={child}
                    depth={depth + 1}
                    isLast={index === prd.children.length - 1}
                    parentPath={currentPath}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const sortedHierarchy = useMemo(() => {
    return hierarchyData.sort((a, b) => {
      // Sort by creation date, newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [hierarchyData]);

  if (!hierarchyData || hierarchyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <DocumentTextIcon className="w-12 h-12 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No PRDs Found</h3>
        <p className="text-sm text-center max-w-sm">
          Create your first PRD to see it displayed in the tree view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tree View Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            PRD Hierarchy ({hierarchyData.length} root{hierarchyData.length !== 1 ? 's' : ''})
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Root</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Version</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span>Sub-PRD</span>
          </div>
        </div>
      </div>

      {/* Tree Nodes */}
      <div className="space-y-2">
        {sortedHierarchy.map((rootPRD, index) => (
          <TreeNode
            key={rootPRD.id}
            prd={rootPRD}
            depth={0}
            isLast={index === sortedHierarchy.length - 1}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Hierarchy Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total PRDs:</span>
            <span className="ml-2 font-medium">
              {hierarchyData.reduce((sum, root) => sum + 1 + (root.totalDescendants || 0), 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Root PRDs:</span>
            <span className="ml-2 font-medium">{hierarchyData.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Versions:</span>
            <span className="ml-2 font-medium">
              {hierarchyData.reduce((sum, root) => sum + (root.versions?.length || 1), 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Sub-PRDs:</span>
            <span className="ml-2 font-medium">
              {hierarchyData.reduce((sum, root) => sum + (root.totalDescendants || 0), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRDTreeView;