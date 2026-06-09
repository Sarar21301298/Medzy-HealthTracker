import React from 'react';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardBody, Button } from './ui';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend = null,
  trendValue = null,
  onClick = null,
  className = '',
  color = 'green',
  ...props
}) => {
  const colorClasses = {
    green: 'text-healthcare-green-600 dark:text-healthcare-green-400 bg-healthcare-green-100 dark:bg-healthcare-green-900/20',
    teal: 'text-healthcare-teal-600 dark:text-healthcare-teal-400 bg-healthcare-teal-100 dark:bg-healthcare-teal-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownLeft : null;
  const trendColorClass = trend === 'up' ? 'text-healthcare-green-600' : 'text-red-600';

  return (
    <Card 
      className={`hover:shadow-soft-lg transition-all duration-300 cursor-pointer ${onClick ? 'hover:scale-105 transform' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <CardBody className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 ${trendColorClass}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{trendValue || '0%'}</span>
            </div>
          )}
        </div>
        <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
          {title}
        </h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
      </CardBody>
    </Card>
  );
};

export const DashboardCard = ({
  title,
  icon: Icon,
  children,
  action = null,
  className = '',
  ...props
}) => {
  return (
    <Card className={`shadow-soft hover:shadow-soft-lg transition-all duration-300 ${className}`} {...props}>
      <CardBody className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-healthcare-green-100 dark:bg-healthcare-green-900/20 rounded-lg text-healthcare-green-600 dark:text-healthcare-green-400">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          {action && (
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <action.icon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div>
          {children}
        </div>
      </CardBody>
    </Card>
  );
};

export const MetricRow = ({
  label,
  value,
  icon: Icon = null,
  trend = null,
  subtext = null,
  className = '',
  ...props
}) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownLeft : TrendingUp;
  const trendColorClass = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${className}`} {...props}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="text-healthcare-green-600 dark:text-healthcare-green-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          {subtext && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtext}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <TrendIcon className={`h-4 w-4 ${trendColorClass}`} />
        )}
      </div>
    </div>
  );
};

export const ProgressCard = ({
  title,
  progress = 0,
  color = 'green',
  label = null,
  ...props
}) => {
  const colorClasses = {
    green: 'bg-healthcare-green-600',
    teal: 'bg-healthcare-teal-600',
    red: 'bg-red-600',
    blue: 'bg-blue-600',
  };

  return (
    <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300" {...props}>
      <CardBody className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="text-sm font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`${colorClasses[color]} h-full transition-all duration-500 rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {label && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {label}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

export const ActionCard = ({
  icon: Icon,
  title,
  description,
  action = null,
  className = '',
  ...props
}) => {
  return (
    <Card className={`card-healthcare-hover text-center p-6 ${className}`} {...props}>
      <CardBody>
        <div className="p-4 w-fit mx-auto rounded-2xl mb-4 bg-healthcare-green-100 dark:bg-healthcare-green-900/20 text-healthcare-green-600 dark:text-healthcare-green-400">
          {Icon && <Icon className="h-8 w-8" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        {action && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={action.onClick}
            className="group"
          >
            {action.label}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

export default StatCard;
