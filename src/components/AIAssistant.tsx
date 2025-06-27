import React from 'react';
import { Bot, MessageSquare, Clock, Brain, Mic, Phone } from 'lucide-react';

function SummaryCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 whitespace-pre-line">{content}</p>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">AI Assistant</h1>
          </div>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto">
            Your intelligent financial companion powered by advanced AI
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Widget Section */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">AI Chat</h2>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                Active
              </span>
            </div>
            <iframe
              title="AI Assistant Widget"
              src="https://widget.synthflow.ai/widget/v2/1731600691113x902019418336273800/1731600691005x760354133032618500"
              allow="microphone"
              className="w-full h-[600px] border border-blue-100 rounded-xl bg-white/50"
            />
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">Conversation Insights</h2>
            </div>

            <SummaryCard
              title="Key Points Discussed"
              content={`• Market analysis for Q1 2024
• Investment strategy review
• Risk assessment updates
• Portfolio rebalancing recommendations`}
            />

            <SummaryCard
              title="Action Items"
              content={`• Schedule portfolio review
• Update risk tolerance assessment
• Review proposed asset allocation
• Set up monthly performance tracking`}
            />

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Session Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">Duration: 45 minutes</p>
                <p className="text-gray-600">Topics Covered: 4</p>
                <p className="text-gray-600">Decisions Made: 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
