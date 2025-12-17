import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { INCIDENT_TYPES, LOCATIONS, INCIDENT_TYPE_LOCATIONS, SUSPECT_STATUSES } from '@/data/incidentData';
import { PENAL_CODES, PLEAD_OPTIONS, ENHANCEMENT_MULTIPLIERS, calculateTotals, type PenalCode, type ChargeWithCount, type EnhancementMultiplier } from '@/data/penalCodes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Edit, MapPin, FileText, Users, Car, Search, X, Plus, Trash2, Eye, UserPlus, Percent, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';

interface FullEditIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: any;
}

interface SuspectFormData {
  id?: string;
  name: string;
  cid: string;
  mugshot: string;
  charges: ChargeWithCount[];
  chargesStr: string;
  enhancements: EnhancementMultiplier[];
  confiscatedItems: string;
  evidences: string;
  plead: string;
  fine: number;
  jail: number;
  tag: string;
  status: string;
  isHUT: boolean;
}

interface VehicleFormData {
  id?: string;
  vehicle_name: string;
  plate: string;
  color: string;
  registered_owner: string;
  front_image: string;
  back_image: string;
  plate_image: string;
}

const emptySuspect: SuspectFormData = {
  name: '',
  cid: '',
  mugshot: '',
  charges: [],
  chargesStr: '',
  enhancements: [],
  confiscatedItems: '',
  evidences: '',
  plead: 'Not Guilty',
  fine: 0,
  jail: 0,
  tag: '',
  status: 'In Custody',
  isHUT: false,
};

const emptyVehicle: VehicleFormData = {
  vehicle_name: '',
  plate: '',
  color: '',
  registered_owner: '',
  front_image: '',
  back_image: '',
  plate_image: '',
};

export function FullEditIncidentDialog({ open, onOpenChange, incident }: FullEditIncidentDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'suspect' | 'vehicle'; id: string } | null>(null);
  
  // Form state
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
  
  // 10-90 specific fields (stored in report but need to extract)
  const [sceneData, setSceneData] = useState({
    reportingOfficer: '',
    sceneCommand: '',
    negotiator: '',
    hostageOfficer: '',
    pursuitPrimary: '',
    pursuitSecondary: '',
    pursuitTertiary: '',
    pursuitParallel: '',
    robbersInvolved: 0,
    robbersApprehended: 0,
    hostagesCount: 0,
    demands: '',
    chaseNarrative: '',
  });
  
  // Suspects and vehicles
  const [suspects, setSuspects] = useState<SuspectFormData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleFormData[]>([]);
  const [editingSuspect, setEditingSuspect] = useState<number | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<number | null>(null);
  
  // Charge search state
  const [chargeSearchOpen, setChargeSearchOpen] = useState(false);
  const [chargeSearch, setChargeSearch] = useState('');
  
  const is1090 = ['bank', 'jewelry', 'store'].includes(formData.incident_type);

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
      
      // Load suspects
      if (incident.incident_suspects) {
        setSuspects(incident.incident_suspects.map((s: any) => ({
          id: s.id,
          name: s.name || '',
          cid: s.cid || '',
          mugshot: s.mugshot || '',
          charges: [],
          chargesStr: s.charges || '',
          enhancements: [],
          confiscatedItems: s.confiscated_items || '',
          evidences: s.evidences || '',
          plead: s.plead || 'Not Guilty',
          fine: s.fine || 0,
          jail: s.jail || 0,
          tag: s.tag || '',
          status: s.status || 'In Custody',
          isHUT: s.is_hut || false,
        })));
      }
      
      // Load vehicles
      if (incident.incident_vehicles) {
        setVehicles(incident.incident_vehicles.map((v: any) => ({
          id: v.id,
          vehicle_name: v.vehicle_name || '',
          plate: v.plate || '',
          color: v.color || '',
          registered_owner: v.registered_owner || '',
          front_image: v.front_image || '',
          back_image: v.back_image || '',
          plate_image: v.plate_image || '',
        })));
      }
      
      // Parse 10-90 fields from report_content if applicable
      if (incident.report_content && ['bank', 'jewelry', 'store'].includes(incident.incident_type)) {
        const report = incident.report_content;
        // Extract values using regex or simple parsing
        const extractField = (pattern: RegExp) => {
          const match = report.match(pattern);
          return match ? match[1].trim() : '';
        };
        
        setSceneData({
          reportingOfficer: extractField(/REPORTING OFFICER:\*\*\n(.+)/),
          sceneCommand: extractField(/Scene Command: (.+)/),
          negotiator: extractField(/Negotiator: (.+)/),
          hostageOfficer: extractField(/Stayed Back For Hostage: (.+)/),
          pursuitPrimary: extractField(/Primary: (.+)/),
          pursuitSecondary: extractField(/Secondary: (.+)/),
          pursuitTertiary: extractField(/Tertiary: (.+)/),
          pursuitParallel: extractField(/Parallel: (.+)/),
          robbersInvolved: parseInt(extractField(/Robbers Involved: (\d+)/) || '0'),
          robbersApprehended: parseInt(extractField(/Robbers Apprehended: (\d+)/) || '0'),
          hostagesCount: parseInt(extractField(/Hostages: (\d+)/) || '0'),
          demands: extractField(/their demand was (.+)\./),
          chaseNarrative: extractField(/\*\*CHASE:\*\*\n([\s\S]*?)(?=\n\n\*\*|$)/),
        });
      }
    }
  }, [incident]);

  const incidentType = INCIDENT_TYPES.find(t => t.value === formData.incident_type);
  const hasFixedLocation = incidentType?.fixedLocation;
  const typeLocations = INCIDENT_TYPE_LOCATIONS[formData.incident_type];
  const locationOptions = typeLocations || LOCATIONS;

  const filteredCharges = useMemo(() => {
    if (!chargeSearch) return PENAL_CODES;
    const search = chargeSearch.toLowerCase();
    return PENAL_CODES.filter(
      (pc) =>
        pc.code.toLowerCase().includes(search) ||
        pc.title.toLowerCase().includes(search)
    );
  }, [chargeSearch]);

  // Suspect management functions
  const addNewSuspect = () => {
    setSuspects([...suspects, { ...emptySuspect }]);
    setEditingSuspect(suspects.length);
  };

  const updateSuspect = (index: number, updates: Partial<SuspectFormData>) => {
    setSuspects(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const addChargeToSuspect = (index: number, charge: PenalCode) => {
    const suspect = suspects[index];
    const existing = suspect.charges.find((c) => c.charge.code === charge.code);
    let updatedCharges: ChargeWithCount[];
    
    if (existing) {
      updatedCharges = suspect.charges.map((c) =>
        c.charge.code === charge.code ? { ...c, count: c.count + 1 } : c
      );
    } else {
      updatedCharges = [...suspect.charges, { charge, count: 1 }];
    }

    const totals = calculateTotals(updatedCharges, suspect.enhancements);
    const chargesStr = updatedCharges.map((c) => `${c.charge.code} ${c.charge.title}${c.count > 1 ? ` x${c.count}` : ''}`).join(', ');
    
    updateSuspect(index, {
      charges: updatedCharges,
      chargesStr,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const removeChargeFromSuspect = (suspectIndex: number, chargeCode: string) => {
    const suspect = suspects[suspectIndex];
    const updatedCharges = suspect.charges.filter((c) => c.charge.code !== chargeCode);
    const totals = calculateTotals(updatedCharges, suspect.enhancements);
    const chargesStr = updatedCharges.map((c) => `${c.charge.code} ${c.charge.title}${c.count > 1 ? ` x${c.count}` : ''}`).join(', ');
    
    updateSuspect(suspectIndex, {
      charges: updatedCharges,
      chargesStr,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const toggleEnhancementForSuspect = (suspectIndex: number, enhancement: EnhancementMultiplier) => {
    const suspect = suspects[suspectIndex];
    const exists = suspect.enhancements.find((e) => e.code === enhancement.code);
    let updatedEnhancements: EnhancementMultiplier[];
    
    if (exists) {
      updatedEnhancements = suspect.enhancements.filter((e) => e.code !== enhancement.code);
    } else {
      updatedEnhancements = [...suspect.enhancements, enhancement];
    }

    const totals = calculateTotals(suspect.charges, updatedEnhancements);
    updateSuspect(suspectIndex, {
      enhancements: updatedEnhancements,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  // Vehicle management
  const addNewVehicle = () => {
    setVehicles([...vehicles, { ...emptyVehicle }]);
    setEditingVehicle(vehicles.length);
  };

  const updateVehicle = (index: number, updates: Partial<VehicleFormData>) => {
    setVehicles(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  // Delete mutations
  const deleteSuspectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incident_suspects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Suspect removed');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incident_vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Vehicle removed');
    },
  });

  const handleDeleteItem = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'suspect') {
      const suspect = suspects.find(s => s.id === deleteConfirm.id);
      if (suspect?.id) {
        deleteSuspectMutation.mutate(suspect.id);
      }
      setSuspects(prev => prev.filter(s => s.id !== deleteConfirm.id));
    } else {
      const vehicle = vehicles.find(v => v.id === deleteConfirm.id);
      if (vehicle?.id) {
        deleteVehicleMutation.mutate(vehicle.id);
      }
      setVehicles(prev => prev.filter(v => v.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  // Save mutations
  const updateIncidentMutation = useMutation({
    mutationFn: async () => {
      // Generate updated report
      const reportContent = generateReport();
      
      // Update main incident
      const { error: incidentError } = await supabase
        .from('incidents')
        .update({
          incident_type: formData.incident_type,
          location: hasFixedLocation ? incidentType?.fixedLocation : formData.location,
          custom_location: formData.custom_location || null,
          description: formData.description || null,
          notes: formData.notes || null,
          pursuit_occurred: formData.pursuit_occurred,
          pursuit_initiator: formData.pursuit_initiator || null,
          pursuit_reason: formData.pursuit_reason || null,
          pursuit_type: formData.pursuit_type || null,
          pursuit_termination: formData.pursuit_termination || null,
          report_content: reportContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incident.id);
      
      if (incidentError) throw incidentError;

      // Update/create suspects
      for (const suspect of suspects) {
        const suspectData = {
          incident_id: incident.id,
          name: suspect.name,
          cid: suspect.cid || null,
          mugshot: suspect.mugshot || null,
          charges: suspect.chargesStr || null,
          status: suspect.status,
          plead: suspect.plead,
          confiscated_items: suspect.confiscatedItems || null,
          evidences: suspect.evidences || null,
          fine: suspect.isHUT ? 0 : suspect.fine,
          jail: suspect.isHUT ? 0 : suspect.jail,
          tag: suspect.tag || null,
          is_hut: suspect.isHUT,
        };

        if (suspect.id) {
          const { error } = await supabase.from('incident_suspects').update(suspectData).eq('id', suspect.id);
          if (error) throw error;
        } else if (suspect.name) {
          const { error } = await supabase.from('incident_suspects').insert(suspectData);
          if (error) throw error;
        }
      }

      // Update/create vehicles
      for (const vehicle of vehicles) {
        const vehicleData = {
          incident_id: incident.id,
          vehicle_name: vehicle.vehicle_name,
          plate: vehicle.plate || null,
          color: vehicle.color || null,
          registered_owner: vehicle.registered_owner || null,
          front_image: vehicle.front_image || null,
          back_image: vehicle.back_image || null,
          plate_image: vehicle.plate_image || null,
        };

        if (vehicle.id) {
          const { error } = await supabase.from('incident_vehicles').update(vehicleData).eq('id', vehicle.id);
          if (error) throw error;
        } else if (vehicle.vehicle_name) {
          const { error } = await supabase.from('incident_vehicles').insert(vehicleData);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Incident updated');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update incident: ' + error.message);
    },
  });

  const generateReport = (): string => {
    const today = new Date().toLocaleDateString();
    const location = hasFixedLocation ? incidentType?.fixedLocation : formData.location;
    
    if (is1090) {
      const incidentTypeLabel = formData.incident_type === 'bank' ? 'Bank' : 
                                formData.incident_type === 'jewelry' ? 'Jewelry Store' : 'Store';
      
      let report = `**10-90 | ${incidentTypeLabel} Robbery: ${location}**\n\n`;
      report += `**REPORTING OFFICER:**\n${sceneData.reportingOfficer || 'N/A'}\n\n`;
      
      report += `**SCENE ASSIGNMENT**\n`;
      report += `Scene Command: ${sceneData.sceneCommand || 'N/A'}\n`;
      report += `Negotiator: ${sceneData.negotiator || 'N/A'}\n`;
      report += `Stayed Back For Hostage: ${sceneData.hostageOfficer || 'N/A'}\n\n`;
      
      if (formData.pursuit_occurred) {
        report += `**INVOLVED IN PURSUIT:**\n`;
        report += `Primary: ${sceneData.pursuitPrimary || 'N/A'}\n`;
        report += `Secondary: ${sceneData.pursuitSecondary || 'N/A'}\n`;
        report += `Tertiary: ${sceneData.pursuitTertiary || 'N/A'}\n`;
        report += `Parallel: ${sceneData.pursuitParallel || 'N/A'}\n\n`;
      }
      
      report += `**DETAILS & DEMANDS**\n\n`;
      report += `While patrolling, we received a report of an alarm going off at the ${location}. ${sceneData.reportingOfficer || 'Reporting officer'} was assigned to create an incident report.\n\n`;
      report += `After setting up the perimeters around the area, we began with the negotiations. By interacting with the robbers we learned few below mentioned things:\n\n`;
      report += `Robbers Involved: ${sceneData.robbersInvolved || 0}\n`;
      report += `Robbers Apprehended: ${sceneData.robbersApprehended || 0}\n`;
      report += `Hostages: ${sceneData.hostagesCount || 0}\n\n`;
      
      if (vehicles.length > 0) {
        report += `**Vehicle Details**\n`;
        vehicles.forEach((v) => {
          report += `Model: ${v.vehicle_name}\n`;
          report += `Color: ${v.color || 'N/A'}\n`;
          report += `Plate: ${v.plate || 'N/A'}\n`;
          report += `Registered to: ${v.registered_owner || 'N/A'}\n\n`;
        });
      }
      
      report += `Robbers were unidentified and in exchange of the hostage, their demand was ${sceneData.demands || 'Free Passage & No Spikes'}.\n\n`;
      report += `Once everyone was ready, scene command prepared a lineup for the pursuit.\n\n`;
      
      if (formData.pursuit_occurred && sceneData.chaseNarrative) {
        report += `**CHASE:**\n${sceneData.chaseNarrative}\n\n`;
      }
      
      suspects.forEach((s, i) => {
        if (s.name) {
          report += `**Suspect ${i + 1}:**\n`;
          report += `Mugshot: ${s.mugshot || 'N/A'}\n`;
          report += `Name: ${s.name}\n`;
          report += `CID: ${s.cid || 'N/A'}\n`;
          report += `Charges: ${s.chargesStr || 'None'}\n`;
          report += `Confiscated Items: ${s.confiscatedItems || 'N/A'}\n`;
          report += `Evidences: ${s.evidences || 'N/A'}\n`;
          if (s.isHUT) {
            report += `Fine: HUT\n`;
            report += `Jail: HUT\n`;
          } else {
            report += `Fine: $${s.fine?.toLocaleString() || 0}\n`;
            report += `Jail: ${s.jail || 0} months\n`;
          }
          report += `Tag: ${s.tag || 'N/A'}\n\n`;
        }
      });
      
      return report;
    } else {
      let report = `**Date:** ${today}\n`;
      report += `**Title:** ${formData.incident_type.toUpperCase()} | ${location}\n`;
      report += `**Incident Type:** ${incidentType?.label || formData.incident_type}\n`;
      report += `**Location:** ${location}${formData.custom_location ? ` (${formData.custom_location})` : ''}\n`;
      report += `**Report:**\n${formData.description || 'N/A'}\n\n`;
      
      if (formData.pursuit_occurred) {
        report += `**Pursuit Details:**\n`;
        report += `- Initiator: ${formData.pursuit_initiator}\n`;
        report += `- Reason: ${formData.pursuit_reason}\n`;
        report += `- Type: ${formData.pursuit_type}\n`;
        report += `- Termination: ${formData.pursuit_termination}\n\n`;
      }
      
      suspects.forEach((s, i) => {
        if (s.name) {
          report += `**Suspect ${i + 1}:**\n`;
          report += `Mugshot: ${s.mugshot || 'N/A'}\n`;
          report += `Name: ${s.name}\n`;
          report += `CID: ${s.cid || 'N/A'}\n`;
          report += `Charges: ${s.chargesStr || 'None'}\n`;
          report += `Confiscated Items: ${s.confiscatedItems || 'N/A'}\n`;
          report += `Evidences: ${s.evidences || 'N/A'}\n`;
          if (s.isHUT) {
            report += `Fine: HUT\n`;
            report += `Jail: HUT\n`;
          } else {
            report += `Fine: $${s.fine?.toLocaleString() || 0}\n`;
            report += `Jail: ${s.jail || 0} months\n`;
          }
          report += `Tag: ${s.tag || 'N/A'}\n\n`;
        }
      });
      
      if (vehicles.length > 0) {
        report += `**Vehicles:**\n`;
        vehicles.forEach((v) => {
          if (v.vehicle_name) {
            report += `- ${v.vehicle_name}${v.color ? ` (${v.color})` : ''}${v.plate ? ` - Plate: ${v.plate}` : ''}${v.registered_owner ? ` - Registered to: ${v.registered_owner}` : ''}\n`;
          }
        });
        report += '\n';
      }
      
      if (formData.notes) {
        report += `**Additional Notes:**\n${formData.notes}\n`;
      }
      
      return report;
    }
  };

  const handleSubmit = () => {
    if (!formData.incident_type) {
      toast.error('Incident type is required');
      return;
    }
    if (!hasFixedLocation && !formData.location) {
      toast.error('Location is required');
      return;
    }
    updateIncidentMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Incident
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className={`grid w-full ${is1090 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="details">Details</TabsTrigger>
              {is1090 && <TabsTrigger value="scene">Scene Assignment</TabsTrigger>}
              <TabsTrigger value="suspects">Suspects ({suspects.length})</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-1">
              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
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
                    <Checkbox
                      id="pursuit_occurred"
                      checked={formData.pursuit_occurred}
                      onCheckedChange={(checked) => setFormData({ ...formData, pursuit_occurred: !!checked })}
                    />
                    <Label htmlFor="pursuit_occurred" className="text-sm cursor-pointer">Pursuit Occurred</Label>
                  </div>

                  {formData.pursuit_occurred && !is1090 && (
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
              </TabsContent>

              {/* Scene Assignment Tab (10-90 only) */}
              {is1090 && (
                <TabsContent value="scene" className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Reporting Officer</Label>
                    <Input
                      placeholder="Officer name"
                      value={sceneData.reportingOfficer}
                      onChange={(e) => setSceneData({ ...sceneData, reportingOfficer: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Scene Command</Label>
                      <Input
                        placeholder="Scene commander"
                        value={sceneData.sceneCommand}
                        onChange={(e) => setSceneData({ ...sceneData, sceneCommand: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Negotiator</Label>
                      <Input
                        placeholder="Negotiator name"
                        value={sceneData.negotiator}
                        onChange={(e) => setSceneData({ ...sceneData, negotiator: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hostage Handler</Label>
                      <Input
                        placeholder="Stayed back for hostage"
                        value={sceneData.hostageOfficer}
                        onChange={(e) => setSceneData({ ...sceneData, hostageOfficer: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.pursuit_occurred && (
                    <>
                      <Label className="text-xs text-muted-foreground">Pursuit Lineup</Label>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Primary</Label>
                          <Input
                            placeholder="Primary unit"
                            value={sceneData.pursuitPrimary}
                            onChange={(e) => setSceneData({ ...sceneData, pursuitPrimary: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Secondary</Label>
                          <Input
                            placeholder="Secondary unit"
                            value={sceneData.pursuitSecondary}
                            onChange={(e) => setSceneData({ ...sceneData, pursuitSecondary: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tertiary</Label>
                          <Input
                            placeholder="Tertiary unit"
                            value={sceneData.pursuitTertiary}
                            onChange={(e) => setSceneData({ ...sceneData, pursuitTertiary: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Parallel</Label>
                          <Input
                            placeholder="Parallel unit"
                            value={sceneData.pursuitParallel}
                            onChange={(e) => setSceneData({ ...sceneData, pursuitParallel: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Robbers Involved</Label>
                      <Input
                        type="number"
                        min="0"
                        value={sceneData.robbersInvolved}
                        onChange={(e) => setSceneData({ ...sceneData, robbersInvolved: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Robbers Apprehended</Label>
                      <Input
                        type="number"
                        min="0"
                        value={sceneData.robbersApprehended}
                        onChange={(e) => setSceneData({ ...sceneData, robbersApprehended: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hostages</Label>
                      <Input
                        type="number"
                        min="0"
                        value={sceneData.hostagesCount}
                        onChange={(e) => setSceneData({ ...sceneData, hostagesCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Demands</Label>
                    <Input
                      placeholder="Free Passage & No Spikes"
                      value={sceneData.demands}
                      onChange={(e) => setSceneData({ ...sceneData, demands: e.target.value })}
                    />
                  </div>

                  {formData.pursuit_occurred && (
                    <div className="space-y-1">
                      <Label className="text-xs">Chase Narrative</Label>
                      <Textarea
                        placeholder="Describe the chase..."
                        value={sceneData.chaseNarrative}
                        onChange={(e) => setSceneData({ ...sceneData, chaseNarrative: e.target.value })}
                        rows={4}
                      />
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Suspects Tab */}
              <TabsContent value="suspects" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Suspects</Label>
                  <Button size="sm" onClick={addNewSuspect} className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Suspect
                  </Button>
                </div>

                {suspects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No suspects added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suspects.map((suspect, index) => (
                      <div key={suspect.id || index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3 items-center">
                            {suspect.mugshot && (
                              <div 
                                className="w-12 h-12 rounded-lg overflow-hidden border border-border cursor-pointer"
                                onClick={() => setPreviewImage(suspect.mugshot)}
                              >
                                <img src={suspect.mugshot} alt="Mugshot" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{suspect.name || 'Unnamed Suspect'}</p>
                              {suspect.cid && <p className="text-xs text-muted-foreground">CID: {suspect.cid}</p>}
                              <div className="flex gap-2 text-xs">
                                <Badge variant="outline">{suspect.status}</Badge>
                                {suspect.isHUT && <Badge variant="destructive">HUT</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingSuspect(editingSuspect === index ? null : index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteConfirm({ type: 'suspect', id: suspect.id || `new-${index}` })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Evidence Thumbnails */}
                        {suspect.evidences && editingSuspect !== index && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Evidences</Label>
                            <div className="flex flex-wrap gap-2">
                              {suspect.evidences.split('\n').filter(url => url.trim()).map((url, i) => (
                                <div
                                  key={i}
                                  className="w-16 h-16 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors"
                                  onClick={() => setPreviewImage(url.trim())}
                                >
                                  <img 
                                    src={url.trim()} 
                                    alt={`Evidence ${i + 1}`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {editingSuspect === index && (
                          <div className="space-y-3 pt-3 border-t border-border">
                            {/* Basic Info */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input
                                  placeholder="Suspect name"
                                  value={suspect.name}
                                  onChange={(e) => updateSuspect(index, { name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">CID</Label>
                                <Input
                                  placeholder="Criminal ID"
                                  value={suspect.cid}
                                  onChange={(e) => updateSuspect(index, { cid: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mugshot URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Image URL"
                                    value={suspect.mugshot}
                                    onChange={(e) => updateSuspect(index, { mugshot: e.target.value })}
                                    className="flex-1"
                                  />
                                  {suspect.mugshot && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setPreviewImage(suspect.mugshot)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Charges Search */}
                            <div className="space-y-2">
                              <Label className="text-xs">Charges</Label>
                              <Popover open={chargeSearchOpen && editingSuspect === index} onOpenChange={setChargeSearchOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-muted-foreground"
                                  >
                                    <Search className="w-4 h-4 mr-2" />
                                    Search penal codes...
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] p-0" align="start">
                                  <Command>
                                    <CommandInput
                                      placeholder="Search by code or title..."
                                      value={chargeSearch}
                                      onValueChange={setChargeSearch}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No charges found.</CommandEmpty>
                                      <CommandGroup>
                                        {filteredCharges.slice(0, 15).map((charge) => (
                                          <CommandItem
                                            key={charge.code}
                                            value={charge.code}
                                            onSelect={() => {
                                              addChargeToSuspect(index, charge);
                                              setChargeSearchOpen(false);
                                            }}
                                            className="flex justify-between"
                                          >
                                            <div>
                                              <span className="font-mono text-xs text-primary mr-2">{charge.code}</span>
                                              <span>{charge.title}</span>
                                            </div>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                              <span>{charge.jail === 'HUT' ? 'HUT' : `${charge.jail}mo`}</span>
                                              <span>${charge.fine === 'HUT' ? 'HUT' : charge.fine.toLocaleString()}</span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              {suspect.charges.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {suspect.charges.map(({ charge, count }) => (
                                    <Badge key={charge.code} variant="secondary" className="flex items-center gap-1 py-1">
                                      <span className="font-mono text-xs">{charge.code}</span>
                                      <span className="truncate max-w-[100px]">{charge.title}</span>
                                      {count > 1 && <span className="text-xs">x{count}</span>}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() => removeChargeFromSuspect(index, charge.code)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {suspect.chargesStr && suspect.charges.length === 0 && (
                                <p className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                                  Current: {suspect.chargesStr}
                                </p>
                              )}
                            </div>

                            {/* Enhancements */}
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-2">
                                <Percent className="w-3 h-3" />
                                Enhancements
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {ENHANCEMENT_MULTIPLIERS.map((enhancement) => {
                                  const isSelected = suspect.enhancements.some((e) => e.code === enhancement.code);
                                  return (
                                    <Badge
                                      key={enhancement.code}
                                      variant={isSelected ? 'default' : 'outline'}
                                      className="cursor-pointer"
                                      onClick={() => toggleEnhancementForSuspect(index, enhancement)}
                                    >
                                      {enhancement.abbreviation} ({Math.round(enhancement.multiplier * 100)}%)
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Status, Plead, Tag */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={suspect.status} onValueChange={(v) => updateSuspect(index, { status: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SUSPECT_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Plead</Label>
                                <Select value={suspect.plead} onValueChange={(v) => updateSuspect(index, { plead: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PLEAD_OPTIONS.map((p) => (
                                      <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tag</Label>
                                <Input
                                  placeholder="Gang tag, etc."
                                  value={suspect.tag}
                                  onChange={(e) => updateSuspect(index, { tag: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Confiscated & Evidences */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Confiscated Items</Label>
                                <Textarea
                                  placeholder="List items..."
                                  value={suspect.confiscatedItems}
                                  onChange={(e) => updateSuspect(index, { confiscatedItems: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Evidences (URLs)</Label>
                                <Textarea
                                  placeholder="One URL per line..."
                                  value={suspect.evidences}
                                  onChange={(e) => updateSuspect(index, { evidences: e.target.value })}
                                  rows={2}
                                />
                                {suspect.evidences && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {suspect.evidences.split('\n').filter(url => url.trim()).map((url, i) => (
                                      <div
                                        key={i}
                                        className="w-12 h-12 rounded overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => setPreviewImage(url.trim())}
                                      >
                                        <img 
                                          src={url.trim()} 
                                          alt={`Evidence ${i + 1}`} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Totals */}
                            <div className="flex items-center gap-4 p-2 rounded bg-secondary/50">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-sm">Jail:</span>
                                {suspect.isHUT ? (
                                  <Badge variant="destructive">HUT</Badge>
                                ) : (
                                  <span className="font-bold">{suspect.jail} months</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-sm">Fine:</span>
                                {suspect.isHUT ? (
                                  <Badge variant="destructive">HUT</Badge>
                                ) : (
                                  <span className="font-bold text-green-500">${suspect.fine.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Vehicles Tab */}
              <TabsContent value="vehicles" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Vehicles Involved</Label>
                  <Button size="sm" onClick={addNewVehicle} className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Vehicle
                  </Button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No vehicles added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicles.map((vehicle, index) => (
                      <div key={vehicle.id || index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{vehicle.vehicle_name || 'Unnamed Vehicle'}</p>
                            {vehicle.plate && <p className="text-xs text-muted-foreground">Plate: {vehicle.plate}</p>}
                            {vehicle.color && <p className="text-xs text-muted-foreground">Color: {vehicle.color}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingVehicle(editingVehicle === index ? null : index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteConfirm({ type: 'vehicle', id: vehicle.id || `new-${index}` })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {editingVehicle === index && (
                          <div className="space-y-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Vehicle Name *</Label>
                                <Input
                                  placeholder="e.g. Karin Sultan RS"
                                  value={vehicle.vehicle_name}
                                  onChange={(e) => updateVehicle(index, { vehicle_name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Plate</Label>
                                <Input
                                  placeholder="License plate"
                                  value={vehicle.plate}
                                  onChange={(e) => updateVehicle(index, { plate: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Color</Label>
                                <Input
                                  placeholder="Vehicle color"
                                  value={vehicle.color}
                                  onChange={(e) => updateVehicle(index, { color: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Registered Owner</Label>
                                <Input
                                  placeholder="Owner name"
                                  value={vehicle.registered_owner}
                                  onChange={(e) => updateVehicle(index, { registered_owner: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Front Image URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="URL"
                                    value={vehicle.front_image}
                                    onChange={(e) => updateVehicle(index, { front_image: e.target.value })}
                                    className="flex-1"
                                  />
                                  {vehicle.front_image && (
                                    <Button variant="outline" size="icon" onClick={() => setPreviewImage(vehicle.front_image)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Back Image URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="URL"
                                    value={vehicle.back_image}
                                    onChange={(e) => updateVehicle(index, { back_image: e.target.value })}
                                    className="flex-1"
                                  />
                                  {vehicle.back_image && (
                                    <Button variant="outline" size="icon" onClick={() => setPreviewImage(vehicle.back_image)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Plate Image URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="URL"
                                    value={vehicle.plate_image}
                                    onChange={(e) => updateVehicle(index, { plate_image: e.target.value })}
                                    className="flex-1"
                                  />
                                  {vehicle.plate_image && (
                                    <Button variant="outline" size="icon" onClick={() => setPreviewImage(vehicle.plate_image)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={updateIncidentMutation.isPending}>
              {updateIncidentMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this {deleteConfirm?.type} from the incident. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteItem}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview */}
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
