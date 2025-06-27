import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, MessageSquare, Brain, ArrowUpRight, Sparkles, AlertTriangle } from 'lucide-react';
import { aiService, type ChatMessage, type UserFinancialData } from '../services/aiService';

interface ChatProps {
  userFinancialData?: UserFinancialData;
}

interface SuggestedQuestion {
  text: string;
  category: string;
}

const Chat: React.FC<ChatProps> = ({ userFinancialData = {} }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate personalized suggested questions based on user data
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);

  useEffect(() => {
    generatePersonalizedQuestions();
  }, [userFinancialData]);

  const generatePersonalizedQuestions = () => {
    const questions: SuggestedQuestion[] = [];
    
    // Base questions
    questions.push(
      { text: "How can I optimize my current investment portfolio?", category: "Investment" },
      { text: "What tax-saving strategies should I consider?", category: "Tax" }
    );

    // Personalized questions based on user data
    if (userFinancialData.savingsRate !== undefined) {
      if (userFinancialData.savingsRate < 20) {
        questions.push({ text: "How can I improve my savings rate?", category: "Savings" });
      } else {
        questions.push({ text: "Where should I invest my surplus savings?", category: "Investment" });
      }
    }

    if (userFinancialData.goals && userFinancialData.goals.length > 0) {
      questions.push({ text: "Am I on track to achieve my financial goals?", category: "Goals" });
    } else {
      questions.push({ text: "What financial goals should I set for my situation?", category: "Planning" });
    }

    if (userFinancialData.monthlyExpenses && userFinancialData.monthlyIncome) {
      const expenseRatio = (userFinancialData.monthlyExpenses / userFinancialData.monthlyIncome) * 100;
      if (expenseRatio > 80) {
        questions.push({ text: "How can I reduce my monthly expenses?", category: "Budgeting" });
      }
    }

    setSuggestedQuestions(questions.slice(0, 4));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      // Send message with user financial data for personalized responses
      const response = await aiService.sendMessage(input, userFinancialData);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'investment':
        return 'bg-blue-100 text-blue-600';
      case 'tax':
        return 'bg-green-100 text-green-600';
      case 'savings':
        return 'bg-purple-100 text-purple-600';
      case 'goals':
        return 'bg-yellow-100 text-yellow-600';
      case 'planning':
        return 'bg-indigo-100 text-indigo-600';
      case 'budgeting':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getWelcomeMessage = () => {
    if (userFinancialData.totalBalance) {
      return `Welcome! I can see you have ₹${userFinancialData.totalBalance.toLocaleString('en-IN')} across ${userFinancialData.accounts?.length || 0} accounts. I'm here to provide personalized financial advice based on your specific situation.`;
    }
    return "Welcome to your personalized AI Financial Assistant! I can provide tailored advice based on your financial profile.";
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <Bot className="w-6 h-6 text-indigo-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Personalized AI Financial Assistant</h2>
          <p className="text-sm text-gray-600">
            {userFinancialData.totalBalance 
              ? `Tailored advice for your ₹${userFinancialData.totalBalance.toLocaleString('en-IN')} portfolio`
              : "Ask me anything about your finances"
            }
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 bg-indigo-50 rounded-full">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Personal Financial AI</h3>
              <p className="text-gray-600 mt-2 max-w-md">
                {getWelcomeMessage()}
              </p>
            </div>
            
            {/* Personalized Quick Actions */}
            {userFinancialData.totalBalance && (
              <div className="bg-blue-50 p-4 rounded-lg max-w-md">
                <h4 className="font-medium text-blue-900 mb-2">Your Financial Snapshot</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-600">Balance:</span>
                    <span className="ml-1 font-medium">₹{userFinancialData.totalBalance.toLocaleString('en-IN')}</span>
                  </div>
                  {userFinancialData.savingsRate !== undefined && (
                    <div>
                      <span className="text-blue-600">Savings Rate:</span>
                      <span className="ml-1 font-medium">{userFinancialData.savingsRate.toFixed(1)}%</span>
                    </div>
                  )}
                  <div>
                    <span className="text-blue-600">Accounts:</span>
                    <span className="ml-1 font-medium">{userFinancialData.accounts?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Goals:</span>
                    <span className="ml-1 font-medium">{userFinancialData.goals?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question.text)}
                  className="flex items-center gap-2 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-gray-700">{question.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } p-4`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <div className="p-1 bg-white rounded-lg">
                        <Bot className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <div className="prose max-w-none">
                        {typeof message.content === 'string' ? (
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                        ) : (
                          message.content
                        )}
                      </div>
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-white rounded-lg">
                      <Brain className="h-4 w-4 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Contextual Suggested Questions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question.text)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(question.category)}`}>
                    {question.category}
                  </span>
                  <span className="text-sm text-gray-700">{question.text}</span>
                  <ArrowUpRight className="h-3 w-3 text-gray-400" />
                </button>
              ))}
            </div>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your finances, investments, or financial goals..."
            className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;