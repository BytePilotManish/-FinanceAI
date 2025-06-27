import React from 'react';
import { LayoutDashboard, Wallet, LineChart, Bell, Settings, Shield, Brain, LogOut, Calculator, CreditCard, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wallet, label: 'Transactions', path: '/transactions' },
    { icon: LineChart, label: 'Analytics', path: '/analytics' },
    { icon: Calculator, label: 'Calculators', path: '/calculators' },
    { icon: CreditCard, label: 'Loan Assessment', path: '/loan-assessment' },
    { icon: TrendingUp, label: 'AI Trading', path: '/automated-trading' },
    { icon: Brain, label: 'AI Insights', path: '/ai-insights' },
    { 
      icon: Bell, 
      label: 'Notifications', 
      path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { icon: Shield, label: 'Security', path: '/security' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAskAI = () => {
    navigate('/ai-assistant');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 px-3 py-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Brain className="h-8 w-8 text-indigo-600" />
        <span className="text-xl font-bold text-gray-800">FinanceAI</span>
      </div>
      
      <nav className="flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors mb-1 relative ${
              location.pathname === item.path
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">AI Assistant</h3>
          <p className="text-xs text-indigo-700">Get personalized financial insights with our AI assistant</p>
          <button 
            onClick={handleAskAI}
            className="mt-3 w-full bg-indigo-600 text-white py-2 px-3 rounded-md text-sm hover:bg-indigo-700 transition-colors"
          >
            Ask AI
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;