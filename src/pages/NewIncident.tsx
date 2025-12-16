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

export interface IncidentFormData {
  incidentType: string;
  location: string;
  customLocation: string;
  description: string;
  officers: string[];
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
  }>;
  notes: string;
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
    pursuitOccurred: false,
    pursuitInitiator: '',
    pursuitReason: '',
    pursuitType: '',
    pursuitTermination: '',
    suspects: [],
    vehicles: [],
    notes: '',
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
    let report = `**INCIDENT REPORT**\n`;
    report += `Type: ${data.incidentType.toUpperCase()}\n`;
    report += `Location: ${data.location}${data.customLocation ? ` (${data.customLocation})` : ''}\n\n`;
    
    if (data.description) {
      report += `**Description:**\n${data.description}\n\n`;
    }
    
    if (data.officers.length > 0) {
      report += `**Responding Officers:**\n${data.officers.join(', ')}\n\n`;
    }
    
    if (data.pursuitOccurred) {
      report += `**Pursuit Details:**\n`;
      report += `- Initiator: ${data.pursuitInitiator}\n`;
      report += `- Reason: ${data.pursuitReason}\n`;
      report += `- Type: ${data.pursuitType}\n`;
      report += `- Termination: ${data.pursuitTermination}\n\n`;
    }
    
    if (data.suspects.length > 0) {
      report += `**Suspects:**\n`;
      data.suspects.forEach((s, i) => {
        report += `\n**Suspect ${i + 1}:**\n`;
        if (s.mugshot) report += `Mugshot: ${s.mugshot}\n`;
        report += `Name: ${s.name}\n`;
        if (s.cid) report += `CID: ${s.cid}\n`;
        report += `Charges: ${s.charges || 'None'}\n`;
        if (s.confiscatedItems) report += `Confiscated Items: ${s.confiscatedItems}\n`;
        if (s.evidences) report += `Evidences: ${s.evidences}\n`;
        report += `Plead: ${s.plead}\n`;
        if (s.isHUT) {
          report += `Fine: HUT\n`;
          report += `Jail: HUT\n`;
        } else {
          report += `Fine: $${s.fine?.toLocaleString() || 0}\n`;
          report += `Jail: ${s.jail || 0} months\n`;
        }
        if (s.tag) report += `Tag: ${s.tag}\n`;
        report += `Status: ${s.status}\n`;
      });
      report += '\n';
    }
    
    if (data.vehicles.length > 0) {
      report += `**Vehicles:**\n`;
      data.vehicles.forEach((v, i) => {
        report += `${i + 1}. ${v.vehicle}${v.color ? ` (${v.color})` : ''}${v.plate ? ` - Plate: ${v.plate}` : ''}\n`;
      });
      report += '\n';
    }
    
    if (data.notes) {
      report += `**Additional Notes:**\n${data.notes}\n`;
    }
    
    return report;
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
