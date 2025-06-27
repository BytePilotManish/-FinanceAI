import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, PieChart, Brain } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase/client';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface RiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RiskScore {
  overall: number;
  categories: {
    [key: string]: number;
  };
  recommendations: string[];
}

const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState({
    investmentExperience: '',
    riskTolerance: '',
    investmentHorizon: '',
    incomeStability: '',
    emergencyFund: '',
    dependents: '',
    debtLevel: '',
    investmentKnowledge: '',
    monthlyIncome: '',
    existingInvestments: '',
    ageGroup: ''
  });

  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);

  const questions = [
    {
      id: 'ageGroup',
      question: 'What is your age group?',
      options: [
        { value: '18-25', label: '18-25 years' },
        { value: '26-35', label: '26-35 years' },
        { value: '36-45', label: '36-45 years' },
        { value: '46-55', label: '46-55 years' },
        { value: '56+', label: 'Above 55 years' }
      ]
    },
    {
      id: 'monthlyIncome',
      question: 'What is your monthly income range?',
      options: [
        { value: 'below50k', label: 'Below ₹50,000' },
        { value: '50k-1L', label: '₹50,000 - ₹1,00,000' },
        { value: '1L-2L', label: '₹1,00,000 - ₹2,00,000' },
        { value: 'above2L', label: 'Above ₹2,00,000' }
      ]
    },
    {
      id: 'investmentExperience',
      question: 'How many years of investment experience do you have?',
      options: [
        { value: 'novice', label: 'Less than 1 year' },
        { value: 'intermediate', label: '1-5 years' },
        { value: 'experienced', label: '5-10 years' },
        { value: 'expert', label: 'More than 10 years' }
      ]
    },
    {
      id: 'riskTolerance',
      question: 'How would you react to a 20% decline in your investment value?',
      options: [
        { value: 'conservative', label: 'Sell immediately to prevent further losses' },
        { value: 'moderate', label: 'Wait and watch for some time' },
        { value: 'aggressive', label: 'Buy more at lower prices' }
      ]
    },
    {
      id: 'investmentHorizon',
      question: 'What is your primary investment time horizon?',
      options: [
        { value: 'short', label: 'Less than 3 years' },
        { value: 'medium', label: '3-7 years' },
        { value: 'long', label: 'More than 7 years' }
      ]
    },
    {
      id: 'incomeStability',
      question: 'How stable is your current income?',
      options: [
        { value: 'unstable', label: 'Highly variable/uncertain' },
        { value: 'moderate', label: 'Somewhat stable' },
        { value: 'stable', label: 'Very stable' }
      ]
    },
    {
      id: 'emergencyFund',
      question: 'How many months of expenses do you have saved in emergency funds?',
      options: [
        { value: 'none', label: 'No emergency fund' },
        { value: 'some', label: '1-3 months' },
        { value: 'adequate', label: '3-6 months' },
        { value: 'excellent', label: 'More than 6 months' }
      ]
    },
    {
      id: 'dependents',
      question: 'How many financial dependents do you have?',
      options: [
        { value: 'none', label: 'None' },
        { value: 'few', label: '1-2' },
        { value: 'many', label: '3 or more' }
      ]
    },
    {
      id: 'debtLevel',
      question: 'What is your current debt level (excluding home loan)?',
      options: [
        { value: 'none', label: 'No debt' },
        { value: 'low', label: 'Less than 20% of annual income' },
        { value: 'moderate', label: '20-50% of annual income' },
        { value: 'high', label: 'More than 50% of annual income' }
      ]
    }
  ];

  useEffect(() => {
    const requiredAnswered = questions.every(q => answers[q.id as keyof typeof answers] !== '');
    setAllQuestionsAnswered(requiredAnswered);

    if (requiredAnswered) {
      calculateRiskProfile();
    }
  }, [answers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allQuestionsAnswered) {
      setError('Please answer all questions');
      return;
    }
    await calculateRiskProfile();
  };

  const calculateRiskProfile = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `As a financial risk analyst, analyze this investor profile and provide a detailed risk assessment:

Age Group: ${answers.ageGroup}
Monthly Income: ${answers.monthlyIncome}
Investment Experience: ${answers.investmentExperience}
Risk Tolerance: ${answers.riskTolerance}
Investment Horizon: ${answers.investmentHorizon}
Income Stability: ${answers.incomeStability}
Emergency Fund: ${answers.emergencyFund}
Dependents: ${answers.dependents}
Debt Level: ${answers.debtLevel}

Provide a JSON response with:
1. Overall risk score (0-100)
2. Category-wise scores for:
   - Market Risk Tolerance
   - Financial Security
   - Investment Capacity
   - Knowledge & Experience
3. 3-4 specific investment recommendations

Format:
{
  "overall": number,
  "categories": {
    "marketRiskTolerance": number,
    "financialSecurity": number,
    "investmentCapacity": number,
    "knowledgeExperience": number
  },
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3"
  ]
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean the response text by removing markdown code block delimiters
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsedScore = JSON.parse(cleanedText);
        setRiskScore(parsedScore);
      } catch (error) {
        console.error('Error parsing AI response:', error);
        const calculatedScore = calculateBasicRiskScore();
        setRiskScore(calculatedScore);
      }
    } catch (error) {
      console.error('Error getting AI risk analysis:', error);
      const calculatedScore = calculateBasicRiskScore();
      setRiskScore(calculatedScore);
    } finally {
      setLoading(false);
    }
  };

  const calculateBasicRiskScore = (): RiskScore => {
    const scores = {
      marketRiskTolerance: 0,
      financialSecurity: 0,
      investmentCapacity: 0,
      knowledgeExperience: 0
    };

    scores.marketRiskTolerance = answers.riskTolerance === 'aggressive' ? 90 :
      answers.riskTolerance === 'moderate' ? 60 : 30;

    scores.financialSecurity = answers.emergencyFund === 'excellent' ? 90 :
      answers.emergencyFund === 'adequate' ? 70 :
      answers.emergencyFund === 'some' ? 40 : 20;

    scores.investmentCapacity = answers.incomeStability === 'stable' ? 85 :
      answers.incomeStability === 'moderate' ? 60 : 35;

    scores.knowledgeExperience = answers.investmentExperience === 'expert' ? 90 :
      answers.investmentExperience === 'experienced' ? 75 :
      answers.investmentExperience === 'intermediate' ? 50 : 25;

    const overall = Math.round(
      (scores.marketRiskTolerance + scores.financialSecurity + 
       scores.investmentCapacity + scores.knowledgeExperience) / 4
    );

    return {
      overall,
      categories: scores,
      recommendations: [
        "Consider a balanced portfolio with debt and equity mutual funds",
        "Build emergency fund before aggressive investments",
        "Focus on tax-saving investments under Section 80C"
      ]
    };
  };

  const saveRiskProfile = async () => {
    if (!riskScore) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      const riskProfile = {
        user_id: userData.user.id,
        risk_score: riskScore.overall,
        risk_categories: riskScore.categories,
        recommendations: riskScore.recommendations,
        answers: answers,
        assessment_date: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('risk_profiles')
        .insert(riskProfile);

      if (insertError) throw insertError;

      onClose();
    } catch (err: any) {
      console.error('Error saving risk profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Risk Analysis Assessment</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {questions.map((q) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={q.id}
                        value={option.value}
                        checked={answers[q.id as keyof typeof answers] === option.value}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!allQuestionsAnswered || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Calculate Risk Profile'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
                <span className="ml-2 text-gray-600">Analyzing risk profile...</span>
              </div>
            ) : riskScore ? (
              <>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Overall Risk Profile</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{riskScore.overall}</span>
                      </div>
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="#eee"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke={
                            riskScore.overall < 30 ? '#22c55e' :
                            riskScore.overall < 60 ? '#eab308' : '#ef4444'
                          }
                          strokeWidth="8"
                          strokeDasharray={`${riskScore.overall * 3.77} 377`}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      riskScore.overall < 30 ? 'bg-green-100 text-green-800' :
                      riskScore.overall < 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {riskScore.overall < 30 ? 'Conservative' :
                       riskScore.overall < 60 ? 'Moderate' : 'Aggressive'} Risk Profile
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Risk Categories</h3>
                  <div className="space-y-4">
                    {Object.entries(riskScore.categories).map(([category, score]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {riskScore.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="p-1 rounded-full bg-green-100">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={saveRiskProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving Profile...' : 'Save Profile'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-12">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <span className="ml-2 text-gray-600">
                  Complete all questions to see your risk analysis
                </span>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisModal;