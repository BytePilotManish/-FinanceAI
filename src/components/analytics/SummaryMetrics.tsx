import React from 'react';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';
import MetricCard from './MetricCard';

const metrics = [
  {
    title: 'Total Investments',
    amount: '₹52,45,000',
    percentage: 18.2,
    icon: TrendingUp,
    iconBgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Total Returns',
    amount: '₹8,75,000',
    percentage: 12.5,
    icon: DollarSign,
    iconBgColor: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    title: 'Portfolio Balance',
    amount: '₹61,20,000',
    percentage: 15.8,
    icon: PieChart,
    iconBgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
  }
];

const SummaryMetrics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default SummaryMetrics;