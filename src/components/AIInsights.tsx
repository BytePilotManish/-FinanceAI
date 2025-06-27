import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, DollarSign, RefreshCw, ArrowUpRight, Target, Shield } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiService, type FinancialInsight, type UserFinancialData } from '../services/aiService';
import Chat from './Chat';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface InsightCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const AIInsights = () => {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [userFinancialData, setUserFinancialData] = useState<UserFinancialData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const categories: InsightCategory[] = [
    { 
      id: 'all', 
      name: 'All Insights',
      icon: Brain,
      description: 'View all personalized financial insights and recommendations'
    },
    { 
      id: 'investment', 
      name: 'Investment',
      icon: TrendingUp,
      description: 'Personalized investment opportunities and portfolio advice'
    },
    { 
      id: 'risk', 
      name: 'Risk Analysis',
      icon: AlertTriangle,
      description: 'Risk assessment based on your financial profile'
    },
    { 
      id: 'opportunity', 
      name: 'Opportunities',
      icon: Target,
      description: 'Tailored financial opportunities for your situation'
    }
  ];

  useEffect(() => {
    fetchUserDataAndInsights();
  }, []);

  const fetchUserDataAndInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch comprehensive user financial data
      const userData = await aiService.fetchUserFinancialData();
      setUserFinancialData(userData);
      
      // Generate personalized insights based on user data
      const personalizedInsights = await aiService.getFinancialInsights(userData);
      setInsights(personalizedInsights);
      
      // Generate and send proactive alerts
      const proactiveAlerts = await aiService.generateProactiveAlerts(userData);
      if (proactiveAlerts.length > 0) {
        await aiService.sendProactiveNotifications(proactiveAlerts);
      }
      
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError('Unable to load personalized insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAIExplanation = async (insight: FinancialInsight) => {
    setIsAiThinking(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `As a financial advisor, provide a detailed explanation of this personalized insight for an Indian investor:

User's Financial Context:
- Total Balance: ₹${userFinancialData.totalBalance?.toLocaleString('en-IN') || 'N/A'}
- Monthly Income: ₹${userFinancialData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}
- Monthly Expenses: ₹${userFinancialData.monthlyExpenses?.toLocaleString('en-IN') || 'N/A'}
- Savings Rate: ${userFinancialData.savingsRate?.toFixed(1) || 'N/A'}%
- Active Goals: ${userFinancialData.goals?.length || 0}

Insight Details:
- Type: ${insight.type}
- Content: ${insight.content}
- Confidence: ${insight.confidence}%

Provide a detailed explanation including:
1. Why this insight is specifically relevant to this user's financial situation
2. How it affects their current financial goals and portfolio
3. Specific action steps they can take immediately
4. Expected outcomes and timeline
5. Relevant Indian market context and tax implications

Keep the response practical and actionable, focusing on the user's specific financial profile.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiResponse(response.text());
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setAiResponse('Unable to generate detailed explanation at the moment.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(insight => insight.type.toLowerCase().includes(selectedCategory));

  const getInsightColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'investment':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'risk':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'opportunity':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'tax planning':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'goal progress':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'investment':
        return TrendingUp;
      case 'risk':
        return AlertTriangle;
      case 'opportunity':
        return Target;
      case 'tax planning':
        return DollarSign;
      case 'goal progress':
        return Target;
      default:
        return Brain;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Personalized AI Financial Insights</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get AI-powered insights tailored to your financial profile and goals
          </p>
          
          {/* Financial Summary */}
          {userFinancialData.totalBalance && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Total Balance</div>
                <div className="text-lg font-bold text-gray-900">
                  ₹{userFinancialData.totalBalance.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Monthly Income</div>
                <div className="text-lg font-bold text-green-600">
                  ₹{userFinancialData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Savings Rate</div>
                <div className="text-lg font-bold text-blue-600">
                  {userFinancialData.savingsRate?.toFixed(1) || 'N/A'}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Active Goals</div>
                <div className="text-lg font-bold text-purple-600">
                  {userFinancialData.goals?.length || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Width Chat Section */}
        <div className="w-full">
          <Chat userFinancialData={userFinancialData} />
        </div>

        {/* Category Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-5 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                selectedCategory === category.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${
                  selectedCategory === category.id ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <category.icon className={`h-5 w-5 ${
                    selectedCategory === category.id ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className={`font-semibold ${
                  selectedCategory === category.id ? 'text-indigo-900' : 'text-gray-900'
                }`}>
                  {category.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
            </button>
          ))}
        </div>

        {/* Insights Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Personalized Insights</h2>
              <button
                onClick={fetchUserDataAndInsights}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-indigo-600 animate-pulse mb-4" />
                <span className="text-gray-600 font-medium">Analyzing your financial data...</span>
                <span className="text-gray-500 text-sm mt-1">Generating personalized insights</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Unable to Load Insights</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredInsights.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                    <p className="text-gray-600">No insights found for the selected category. Try refreshing or selecting a different category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredInsights.map((insight, index) => {
                      const IconComponent = getInsightIcon(insight.type);
                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-white"
                        >
                          {/* Insight Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl border ${getInsightColor(insight.type)}`}>
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{insight.type}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 font-medium">
                                    {insight.confidence}% Confidence
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => getAIExplanation(insight)}
                              disabled={isAiThinking}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Explain
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Insight Content */}
                          <div className="mb-4">
                            <p className="text-gray-700 leading-relaxed">{insight.content}</p>
                          </div>

                          {/* AI Explanation */}
                          {isAiThinking && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                <span className="text-sm text-gray-600 font-medium">Generating detailed explanation...</span>
                              </div>
                            </div>
                          )}

                          {aiResponse && !isAiThinking && (
                            <div className="mt-4 p-5 bg-indigo-50 rounded-xl border border-indigo-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="h-5 w-5 text-indigo-600" />
                                <h4 className="font-semibold text-indigo-900">Personalized Analysis</h4>
                              </div>
                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {aiResponse}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;