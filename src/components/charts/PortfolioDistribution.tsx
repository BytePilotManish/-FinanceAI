import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const portfolioData = [
  { name: 'Stocks', value: 45, color: '#3B82F6' },
  { name: 'Mutual Funds', value: 25, color: '#60A5FA' },
  { name: 'Fixed Deposits', value: 15, color: '#93C5FD' },
  { name: 'Gold', value: 10, color: '#BFDBFE' },
  { name: 'Real Estate', value: 5, color: '#DBEAFE' }
];

const PortfolioDistribution = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Distribution</h2>
      <div className="flex items-center justify-between">
        <div className="h-[300px] w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-4">
          {portfolioData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <span className="font-medium text-gray-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDistribution;