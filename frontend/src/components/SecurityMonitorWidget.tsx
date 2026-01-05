import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services';
import { Card } from './Card';
import type { SecurityStats, SecurityHealth, SecurityAlert } from '../types';

export const SecurityMonitorWidget: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [health, setHealth] = useState<SecurityHealth | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [dashboardData, healthData] = await Promise.all([
        adminService.getSecurityDashboard(),
        adminService.getSystemHealth(),
      ]);

      if (dashboardData.status === 'success') {
        setStats(dashboardData.data.stats);
        setAlerts(dashboardData.data.alerts || []);
      }

      if (healthData.status === 'success') {
        setHealth(healthData.data.health);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setLoading(false);
    }
  };

  const getHealthBadgeColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityBadgeColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Security Monitor</h3>
        </div>
        <p className="text-sm text-gray-500">Loading security data...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Health Card */}
      {health && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">System Security Health</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getHealthBadgeColor(health.status)}`}>
              {health.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{health.score}</span>
            <span className="text-gray-500">/100</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Last checked: {new Date(health.lastChecked).toLocaleString()}
          </p>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Active Alerts ({alerts.length})</h3>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{formatEventType(alert.alertType)}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length > 3 && (
              <button
                onClick={() => navigate('/admin/security')}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {alerts.length} alerts →
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Security Statistics */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Security Statistics</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Last 24 hours</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Failed Logins</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Unauthorized Access</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unauthorizedAccess}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.activeAlerts}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/security')}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Full Security Dashboard
          </button>
        </Card>
      )}
    </div>
  );
};

export default SecurityMonitorWidget;
