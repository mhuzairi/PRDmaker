import React from 'react';
import './RefreshIcon.css';

const RefreshIcon = ({ onClick, isRefreshing = false, size = 20, className = '' }) => {
  return (
    <button 
      className={`refresh-icon-button ${className} ${isRefreshing ? 'refreshing' : ''}`}
      onClick={onClick}
      disabled={isRefreshing}
      title="Refresh to get latest values"
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="refresh-icon-svg"
      >
        <path 
          d="M4 12a8 8 0 0 1 8-8V2.5L14.5 5 12 7.5V6a6 6 0 1 0-6 6H4z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        <path 
          d="M20 12a8 8 0 0 1-8 8v1.5L9.5 19 12 16.5V18a6 6 0 1 0 6-6h2z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
};

export default RefreshIcon;