import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Transactions from '../components/Transactions';
import Analytics from '../components/Analytics';
import AIInsights from '../components/AIInsights';
import AIAssistant from '../components/AIAssistant';
import Notifications from '../components/Notifications';
import Security from '../components/Security';
import Settings from '../components/Settings';
import Calculators from '../components/Calculators';
import LoanRiskAssessment from '../components/LoanRiskAssessment';
import AutomatedTrading from '../components/AutomatedTrading';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/loan-assessment" element={<LoanRiskAssessment />} />
          <Route path="/automated-trading" element={<AutomatedTrading />} />
        </Routes>
      </main>
    </div>
  );
};

export default MainLayout;