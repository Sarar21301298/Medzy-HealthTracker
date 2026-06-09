import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Badge = ({
  variant = 'green',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    green: 'badge-healthcare badge-healthcare-green',
    teal: 'badge-healthcare badge-healthcare-teal',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export const Alert = ({
  variant = 'info',
  title = null,
  children,
  className = '',
  closable = false,
  onClose = null,
  ...props
}) => {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  const variantConfig = {
    success: {
      icon: CheckCircle2,
      bgClass: 'bg-healthcare-emerald-50 dark:bg-healthcare-emerald-900/20',
      borderClass: 'border-healthcare-emerald-200 dark:border-healthcare-emerald-700',
      textClass: 'text-healthcare-emerald-800 dark:text-healthcare-emerald-300',
      iconClass: 'text-healthcare-emerald-600 dark:text-healthcare-emerald-400'
    },
    error: {
      icon: AlertCircle,
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      borderClass: 'border-red-200 dark:border-red-700',
      textClass: 'text-red-800 dark:text-red-300',
      iconClass: 'text-red-600 dark:text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderClass: 'border-yellow-200 dark:border-yellow-700',
      textClass: 'text-yellow-800 dark:text-yellow-300',
      iconClass: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      borderClass: 'border-blue-200 dark:border-blue-700',
      textClass: 'text-blue-800 dark:text-blue-300',
      iconClass: 'text-blue-600 dark:text-blue-400'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgClass} ${config.borderClass} border rounded-xl p-4 ${className}`}
      {...props}
    >
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
        <div className="flex-1">
          {title && <h4 className={`font-semibold mb-1 ${config.textClass}`}>{title}</h4>}
          <div className={config.textClass}>
            {children}
          </div>
        </div>
        {closable && (
          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className={`flex-shrink-0 ${config.textClass} hover:opacity-70`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const StatusBadge = ({
  status = 'available',
  className = '',
  ...props
}) => {
  const statusConfig = {
    available: { label: 'In Stock', class: 'status-badge-available' },
    unavailable: { label: 'Out of Stock', class: 'status-badge-unavailable' },
    lowstock: { label: 'Low Stock', class: 'status-badge-warning' }
  };

  const config = statusConfig[status] || statusConfig.available;

  return (
    <span className={`badge-healthcare ${config.class} ${className}`} {...props}>
      {config.label}
    </span>
  );
};

export default Badge;
