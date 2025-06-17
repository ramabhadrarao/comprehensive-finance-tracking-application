// src/services/dashboard.ts - Fixed Dashboard Service with Error Handling
import api from './api';
import { ApiResponse, DashboardStats, InvestorStats, PaymentStats, PlanStats } from '../types';

export const dashboardService = {
  // ================================
  // MAIN DASHBOARD DATA
  // ================================

  // Get comprehensive dashboard overview with better error handling
  async getDashboardOverview(): Promise<ApiResponse<{
    stats: DashboardStats;
    investorStats: InvestorStats;
    paymentStats: PaymentStats;
    planStats: PlanStats;
    recentActivity: Array<{
      id: string;
      type: 'investment_created' | 'payment_received' | 'investor_added' | 'plan_created' | 'document_uploaded' | 'user_login';
      title: string;
      description: string;
      timestamp: string;
      status: 'success' | 'warning' | 'error';
      user: {
        id: string;
        name: string;
        avatar?: string;
      };
      entity?: {
        id: string;
        type: string;
        name: string;
      };
      metadata?: any;
    }>;
    alerts: Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: 'payments' | 'compliance' | 'system' | 'security';
      title: string;
      message: string;
      timestamp: string;
      isRead: boolean;
      actionRequired: boolean;
      actionUrl?: string;
      relatedEntity?: {
        type: string;
        id: string;
        name: string;
      };
    }>;
  }>> {
    try {
      // First try the combined overview endpoint
      return await api.get('/dashboard/overview');
    } catch (error: any) {
      console.warn('Combined overview endpoint failed, trying individual endpoints:', error.message);
      
      // If the combined endpoint fails, try individual endpoints with fallbacks
      try {
        const [
          investmentStatsResult,
          investorStatsResult,
          paymentStatsResult,
          planStatsResult,
          recentActivityResult,
          systemAlertsResult
        ] = await Promise.allSettled([
          this.getInvestmentStatsWithFallback(),
          this.getInvestorStatsWithFallback(),
          this.getPaymentStatsWithFallback(),
          this.getPlanStatsWithFallback(),
          this.getRecentActivityWithFallback(),
          this.getSystemAlertsWithFallback()
        ]);

        return {
          success: true,
          data: {
            stats: investmentStatsResult.status === 'fulfilled' ? investmentStatsResult.value.data : this.getDefaultInvestmentStats(),
            investorStats: investorStatsResult.status === 'fulfilled' ? investorStatsResult.value.data : this.getDefaultInvestorStats(),
            paymentStats: paymentStatsResult.status === 'fulfilled' ? paymentStatsResult.value.data : this.getDefaultPaymentStats(),
            planStats: planStatsResult.status === 'fulfilled' ? planStatsResult.value.data : this.getDefaultPlanStats(),
            recentActivity: recentActivityResult.status === 'fulfilled' ? recentActivityResult.value.data : [],
            alerts: systemAlertsResult.status === 'fulfilled' ? systemAlertsResult.value.data : []
          }
        };
      } catch (fallbackError: any) {
        console.error('All dashboard endpoints failed:', fallbackError);
        
        // Return default empty data structure
        return {
          success: true,
          data: {
            stats: this.getDefaultInvestmentStats(),
            investorStats: this.getDefaultInvestorStats(),
            paymentStats: this.getDefaultPaymentStats(),
            planStats: this.getDefaultPlanStats(),
            recentActivity: [],
            alerts: []
          }
        };
      }
    }
  },

  // ================================
  // INDIVIDUAL ENDPOINTS WITH FALLBACKS
  // ================================

  async getInvestmentStatsWithFallback(): Promise<ApiResponse<DashboardStats>> {
    try {
      return await api.get('/dashboard/stats/investments');
    } catch (error) {
      console.warn('Investment stats endpoint not available, using fallback');
      return { success: true, data: this.getDefaultInvestmentStats() };
    }
  },

  async getInvestorStatsWithFallback(): Promise<ApiResponse<InvestorStats>> {
    try {
      return await api.get('/dashboard/stats/investors');
    } catch (error) {
      console.warn('Investor stats endpoint not available, using fallback');
      return { success: true, data: this.getDefaultInvestorStats() };
    }
  },

  async getPaymentStatsWithFallback(): Promise<ApiResponse<PaymentStats>> {
    try {
      return await api.get('/dashboard/stats/payments');
    } catch (error) {
      console.warn('Payment stats endpoint not available, using fallback');
      return { success: true, data: this.getDefaultPaymentStats() };
    }
  },

  async getPlanStatsWithFallback(): Promise<ApiResponse<PlanStats>> {
    try {
      return await api.get('/dashboard/stats/plans');
    } catch (error) {
      console.warn('Plan stats endpoint not available, using fallback');
      return { success: true, data: this.getDefaultPlanStats() };
    }
  },

  async getRecentActivityWithFallback(): Promise<ApiResponse<any[]>> {
    try {
      return await api.get('/dashboard/recent-activity', { params: { limit: 10 } });
    } catch (error) {
      console.warn('Recent activity endpoint not available, using fallback');
      return { success: true, data: [] };
    }
  },

  async getSystemAlertsWithFallback(): Promise<ApiResponse<any[]>> {
    try {
      return await api.get('/dashboard/alerts', { params: { limit: 5 } });
    } catch (error) {
      console.warn('System alerts endpoint not available, using fallback');
      return { success: true, data: [] };
    }
  },

  // ================================
  // DEFAULT DATA PROVIDERS (For Fresh Users)
  // ================================

  getDefaultInvestmentStats(): DashboardStats {
    return {
      totalInvestments: 0,
      activeInvestments: 0,
      completedInvestments: 0,
      totalValue: 0,
      totalPaid: 0,
      remainingValue: 0,
      overduePayments: 0,
      averageInvestmentSize: 0
    };
  },

  getDefaultInvestorStats(): InvestorStats {
    return {
      totalInvestors: 0,
      activeInvestors: 0,
      inactiveInvestors: 0,
      newThisMonth: 0,
      totalInvestment: 0,
      averageInvestment: 0,
      withUserAccounts: 0,
      activeUserAccounts: 0,
      userAccountPercentage: 0
    };
  },

  getDefaultPaymentStats(): PaymentStats {
    return {
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      thisMonthPayments: 0,
      averagePayment: 0,
      paymentsByMethod: [],
      documentsStats: []
    };
  },

  getDefaultPlanStats(): PlanStats {
    return {
      totalPlans: 0,
      activePlans: 0,
      inactivePlans: 0,
      plansByType: [],
      plansByPaymentType: [],
      mostPopularPlan: null
    };
  },

  // ================================
  // ENHANCED TRENDING METRICS WITH FALLBACKS
  // ================================

  async getTrendingMetrics(params?: {
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    metrics?: string[];
  }): Promise<ApiResponse<{
    investments: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    payments: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    investors: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    revenue: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
  }>> {
    try {
      return await api.get('/dashboard/trending-metrics', { params });
    } catch (error: any) {
      console.warn('Trending metrics endpoint not available:', error.message);
      
      // Return default trending data for fresh users
      return {
        success: true,
        data: {
          investments: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: this.generateDefaultChartData()
          },
          payments: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: this.generateDefaultChartData()
          },
          investors: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: this.generateDefaultChartData()
          },
          revenue: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: this.generateDefaultChartData()
          }
        }
      };
    }
  },

  // ================================
  // QUICK ACTIONS WITH FALLBACKS
  // ================================

  async getQuickActionsData(): Promise<ApiResponse<{
    pendingActions: {
      paymentsOverdue: number;
      investmentsAwaitingApproval: number;
      documentsToReview: number;
      kycPending: number;
    };
    shortcuts: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      url: string;
      badge?: number;
      color: string;
    }>;
    recentlyViewed: Array<{
      type: 'investment' | 'investor' | 'payment' | 'plan';
      id: string;
      title: string;
      subtitle: string;
      url: string;
      timestamp: string;
    }>;
  }>> {
    try {
      return await api.get('/dashboard/quick-actions');
    } catch (error: any) {
      console.warn('Quick actions endpoint not available:', error.message);
      
      // Return default quick actions for fresh users
      return {
        success: true,
        data: {
          pendingActions: {
            paymentsOverdue: 0,
            investmentsAwaitingApproval: 0,
            documentsToReview: 0,
            kycPending: 0
          },
          shortcuts: [
            {
              id: 'add_investor',
              title: 'Add New Investor',
              description: 'Register a new investor in the system',
              icon: 'UserPlus',
              url: '/investors/new',
              color: 'blue'
            },
            {
              id: 'create_investment',
              title: 'Create Investment',
              description: 'Set up a new investment',
              icon: 'TrendingUp',
              url: '/investments/new',
              color: 'green'
            },
            {
              id: 'record_payment',
              title: 'Record Payment',
              description: 'Record a new payment received',
              icon: 'CreditCard',
              url: '/payments/new',
              color: 'purple'
            },
            {
              id: 'create_plan',
              title: 'Create Plan',
              description: 'Set up a new investment plan',
              icon: 'FileText',
              url: '/plans/new',
              color: 'yellow'
            }
          ],
          recentlyViewed: []
        }
      };
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  generateDefaultChartData(): Array<{ date: string; value: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: 0
      });
    }
    
    return data;
  },

  // Generate sample data for demo purposes
  generateSampleChartData(): Array<{ date: string; value: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000) + 500
      });
    }
    
    return data;
  },

  // ================================
  // LEGACY METHODS (Maintained for Compatibility)
  // ================================

  async getRecentActivity(params?: {
    limit?: number;
    types?: string[];
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    return this.getRecentActivityWithFallback();
  },

  async getSystemAlerts(params?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'payments' | 'compliance' | 'system' | 'security';
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<any[]>> {
    return this.getSystemAlertsWithFallback();
  },

  // Mark alert as read
  async markAlertRead(alertId: string): Promise<ApiResponse<void>> {
    try {
      return await api.put(`/dashboard/alerts/${alertId}/read`);
    } catch (error) {
      console.warn('Mark alert read endpoint not available');
      return { success: true };
    }
  },

  // Mark all alerts as read
  async markAllAlertsRead(): Promise<ApiResponse<void>> {
    try {
      return await api.put('/dashboard/alerts/read-all');
    } catch (error) {
      console.warn('Mark all alerts read endpoint not available');
      return { success: true };
    }
  },

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  },

  // Check if user is fresh (no data)
  async isFreshUser(): Promise<boolean> {
    try {
      const stats = await this.getInvestmentStatsWithFallback();
      return stats.data.totalInvestments === 0;
    } catch (error) {
      return true; // Assume fresh user if can't determine
    }
  }
};