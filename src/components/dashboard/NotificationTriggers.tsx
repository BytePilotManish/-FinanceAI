import { notificationService } from '../../services/notificationService';

// Helper functions to trigger notifications based on user actions
export const NotificationTriggers = {
  // Transaction-related notifications
  async onLargeTransaction(amount: number, accountName: string) {
    if (amount > 50000) {
      await notificationService.createTransactionNotification(
        'Large Transaction Alert',
        `A transaction of ₹${amount.toLocaleString('en-IN')} was processed from your ${accountName}.`,
        { amount, accountName, type: 'large_transaction' }
      );
    }
  },

  async onTransactionFailed(amount: number, reason: string) {
    await notificationService.createTransactionNotification(
      'Transaction Failed',
      `Your transaction of ₹${amount.toLocaleString('en-IN')} failed. Reason: ${reason}`,
      { amount, reason, type: 'failed_transaction' }
    );
  },

  async onTransactionSuccess(amount: number, recipientName: string) {
    await notificationService.createTransactionNotification(
      'Transaction Successful',
      `₹${amount.toLocaleString('en-IN')} has been successfully sent to ${recipientName}.`,
      { amount, recipientName, type: 'successful_transaction' }
    );
  },

  // Account-related notifications
  async onAccountAdded(accountName: string, accountType: string) {
    await notificationService.createSystemNotification(
      'New Account Added',
      `Your ${accountType} account "${accountName}" has been successfully added to your portfolio.`,
      { accountName, accountType, type: 'account_added' }
    );
  },

  async onLowBalance(accountName: string, balance: number) {
    if (balance < 10000) {
      await notificationService.createTransactionNotification(
        'Low Balance Alert',
        `Your ${accountName} balance is low: ₹${balance.toLocaleString('en-IN')}`,
        { accountName, balance, type: 'low_balance' }
      );
    }
  },

  // Investment-related notifications
  async onGoalAchieved(goalName: string, targetAmount: number) {
    await notificationService.createGoalNotification(
      'Goal Achieved! 🎉',
      `Congratulations! Your "${goalName}" goal of ₹${targetAmount.toLocaleString('en-IN')} has been reached.`,
      { goalName, targetAmount, type: 'goal_achieved' }
    );
  },

  async onGoalProgress(goalName: string, progress: number, targetAmount: number) {
    const milestones = [25, 50, 75, 90];
    if (milestones.includes(Math.floor(progress))) {
      await notificationService.createGoalNotification(
        'Goal Progress Update',
        `You're ${progress}% towards your "${goalName}" goal of ₹${targetAmount.toLocaleString('en-IN')}. Keep it up!`,
        { goalName, progress, targetAmount, type: 'goal_progress' }
      );
    }
  },

  async onPortfolioGain(gain: number, percentage: number) {
    if (gain > 5000 || percentage > 5) {
      await notificationService.createInvestmentNotification(
        'Portfolio Performance',
        `Great news! Your portfolio gained ₹${gain.toLocaleString('en-IN')} (${percentage.toFixed(1)}%) today.`,
        { gain, percentage, type: 'portfolio_gain' }
      );
    }
  },

  async onPortfolioLoss(loss: number, percentage: number) {
    if (loss > 10000 || percentage > 10) {
      await notificationService.createInvestmentNotification(
        'Portfolio Alert',
        `Your portfolio decreased by ₹${loss.toLocaleString('en-IN')} (${percentage.toFixed(1)}%) today. Consider reviewing your investments.`,
        { loss, percentage, type: 'portfolio_loss' }
      );
    }
  },

  // Security-related notifications
  async onNewLogin(device: string, location: string) {
    await notificationService.createSecurityNotification(
      'New Login Detected',
      `New login from ${device} in ${location}. If this wasn't you, please secure your account immediately.`,
      { device, location, type: 'new_login' }
    );
  },

  async onPasswordChanged() {
    await notificationService.createSecurityNotification(
      'Password Changed',
      'Your account password has been successfully changed. If you didn\'t make this change, contact support immediately.',
      { type: 'password_changed' }
    );
  },

  async onSuspiciousActivity(activity: string) {
    await notificationService.createSecurityNotification(
      'Suspicious Activity Detected',
      `Suspicious activity detected: ${activity}. Please review your account security.`,
      { activity, type: 'suspicious_activity' }
    );
  },

  // System notifications
  async onSystemMaintenance(startTime: string, duration: string) {
    await notificationService.createSystemNotification(
      'Scheduled Maintenance',
      `System maintenance scheduled for ${startTime}. Expected duration: ${duration}. Some features may be temporarily unavailable.`,
      { startTime, duration, type: 'maintenance' }
    );
  },

  async onFeatureUpdate(featureName: string, description: string) {
    await notificationService.createSystemNotification(
      'New Feature Available',
      `${featureName}: ${description}`,
      { featureName, description, type: 'feature_update' }
    );
  },

  // AI Trading notifications
  async onTradeExecuted(action: string, asset: string, amount: number, price: number) {
    await notificationService.createInvestmentNotification(
      'AI Trade Executed',
      `AI Trading: ${action.toUpperCase()} ${asset} - ₹${amount.toLocaleString('en-IN')} at ₹${price.toFixed(2)}`,
      { action, asset, amount, price, type: 'ai_trade' }
    );
  },

  async onTradingProfitAlert(profit: number, percentage: number) {
    if (profit > 1000) {
      await notificationService.createInvestmentNotification(
        'Trading Profit Alert',
        `Your AI trading strategy generated ₹${profit.toLocaleString('en-IN')} profit (${percentage.toFixed(1)}%) today!`,
        { profit, percentage, type: 'trading_profit' }
      );
    }
  }
};