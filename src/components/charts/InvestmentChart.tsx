import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InvestmentData {
  name: string;
  investments: number;
  returns: number;
}

const InvestmentChart = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6M');
  const [chartData, setChartData] = useState<InvestmentData[]>([]);
  const timeframes = ['1M', '3M', '6M', '1Y', 'ALL'];

  useEffect(() => {
    generateChartData(selectedTimeframe);
  }, [selectedTimeframe]);

  const generateChartData = (timeframe: string) => {
    const data: InvestmentData[] = [];
    const now = new Date();
    let numberOfPoints: number;
    let interval: number;

    switch (timeframe) {
      case '1M':
        numberOfPoints = 30;
        interval = 1;
        break;
      case '3M':
        numberOfPoints = 90;
        interval = 3;
        break;
      case '6M':
        numberOfPoints = 180;
        interval = 6;
        break;
      case '1Y':
        numberOfPoints = 365;
        interval = 12;
        break;
      case 'ALL':
        numberOfPoints = 730; // 2 years
        interval = 24;
        break;
      default:
        numberOfPoints = 180;
        interval = 6;
    }

    let baseInvestment = 250000;
    let baseReturn = 35000;
    const growthRate = 1.015; // 1.5% growth per interval
    const volatility = 0.1; // 10% volatility

    for (let i = 0; i < numberOfPoints; i += interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - (numberOfPoints - i));

      // Add some randomness and trends
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      baseInvestment *= growthRate * randomFactor;
      baseReturn *= growthRate * randomFactor;

      // Add seasonal variations
      const month = date.getMonth();
      const seasonalFactor = 1 + Math.sin(month / 12 * Math.PI) * 0.05; // 5% seasonal variation

      data.push({
        name: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        investments: Math.round(baseInvestment * seasonalFactor),
        returns: Math.round(baseReturn * seasonalFactor)
      });
    }

    setChartData(data);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Investment Trends</h2>
        <div className="flex gap-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-lg text-sm ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="investments"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Investments"
            />
            <Line
              type="monotone"
              dataKey="returns"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Returns"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InvestmentChart;