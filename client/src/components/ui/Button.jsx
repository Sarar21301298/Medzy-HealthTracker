import React from 'react';

export const Button = ({ 
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Color variants
  const variantClasses = {
    primary: 'btn-healthcare btn-healthcare-primary',
    secondary: 'btn-healthcare btn-healthcare-secondary',
    outline: 'btn-healthcare btn-healthcare-outline',
    danger: 'bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 transform',
    success: 'bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 transform',
    ghost: 'text-healthcare-green-600 hover:bg-healthcare-green-50 dark:text-healthcare-green-400 dark:hover:bg-healthcare-green-900/20 rounded-xl transition-all duration-300'
  };

  const fullWidthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]} ${fullWidthClass} ${disabledClass} ${className} flex items-center justify-center gap-2`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export const ButtonGroup = ({ children, className = '', ...props }) => (
  <div className={`flex gap-3 flex-wrap ${className}`} {...props}>
    {children}
  </div>
);

export default Button;
