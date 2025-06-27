import React from 'react';
import { X, Smartphone, Download, Star, Shield, Zap, CreditCard } from 'lucide-react';

interface MobileBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileBankingModal: React.FC<MobileBankingModalProps> = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Send money instantly to any bank account'
    },
    {
      icon: CreditCard,
      title: 'Bill Payments',
      description: 'Pay all your bills in one place'
    },
    {
      icon: Shield,
      title: 'Secure Banking',
      description: 'Bank-grade security with biometric login'
    },
    {
      icon: Star,
      title: 'Investment Tracking',
      description: 'Monitor your portfolio on the go'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Mobile Banking</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">FinanceAI Mobile App</h3>
          <p className="text-gray-600">Experience seamless banking on your mobile device</p>
        </div>

        <div className="space-y-4 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-50 rounded-lg">
                <feature.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          <button className="w-full flex items-center justify-center gap-3 p-3 bg-black text-white rounded-lg hover:bg-gray-800">
            <Download className="h-5 w-5" />
            Download for iOS
          </button>
          <button className="w-full flex items-center justify-center gap-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="h-5 w-5" />
            Download for Android
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Scan QR code to download directly to your phone
          </p>
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
            <span className="text-gray-500 text-xs">QR Code</span>
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

export default MobileBankingModal;