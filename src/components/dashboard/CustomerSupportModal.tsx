import React, { useState } from 'react';
import { X, Phone, MessageCircle, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({ isOpen, onClose }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      description: '24/7 customer service',
      action: 'Call Now',
      details: '+91 1800-123-4567',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      details: 'Average response: 2 minutes',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us your queries',
      action: 'Send Email',
      details: 'support@financeai.com',
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the login page and following the instructions sent to your registered email.'
    },
    {
      question: 'How do I add a new bank account?',
      answer: 'Click on the "Add" button in your dashboard, select "Bank Account", and fill in your account details including bank name, account number, and IFSC code.'
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes, we use bank-grade encryption and security measures to protect your data. All transactions are secured with SSL encryption and we never store your banking passwords.'
    },
    {
      question: 'How do I download my account statements?',
      answer: 'Go to the three-dot menu in your dashboard, select "Statements", choose your account and date range, then click download.'
    },
    {
      question: 'What should I do if I notice unauthorized transactions?',
      answer: 'Immediately contact our support team at +91 1800-123-4567 or use live chat. We will help you secure your account and investigate the transactions.'
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Customer Support</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {contactMethods.map((method, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <method.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{method.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{method.description}</p>
              <p className="text-xs text-gray-500 mb-3">{method.details}</p>
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {method.action}
              </button>
            </div>
          ))}
        </div>

        {/* Operating Hours */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Support Hours</h3>
          </div>
          <div className="text-sm text-blue-800">
            <p>Phone Support: 24/7</p>
            <p>Live Chat: Monday - Friday, 9:00 AM - 9:00 PM IST</p>
            <p>Email Support: Response within 24 hours</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-3">
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportModal;