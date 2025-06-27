import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Settings, Play, Pause, RefreshCw, DollarSign, Info, BookOpen, Shield, Target, Clock, BarChart3 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface TradeSignal {
  timestamp: Date;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  price: number;
  reasoning: string;
  marketSentiment: string;
  technicalIndicators: string;
  riskAssessment: string;
  expectedReturn: number;
  stopLoss: number;
  takeProfit: number;
}

interface TradingState {
  isActive: boolean;
  currentBalance: number;
  totalTrades: number;
  successfulTrades: number;
  profitLoss: number;
  lastUpdated: Date;
  maxDrawdown: number;
  winRate: number;
  avgTradeReturn: number;
  totalVolume: number;
}

interface MarketData {
  timestamp: Date;
  price: number;
  volume: number;
  change: number;
}

interface TradeHistory {
  id: string;
  timestamp: Date;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  pnl: number;
  reasoning: string;
  duration?: number;
}

interface TradingSettings {
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  tradeSize: number; // percentage of balance
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  maxDailyTrades: number;
  enableTrailingStop: boolean;
  minConfidence: number;
}

const AutomatedTrading = () => {
  const [tradingState, setTradingState] = useState<TradingState>({
    isActive: false,
    currentBalance: 100000, // Initial balance ₹1,00,000
    totalTrades: 0,
    successfulTrades: 0,
    profitLoss: 0,
    lastUpdated: new Date(),
    maxDrawdown: 0,
    winRate: 0,
    avgTradeReturn: 0,
    totalVolume: 0
  });

  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('NIFTY50');
  const [timeframe, setTimeframe] = useState('5m');
  const [isLoading, setIsLoading] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTradeHistory, setShowTradeHistory] = useState(false);

  const [settings, setSettings] = useState<TradingSettings>({
    riskLevel: 'moderate',
    tradeSize: 10, // 10% of balance
    stopLoss: 2, // 2%
    takeProfit: 4, // 4%
    maxDailyTrades: 5,
    enableTrailingStop: false,
    minConfidence: 70
  });

  // Mock market data generation
  useEffect(() => {
    const generateMarketData = () => {
      const now = new Date();
      const newData: MarketData[] = [];
      let basePrice = 19500; // Starting NIFTY50 price

      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now.getTime() - (100 - i) * 5 * 60000);
        const change = (Math.random() - 0.5) * 20;
        basePrice += change;
        
        newData.push({
          timestamp,
          price: basePrice,
          volume: Math.random() * 1000000 + 500000,
          change: change
        });
      }

      setMarketData(newData);
    };

    generateMarketData();
    const interval = setInterval(generateMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced AI Signal Generation
  const generateTradeSignal = async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const recentData = marketData.slice(-10);
      
      const prompt = `As an advanced AI trading expert analyzing ${selectedAsset}, provide a comprehensive trading recommendation in JSON format:

MARKET DATA:
Recent Prices: ${recentData.map(d => d.price.toFixed(2)).join(', ')}
Volumes: ${recentData.map(d => Math.round(d.volume)).join(', ')}
Price Changes: ${recentData.map(d => d.change.toFixed(2)).join(', ')}

TRADING PARAMETERS:
Risk Level: ${settings.riskLevel}
Min Confidence: ${settings.minConfidence}%
Stop Loss: ${settings.stopLoss}%
Take Profit: ${settings.takeProfit}%

ANALYSIS REQUIREMENTS:
1. Technical Analysis (RSI, MACD, Moving Averages)
2. Market Sentiment (Bullish/Bearish/Neutral)
3. Risk Assessment (High/Medium/Low)
4. Expected Return Calculation
5. Entry/Exit Strategy

RESPONSE FORMAT (JSON only):
{
  "action": "buy" | "sell" | "hold",
  "confidence": <number 0-100>,
  "reasoning": "<detailed 2-3 sentence explanation>",
  "marketSentiment": "<bullish/bearish/neutral with brief reason>",
  "technicalIndicators": "<key technical signals observed>",
  "riskAssessment": "<risk level and factors>",
  "expectedReturn": <percentage return expected>,
  "stopLoss": <recommended stop loss price>,
  "takeProfit": <recommended take profit price>
}

Consider current market volatility, volume trends, and provide actionable insights for ${settings.riskLevel} risk tolerance.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      try {
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        const aiResponse = JSON.parse(jsonStr);
        
        if (!aiResponse.action || !aiResponse.confidence || !aiResponse.reasoning) {
          throw new Error('Invalid response format');
        }

        const newSignal: TradeSignal = {
          timestamp: new Date(),
          action: aiResponse.action as 'buy' | 'sell' | 'hold',
          confidence: Math.min(100, Math.max(0, aiResponse.confidence)),
          price: marketData[marketData.length - 1].price,
          reasoning: aiResponse.reasoning,
          marketSentiment: aiResponse.marketSentiment || 'Neutral market conditions',
          technicalIndicators: aiResponse.technicalIndicators || 'Mixed signals',
          riskAssessment: aiResponse.riskAssessment || 'Medium risk',
          expectedReturn: aiResponse.expectedReturn || 0,
          stopLoss: aiResponse.stopLoss || marketData[marketData.length - 1].price * 0.98,
          takeProfit: aiResponse.takeProfit || marketData[marketData.length - 1].price * 1.02
        };

        setSignals(prev => [...prev.slice(-9), newSignal]); // Keep last 10 signals
        
        // Only execute if confidence meets minimum threshold
        if (newSignal.confidence >= settings.minConfidence) {
          executeTradeSignal(newSignal);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', text);
      }
    } catch (error) {
      console.error('Error generating trade signal:', error);
    }
  };

  // Enhanced Trade Execution with detailed tracking
  const executeTradeSignal = (signal: TradeSignal) => {
    if (signal.action === 'hold') return;

    const tradeAmount = (tradingState.currentBalance * settings.tradeSize) / 100;
    const quantity = tradeAmount / signal.price;
    
    // Simulate trade outcome based on confidence and market conditions
    const baseSuccessRate = signal.confidence / 100;
    const riskMultiplier = settings.riskLevel === 'conservative' ? 0.8 : 
                          settings.riskLevel === 'moderate' ? 1.0 : 1.2;
    
    const outcome = Math.random() * baseSuccessRate * riskMultiplier;
    const isSuccessful = outcome > 0.5;
    
    let pnl = 0;
    if (isSuccessful) {
      pnl = tradeAmount * (signal.expectedReturn / 100) * (0.8 + Math.random() * 0.4);
    } else {
      pnl = -tradeAmount * (settings.stopLoss / 100) * (0.5 + Math.random() * 0.5);
    }

    const newTrade: TradeHistory = {
      id: `TRADE_${Date.now()}`,
      timestamp: new Date(),
      action: signal.action,
      price: signal.price,
      quantity,
      amount: tradeAmount,
      pnl,
      reasoning: signal.reasoning,
      duration: Math.floor(Math.random() * 120) + 30 // 30-150 minutes
    };

    setTradeHistory(prev => [newTrade, ...prev.slice(0, 49)]); // Keep last 50 trades

    setTradingState(prev => {
      const newBalance = prev.currentBalance + pnl;
      const newTotalTrades = prev.totalTrades + 1;
      const newSuccessfulTrades = prev.successfulTrades + (isSuccessful ? 1 : 0);
      const newProfitLoss = prev.profitLoss + pnl;
      const newWinRate = (newSuccessfulTrades / newTotalTrades) * 100;
      const newAvgReturn = newProfitLoss / newTotalTrades;
      const drawdown = Math.min(prev.maxDrawdown, (newBalance - 100000) / 100000 * 100);

      return {
        ...prev,
        currentBalance: newBalance,
        totalTrades: newTotalTrades,
        successfulTrades: newSuccessfulTrades,
        profitLoss: newProfitLoss,
        winRate: newWinRate,
        avgTradeReturn: newAvgReturn,
        maxDrawdown: Math.min(drawdown, prev.maxDrawdown),
        totalVolume: prev.totalVolume + tradeAmount,
        lastUpdated: new Date()
      };
    });
  };

  // Start/Stop Trading
  const toggleTrading = () => {
    setTradingState(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tradingState.isActive) {
      interval = setInterval(generateTradeSignal, 8000); // Every 8 seconds
    }
    return () => clearInterval(interval);
  }, [tradingState.isActive, settings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Simulation Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Trading Simulator</h1>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                SIMULATION MODE
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              Advanced paper trading environment powered by AI - No real money involved
            </p>
          </div>
          <button
            onClick={toggleTrading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              tradingState.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
            }`}
          >
            {tradingState.isActive ? (
              <>
                <Pause className="h-5 w-5" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start Simulation
              </>
            )}
          </button>
        </div>

        {/* Simulation Disclaimer */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">📊 This is a Simulated Trading Environment</h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• <strong>No Real Money:</strong> All trades are hypothetical and use virtual currency</p>
                <p>• <strong>Educational Purpose:</strong> Learn trading strategies and AI decision-making without financial risk</p>
                <p>• <strong>Paper Trading:</strong> Test different approaches and understand market dynamics safely</p>
                <p>• <strong>AI Learning:</strong> Experience how artificial intelligence analyzes market data and makes trading decisions</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowEducation(true)}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Trading Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Portfolio Value</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(tradingState.currentBalance)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Initial: ₹1,00,000
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total P&L</span>
          </div>
          <div className={`text-xl font-bold ${
            tradingState.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {tradingState.profitLoss >= 0 ? '+' : ''}
            {formatCurrency(tradingState.profitLoss)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {((tradingState.profitLoss / 100000) * 100).toFixed(2)}% return
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Target className="h-4 w-4" />
            <span className="text-sm">Win Rate</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {tradingState.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {tradingState.successfulTrades}/{tradingState.totalTrades} trades
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Avg Return</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(tradingState.avgTradeReturn)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Per trade
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Max Drawdown</span>
          </div>
          <div className="text-xl font-bold text-red-600">
            {tradingState.maxDrawdown.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Peak to trough
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Volume</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(tradingState.totalVolume)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Traded amount
          </div>
        </div>
      </div>

      {/* Market Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Market Performance</h2>
          <div className="flex gap-4">
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="NIFTY50">NIFTY 50</option>
              <option value="BANKNIFTY">BANK NIFTY</option>
              <option value="SENSEX">SENSEX</option>
              <option value="RELIANCE">RELIANCE</option>
              <option value="TCS">TCS</option>
            </select>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
            </select>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Recent Signals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">AI Trading Signals</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTradeHistory(!showTradeHistory)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Trade History
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {signals.slice(-5).reverse().map((signal, index) => (
            <div key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  signal.action === 'buy' ? 'bg-green-50' :
                  signal.action === 'sell' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    signal.action === 'buy' ? 'text-green-600' :
                    signal.action === 'sell' ? 'text-red-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {signal.action.toUpperCase()} Signal - {selectedAsset}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{signal.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        signal.confidence > 80 ? 'bg-green-100 text-green-800' :
                        signal.confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {signal.confidence}% Confidence
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Signal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Market Sentiment</p>
                      <p className="text-sm font-medium text-gray-700">{signal.marketSentiment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technical Indicators</p>
                      <p className="text-sm font-medium text-gray-700">{signal.technicalIndicators}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Risk Assessment</p>
                      <p className="text-sm font-medium text-gray-700">{signal.riskAssessment}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-1 font-medium">₹{signal.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected Return:</span>
                      <span className="ml-1 font-medium text-green-600">+{signal.expectedReturn.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stop Loss:</span>
                      <span className="ml-1 font-medium text-red-600">₹{signal.stopLoss.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Take Profit:</span>
                      <span className="ml-1 font-medium text-green-600">₹{signal.takeProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {signals.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No trading signals yet. Start the simulation to see AI-generated signals.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trade History Modal */}
      {showTradeHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Trade History</h3>
              <button
                onClick={() => setShowTradeHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {tradeHistory.map((trade) => (
                <div key={trade.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.action === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.action.toUpperCase()}
                      </span>
                      <span className="font-medium">₹{trade.price.toFixed(2)}</span>
                      <span className="text-gray-600">Qty: {trade.quantity.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trade.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{trade.reasoning}</p>
                  {trade.duration && (
                    <p className="text-xs text-gray-500 mt-1">Duration: {trade.duration} minutes</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Trading Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <select
                  value={settings.riskLevel}
                  onChange={(e) => setSettings({...settings, riskLevel: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade Size: {settings.tradeSize}% of balance
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={settings.tradeSize}
                  onChange={(e) => setSettings({...settings, tradeSize: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss: {settings.stopLoss}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.stopLoss}
                  onChange={(e) => setSettings({...settings, stopLoss: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit: {settings.takeProfit}%
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={settings.takeProfit}
                  onChange={(e) => setSettings({...settings, takeProfit: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Confidence: {settings.minConfidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={settings.minConfidence}
                  onChange={(e) => setSettings({...settings, minConfidence: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trailingStop"
                  checked={settings.enableTrailingStop}
                  onChange={(e) => setSettings({...settings, enableTrailingStop: e.target.checked})}
                />
                <label htmlFor="trailingStop" className="text-sm text-gray-700">
                  Enable Trailing Stop Loss
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Modal */}
      {showEducation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">About AI Trading Simulation</h3>
              <button
                onClick={() => setShowEducation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 What is Paper Trading?</h4>
                <p className="text-sm">
                  Paper trading is a simulated trading environment where you can practice trading strategies 
                  without risking real money. It's an essential tool for learning and testing new approaches.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🤖 How Our AI Works</h4>
                <p className="text-sm">
                  Our AI analyzes market data, technical indicators, and sentiment to generate trading signals. 
                  It considers factors like price trends, volume, volatility, and risk parameters to make decisions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Key Features</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Real-time market data simulation</li>
                  <li>• Advanced AI signal generation</li>
                  <li>• Risk management tools</li>
                  <li>• Detailed performance analytics</li>
                  <li>• Educational trading experience</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚠️ Important Disclaimers</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• This is for educational purposes only</li>
                  <li>• Past performance doesn't guarantee future results</li>
                  <li>• Real trading involves significant risks</li>
                  <li>• Always consult financial advisors for real investments</li>
                  <li>• Market conditions can be unpredictable</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Learning Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• Start with conservative settings</li>
                  <li>• Observe AI reasoning for each signal</li>
                  <li>• Track your performance metrics</li>
                  <li>• Experiment with different risk levels</li>
                  <li>• Learn from both winning and losing trades</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedTrading;