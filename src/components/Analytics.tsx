import React, { useState } from 'react';
import { Target, Shield } from 'lucide-react';
import Button from './ui/Button';
import SummaryMetrics from './analytics/SummaryMetrics';
import FinancialGoals from './analytics/FinancialGoals';
import MarketInsights from './analytics/MarketInsights';
import InvestmentChart from './charts/InvestmentChart';
import PortfolioDistribution from './charts/PortfolioDistribution';
import SetGoalModal from './modals/SetGoalModal';
import RiskAnalysisModal from './modals/RiskAnalysisModal';

const Analytics = () => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const handleSaveGoal = (goalData: any) => {
    console.log('Saving goal:', goalData);
    setIsGoalModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Analytics</h1>
          <p className="text-gray-600">Comprehensive analysis of your financial portfolio</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            icon={<Target className="h-4 w-4" />}
            onClick={() => setIsGoalModalOpen(true)}
          >
            Set New Goal
          </Button>
          <Button
            variant="secondary"
            icon={<Shield className="h-4 w-4" />}
            onClick={() => setIsRiskModalOpen(true)}
          >
            Risk Analysis
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <SummaryMetrics />

      {/* Financial Goals */}
      <FinancialGoals />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentChart />
        <PortfolioDistribution />
      </div>

      {/* Market Insights */}
      <MarketInsights />

      {/* Modals */}
      <SetGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
      <RiskAnalysisModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />
    </div>
  );
};

export default Analytics;