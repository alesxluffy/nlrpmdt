import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Users,
  Clock,
  Shield,
  TrendingUp,
  Plus,
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: incidentStats } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = data?.length || 0;
      const open = data?.filter(i => i.status === 'Open').length || 0;
      const recent = data?.slice(0, 5) || [];

      return { total, open, recent };
    },
  });

  const { data: officerCount } = useQuery({
    queryKey: ['officer-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const stats = [
    {
      label: 'Total Incidents',
      value: incidentStats?.total || 0,
      icon: AlertTriangle,
      color: 'text-police-red',
      bgColor: 'bg-police-red/10',
    },
    {
      label: 'Open Cases',
      value: incidentStats?.open || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Active Officers',
      value: officerCount || 0,
      icon: Users,
      color: 'text-police-blue',
      bgColor: 'bg-police-blue/10',
    },
    {
      label: 'Case Clearance',
      value: incidentStats?.total 
        ? `${Math.round(((incidentStats.total - (incidentStats.open || 0)) / incidentStats.total) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.rank} {profile?.last_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Badge #{profile?.badge_number} • {profile?.division} Division
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link to="/incidents/new">
            <Plus className="w-5 h-5" />
            New Incident Report
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <Link to="/sop">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Standard Operating Procedures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access department policies, procedures, and guidelines
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <Link to="/roster">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Officer Roster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View active officers, ranks, and divisions
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <Link to="/incidents">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                Incident History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and search past incident reports
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidentStats?.recent && incidentStats.recent.length > 0 ? (
            <div className="space-y-3">
              {incidentStats.recent.map((incident: any) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-police-red" />
                    <span className="text-sm text-foreground">
                      Incident #{incident.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      incident.status === 'Open' 
                        ? 'bg-warning/20 text-warning' 
                        : 'bg-success/20 text-success'
                    }`}>
                      {incident.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No incidents recorded yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
