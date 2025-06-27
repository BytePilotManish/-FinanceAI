import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  Brain, 
  AlertTriangle,
  Target,
  Calculator
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MarketInsightCard from './MarketInsightCard';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface MarketAnalysis {
  positiveIndicators: string[];
  riskFactors: string[];
  strategicActions: string[];
  taxPlanning: string[];
  lastSynced: Date;
  isLoading: boolean;
}

const MarketInsights = () => {
  const [analysis, setAnalysis] = useState<MarketAnalysis>({
    positiveIndicators: [],
    riskFactors: [],
    strategicActions: [],
    taxPlanning: [],
    lastSynced: new Date(),
    isLoading: true
  });

  const fetchMarketAnalysis = async () => {
    setAnalysis(prev => ({ ...prev, isLoading: true }));
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze the current Indian financial market and provide:
        1. Four positive market indicators with specific numbers (e.g., Nifty movements, sector performance)
        2. Four risk factors or challenges
        3. Four strategic investment actions
        4. Four tax planning recommendations
        Focus on:
        - Nifty and Sensex performance
        - Key sector movements
        - FII/DII flows
        - Economic indicators
        - Indian tax laws and regulations
        Format the response in four sections with bullet points.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      const sections = text.split('\n\n');
      const positiveSection = sections[0]?.split('\n').filter(line => line.startsWith('•') || line.startsWith('-'));
      const riskSection = sections[1]?.split('\n').filter(line => line.startsWith('•') || line.startsWith('-'));
      const strategicSection = sections[2]?.split('\n').filter(line => line.startsWith('•') || line.startsWith('-'));
      const taxSection = sections[3]?.split('\n').filter(line => line.startsWith('•') || line.startsWith('-'));

      setAnalysis({
        positiveIndicators: positiveSection || [],
        riskFactors: riskSection || [],
        strategicActions: strategicSection || [],
        taxPlanning: taxSection || [],
        lastSynced: new Date(),
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      setAnalysis(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchMarketAnalysis();
    // Refresh every 30 minutes
    const interval = setInterval(fetchMarketAnalysis, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSynced = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Market Insights</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last synced: {formatLastSynced(analysis.lastSynced)}
          </span>
          <button
            onClick={fetchMarketAnalysis}
            disabled={analysis.isLoading}
            className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${analysis.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {analysis.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketInsightCard
            title="Market Analysis"
            items={analysis.positiveIndicators}
            icon={TrendingUp}
            variant="positive"
          />
          <MarketInsightCard
            title="Risk Factors"
            items={analysis.riskFactors}
            icon={AlertTriangle}
            variant="risk"
          />
          <MarketInsightCard
            title="Strategic Actions"
            items={analysis.strategicActions}
            icon={Target}
            variant="action"
          />
          <MarketInsightCard
            title="Tax Planning"
            items={analysis.taxPlanning}
            icon={Calculator}
            variant="tax"
          />
        </div>
      )}
    </div>
  );
};

export default MarketInsights;