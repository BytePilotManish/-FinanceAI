import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Percent, Clock, DollarSign, Building, Briefcase, Brain } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface CalculatorConfig {
  id: string;
  name: string;
  icon: any;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  amountStep: number;
  label: string;
  unit: string;
}

const Calculators = () => {
  const [activeCalculator, setActiveCalculator] = useState('sip');
  const [amount, setAmount] = useState('25000');
  const [duration, setDuration] = useState('10');
  const [rate, setRate] = useState('12');
  const [result, setResult] = useState<number | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const calculatorConfigs: Record<string, CalculatorConfig> = {
    sip: {
      id: 'sip',
      name: 'SIP Calculator',
      icon: TrendingUp,
      minAmount: 500,
      maxAmount: 100000,
      defaultAmount: 25000,
      amountStep: 500,
      label: 'Monthly Investment',
      unit: '₹'
    },
    fd: {
      id: 'fd',
      name: 'FD Calculator',
      icon: Building,
      minAmount: 1000,
      maxAmount: 10000000,
      defaultAmount: 100000,
      amountStep: 1000,
      label: 'Principal Amount',
      unit: '₹'
    },
    rd: {
      id: 'rd',
      name: 'RD Calculator',
      icon: Clock,
      minAmount: 500,
      maxAmount: 100000,
      defaultAmount: 10000,
      amountStep: 500,
      label: 'Monthly Deposit',
      unit: '₹'
    },
    ppf: {
      id: 'ppf',
      name: 'PPF Calculator',
      icon: Briefcase,
      minAmount: 500,
      maxAmount: 150000,
      defaultAmount: 25000,
      amountStep: 500,
      label: 'Yearly Investment',
      unit: '₹'
    },
    lumpsum: {
      id: 'lumpsum',
      name: 'Lumpsum Calculator',
      icon: DollarSign,
      minAmount: 1000,
      maxAmount: 10000000,
      defaultAmount: 100000,
      amountStep: 1000,
      label: 'Investment Amount',
      unit: '₹'
    },
    emi: {
      id: 'emi',
      name: 'EMI Calculator',
      icon: Percent,
      minAmount: 10000,
      maxAmount: 10000000,
      defaultAmount: 1000000,
      amountStep: 10000,
      label: 'Loan Amount',
      unit: '₹'
    }
  };

  useEffect(() => {
    calculateResult();
  }, [amount, duration, rate, activeCalculator]);

  const calculateResult = () => {
    if (!amount || !duration || !rate) return;

    const p = parseFloat(amount);
    const t = parseFloat(duration);
    const r = parseFloat(rate) / 100;

    let futureValue = 0;

    switch (activeCalculator) {
      case 'sip':
        const monthlyRate = r / 12;
        const months = t * 12;
        futureValue = p * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        break;

      case 'fd':
        futureValue = p * Math.pow(1 + r, t);
        break;

      case 'rd':
        const rdMonths = t * 12;
        futureValue = p * rdMonths * (1 + (r * (rdMonths + 1)) / (2 * 12));
        break;

      case 'ppf':
        futureValue = p * ((Math.pow(1 + r, t) - 1) / r);
        break;

      case 'lumpsum':
        futureValue = p * Math.pow(1 + r, t);
        break;

      case 'emi':
        const monthlyInterest = r / 12;
        const emiMonths = t * 12;
        const emi = p * monthlyInterest * Math.pow(1 + monthlyInterest, emiMonths) / (Math.pow(1 + monthlyInterest, emiMonths) - 1);
        futureValue = emi * emiMonths;
        break;
    }

    setResult(Math.round(futureValue));
  };

  const getAIInsights = async () => {
    if (!result) return;

    setIsAIThinking(true);
    setAiError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `As a financial advisor, analyze this ${calculatorConfigs[activeCalculator].name} calculation:

Investment Details:
- Type: ${calculatorConfigs[activeCalculator].name}
- ${calculatorConfigs[activeCalculator].label}: ₹${amount}
- Duration: ${duration} years
- Interest Rate: ${rate}%
- Final Amount: ₹${result.toLocaleString('en-IN')}

Provide a detailed analysis including:
1. Whether this is a good investment strategy based on typical Indian market conditions
2. Potential risks and considerations
3. Tax implications in Indian context
4. Alternative investment suggestions if applicable
5. Tips to maximize returns

Keep the response concise but informative, focusing on practical advice for Indian investors.`;

      const geminiResult = await model.generateContent(prompt);
      const response = await geminiResult.response;
      setAiInterpretation(response.text());
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setAiError('Unable to get AI insights at the moment. Please try again later.');
    } finally {
      setIsAIThinking(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getInvestedAmount = () => {
    const p = parseFloat(amount);
    const t = parseFloat(duration);
    
    switch (activeCalculator) {
      case 'sip':
      case 'rd':
        return p * t * 12;
      case 'ppf':
        return p * t;
      case 'fd':
      case 'lumpsum':
        return p;
      case 'emi':
        return parseFloat(amount);
      default:
        return 0;
    }
  };

  const getEstimatedReturns = () => {
    if (!result) return 0;
    return result - getInvestedAmount();
  };

  const pieData = [
    { name: 'Invested Amount', value: getInvestedAmount() },
    { name: 'Est. Returns', value: getEstimatedReturns() }
  ];

  const COLORS = ['#EBF5FF', '#3B82F6'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Calculators</h1>
        <p className="text-gray-600">Plan your investments with our AI-powered financial calculators</p>
      </div>

      {/* Calculator Types */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.values(calculatorConfigs).map((calc) => (
          <button
            key={calc.id}
            onClick={() => setActiveCalculator(calc.id)}
            className={`p-4 rounded-xl border ${
              activeCalculator === calc.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50'
            } transition-all`}
          >
            <div className="flex flex-col items-center gap-2">
              <calc.icon className={`h-6 w-6 ${
                activeCalculator === calc.id ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <span className={`text-sm font-medium ${
                activeCalculator === calc.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {calc.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Calculator Interface */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {calculatorConfigs[activeCalculator].label}
                </label>
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-blue-600 font-medium">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-24 bg-transparent text-blue-600 font-medium focus:outline-none text-right"
                  />
                </div>
              </div>
              <input
                type="range"
                min={calculatorConfigs[activeCalculator].minAmount}
                max={calculatorConfigs[activeCalculator].maxAmount}
                step={calculatorConfigs[activeCalculator].amountStep}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatCurrency(calculatorConfigs[activeCalculator].minAmount)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatCurrency(calculatorConfigs[activeCalculator].maxAmount)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {activeCalculator === 'emi' ? 'Interest Rate (p.a)' : 'Expected Return Rate (p.a)'}
                </label>
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-16 bg-transparent text-blue-600 font-medium focus:outline-none text-right"
                  />
                  <span className="text-blue-600 font-medium">%</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">1%</span>
                <span className="text-xs text-gray-500">30%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Time Period
                </label>
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-16 bg-transparent text-blue-600 font-medium focus:outline-none text-right"
                  />
                  <span className="text-blue-600 font-medium">Yr</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max={activeCalculator === 'ppf' ? '15' : '30'}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">1 Yr</span>
                <span className="text-xs text-gray-500">
                  {activeCalculator === 'ppf' ? '15 Yr' : '30 Yr'}
                </span>
              </div>
            </div>

            <button 
              onClick={getAIInsights}
              disabled={!result || isAIThinking}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Brain className="h-5 w-5" />
              {isAIThinking ? 'Getting AI Insights...' : 'Get AI Insights'}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="flex justify-center mb-8">
              <PieChart width={280} height={280}>
                <Pie
                  data={pieData}
                  cx={140}
                  cy={140}
                  innerRadius={100}
                  outerRadius={120}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {activeCalculator === 'emi' ? 'Principal Amount' : 'Invested Amount'}
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(getInvestedAmount())}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {activeCalculator === 'emi' ? 'Total Interest' : 'Est. Returns'}
                </span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(getEstimatedReturns())}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-900 font-medium">
                  {activeCalculator === 'emi' ? 'Total Payment' : 'Total Value'}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {result ? formatCurrency(result) : '-'}
                </span>
              </div>
            </div>

            {/* AI Insights Section */}
            {(aiInterpretation || isAIThinking || aiError) && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">AI Insights</h3>
                </div>
                
                {isAIThinking ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : aiError ? (
                  <div className="text-red-600 text-sm">{aiError}</div>
                ) : (
                  <div className="text-gray-700 text-sm whitespace-pre-line">
                    {aiInterpretation}
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

export default Calculators;