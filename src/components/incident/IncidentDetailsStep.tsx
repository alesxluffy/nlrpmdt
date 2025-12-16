import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LOCATIONS, PURSUIT_INITIATORS, PURSUIT_REASONS, PURSUIT_TYPES, PURSUIT_TERMINATIONS, INCIDENT_TYPE_LOCATIONS, INCIDENT_TYPES } from '@/data/incidentData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import type { IncidentFormData } from '@/pages/NewIncident';

interface IncidentDetailsStepProps {
  formData: IncidentFormData;
  updateFormData: (updates: Partial<IncidentFormData>) => void;
}

export default function IncidentDetailsStep({ formData, updateFormData }: IncidentDetailsStepProps) {
  const [officerInput, setOfficerInput] = useState('');

  const incidentType = INCIDENT_TYPES.find(t => t.value === formData.incidentType);
  const hasFixedLocation = incidentType && 'fixedLocation' in incidentType;
  const specificLocations = INCIDENT_TYPE_LOCATIONS[formData.incidentType];
  const availableLocations = specificLocations || LOCATIONS;

  // Auto-set fixed location for jewelry store
  useEffect(() => {
    if (hasFixedLocation && incidentType.fixedLocation && formData.location !== incidentType.fixedLocation) {
      updateFormData({ location: incidentType.fixedLocation });
    }
  }, [formData.incidentType, hasFixedLocation]);

  const { data: officers } = useQuery({
    queryKey: ['officers-for-incident'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, badge_number')
        .order('last_name');
      return data || [];
    },
  });

  const addOfficer = (name: string) => {
    if (name && !formData.officers.includes(name)) {
      updateFormData({ officers: [...formData.officers, name] });
    }
    setOfficerInput('');
  };

  const removeOfficer = (name: string) => {
    updateFormData({ officers: formData.officers.filter(o => o !== name) });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Incident Details</h2>

      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        {hasFixedLocation ? (
          <Input value={incidentType.fixedLocation} disabled className="bg-secondary/50" />
        ) : (
          <Select
            value={formData.location}
            onValueChange={(value) => updateFormData({ location: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {formData.location === 'Custom Location' && (
        <div className="space-y-2">
          <Label>Custom Location Details</Label>
          <Input
            placeholder="Enter specific location..."
            value={formData.customLocation}
            onChange={(e) => updateFormData({ customLocation: e.target.value })}
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the incident..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
        />
      </div>

      {/* Officers */}
      <div className="space-y-2">
        <Label>Responding Officers</Label>
        <Select
          value=""
          onValueChange={(value) => addOfficer(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Add officer" />
          </SelectTrigger>
          <SelectContent>
            {officers?.map((officer) => {
              const name = `${officer.first_name} ${officer.last_name} (${officer.badge_number})`;
              return (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {formData.officers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.officers.map((officer) => (
              <Badge key={officer} variant="secondary" className="gap-1">
                {officer}
                <button
                  type="button"
                  onClick={() => removeOfficer(officer)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Pursuit Section */}
      <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center justify-between">
          <Label>Pursuit Occurred?</Label>
          <Switch
            checked={formData.pursuitOccurred}
            onCheckedChange={(checked) => updateFormData({ pursuitOccurred: checked })}
          />
        </div>

        {formData.pursuitOccurred && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pursuit Initiator</Label>
              <Select
                value={formData.pursuitInitiator}
                onValueChange={(value) => updateFormData({ pursuitInitiator: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select initiator" />
                </SelectTrigger>
                <SelectContent>
                  {PURSUIT_INITIATORS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pursuit Reason</Label>
              <Select
                value={formData.pursuitReason}
                onValueChange={(value) => updateFormData({ pursuitReason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {PURSUIT_REASONS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pursuit Type</Label>
              <Select
                value={formData.pursuitType}
                onValueChange={(value) => updateFormData({ pursuitType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PURSUIT_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pursuit Termination</Label>
              <Select
                value={formData.pursuitTermination}
                onValueChange={(value) => updateFormData({ pursuitTermination: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select termination" />
                </SelectTrigger>
                <SelectContent>
                  {PURSUIT_TERMINATIONS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
