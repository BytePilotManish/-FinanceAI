import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Download, Info } from 'lucide-react';

interface FlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  period: string;
  weekNumber?: number;
  monthName?: string;
}

interface CashFlowChartProps {
  selectedView: string;
  onViewChange: (view: string) => void;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ selectedView, onViewChange }) => {
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const viewOptions = [
    { id: 'weekly', label: 'Weekly', days: 14 },
    { id: 'daily', label: 'Daily', days: 30 },
    { id: 'monthly', label: 'Monthly', days: 365 }
  ];

  useEffect(() => {
    generateFlowData();
  }, [selectedView]);

  const generateFlowData = () => {
    const data: FlowData[] = [];
    const now = new Date();
    
    if (selectedView === 'weekly') {
      // Generate 12 weeks of data
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        
        const weekNumber = getWeekNumber(weekStart);
        const inflow = Math.random() * 80000 + 40000;
        const outflow = Math.random() * 60000 + 30000;
        
        data.push({
          date: weekStart.toISOString().split('T')[0],
          inflow: Math.round(inflow),
          outflow: Math.round(outflow),
          netFlow: Math.round(inflow - outflow),
          period: `W${weekNumber}`,
          weekNumber,
          monthName: weekStart.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    } else if (selectedView === 'daily') {
      // Generate 30 days of data
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let baseInflow = Math.random() * 15000 + 8000;
        let baseOutflow = Math.random() * 12000 + 5000;
        
        // Reduce activity on weekends
        if (isWeekend) {
          baseInflow *= 0.6;
          baseOutflow *= 0.8;
        }
        
        data.push({
          date: date.toISOString().split('T')[0],
          inflow: Math.round(baseInflow),
          outflow: Math.round(baseOutflow),
          netFlow: Math.round(baseInflow - baseOutflow),
          period: date.getDate().toString()
        });
      }
    } else {
      // Generate 12 months of data
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        
        const inflow = Math.random() * 300000 + 200000;
        const outflow = Math.random() * 250000 + 150000;
        
        data.push({
          date: date.toISOString().split('T')[0],
          inflow: Math.round(inflow),
          outflow: Math.round(outflow),
          netFlow: Math.round(inflow - outflow),
          period: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    }
    
    setFlowData(data);
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Enhanced Download Function
  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Prepare data for export
      const exportData = flowData.map((data, index) => ({
        'Period': selectedView === 'weekly' ? `Week ${data.weekNumber} (${data.monthName})` : 
                 selectedView === 'daily' ? new Date(data.date).toLocaleDateString('en-IN') :
                 data.period,
        'Date': data.date,
        'Inflow (₹)': data.inflow.toLocaleString('en-IN'),
        'Outflow (₹)': data.outflow.toLocaleString('en-IN'),
        'Net Flow (₹)': data.netFlow.toLocaleString('en-IN'),
        'Inflow Raw': data.inflow,
        'Outflow Raw': data.outflow,
        'Net Flow Raw': data.netFlow
      }));

      // Calculate summary statistics
      const totalInflow = flowData.reduce((sum, d) => sum + d.inflow, 0);
      const totalOutflow = flowData.reduce((sum, d) => sum + d.outflow, 0);
      const netFlow = totalInflow - totalOutflow;
      const avgInflow = totalInflow / flowData.length;
      const avgOutflow = totalOutflow / flowData.length;
      const profitablePeriods = flowData.filter(d => d.netFlow > 0).length;

      // Create CSV content
      const headers = Object.keys(exportData[0]);
      const csvRows = [
        // Title and metadata
        [`Cash Flow Analysis Report - ${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} View`],
        [`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`],
        [''],
        
        // Summary statistics
        ['SUMMARY STATISTICS'],
        [`Total Inflow,₹${totalInflow.toLocaleString('en-IN')}`],
        [`Total Outflow,₹${totalOutflow.toLocaleString('en-IN')}`],
        [`Net Cash Flow,₹${netFlow.toLocaleString('en-IN')}`],
        [`Average Inflow,₹${avgInflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
        [`Average Outflow,₹${avgOutflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
        [`Profitable Periods,${profitablePeriods} out of ${flowData.length}`],
        [`Success Rate,${((profitablePeriods / flowData.length) * 100).toFixed(1)}%`],
        [''],
        
        // Data headers
        ['DETAILED DATA'],
        headers.slice(0, 5), // Only include display columns, not raw data
        
        // Data rows
        ...exportData.map(row => [
          row['Period'],
          row['Date'],
          row['Inflow (₹)'],
          row['Outflow (₹)'],
          row['Net Flow (₹)']
        ])
      ];

      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        Array.isArray(row) ? row.join(',') : row
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cash-flow-${selectedView}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Show success message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Cash flow data exported successfully!
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);

    } catch (error) {
      console.error('Error downloading cash flow data:', error);
      
      // Show error message
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      errorNotification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Failed to export data. Please try again.
      `;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const maxValue = Math.max(...flowData.map(d => Math.max(d.inflow, d.outflow)));
  const totalInflow = flowData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = flowData.reduce((sum, d) => sum + d.outflow, 0);
  const netFlow = totalInflow - totalOutflow;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatFullCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-blue-900">Cash Flow Analysis</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex bg-blue-100 rounded-lg p-1">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onViewChange(option.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedView === option.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-blue-50 flex-shrink-0"
            title="Download cash flow data as CSV"
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Total Inflow</span>
          </div>
          <div className="text-xl font-bold text-blue-900">{formatCurrency(totalInflow)}</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingDown className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-700">Total Outflow</span>
          </div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(totalOutflow)}</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Net Flow</span>
          </div>
          <div className={`text-xl font-bold ${netFlow >= 0 ? 'text-blue-900' : 'text-blue-600'}`}>
            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-blue-50/30 rounded-lg p-4 overflow-hidden">
        {/* Chart */}
        <div className="h-[240px] flex items-end justify-center gap-2 mb-4 px-2 relative">
          {flowData.map((data, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 relative group cursor-pointer"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ width: `${100 / flowData.length}%`, maxWidth: '60px' }}
            >
              {/* Bar Container */}
              <div className="flex flex-col gap-1 w-full items-center relative">
                {/* Inflow Bar */}
                <div
                  className="bg-blue-600 rounded-t-sm w-full transition-all duration-200 hover:bg-blue-700 relative"
                  style={{
                    height: `${Math.max((data.inflow / maxValue) * 180, 4)}px`,
                    minHeight: '4px'
                  }}
                >
                  {hoveredBar === i && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(data.inflow)}
                    </div>
                  )}
                </div>
                
                {/* Outflow Bar */}
                <div
                  className="bg-blue-300 rounded-b-sm w-full transition-all duration-200 hover:bg-blue-400 relative"
                  style={{
                    height: `${Math.max((data.outflow / maxValue) * 180, 4)}px`,
                    minHeight: '4px'
                  }}
                >
                  {hoveredBar === i && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-300 text-blue-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(data.outflow)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Period Label */}
              <div className="text-xs text-blue-600 text-center mt-2 font-medium min-h-[16px] flex items-center justify-center">
                {data.period}
              </div>
              
              {/* Detailed Tooltip */}
              {hoveredBar === i && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-30">
                  <div className="bg-blue-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[180px] border border-blue-700">
                    <div className="font-medium mb-2 text-blue-100">
                      {selectedView === 'weekly' ? `Week ${data.weekNumber} (${data.monthName})` : 
                       selectedView === 'daily' ? new Date(data.date).toLocaleDateString('en-IN') :
                       data.period}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-blue-300">Inflow:</span>
                        <span className="text-white font-medium">{formatFullCurrency(data.inflow)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300">Outflow:</span>
                        <span className="text-white font-medium">{formatFullCurrency(data.outflow)}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-700 pt-1 mt-1">
                        <span className="font-medium text-blue-200">Net:</span>
                        <span className={`font-bold ${data.netFlow >= 0 ? 'text-blue-100' : 'text-blue-300'}`}>
                          {data.netFlow >= 0 ? '+' : ''}{formatFullCurrency(data.netFlow)}
                        </span>
                      </div>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm pt-2 border-t border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-blue-700 font-medium">Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span className="text-blue-700 font-medium">Outflow</span>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Cash Flow Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Period Analysis</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Showing {flowData.length} {selectedView === 'weekly' ? 'weeks' : selectedView === 'daily' ? 'days' : 'months'}</li>
                <li>• Average inflow: {formatCurrency(totalInflow / flowData.length)}</li>
                <li>• Average outflow: {formatCurrency(totalOutflow / flowData.length)}</li>
                <li>• Best period: {formatCurrency(Math.max(...flowData.map(d => d.netFlow)))}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Performance Metrics</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• {netFlow >= 0 ? 'Positive' : 'Negative'} net cash flow</li>
                <li>• {flowData.filter(d => d.netFlow > 0).length} profitable periods</li>
                <li>• Flow ratio: {((totalInflow / totalOutflow) * 100).toFixed(1)}%</li>
                <li>• Volatility: {selectedView === 'daily' ? 'High' : selectedView === 'weekly' ? 'Medium' : 'Low'}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Click the download button to export this data as a CSV file with detailed analytics and summary statistics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowChart;