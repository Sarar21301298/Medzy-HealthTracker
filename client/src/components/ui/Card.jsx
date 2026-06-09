import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  interactive = false,
  onClick = null,
  ...props 
}) => {
  const baseClasses = 'card-healthcare';
  const hoverClasses = hoverable ? 'card-healthcare-hover' : '';
  const interactiveClasses = interactive ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
