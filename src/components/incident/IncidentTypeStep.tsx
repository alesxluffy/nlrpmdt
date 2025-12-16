import { INCIDENT_TYPES } from '@/data/incidentData';
import { cn } from '@/lib/utils';
import type { IncidentFormData } from '@/pages/NewIncident';

interface IncidentTypeStepProps {
  formData: IncidentFormData;
  updateFormData: (updates: Partial<IncidentFormData>) => void;
}

export default function IncidentTypeStep({ formData, updateFormData }: IncidentTypeStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Select Incident Type</h2>
      <p className="text-sm text-muted-foreground">
        Choose the type of incident you are reporting
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {INCIDENT_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => updateFormData({ incidentType: type.value })}
            className={cn(
              'p-4 rounded-lg border text-left transition-all duration-200',
              'hover:border-primary/50 hover:bg-secondary/50',
              formData.incidentType === type.value
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border bg-secondary/30'
            )}
          >
            <span className="text-2xl block mb-2">{type.icon}</span>
            <span className="font-medium text-foreground text-sm">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
