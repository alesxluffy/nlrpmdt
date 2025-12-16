import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { INCIDENT_TYPES } from '@/data/incidentData';
import type { IncidentFormData } from '@/pages/NewIncident';

interface IncidentReviewStepProps {
  formData: IncidentFormData;
  generateReport: (data: IncidentFormData) => string;
}

export default function IncidentReviewStep({ formData, generateReport }: IncidentReviewStepProps) {
  const [copied, setCopied] = useState(false);
  const report = generateReport(formData);
  const incidentType = INCIDENT_TYPES.find(t => t.value === formData.incidentType);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('Report copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Review Report</h2>
        <Button
          type="button"
          variant="outline"
          onClick={copyToClipboard}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground uppercase">Type</p>
          <p className="font-medium text-foreground mt-1">
            {incidentType?.icon} {incidentType?.label}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground uppercase">Location</p>
          <p className="font-medium text-foreground mt-1">
            {formData.location}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground uppercase">Suspects</p>
          <p className="font-medium text-foreground mt-1">
            {formData.suspects.length}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground uppercase">Vehicles</p>
          <p className="font-medium text-foreground mt-1">
            {formData.vehicles.length}
          </p>
        </div>
      </div>

      {/* Report Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <Label>Generated Report</Label>
        </div>
        <div className="p-4 rounded-lg bg-background border border-border font-mono text-sm whitespace-pre-wrap">
          {report}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Additional Notes (Optional)</Label>
        <Textarea
          placeholder="Add any additional notes before submitting..."
          value={formData.notes}
          onChange={(e) => {
            // This is read-only in review, but showing for reference
          }}
          rows={3}
          disabled
        />
      </div>

      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> Submitting this report will save it to the database and copy the formatted report to your clipboard for posting in Discord or other platforms.
        </p>
      </div>
    </div>
  );
}
