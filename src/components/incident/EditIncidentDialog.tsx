import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { INCIDENT_TYPES, LOCATIONS, INCIDENT_TYPE_LOCATIONS } from '@/data/incidentData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Edit, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface EditIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: any;
}

export function EditIncidentDialog({ open, onOpenChange, incident }: EditIncidentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    incident_type: '',
    location: '',
    custom_location: '',
    description: '',
    notes: '',
    pursuit_occurred: false,
    pursuit_initiator: '',
    pursuit_reason: '',
    pursuit_type: '',
    pursuit_termination: '',
  });

  useEffect(() => {
    if (incident) {
      setFormData({
        incident_type: incident.incident_type || '',
        location: incident.location || '',
        custom_location: incident.custom_location || '',
        description: incident.description || '',
        notes: incident.notes || '',
        pursuit_occurred: incident.pursuit_occurred || false,
        pursuit_initiator: incident.pursuit_initiator || '',
        pursuit_reason: incident.pursuit_reason || '',
        pursuit_type: incident.pursuit_type || '',
        pursuit_termination: incident.pursuit_termination || '',
      });
    }
  }, [incident]);

  const incidentType = INCIDENT_TYPES.find(t => t.value === formData.incident_type);
  const hasFixedLocation = incidentType?.fixedLocation;
  const typeLocations = INCIDENT_TYPE_LOCATIONS[formData.incident_type];
  const locationOptions = typeLocations || LOCATIONS;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('incidents')
        .update({
          incident_type: formData.incident_type,
          location: hasFixedLocation ? incidentType.fixedLocation : formData.location,
          custom_location: formData.custom_location || null,
          description: formData.description || null,
          notes: formData.notes || null,
          pursuit_occurred: formData.pursuit_occurred,
          pursuit_initiator: formData.pursuit_initiator || null,
          pursuit_reason: formData.pursuit_reason || null,
          pursuit_type: formData.pursuit_type || null,
          pursuit_termination: formData.pursuit_termination || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incident.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Incident updated');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update incident');
    },
  });

  const handleSubmit = () => {
    if (!formData.incident_type) {
      toast.error('Incident type is required');
      return;
    }
    if (!hasFixedLocation && !formData.location) {
      toast.error('Location is required');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Incident
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Incident Type */}
          <div className="space-y-1">
            <Label className="text-xs">Incident Type *</Label>
            <Select 
              value={formData.incident_type} 
              onValueChange={(v) => setFormData({ ...formData, incident_type: v, location: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {hasFixedLocation ? (
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{incidentType?.fixedLocation}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Location *</Label>
              <Select 
                value={formData.location} 
                onValueChange={(v) => setFormData({ ...formData, location: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Location */}
          {formData.location === 'Custom Location' && (
            <div className="space-y-1">
              <Label className="text-xs">Custom Location</Label>
              <Input
                placeholder="Enter custom location"
                value={formData.custom_location}
                onChange={(e) => setFormData({ ...formData, custom_location: e.target.value })}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              placeholder="Brief description of the incident..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Additional Notes
            </Label>
            <Textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Pursuit Section */}
          <div className="space-y-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pursuit_occurred"
                checked={formData.pursuit_occurred}
                onChange={(e) => setFormData({ ...formData, pursuit_occurred: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="pursuit_occurred" className="text-sm cursor-pointer">Pursuit Occurred</Label>
            </div>

            {formData.pursuit_occurred && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Initiator</Label>
                  <Input
                    placeholder="Who initiated"
                    value={formData.pursuit_initiator}
                    onChange={(e) => setFormData({ ...formData, pursuit_initiator: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <Input
                    placeholder="Pursuit reason"
                    value={formData.pursuit_reason}
                    onChange={(e) => setFormData({ ...formData, pursuit_reason: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Input
                    placeholder="Ground/Air"
                    value={formData.pursuit_type}
                    onChange={(e) => setFormData({ ...formData, pursuit_type: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Termination</Label>
                  <Input
                    placeholder="How it ended"
                    value={formData.pursuit_termination}
                    onChange={(e) => setFormData({ ...formData, pursuit_termination: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
