import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

import IncidentTypeStep from '@/components/incident/IncidentTypeStep';
import IncidentDetailsStep from '@/components/incident/IncidentDetailsStep';
import IncidentSuspectsStep from '@/components/incident/IncidentSuspectsStep';
import IncidentReviewStep from '@/components/incident/IncidentReviewStep';

export interface SuspectFormData {
  name: string;
  cid: string;
  mugshot: string;
  charges: string;
  confiscatedItems: string;
  evidences: string;
  plead: string;
  fine: number;
  jail: number;
  tag: string;
  status: string;
  isHUT: boolean;
}

export interface CitizenInvolved {
  fullName: string;
  phoneNumber: string;
  cid: string;
}

export interface EvidenceItem {
  type: string;
  url: string;
}

export interface IncidentFormData {
  incidentType: string;
  location: string;
  customLocation: string;
  description: string;
  officers: string[];
  citizensInvolved: CitizenInvolved[];
  incidentEvidences: EvidenceItem[];
  pursuitOccurred: boolean;
  pursuitInitiator: string;
  pursuitReason: string;
  pursuitType: string;
  pursuitTermination: string;
  suspects: SuspectFormData[];
  vehicles: Array<{
    vehicle: string;
    plate: string;
    color: string;
    registeredTo: string;
  }>;
  notes: string;
  // 10-90 specific fields
  reportingOfficer: string;
  sceneCommand: string;
  negotiator: string;
  hostageOfficer: string;
  pursuitPrimary: string;
  pursuitSecondary: string;
  pursuitTertiary: string;
  pursuitParallel: string;
  robbersInvolved: number;
  robbersApprehended: number;
  hostagesCount: number;
  demands: string;
  chaseNarrative: string;
}

const STEPS = ['Type', 'Details', 'Suspects & Vehicles', 'Review'];

export default function NewIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IncidentFormData>({
    incidentType: '',
    location: '',
    customLocation: '',
    description: '',
    officers: [],
    citizensInvolved: [],
    incidentEvidences: [],
    pursuitOccurred: false,
    pursuitInitiator: '',
    pursuitReason: '',
    pursuitType: '',
    pursuitTermination: '',
    suspects: [],
    vehicles: [],
    notes: '',
    // 10-90 specific fields
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

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      // Create main incident
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert({
          incident_type: data.incidentType,
          location: data.location,
          custom_location: data.customLocation || null,
          description: data.description,
          pursuit_occurred: data.pursuitOccurred,
          pursuit_initiator: data.pursuitInitiator || null,
          pursuit_reason: data.pursuitReason || null,
          pursuit_type: data.pursuitType || null,
          pursuit_termination: data.pursuitTermination || null,
          notes: data.notes || null,
          report_content: generateReport(data),
          created_by: user?.id,
        })
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Add officers
      if (data.officers.length > 0) {
        const { error: officersError } = await supabase
          .from('incident_officers')
          .insert(
            data.officers.map(name => ({
              incident_id: incident.id,
              officer_name: name,
            }))
          );
        if (officersError) throw officersError;
      }

      // Add suspects
      if (data.suspects.length > 0) {
        const { error: suspectsError } = await supabase
          .from('incident_suspects')
          .insert(
            data.suspects.map(s => ({
              incident_id: incident.id,
              name: s.name,
              charges: s.charges || null,
              status: s.status || 'In Custody',
              cid: s.cid || null,
              mugshot: s.mugshot || null,
              confiscated_items: s.confiscatedItems || null,
              evidences: s.evidences || null,
              plead: s.plead || 'Not Guilty',
              fine: s.isHUT ? 0 : (s.fine || 0),
              jail: s.isHUT ? 0 : (s.jail || 0),
              tag: s.tag || null,
              is_hut: s.isHUT || false,
            }))
          );
        if (suspectsError) throw suspectsError;
      }

      // Add vehicles
      if (data.vehicles.length > 0) {
        const { error: vehiclesError } = await supabase
          .from('incident_vehicles')
          .insert(
            data.vehicles.map(v => ({
              incident_id: incident.id,
              vehicle_name: v.vehicle,
              plate: v.plate || null,
              color: v.color || null,
            }))
          );
        if (vehiclesError) throw vehiclesError;
      }

      return incident;
    },
    onSuccess: () => {
      toast.success('Incident report created successfully!');
      navigate('/incidents');
    },
    onError: (error) => {
      toast.error('Failed to create incident: ' + error.message);
    },
  });

  const generateReport = (data: IncidentFormData): string => {
    const is1090 = ['bank', 'jewelry', 'store'].includes(data.incidentType);
    const incidentTypeLabel = data.incidentType === 'bank' ? 'Bank' : 
                              data.incidentType === 'jewelry' ? 'Jewelry Store' : 
                              data.incidentType === 'store' ? 'Store' : data.incidentType;
    const today = new Date().toLocaleDateString();

    if (is1090) {
      // 10-90 Format
      let report = `**10-90 | ${incidentTypeLabel} Robbery: ${data.location}**\n\n`;
      report += `**REPORTING OFFICER:**\n${data.reportingOfficer || 'N/A'}\n\n`;
      
      report += `**SCENE ASSIGNMENT**\n`;
      report += `Scene Command: ${data.sceneCommand || 'N/A'}\n`;
      report += `Negotiator: ${data.negotiator || 'N/A'}\n`;
      report += `Stayed Back For Hostage: ${data.hostageOfficer || 'N/A'}\n\n`;
      
      if (data.pursuitOccurred) {
        report += `**INVOLVED IN PURSUIT:**\n`;
        report += `Primary: ${data.pursuitPrimary || 'N/A'}\n`;
        report += `Secondary: ${data.pursuitSecondary || 'N/A'}\n`;
        report += `Tertiary: ${data.pursuitTertiary || 'N/A'}\n`;
        report += `Parallel: ${data.pursuitParallel || 'N/A'}\n\n`;
      }
      
      report += `**DETAILS & DEMANDS**\n\n`;
      report += `While patrolling, we received a report of an alarm going off at the ${data.location}. ${data.reportingOfficer || 'Reporting officer'} was assigned to create an incident report.\n\n`;
      report += `After setting up the perimeters around the area, we began with the negotiations. By interacting with the robbers we learned few below mentioned things:\n\n`;
      report += `Robbers Involved: ${data.robbersInvolved || 0}\n`;
      report += `Robbers Apprehended: ${data.robbersApprehended || 0}\n`;
      report += `Hostages: ${data.hostagesCount || 0}\n\n`;
      
      if (data.vehicles.length > 0) {
        report += `**Vehicle Details**\n`;
        data.vehicles.forEach((v) => {
          report += `Model: ${v.vehicle}\n`;
          report += `Color: ${v.color || 'N/A'}\n`;
          report += `Plate: ${v.plate || 'N/A'}\n`;
          report += `Registered to: ${v.registeredTo || 'N/A'}\n\n`;
        });
      }
      
      report += `Robbers were unidentified and in exchange of the hostage, their demand was ${data.demands || 'Free Passage & No Spikes'}.\n\n`;
      report += `Once everyone was ready, scene command prepared a lineup for the pursuit.\n\n`;
      
      if (data.pursuitOccurred && data.chaseNarrative) {
        report += `**CHASE:**\n${data.chaseNarrative}\n\n`;
      } else if (data.pursuitOccurred) {
        report += `**CHASE:**\nOnce everyone was ready, the chase started and they attempted to evade from police recklessly. The officers followed the suspects vehicle according to the sequence. The robbers kept roaming in the city and were damaging the public property.\n\n`;
      }
      
      if (data.suspects.length > 0) {
        data.suspects.forEach((s, i) => {
          report += `**Suspect ${i + 1}:**\n`;
          report += `Mugshot: ${s.mugshot || 'N/A'}\n`;
          report += `Name: ${s.name}\n`;
          report += `CID: ${s.cid || 'N/A'}\n`;
          report += `Charges: ${s.charges || 'None'}\n`;
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
        });
      }
      
      return report;
    } else {
      // Standard Format for other incidents
      let report = `**Date:** ${today}\n`;
      report += `**Title:** ${data.incidentType.toUpperCase()} | ${data.location}\n`;
      report += `**Incident Type:** ${incidentTypeLabel}\n`;
      report += `**Officers Involved:** ${data.officers.length > 0 ? data.officers.join(', ') : 'N/A'}\n`;
      
      if (data.citizensInvolved.length > 0) {
        report += `**People Involved:**\n`;
        data.citizensInvolved.forEach((c) => {
          report += `- ${c.fullName}${c.cid ? ` (CID: ${c.cid})` : ''}${c.phoneNumber ? ` - Phone: ${c.phoneNumber}` : ''}\n`;
        });
      }
      
      report += `**Location:** ${data.location}${data.customLocation ? ` (${data.customLocation})` : ''}\n`;
      report += `**Report:**\n${data.description || 'N/A'}\n\n`;
      
      if (data.pursuitOccurred) {
        report += `**Pursuit Details:**\n`;
        report += `- Initiator: ${data.pursuitInitiator}\n`;
        report += `- Reason: ${data.pursuitReason}\n`;
        report += `- Type: ${data.pursuitType}\n`;
        report += `- Termination: ${data.pursuitTermination}\n\n`;
      }

      if (data.incidentEvidences.length > 0) {
        report += `**Evidence Collected:**\n`;
        data.incidentEvidences.forEach((e) => {
          report += `- ${e.type}: ${e.url}\n`;
        });
        report += '\n';
      }
      
      if (data.suspects.length > 0) {
        data.suspects.forEach((s, i) => {
          report += `**Suspect ${i + 1}:**\n`;
          report += `Mugshot: ${s.mugshot || 'N/A'}\n`;
          report += `Name: ${s.name}\n`;
          report += `CID: ${s.cid || 'N/A'}\n`;
          report += `Charges: ${s.charges || 'None'}\n`;
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
        });
      }
      
      if (data.vehicles.length > 0) {
        report += `**Vehicles:**\n`;
        data.vehicles.forEach((v) => {
          report += `- ${v.vehicle}${v.color ? ` (${v.color})` : ''}${v.plate ? ` - Plate: ${v.plate}` : ''}${v.registeredTo ? ` - Registered to: ${v.registeredTo}` : ''}\n`;
        });
        report += '\n';
      }
      
      if (data.notes) {
        report += `**Additional Notes:**\n${data.notes}\n`;
      }
      
      return report;
    }
  };

  const updateFormData = (updates: Partial<IncidentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    createIncidentMutation.mutate(formData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.incidentType;
      case 1:
        return !!formData.location;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-police-red" />
          New Incident Report
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a detailed incident report
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => (
              <span
                key={step}
                className={`text-sm ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {currentStep === 0 && (
            <IncidentTypeStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 1 && (
            <IncidentDetailsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <IncidentSuspectsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <IncidentReviewStep
              formData={formData}
              generateReport={generateReport}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createIncidentMutation.isPending}
            className="gap-2"
          >
            {createIncidentMutation.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        )}
      </div>
    </div>
  );
}
