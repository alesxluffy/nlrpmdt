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
import { Search, History, Filter, Eye, Copy, Check, Plus, Trash2, Lock, UserPlus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { INCIDENT_TYPES } from '@/data/incidentData';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { AddSuspectDialog } from '@/components/incident/AddSuspectDialog';
import { EditIncidentDialog } from '@/components/incident/EditIncidentDialog';

export default function IncidentHistory() {
  const { canDeleteIncident } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [closeConfirm, setCloseConfirm] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [addSuspectIncidentId, setAddSuspectIncidentId] = useState<string | null>(null);
  const [editIncident, setEditIncident] = useState<any>(null);

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

  const closeIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'Closed', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Incident closed');
      setCloseConfirm(null);
      setSelectedIncident(null);
    },
    onError: () => {
      toast.error('Failed to close incident');
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

  // Collect all evidence URLs from an incident
  const collectEvidenceUrls = (incident: any): { url: string; label: string }[] => {
    const evidences: { url: string; label: string }[] = [];
    
    incident.incident_suspects?.forEach((s: any) => {
      if (s.mugshot) {
        evidences.push({ url: s.mugshot, label: `Mugshot - ${s.name}` });
      }
      if (s.evidences) {
        s.evidences.split('\n').filter((url: string) => url.trim()).forEach((url: string, eIdx: number) => {
          evidences.push({ url: url.trim(), label: `Evidence ${eIdx + 1} - ${s.name}` });
        });
      }
    });
    
    incident.incident_vehicles?.forEach((v: any) => {
      if (v.front_image) evidences.push({ url: v.front_image, label: `Front - ${v.vehicle_name}` });
      if (v.back_image) evidences.push({ url: v.back_image, label: `Back - ${v.vehicle_name}` });
      if (v.plate_image) evidences.push({ url: v.plate_image, label: `Plate - ${v.vehicle_name}` });
    });
    
    return evidences;
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
            const isOpen = incident.status === 'Open';
            
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
                          variant={isOpen ? 'default' : 'secondary'}
                          className={isOpen ? 'bg-warning/20 text-warning' : ''}
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
                      {isOpen && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditIncident(incident);
                            }}
                            title="Edit Incident"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddSuspectIncidentId(incident.id);
                            }}
                            title="Add Suspect"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
              <div className="flex gap-2 items-center">
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

              {/* Evidence Collection Section */}
              {collectEvidenceUrls(selectedIncident).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Evidences Collected ({collectEvidenceUrls(selectedIncident).length})
                  </h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {collectEvidenceUrls(selectedIncident).map((evidence, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => setPreviewImage(evidence.url)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border border-border bg-background">
                          <img 
                            src={evidence.url} 
                            alt={evidence.label} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 rounded-lg bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-5 h-5 text-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-1">{evidence.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspects */}
              {selectedIncident.incident_suspects?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Suspects ({selectedIncident.incident_suspects.length})</h4>
                  <div className="space-y-2">
                    {selectedIncident.incident_suspects.map((s: any) => (
                      <div key={s.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex gap-3">
                          {s.mugshot && (
                            <div 
                              className="w-12 h-12 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImage(s.mugshot)}
                            >
                              <img src={s.mugshot} alt="Mugshot" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{s.name}</p>
                            {s.cid && <p className="text-xs text-muted-foreground">CID: {s.cid}</p>}
                            <p className="text-xs text-muted-foreground">{s.status} • {s.plead}</p>
                            {s.charges && <p className="text-xs text-muted-foreground mt-1 truncate">{s.charges}</p>}
                            <div className="flex gap-3 text-xs mt-1">
                              {s.is_hut ? (
                                <span className="text-destructive font-bold">HUT</span>
                              ) : (
                                <>
                                  <span className="text-primary">{s.jail} months</span>
                                  <span className="text-green-500">${s.fine?.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {selectedIncident.incident_vehicles?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Vehicles ({selectedIncident.incident_vehicles.length})</h4>
                  <div className="space-y-2">
                    {selectedIncident.incident_vehicles.map((v: any) => (
                      <div key={v.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <p className="font-medium text-foreground">{v.vehicle_name}</p>
                        {v.plate && <p className="text-xs text-muted-foreground">Plate: {v.plate}</p>}
                        {v.color && <p className="text-xs text-muted-foreground">Color: {v.color}</p>}
                        {v.registered_owner && <p className="text-xs text-muted-foreground">Owner: {v.registered_owner}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => copyReport(selectedIncident.report_content || '')}
                  className="flex-1 gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Report'}
                </Button>
                
                {selectedIncident.status === 'Open' && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setEditIncident(selectedIncident)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setAddSuspectIncidentId(selectedIncident.id)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Suspect
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setCloseConfirm(selectedIncident)}
                    >
                      <Lock className="w-4 h-4" />
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Suspect Dialog */}
      <AddSuspectDialog
        open={!!addSuspectIncidentId}
        onOpenChange={(open) => !open && setAddSuspectIncidentId(null)}
        incidentId={addSuspectIncidentId || ''}
      />

      {/* Edit Incident Dialog */}
      <EditIncidentDialog
        open={!!editIncident}
        onOpenChange={(open) => !open && setEditIncident(null)}
        incident={editIncident}
      />

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

      {/* Close Incident Confirmation */}
      <AlertDialog open={!!closeConfirm} onOpenChange={() => setCloseConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Incident?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing this incident will prevent further modifications. Officers will no longer be able to add suspects or edit this incident.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeConfirm && closeIncidentMutation.mutate(closeConfirm.id)}>
              Close Incident
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
