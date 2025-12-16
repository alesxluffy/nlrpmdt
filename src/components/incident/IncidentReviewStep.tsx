import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, FileText, User, DollarSign, Clock, AlertTriangle } from 'lucide-react';
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

  const totalFine = formData.suspects.reduce((sum, s) => sum + (s.isHUT ? 0 : (s.fine || 0)), 0);
  const totalJail = formData.suspects.reduce((sum, s) => sum + (s.isHUT ? 0 : (s.jail || 0)), 0);
  const hasHUT = formData.suspects.some(s => s.isHUT);

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

      {/* Totals Summary */}
      {formData.suspects.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-foreground mb-3">Sentencing Summary</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formData.suspects.length} Suspect(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-police-blue" />
              <span className="text-sm">
                Total Jail: {hasHUT && <span className="text-police-red font-bold">HUT + </span>}
                {totalJail} months
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Total Fine: {hasHUT && <span className="text-police-red font-bold">HUT + </span>}
                ${totalFine.toLocaleString()}
              </span>
            </div>
            {hasHUT && (
              <div className="flex items-center gap-2 text-police-red">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold">Hold Until Trial</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspects Detail */}
      {formData.suspects.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Suspects Detail</p>
          {formData.suspects.map((suspect, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/20 border border-border space-y-2">
              <div className="flex items-start gap-3">
                {suspect.mugshot && (
                  <img
                    src={suspect.mugshot}
                    alt="Mugshot"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-foreground">{suspect.name}</p>
                  {suspect.cid && <p className="text-xs text-muted-foreground">CID: {suspect.cid}</p>}
                  <p className="text-xs text-muted-foreground">
                    {suspect.status} • {suspect.plead}
                    {suspect.tag && ` • Tag: ${suspect.tag}`}
                  </p>
                </div>
                <div className="text-right">
                  {suspect.isHUT ? (
                    <span className="text-police-red font-bold text-sm">HUT</span>
                  ) : (
                    <>
                      <p className="text-sm text-police-blue">{suspect.jail} months</p>
                      <p className="text-sm text-green-500">${suspect.fine?.toLocaleString()}</p>
                    </>
                  )}
                </div>
              </div>
              {suspect.charges && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Charges:</span> {suspect.charges}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <Label>Generated Report</Label>
        </div>
        <div className="p-4 rounded-lg bg-background border border-border font-mono text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
          {report}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> Submitting this report will save it to the database and copy the formatted report to your clipboard for posting in Discord or other platforms.
        </p>
      </div>
    </div>
  );
}
