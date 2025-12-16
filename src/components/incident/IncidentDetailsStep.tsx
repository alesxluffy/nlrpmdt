import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LOCATIONS, PURSUIT_INITIATORS, PURSUIT_REASONS, PURSUIT_TYPES, PURSUIT_TERMINATIONS, INCIDENT_TYPE_LOCATIONS, INCIDENT_TYPES, EVIDENCE_TYPES } from '@/data/incidentData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Image, Eye } from 'lucide-react';
import type { IncidentFormData, CitizenInvolved, EvidenceItem } from '@/pages/NewIncident';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';

interface IncidentDetailsStepProps {
  formData: IncidentFormData;
  updateFormData: (updates: Partial<IncidentFormData>) => void;
}

export default function IncidentDetailsStep({ formData, updateFormData }: IncidentDetailsStepProps) {
  const [officerInput, setOfficerInput] = useState('');
  const [newCitizen, setNewCitizen] = useState<CitizenInvolved>({ fullName: '', phoneNumber: '' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const addCitizen = () => {
    if (newCitizen.fullName && newCitizen.phoneNumber) {
      updateFormData({ citizensInvolved: [...formData.citizensInvolved, newCitizen] });
      setNewCitizen({ fullName: '', phoneNumber: '' });
    }
  };

  const removeCitizen = (index: number) => {
    updateFormData({ 
      citizensInvolved: formData.citizensInvolved.filter((_, i) => i !== index) 
    });
  };

  const isEvidenceSelected = (evidenceType: string) => {
    return formData.incidentEvidences.some(e => e.type === evidenceType);
  };

  const toggleEvidence = (evidenceType: string) => {
    if (isEvidenceSelected(evidenceType)) {
      updateFormData({ 
        incidentEvidences: formData.incidentEvidences.filter(e => e.type !== evidenceType) 
      });
    } else {
      updateFormData({ 
        incidentEvidences: [...formData.incidentEvidences, { type: evidenceType, url: '' }] 
      });
    }
  };

  const updateEvidenceUrl = (evidenceType: string, url: string) => {
    updateFormData({
      incidentEvidences: formData.incidentEvidences.map(e => 
        e.type === evidenceType ? { ...e, url } : e
      )
    });
  };

  const getEvidenceUrl = (evidenceType: string) => {
    return formData.incidentEvidences.find(e => e.type === evidenceType)?.url || '';
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

      {/* Citizens Involved */}
      <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
        <Label className="text-base font-medium">Citizens Involved</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Full Name"
            value={newCitizen.fullName}
            onChange={(e) => setNewCitizen(prev => ({ ...prev, fullName: e.target.value }))}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Phone Number"
              value={newCitizen.phoneNumber}
              onChange={(e) => setNewCitizen(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCitizen}
              disabled={!newCitizen.fullName || !newCitizen.phoneNumber}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {formData.citizensInvolved.length > 0 && (
          <div className="space-y-2 mt-3">
            {formData.citizensInvolved.map((citizen, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                <span className="text-sm">
                  {citizen.fullName} - <span className="text-muted-foreground">{citizen.phoneNumber}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeCitizen(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Collection */}
      <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
        <Label className="text-base font-medium">Evidence Collected</Label>
        <div className="space-y-4">
          {EVIDENCE_TYPES.map((evidence) => (
            <div key={evidence} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={evidence}
                  checked={isEvidenceSelected(evidence)}
                  onCheckedChange={() => toggleEvidence(evidence)}
                />
                <label
                  htmlFor={evidence}
                  className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {evidence}
                </label>
              </div>
              
              {isEvidenceSelected(evidence) && (
                <div className="ml-6 space-y-2">
                  <Input
                    placeholder={`${evidence} screenshot URL (Discord, Imgur, etc.)`}
                    value={getEvidenceUrl(evidence)}
                    onChange={(e) => updateEvidenceUrl(evidence, e.target.value)}
                    className="text-sm"
                  />
                  {getEvidenceUrl(evidence) && (
                    <div 
                      className="relative w-full max-w-xs rounded-lg overflow-hidden border border-border bg-background cursor-pointer group"
                      onClick={() => setPreviewImage(getEvidenceUrl(evidence))}
                    >
                      <img 
                        src={getEvidenceUrl(evidence)} 
                        alt={`${evidence} preview`}
                        className="w-full h-auto max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {formData.incidentEvidences.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Label className="text-sm text-muted-foreground mb-2 block">Collected Evidence Summary</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.incidentEvidences.filter(e => e.url).map((evidence) => (
                <div key={evidence.type} className="flex items-start gap-2 p-2 bg-background rounded border border-border">
                  <Image className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{evidence.type}</span>
                    <a 
                      href={evidence.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate block"
                    >
                      {evidence.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleEvidence(evidence.type)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
