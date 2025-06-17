// src/services/dashboard.ts - Comprehensive Dashboard Service
import api from './api';
import { ApiResponse, DashboardStats, InvestorStats, PaymentStats, PlanStats } from '../types';

export const dashboardService = {
  // ================================
  // MAIN DASHBOARD DATA
  // ================================

  // Get comprehensive dashboard overview
  async getDashboardOverview(): Promise<ApiResponse<{
    stats: DashboardStats;
    investorStats: InvestorStats;
    paymentStats: PaymentStats;
    planStats: PlanStats;
    recentActivity: Array<{
      id: string;
      type: 'investment' | 'payment' | 'investor' | 'plan';
      title: string;
      description: string;
      timestamp: string;
      status: 'success' | 'warning' | 'error';
      user: string;
    }>;
    alerts: Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      timestamp: string;
      actionRequired: boolean;
      actionUrl?: string;
    }>;
  }>> {
    // This combines multiple API calls for efficiency
    const [
      investmentStats,
      investorStats,
      paymentStats,
      planStats,
      recentActivity,
      systemAlerts
    ] = await Promise.all([
      api.get('/investments/stats/overview'),
      api.get('/investors/stats/overview'),
      api.get('/payments/stats/overview'),
      api.get('/plans/stats/overview'),
      this.getRecentActivity(),
      this.getSystemAlerts()
    ]);

    return {
      success: true,
      data: {
        stats: investmentStats.data,
        investorStats: investorStats.data,
        paymentStats: paymentStats.data,
        planStats: planStats.data,
        recentActivity: recentActivity.data || [],
        alerts: systemAlerts.data || []
      }
    };
  },

  // ================================
  // STATISTICS ENDPOINTS
  // ================================

  // Get investment statistics
  async getInvestmentStats(): Promise<ApiResponse<DashboardStats>> {
    return api.get('/investments/stats/overview');
  },

  // Get investor statistics
  async getInvestorStats(): Promise<ApiResponse<InvestorStats>> {
    return api.get('/investors/stats/overview');
  },

  // Get payment statistics
  async getPaymentStats(): Promise<ApiResponse<PaymentStats>> {
    return api.get('/payments/stats/overview');
  },

  // Get plan statistics
  async getPlanStats(): Promise<ApiResponse<PlanStats>> {
    return api.get('/plans/stats/overview');
  },

  // ================================
  // ACTIVITY & TIMELINE
  // ================================

  // Get recent activity across the system
  async getRecentActivity(params?: {
    limit?: number;
    types?: string[];
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Array<{
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
  }>>> {
    return api.get('/dashboard/recent-activity', { params });
  },

  // Get system activity timeline
  async getActivityTimeline(params?: {
    period?: 'today' | 'week' | 'month' | 'quarter';
    groupBy?: 'hour' | 'day' | 'week';
    types?: string[];
  }): Promise<ApiResponse<Array<{
    timestamp: string;
    activities: Array<{
      type: string;
      count: number;
      totalValue?: number;
    }>;
    summary: {
      totalActivities: number;
      totalValue: number;
      topActivity: string;
    };
  }>>> {
    return api.get('/dashboard/activity-timeline', { params });
  },

  // ================================
  // ALERTS & NOTIFICATIONS
  // ================================

  // Get system alerts
  async getSystemAlerts(params?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'payments' | 'compliance' | 'system' | 'security';
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<Array<{
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
    metadata?: any;
  }>>> {
    return api.get('/dashboard/alerts', { params });
  },

  // Mark alert as read
  async markAlertRead(alertId: string): Promise<ApiResponse<void>> {
    return api.put(`/dashboard/alerts/${alertId}/read`);
  },

  // Mark all alerts as read
  async markAllAlertsRead(): Promise<ApiResponse<void>> {
    return api.put('/dashboard/alerts/read-all');
  },

  // Dismiss alert
  async dismissAlert(alertId: string): Promise<ApiResponse<void>> {
    return api.delete(`/dashboard/alerts/${alertId}`);
  },

  // ================================
  // TRENDING & ANALYTICS
  // ================================

  // Get trending metrics
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
    return api.get('/dashboard/trending-metrics', { params });
  },

  // Get performance analytics
  async getPerformanceAnalytics(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    compareWith?: 'previous_period' | 'same_period_last_year';
  }): Promise<ApiResponse<{
    summary: {
      totalGrowth: number;
      investmentGrowth: number;
      paymentGrowth: number;
      investorGrowth: number;
    };
    comparisons: {
      investments: { current: number; previous: number; change: number };
      payments: { current: number; previous: number; change: number };
      investors: { current: number; previous: number; change: number };
      revenue: { current: number; previous: number; change: number };
    };
    breakdown: {
      byPlan: Array<{ name: string; value: number; growth: number }>;
      byInvestor: Array<{ name: string; value: number; growth: number }>;
      byMonth: Array<{ month: string; investments: number; payments: number }>;
    };
    forecast: {
      nextMonth: { investments: number; payments: number; revenue: number };
      nextQuarter: { investments: number; payments: number; revenue: number };
      confidence: number;
    };
  }>> {
    return api.get('/dashboard/performance-analytics', { params });
  },

  // ================================
  // QUICK ACTIONS DATA
  // ================================

  // Get data for quick actions
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
    return api.get('/dashboard/quick-actions');
  },

  // Get overdue items requiring attention
  async getOverdueItems(): Promise<ApiResponse<{
    payments: Array<{
      investmentId: string;
      investorName: string;
      amount: number;
      dueDate: string;
      daysPastDue: number;
    }>;
    documents: Array<{
      investmentId: string;
      investorName: string;
      documentType: string;
      daysOverdue: number;
    }>;
    reviews: Array<{
      entityType: string;
      entityId: string;
      entityName: string;
      reviewType: string;
      daysOverdue: number;
    }>;
  }>> {
    return api.get('/dashboard/overdue-items');
  },

  // ================================
  // CUSTOMIZATION & PREFERENCES
  // ================================

  // Get user dashboard preferences
  async getDashboardPreferences(): Promise<ApiResponse<{
    layout: 'grid' | 'list' | 'compact';
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number; w: number; h: number };
      isVisible: boolean;
      config: any;
    }>;
    refreshInterval: number;
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      desktop: boolean;
      email: boolean;
      sound: boolean;
    };
  }>> {
    return api.get('/dashboard/preferences');
  },

  // Update dashboard preferences
  async updateDashboardPreferences(preferences: {
    layout?: 'grid' | 'list' | 'compact';
    widgets?: Array<{
      id: string;
      type: string;
      position: { x: number; y: number; w: number; h: number };
      isVisible: boolean;
      config: any;
    }>;
    refreshInterval?: number;
    theme?: 'light' | 'dark' | 'auto';
    notifications?: {
      desktop?: boolean;
      email?: boolean;
      sound?: boolean;
    };
  }): Promise<ApiResponse<any>> {
    return api.put('/dashboard/preferences', preferences);
  },

  // Get available widgets
  async getAvailableWidgets(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    category: 'statistics' | 'charts' | 'tables' | 'actions';
    icon: string;
    defaultSize: { w: number; h: number };
    configOptions: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'boolean';
      options?: Array<{ value: string; label: string }>;
      default: any;
    }>;
  }>>> {
    return api.get('/dashboard/available-widgets');
  },

  // ================================
  // EXPORT & REPORTING
  // ================================

  // Export dashboard data
  async exportDashboardData(options: {
    format: 'pdf' | 'excel' | 'csv';
    dateRange: { start: string; end: string };
    includeCharts?: boolean;
    includeStatistics?: boolean;
    includeActivity?: boolean;
  }): Promise<Blob> {
    const response = await api.get('/dashboard/export', {
      params: options,
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate dashboard snapshot
  async generateSnapshot(config?: {
    title?: string;
    description?: string;
    includeAlerts?: boolean;
    includeActivity?: boolean;
  }): Promise<ApiResponse<{
    snapshotId: string;
    url: string;
    expiresAt: string;
  }>> {
    return api.post('/dashboard/snapshot', config);
  },

  // ================================
  // REAL-TIME DATA
  // ================================

  // Get real-time metrics (for live updates)
  async getRealTimeMetrics(): Promise<ApiResponse<{
    activeUsers: number;
    onlineInvestors: number;
    todaysPayments: number;
    todaysInvestments: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastUpdated: string;
  }>> {
    return api.get('/dashboard/realtime-metrics');
  },

  // Subscribe to real-time updates (WebSocket endpoint info)
  async getWebSocketConfig(): Promise<ApiResponse<{
    endpoint: string;
    token: string;
    events: string[];
  }>> {
    return api.get('/dashboard/websocket-config');
  },

  // ================================
  // COMPARATIVE ANALYTICS
  // ================================

  // Get period comparison
  async getPeriodComparison(params: {
    currentPeriod: { start: string; end: string };
    comparePeriod: { start: string; end: string };
    metrics: string[];
  }): Promise<ApiResponse<{
    metrics: {
      [key: string]: {
        current: number;
        previous: number;
        change: number;
        changePercentage: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
    charts: {
      [key: string]: {
        current: Array<{ date: string; value: number }>;
        previous: Array<{ date: string; value: number }>;
      };
    };
  }>> {
    return api.post('/dashboard/period-comparison', params);
  },

  // Get benchmarking data
  async getBenchmarkData(params?: {
    benchmarkType?: 'industry' | 'internal' | 'custom';
    metrics?: string[];
  }): Promise<ApiResponse<{
    benchmarks: {
      [key: string]: {
        current: number;
        benchmark: number;
        performance: 'above' | 'below' | 'on_target';
        percentile: number;
      };
    };
    insights: Array<{
      metric: string;
      message: string;
      recommendation?: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }>> {
    return api.get('/dashboard/benchmark-data', { params });
  },

  // ================================
  // SEARCH & QUICK ACCESS
  // ================================

  // Global search across entities
  async globalSearch(query: string, filters?: {
    entities?: ('investors' | 'investments' | 'payments' | 'plans')[];
    limit?: number;
  }): Promise<ApiResponse<{
    investors: Array<{
      id: string;
      name: string;
      email: string;
      type: 'investor';
      relevance: number;
    }>;
    investments: Array<{
      id: string;
      investmentId: string;
      investorName: string;
      type: 'investment';
      relevance: number;
    }>;
    payments: Array<{
      id: string;
      paymentId: string;
      investorName: string;
      type: 'payment';
      relevance: number;
    }>;
    plans: Array<{
      id: string;
      name: string;
      type: 'plan';
      relevance: number;
    }>;
    total: number;
  }>> {
    return api.get('/dashboard/search', { 
      params: { query, ...filters } 
    });
  },

  // Get quick access suggestions
  async getQuickAccessSuggestions(): Promise<ApiResponse<Array<{
    type: 'recent' | 'frequent' | 'favorite' | 'suggested';
    entities: Array<{
      id: string;
      type: string;
      title: string;
      subtitle: string;
      url: string;
      icon: string;
      metadata?: any;
    }>;
  }>>> {
    return api.get('/dashboard/quick-access-suggestions');
  }
};