import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MarketInsightCardProps {
  title: string;
  items: string[];
  icon: LucideIcon;
  variant: 'positive' | 'risk' | 'action' | 'tax';
}

const MarketInsightCard: React.FC<MarketInsightCardProps> = ({ title, items, icon: Icon, variant }) => {
  const variants = {
    positive: {
      wrapper: 'bg-green-50/30 border-green-100',
      iconWrapper: 'bg-green-100',
      icon: 'text-green-600',
      dot: 'bg-green-500'
    },
    risk: {
      wrapper: 'bg-red-50/30 border-red-100',
      iconWrapper: 'bg-red-100',
      icon: 'text-red-600',
      dot: 'bg-red-500'
    },
    action: {
      wrapper: 'bg-blue-50/30 border-blue-100',
      iconWrapper: 'bg-blue-100',
      icon: 'text-blue-600',
      dot: 'bg-blue-500'
    },
    tax: {
      wrapper: 'bg-purple-50/30 border-purple-100',
      iconWrapper: 'bg-purple-100',
      icon: 'text-purple-600',
      dot: 'bg-purple-500'
    }
  };

  const styles = variants[variant];

  return (
    <div className={`rounded-xl border p-6 ${styles.wrapper}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${styles.iconWrapper} rounded-lg`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-700">
            <span className={`w-1.5 h-1.5 ${styles.dot} rounded-full`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MarketInsightCard;