import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, History, Filter, Eye, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { INCIDENT_TYPES } from '@/data/incidentData';

export default function IncidentHistory() {
  const { canDeleteIncident } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          incident_officers (*),
          incident_suspects (*),
          incident_vehicles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Incident deleted');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete incident');
    },
  });

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = 
      incident.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || incident.incident_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getIncidentType = (type: string) => {
    return INCIDENT_TYPES.find(t => t.value === type);
  };

  const copyReport = async (report: string) => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('Report copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Incident History
          </h1>
          <p className="text-muted-foreground mt-1">
            {incidents?.length || 0} total incidents
          </p>
        </div>

        <Button asChild className="gap-2">
          <Link to="/incidents/new">
            <Plus className="w-4 h-4" />
            New Incident
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {INCIDENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-card">
              <CardContent className="p-4">
                <div className="h-6 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredIncidents && filteredIncidents.length > 0 ? (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const incidentType = getIncidentType(incident.incident_type);
            
            return (
              <Card
                key={incident.id}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{incidentType?.icon}</span>
                        <h3 className="font-semibold text-foreground">
                          {incidentType?.label || incident.incident_type}
                        </h3>
                        <Badge 
                          variant={incident.status === 'Open' ? 'default' : 'secondary'}
                          className={incident.status === 'Open' ? 'bg-warning/20 text-warning' : ''}
                        >
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        📍 {incident.location}
                        {incident.custom_location && ` - ${incident.custom_location}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(incident.created_at).toLocaleString()} • 
                        ID: {incident.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canDeleteIncident && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(incident);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No incidents found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No incidents have been reported yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Incident Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getIncidentType(selectedIncident?.incident_type)?.icon}
              {getIncidentType(selectedIncident?.incident_type)?.label} Report
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={selectedIncident.status === 'Open' ? 'default' : 'secondary'}>
                  {selectedIncident.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedIncident.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm whitespace-pre-wrap">
                {selectedIncident.report_content || 'No report content available'}
              </div>

              <Button
                onClick={() => copyReport(selectedIncident.report_content || '')}
                className="w-full gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Report'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this incident report. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
