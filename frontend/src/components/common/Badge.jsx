import React from 'react';

const Badge = ({ variant = 'primary', children, className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

export default Badge;
