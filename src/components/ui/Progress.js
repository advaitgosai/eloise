import React from 'react';

export const Progress = ({ value, className = '' }) => (
  <div className={`bg-gray-200 rounded-full ${className}`}>
    <div
      className="bg-blue-600 rounded-full h-full"
      style={{ width: `${value}%` }}
    />
  </div>
);