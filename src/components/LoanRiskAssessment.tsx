import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Settings, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loanAssessmentService } from '../services/loanAssessmentService';
import { supabase } from '../lib/supabase/client';
import type { LoanAssessment } from '../lib/supabase/types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface FormData {
  personal_info: {
    full_name: string;
    age: string;
    marital_status: string;
    dependents: string;
    education: string;
  };
  financial_info: {
    income: string;
    employment_type: string;
    employment_years: string;
    credit_score: string;
    existing_loans: string;
    monthly_expenses: string;
  };
  loan_info: {
    amount: string;
    term: string;
    purpose: string;
  };
  assets_info: {
    total_assets: string;
    property_ownership: boolean;
    vehicle_ownership: boolean;
  };
}

const LoanRiskAssessment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    personal_info: {
      full_name: '',
      age: '',
      marital_status: 'single',
      dependents: '0',
      education: 'graduate'
    },
    financial_info: {
      income: '',
      employment_type: 'salaried',
      employment_years: '',
      credit_score: '',
      existing_loans: '0',
      monthly_expenses: ''
    },
    loan_info: {
      amount: '',
      term: '',
      purpose: 'personal'
    },
    assets_info: {
      total_assets: '0',
      property_ownership: false,
      vehicle_ownership: false
    }
  });

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<LoanAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousAssessments, setPreviousAssessments] = useState<LoanAssessment[]>([]);

  useEffect(() => {
    loadPreviousAssessments();
  }, []);

  const loadPreviousAssessments = async () => {
    try {
      const assessments = await loanAssessmentService.getAssessments();
      setPreviousAssessments(assessments);
    } catch (error) {
      console.error('Error loading previous assessments:', error);
    }
  };

  const handleInputChange = (section: keyof FormData, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return Object.values(formData.personal_info).every(val => val !== '');
      case 2:
        return Object.values(formData.financial_info).every(val => val !== '');
      case 3:
        return Object.values(formData.loan_info).every(val => val !== '');
      case 4:
        return true; // Assets are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError(null);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }

    setIsAssessing(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `As an AI loan risk assessor, analyze this loan application for an Indian context:

Personal Information:
- Age: ${formData.personal_info.age}
- Marital Status: ${formData.personal_info.marital_status}
- Dependents: ${formData.personal_info.dependents}
- Education: ${formData.personal_info.education}

Financial Information:
- Monthly Income: ₹${formData.financial_info.income}
- Employment Type: ${formData.financial_info.employment_type}
- Years Employed: ${formData.financial_info.employment_years}
- Credit Score: ${formData.financial_info.credit_score}
- Existing Loans: ₹${formData.financial_info.existing_loans}
- Monthly Expenses: ₹${formData.financial_info.monthly_expenses}

Loan Details:
- Loan Amount: ₹${formData.loan_info.amount}
- Loan Term: ${formData.loan_info.term} years
- Purpose: ${formData.loan_info.purpose}

Assets:
- Total Assets: ₹${formData.assets_info.total_assets}
- Owns Property: ${formData.assets_info.property_ownership}
- Owns Vehicle: ${formData.assets_info.vehicle_ownership}

Provide a JSON response with:
{
  "risk_score": <number 0-100>,
  "risk_breakdown": {
    "credit_risk": <number 0-100>,
    "income_stability": <number 0-100>,
    "debt_burden": <number 0-100>,
    "asset_coverage": <number 0-100>,
    "employment_stability": <number 0-100>
  },
  "recommendations": [
    <string>,
    <string>,
    <string>
  ],
  "summary": <string>
}

Consider Indian financial context, RBI guidelines, and typical lending criteria.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const aiResponse = JSON.parse(cleanedText);

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('No authenticated user');

        const assessment: Omit<LoanAssessment, 'id' | 'created_at'> = {
          user_id: userData.user.id,
          assessment_date: new Date().toISOString(),
          loan_application_data: formData,
          risk_score: aiResponse.risk_score,
          risk_breakdown: aiResponse.risk_breakdown,
          recommendations: aiResponse.recommendations,
          summary: aiResponse.summary
        };

        const savedAssessment = await loanAssessmentService.saveAssessment(assessment);
        setAssessmentResult(savedAssessment);
        loadPreviousAssessments();
      } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to analyze loan application');
      }
    } catch (error: any) {
      console.error('Error in loan assessment:', error);
      setError(error.message || 'Failed to complete loan assessment');
    } finally {
      setIsAssessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.personal_info.full_name}
                  onChange={(e) => handleInputChange('personal_info', 'full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.personal_info.age}
                  onChange={(e) => handleInputChange('personal_info', 'age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="18"
                  max="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  value={formData.personal_info.marital_status}
                  onChange={(e) => handleInputChange('personal_info', 'marital_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Dependents</label>
                <input
                  type="number"
                  value={formData.personal_info.dependents}
                  onChange={(e) => handleInputChange('personal_info', 'dependents', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                <select
                  value={formData.personal_info.education}
                  onChange={(e) => handleInputChange('personal_info', 'education', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="high_school">High School</option>
                  <option value="graduate">Graduate</option>
                  <option value="post_graduate">Post Graduate</option>
                  <option value="doctorate">Doctorate</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={formData.financial_info.income}
                  onChange={(e) => handleInputChange('financial_info', 'income', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={formData.financial_info.employment_type}
                  onChange={(e) => handleInputChange('financial_info', 'employment_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business">Business Owner</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Employment</label>
                <input
                  type="number"
                  value={formData.financial_info.employment_years}
                  onChange={(e) => handleInputChange('financial_info', 'employment_years', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
                <input
                  type="number"
                  value={formData.financial_info.credit_score}
                  onChange={(e) => handleInputChange('financial_info', 'credit_score', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="300"
                  max="900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Loans (₹)</label>
                <input
                  type="number"
                  value={formData.financial_info.existing_loans}
                  onChange={(e) => handleInputChange('financial_info', 'existing_loans', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses (₹)</label>
                <input
                  type="number"
                  value={formData.financial_info.monthly_expenses}
                  onChange={(e) => handleInputChange('financial_info', 'monthly_expenses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Loan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
                <input
                  type="number"
                  value={formData.loan_info.amount}
                  onChange={(e) => handleInputChange('loan_info', 'amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                <input
                  type="number"
                  value={formData.loan_info.term}
                  onChange={(e) => handleInputChange('loan_info', 'term', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose</label>
                <select
                  value={formData.loan_info.purpose}
                  onChange={(e) => handleInputChange('loan_info', 'purpose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="personal">Personal Loan</option>
                  <option value="home">Home Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="vehicle">Vehicle Loan</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Assets Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Assets Value (₹)</label>
                <input
                  type="number"
                  value={formData.assets_info.total_assets}
                  onChange={(e) => handleInputChange('assets_info', 'total_assets', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.assets_info.property_ownership}
                    onChange={(e) => handleInputChange('assets_info', 'property_ownership', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Own Property</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.assets_info.vehicle_ownership}
                    onChange={(e) => handleInputChange('assets_info', 'vehicle_ownership', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Own Vehicle</span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Loan Risk Assessment</h1>
        <p className="text-gray-600">Get instant risk analysis for loan applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Brain className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Loan Application</h2>
              </div>
              <div className="text-sm text-gray-600">
                Step {currentStep} of 4
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStep()}

            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 ml-auto"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isAssessing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 ml-auto disabled:opacity-50"
                >
                  {isAssessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Analyze Risk
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {assessmentResult && (
            <>
              {/* Risk Score */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Risk Assessment Result</h2>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{assessmentResult.risk_score}</span>
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
                          assessmentResult.risk_score < 30 ? '#22c55e' :
                          assessmentResult.risk_score < 60 ? '#eab308' : '#ef4444'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${assessmentResult.risk_score * 3.77} 377`}
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assessmentResult.risk_score < 30 ? 'bg-green-100 text-green-800' :
                    assessmentResult.risk_score < 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {assessmentResult.risk_score < 30 ? 'Low Risk' :
                     assessmentResult.risk_score < 60 ? 'Moderate Risk' : 'High Risk'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm">{assessmentResult.summary}</p>
              </div>

              {/* Risk Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(assessmentResult.risk_breakdown).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score < 30 ? 'bg-green-500' :
                            score < 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {assessmentResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Previous Assessments */}
          {previousAssessments.length > 0 && !assessmentResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Assessments</h3>
              <div className="space-y-4">
                {previousAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          assessment.risk_score < 30 ? 'bg-green-500' :
                          assessment.risk_score < 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-gray-900">
                          {assessment.loan_application_data.loan_info.purpose.charAt(0).toUpperCase() +
                           assessment.loan_application_data.loan_info.purpose.slice(1)} Loan
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(assessment.assessment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Amount: ₹{parseInt(assessment.loan_application_data.loan_info.amount).toLocaleString('en-IN')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assessment.risk_score < 30 ? 'bg-green-100 text-green-800' :
                        assessment.risk_score < 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Risk Score: {assessment.risk_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanRiskAssessment;