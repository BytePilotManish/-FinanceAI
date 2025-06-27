import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FinancialGoalCardProps {
  name: string;
  icon: LucideIcon;
  progress: number;
  current: string;
  target: string;
}

const FinancialGoalCard: React.FC<FinancialGoalCardProps> = ({
  name,
  icon: Icon,
  progress,
  current,
  target
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="font-medium text-gray-900">{name}</h3>
      </div>
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Current: {current}</span>
        <span className="text-gray-900">Target: {target}</span>
      </div>
    </div>
  );
};

export default FinancialGoalCard;