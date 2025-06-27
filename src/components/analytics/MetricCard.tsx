import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  amount: string;
  percentage: number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  percentage,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600'
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-xl font-bold text-gray-900">{amount}</h3>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className="text-green-600 flex items-center">
          +{percentage}% <ArrowUpRight className="h-4 w-4" />
        </span>
        <span className="text-gray-600 ml-2">vs last month</span>
      </div>
    </div>
  );
};

export default MetricCard;