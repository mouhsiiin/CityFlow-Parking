import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import { Card, Button, Loading } from '../components';
import type { SecurityEvent, SecurityAlert, SecurityStats, SecurityHealth } from '../types';

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [health, setHealth] = useState<SecurityHealth | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'alerts'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [eventFilter, setEventFilter] = useState({ type: '', severity: '' });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [user, navigate, timeRange]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Calculate since timestamp based on time range
      const now = new Date();
      let since = new Date();
      switch (timeRange) {
        case '1h':
          since = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [dashboardData, healthData, eventsData] = await Promise.all([
        adminService.getSecurityDashboard(since.toISOString()),
        adminService.getSystemHealth(),
        adminService.getSecurityEvents({ limit: 50 }),
      ]);

      if ((dashboardData as any).status === 'success') {
        setStats((dashboardData as any).data.stats);
        setAlerts((dashboardData as any).data.alerts || []);
      }

      if ((healthData as any).status === 'success') {
        setHealth((healthData as any).data.health);
      }

      if ((eventsData as any).status === 'success') {
        setEvents((eventsData as any).data.events || []);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load security data');
      console.error('Security data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await adminService.acknowledgeSecurityAlert(alertId);
      await loadSecurityData(); // Reload data
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
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
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredEvents = events.filter(event => {
    if (eventFilter.type && event.eventType !== eventFilter.type) return false;
    if (eventFilter.severity && event.severity !== eventFilter.severity) return false;
    return true;
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Monitoring</h1>
          <p className="text-gray-600">Monitor and manage system security events</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin')}
          >
            Back to Admin
          </Button>
          <Button
            onClick={loadSecurityData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {(['1h', '24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range === '1h' ? 'Last Hour' : range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* System Health Card */}
      {health && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">System Security Health</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getHealthBadgeColor(health.status)}`}>
                  {health.status.toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-gray-900">{health.score}/100</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              Last checked: {new Date(health.lastChecked).toLocaleString()}
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Total Events</h4>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalEvents || 0}</p>
          <p className="text-xs text-gray-500 mt-1">In selected time range</p>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Failed Logins</h4>
          <p className="text-3xl font-bold text-red-600">{stats?.failedLogins || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Authentication failures</p>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Unauthorized Access</h4>
          <p className="text-3xl font-bold text-orange-600">{stats?.unauthorizedAccess || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Access violations</p>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Active Alerts</h4>
          <p className="text-3xl font-bold text-yellow-600">{stats?.activeAlerts || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Require attention</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          {(['overview', 'events', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Events by Type */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Type</h3>
            <div className="space-y-2">
              {Object.entries(stats.eventsByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-700">{formatEventType(type)}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatEventType(alert.alertType)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {selectedTab === 'events' && (
        <div>
          {/* Event Filters */}
          <Card className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={eventFilter.type}
                  onChange={(e) => setEventFilter({ ...eventFilter, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="login_attempt">Login Attempt</option>
                  <option value="unauthorized_access">Unauthorized Access</option>
                  <option value="data_access">Data Access</option>
                  <option value="system_event">System Event</option>
                  <option value="api_call">API Call</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={eventFilter.severity}
                  onChange={(e) => setEventFilter({ ...eventFilter, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Events List */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {formatEventType(event.eventType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{event.message}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.userId || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.ipAddress || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No events found for the selected filters
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500">
                No active alerts at this time
              </div>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${getSeverityBadgeColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {formatEventType(alert.alertType)}
                      </h4>
                      {alert.acknowledged && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-600 mb-2">{alert.details}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.affectedResource && <span>Resource: {alert.affectedResource}</span>}
                      {alert.acknowledgedBy && (
                        <span>Acknowledged by: {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt!).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="secondary"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
