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
  const [newCitizen, setNewCitizen] = useState<CitizenInvolved>({ fullName: '', phoneNumber: '', cid: '' });
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
      setNewCitizen({ fullName: '', phoneNumber: '', cid: '' });
    }
  };

  const removeCitizen = (index: number) => {
    updateFormData({ 
      citizensInvolved: formData.citizensInvolved.filter((_, i) => i !== index) 
    });
  };

  const getEvidencesByType = (evidenceType: string) => {
    return formData.incidentEvidences.filter(e => e.type === evidenceType);
  };

  const addEvidence = (evidenceType: string) => {
    updateFormData({ 
      incidentEvidences: [...formData.incidentEvidences, { type: evidenceType, url: '' }] 
    });
  };

  const removeEvidence = (index: number) => {
    updateFormData({ 
      incidentEvidences: formData.incidentEvidences.filter((_, i) => i !== index) 
    });
  };

  const updateEvidenceUrl = (index: number, url: string) => {
    updateFormData({
      incidentEvidences: formData.incidentEvidences.map((e, i) => 
        i === index ? { ...e, url } : e
      )
    });
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
        <Label className="text-base font-medium">People Involved</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Full Name"
            value={newCitizen.fullName}
            onChange={(e) => setNewCitizen(prev => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            placeholder="CID"
            value={newCitizen.cid}
            onChange={(e) => setNewCitizen(prev => ({ ...prev, cid: e.target.value }))}
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
              disabled={!newCitizen.fullName}
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
                  {citizen.fullName}
                  {citizen.cid && <span className="text-muted-foreground"> (CID: {citizen.cid})</span>}
                  {citizen.phoneNumber && <span className="text-muted-foreground"> - {citizen.phoneNumber}</span>}
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
          {EVIDENCE_TYPES.map((evidenceType) => {
            const evidencesOfType = getEvidencesByType(evidenceType);
            return (
              <div key={evidenceType} className="space-y-2 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{evidenceType}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addEvidence(evidenceType)}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add {evidenceType}
                  </Button>
                </div>
                
                {evidencesOfType.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {evidencesOfType.map((evidence, idx) => {
                      const globalIndex = formData.incidentEvidences.findIndex(
                        (e, i) => e.type === evidenceType && 
                        formData.incidentEvidences.slice(0, i).filter(x => x.type === evidenceType).length === idx
                      );
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder={`${evidenceType} #${idx + 1} URL (Discord, Imgur, etc.)`}
                              value={evidence.url}
                              onChange={(e) => updateEvidenceUrl(globalIndex, e.target.value)}
                              className="text-sm"
                            />
                            {evidence.url && (
                              <div 
                                className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-background cursor-pointer group"
                                onClick={() => setPreviewImage(evidence.url)}
                              >
                                <img 
                                  src={evidence.url} 
                                  alt={`${evidenceType} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-foreground" />
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEvidence(globalIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {formData.incidentEvidences.filter(e => e.url).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Collected Evidence Summary ({formData.incidentEvidences.filter(e => e.url).length} items)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.incidentEvidences.filter(e => e.url).map((evidence, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-background rounded border border-border">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 10-90 Specific Fields - Scene Assignment */}
      {['bank', 'jewelry', 'store'].includes(formData.incidentType) && (
        <div className="space-y-4 p-4 rounded-lg bg-police-red/10 border border-police-red/30">
          <Label className="text-base font-medium text-police-red">10-90 Scene Assignment</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Reporting Officer (First Arrived)</Label>
              <Select
                value={formData.reportingOfficer}
                onValueChange={(value) => updateFormData({ reportingOfficer: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reporting officer" />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((officer) => {
                    const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                    return (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Scene Command</Label>
              <Select
                value={formData.sceneCommand}
                onValueChange={(value) => updateFormData({ sceneCommand: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scene command" />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((officer) => {
                    const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                    return (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Negotiator</Label>
              <Select
                value={formData.negotiator}
                onValueChange={(value) => updateFormData({ negotiator: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select negotiator" />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((officer) => {
                    const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                    return (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stayed Back For Hostage</Label>
              <Select
                value={formData.hostageOfficer}
                onValueChange={(value) => updateFormData({ hostageOfficer: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer" />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((officer) => {
                    const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                    return (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Robbers Involved</Label>
              <Input
                type="number"
                min="0"
                value={formData.robbersInvolved || ''}
                onChange={(e) => updateFormData({ robbersInvolved: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Robbers Apprehended</Label>
              <Input
                type="number"
                min="0"
                value={formData.robbersApprehended || ''}
                onChange={(e) => updateFormData({ robbersApprehended: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hostages</Label>
              <Input
                type="number"
                min="0"
                value={formData.hostagesCount || ''}
                onChange={(e) => updateFormData({ hostagesCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Demands</Label>
            <Input
              placeholder="e.g., Free Passage & No Spikes"
              value={formData.demands}
              onChange={(e) => updateFormData({ demands: e.target.value })}
            />
          </div>
        </div>
      )}

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
          <>
            {/* Pursuit Lineup for 10-90 */}
            {['bank', 'jewelry', 'store'].includes(formData.incidentType) && (
              <div className="space-y-4 p-3 rounded-lg bg-police-blue/10 border border-police-blue/30">
                <Label className="text-sm font-medium text-police-blue">Pursuit Lineup</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Primary</Label>
                    <Select
                      value={formData.pursuitPrimary}
                      onValueChange={(value) => updateFormData({ pursuitPrimary: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers?.map((officer) => {
                          const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                          return (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Secondary</Label>
                    <Select
                      value={formData.pursuitSecondary}
                      onValueChange={(value) => updateFormData({ pursuitSecondary: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select secondary" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers?.map((officer) => {
                          const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                          return (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tertiary</Label>
                    <Select
                      value={formData.pursuitTertiary}
                      onValueChange={(value) => updateFormData({ pursuitTertiary: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tertiary" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers?.map((officer) => {
                          const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                          return (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Parallel</Label>
                    <Select
                      value={formData.pursuitParallel}
                      onValueChange={(value) => updateFormData({ pursuitParallel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parallel" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers?.map((officer) => {
                          const name = `${officer.badge_number} ${officer.first_name} ${officer.last_name}`;
                          return (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

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

            {/* Chase Narrative for 10-90 */}
            {['bank', 'jewelry', 'store'].includes(formData.incidentType) && (
              <div className="space-y-2">
                <Label className="text-xs">Chase Narrative</Label>
                <Textarea
                  placeholder="Describe the chase..."
                  value={formData.chaseNarrative}
                  onChange={(e) => updateFormData({ chaseNarrative: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </>
        )}
      </div>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
