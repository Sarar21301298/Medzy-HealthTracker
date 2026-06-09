import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = ({ 
  icon: Icon = null,
  error = null,
  helper = null,
  label = null,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`input-healthcare ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        )}
      </div>
      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helper && !error && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {helper}
        </p>
      )}
    </div>
  );
};

export const Select = ({ 
  options = [],
  label = null,
  error = null,
  helper = null,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`input-healthcare ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helper && !error && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {helper}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ 
  label = null,
  error = null,
  helper = null,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`input-healthcare resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        rows="4"
        {...props}
      />
      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helper && !error && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {helper}
        </p>
      )}
    </div>
  );
};

export default Input;
