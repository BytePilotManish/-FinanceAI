import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import Button from "../components/ui/Button"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { ArrowUpRight, MoreHorizontal, Plus, Send, ArrowDown, ArrowUp, Filter, CreditCard, Settings, Smartphone, FileText, Phone, ArrowDownLeft } from 'lucide-react'

// Import modals
import AddAccountModal from './dashboard/AddAccountModal';
import ManageCardsModal from './dashboard/ManageCardsModal';
import AccountSettingsModal from './dashboard/AccountSettingsModal';
import MobileBankingModal from './dashboard/MobileBankingModal';
import StatementsModal from './dashboard/StatementsModal';
import CustomerSupportModal from './dashboard/CustomerSupportModal';
import SendMoneyModal from './dashboard/SendMoneyModal';
import RequestMoneyModal from './dashboard/RequestMoneyModal';
import CashFlowChart from './dashboard/CashFlowChart';
import { NotificationTriggers } from './dashboard/NotificationTriggers';
import { aiService } from '../services/aiService';

interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  method: string;
  methodDetails: string;
}

interface FlowData {
  inflow: number;
  outflow: number;
  date: string;
}

const Dashboard = () => {
  const [selectedView, setSelectedView] = useState('weekly');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Activity;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filterConfig, setFilterConfig] = useState({
    type: 'all',
    status: 'all',
    method: 'all'
  });
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileBankingModalOpen, setIsMobileBankingModalOpen] = useState(false);
  const [isStatementsModalOpen, setIsStatementsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Sample activities data
  const sampleActivities: Activity[] = [
    {
      id: "TXN001",
      name: "Rahul Sharma",
      type: "deposit",
      date: "Oct 19, 2024",
      time: "14:30",
      amount: 45000,
      status: "success",
      method: "Credit Card",
      methodDetails: "**** 3560"
    },
    {
      id: "TXN002",
      name: "Priya Patel",
      type: "withdrawal",
      date: "Oct 18, 2024",
      time: "11:15",
      amount: 22500,
      status: "pending",
      method: "Bank Transfer",
      methodDetails: "**** 2285"
    },
    {
      id: "TXN003",
      name: "Mutual Fund Investment",
      type: "investment",
      date: "Oct 18, 2024",
      time: "09:45",
      amount: 100000,
      status: "success",
      method: "Net Banking",
      methodDetails: "HDFC Bank"
    },
    {
      id: "TXN004",
      name: "Stock Purchase",
      type: "investment",
      date: "Oct 17, 2024",
      time: "15:20",
      amount: 75000,
      status: "failed",
      method: "UPI",
      methodDetails: "@upi/user"
    },
    {
      id: "TXN005",
      name: "Dividend Credit",
      type: "income",
      date: "Oct 17, 2024",
      time: "10:00",
      amount: 5000,
      status: "success",
      method: "Direct Credit",
      methodDetails: "Company XYZ"
    },
    {
      id: "TXN006",
      name: "Fixed Deposit",
      type: "investment",
      date: "Oct 16, 2024",
      time: "16:45",
      amount: 200000,
      status: "success",
      method: "Net Banking",
      methodDetails: "SBI Bank"
    }
  ];

  // Sample accounts data
  const accounts = [
    {
      name: 'Savings Account',
      number: '**** 5678',
      balance: 2211110.10
    },
    {
      name: 'Current Account',
      number: '**** 9012',
      balance: 1605110.40
    },
    {
      name: 'Investment Account',
      number: '**** 3456',
      balance: 8888888.70
    },
    {
      name: 'Tax Savings Account',
      number: '**** 7890',
      balance: 1500000.00
    },
    {
      name: 'Emergency Fund',
      number: '**** 1234',
      balance: 500000.00
    },
    {
      name: 'Business Account',
      number: '**** 5432',
      balance: 3000000.00
    }
  ];

  useEffect(() => {
    setActivities(sampleActivities);
    // Generate proactive AI alerts when dashboard loads
    generateProactiveAlerts();
  }, []);

  useEffect(() => {
    filterAndSortActivities();
  }, [activities, filterConfig, sortConfig]);

  const generateProactiveAlerts = async () => {
    try {
      // Fetch user financial data
      const userData = await aiService.fetchUserFinancialData();
      
      // Generate proactive alerts based on user data
      const alerts = await aiService.generateProactiveAlerts(userData);
      
      // Send notifications for the alerts
      if (alerts.length > 0) {
        await aiService.sendProactiveNotifications(alerts);
      }
    } catch (error) {
      console.error('Error generating proactive alerts:', error);
    }
  };

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply filters
    if (filterConfig.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterConfig.type);
    }
    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterConfig.status);
    }
    if (filterConfig.method !== 'all') {
      filtered = filtered.filter(activity => activity.method === filterConfig.method);
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredActivities(filtered);
  };

  const handleSort = (key: keyof Activity) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Activity) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleAddAccount = async (accountData: any) => {
    console.log('Adding account:', accountData);
    
    // Add to activities
    const newActivity: Activity = {
      id: `TXN${Date.now()}`,
      name: `Account Added: ${accountData.accountName}`,
      type: 'account_creation',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      amount: accountData.balance,
      status: 'success',
      method: 'System',
      methodDetails: 'Account Setup'
    };
    setActivities(prev => [newActivity, ...prev]);

    // Trigger notification
    await NotificationTriggers.onAccountAdded(accountData.accountName, accountData.accountType);
  };

  const handleSendMoney = async (transferData: any) => {
    console.log('Sending money:', transferData);
    
    const newActivity: Activity = {
      id: transferData.id,
      name: `Money Sent to ${transferData.recipientName}`,
      type: 'transfer',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      amount: transferData.amount,
      status: 'success',
      method: 'Bank Transfer',
      methodDetails: transferData.recipientAccount
    };
    setActivities(prev => [newActivity, ...prev]);

    // Trigger notifications
    await NotificationTriggers.onTransactionSuccess(transferData.amount, transferData.recipientName);
    await NotificationTriggers.onLargeTransaction(transferData.amount, 'Savings Account');
  };

  const handleRequestMoney = async (requestData: any) => {
    console.log('Requesting money:', requestData);
    
    const newActivity: Activity = {
      id: requestData.id,
      name: `Money Requested from ${requestData.fromName}`,
      type: 'request',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      amount: requestData.amount,
      status: 'pending',
      method: 'Payment Request',
      methodDetails: requestData.fromEmail || 'Payment Link'
    };
    setActivities(prev => [newActivity, ...prev]);

    // Trigger system notification
    await NotificationTriggers.onSystemNotification(
      'Payment Request Sent',
      `Payment request for ₹${requestData.amount.toLocaleString('en-IN')} sent to ${requestData.fromName}`,
      { amount: requestData.amount, recipient: requestData.fromName }
    );
  };

  return (
    <div className="p-6 space-y-6 bg-blue-50 min-h-screen text-blue-900">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-blue-600">Total Balance</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-bold">₹28,87,606.80</h1>
            <span className="text-green-600 text-sm">15.8% ↑</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-600 hover:bg-blue-100"
            onClick={() => setIsSendModalOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-600 hover:bg-blue-100"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Request
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-blue-300 text-blue-600 hover:bg-blue-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem 
                onClick={() => setIsCardsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                Manage Cards
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsMobileBankingModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                Mobile Banking
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsStatementsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Statements
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsSupportModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <Phone className="h-4 w-4" />
                Customer Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Cash Flow Chart */}
      <CashFlowChart 
        selectedView={selectedView} 
        onViewChange={setSelectedView} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-900">Business account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₹7,80,498.00</div>
            <p className="text-xs text-green-600">16.0% ↑</p>
            <p className="text-xs text-blue-600 mt-1">vs. ₹6,40,812.60 Last Period</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-900">Total Saving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₹3,38,881.50</div>
            <p className="text-xs text-red-600">8.2% ↓</p>
            <p className="text-xs text-blue-600 mt-1">vs. ₹3,70,485.00 Last Period</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-900">Tax Reserve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₹12,93,854.40</div>
            <p className="text-xs text-green-600">35.2% ↑</p>
            <p className="text-xs text-blue-600 mt-1">vs. ₹9,21,281.40 Last Period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-blue-900">Recent Activity</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-100">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-white">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={filterConfig.type}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="all">All Types</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="investment">Investments</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filterConfig.status}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={filterConfig.method}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, method: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="all">All Methods</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-blue-200">
                  <TableHead 
                    className="text-blue-600 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Type/Name
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-blue-600 cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-blue-600 cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-blue-600 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-blue-600">Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="border-blue-200">
                    <TableCell>
                      <div>
                        <div className="font-medium text-blue-900">{activity.name}</div>
                        <div className="text-xs text-blue-600">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • {activity.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-blue-900">{activity.date}</div>
                      <div className="text-xs text-blue-600">{activity.time}</div>
                    </TableCell>
                    <TableCell className={`text-sm font-medium ${
                      activity.type === 'deposit' || activity.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-blue-900'
                    }`}>
                      {activity.type === 'deposit' || activity.type === 'income' ? '+' : ''}
                      ₹{activity.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'success' ? 'bg-green-100 text-green-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-blue-900">{activity.method}</div>
                      <div className="text-xs text-blue-600">{activity.methodDetails}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-blue-900">My Cards & Accounts</CardTitle>
            <Button 
              variant="link" 
              className="text-sm text-blue-600"
              onClick={() => setShowAllAccounts(!showAllAccounts)}
            >
              {showAllAccounts ? 'Show Less' : 'See All'}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-2xl font-bold">VISA</div>
                <div className="text-sm">**** **** **** 2104</div>
              </div>
              <div className="text-2xl font-bold mt-4">₹4,08,618.00</div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-900">Accounts</h3>
              
              <div className="space-y-2">
                {accounts.slice(0, showAllAccounts ? accounts.length : 3).map((account, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-blue-900">{account.name}</div>
                        <div className="text-xs text-blue-600">{account.number}</div>
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        ₹{account.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddAccount}
      />
      <ManageCardsModal
        isOpen={isCardsModalOpen}
        onClose={() => setIsCardsModalOpen(false)}
      />
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <MobileBankingModal
        isOpen={isMobileBankingModalOpen}
        onClose={() => setIsMobileBankingModalOpen(false)}
      />
      <StatementsModal
        isOpen={isStatementsModalOpen}
        onClose={() => setIsStatementsModalOpen(false)}
      />
      <CustomerSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
      <SendMoneyModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendMoney}
      />
      <RequestMoneyModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRequest={handleRequestMoney}
      />
    </div>
  );
};

export default Dashboard;