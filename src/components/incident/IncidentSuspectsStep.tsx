import { useState } from 'react';
import { VEHICLES, SUSPECT_STATUSES } from '@/data/incidentData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, User, Car } from 'lucide-react';
import type { IncidentFormData } from '@/pages/NewIncident';

interface IncidentSuspectsStepProps {
  formData: IncidentFormData;
  updateFormData: (updates: Partial<IncidentFormData>) => void;
}

export default function IncidentSuspectsStep({ formData, updateFormData }: IncidentSuspectsStepProps) {
  const [newSuspect, setNewSuspect] = useState({ name: '', charges: '', status: 'At Large' });
  const [newVehicle, setNewVehicle] = useState({ vehicle: '', plate: '', color: '' });

  const addSuspect = () => {
    if (newSuspect.name) {
      updateFormData({ suspects: [...formData.suspects, newSuspect] });
      setNewSuspect({ name: '', charges: '', status: 'At Large' });
    }
  };

  const removeSuspect = (index: number) => {
    updateFormData({ suspects: formData.suspects.filter((_, i) => i !== index) });
  };

  const addVehicle = () => {
    if (newVehicle.vehicle) {
      updateFormData({ vehicles: [...formData.vehicles, newVehicle] });
      setNewVehicle({ vehicle: '', plate: '', color: '' });
    }
  };

  const removeVehicle = (index: number) => {
    updateFormData({ vehicles: formData.vehicles.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-foreground">Suspects & Vehicles</h2>

      {/* Suspects Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-police-red" />
          <h3 className="font-medium text-foreground">Suspects</h3>
        </div>

        {/* Existing suspects */}
        {formData.suspects.length > 0 && (
          <div className="space-y-2">
            {formData.suspects.map((suspect, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{suspect.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {suspect.status}{suspect.charges && ` • ${suspect.charges}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSuspect(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new suspect */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-lg bg-secondary/20 border border-border/50">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="Suspect name"
              value={newSuspect.name}
              onChange={(e) => setNewSuspect({ ...newSuspect, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Charges</Label>
            <Input
              placeholder="Charges (optional)"
              value={newSuspect.charges}
              onChange={(e) => setNewSuspect({ ...newSuspect, charges: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select
              value={newSuspect.status}
              onValueChange={(value) => setNewSuspect({ ...newSuspect, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUSPECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={addSuspect}
              disabled={!newSuspect.name}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-police-blue" />
          <h3 className="font-medium text-foreground">Vehicles Involved</h3>
        </div>

        {/* Existing vehicles */}
        {formData.vehicles.length > 0 && (
          <div className="space-y-2">
            {formData.vehicles.map((vehicle, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{vehicle.vehicle}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.color && `${vehicle.color} • `}
                    {vehicle.plate || 'No plate'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVehicle(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-lg bg-secondary/20 border border-border/50">
          <div className="space-y-1">
            <Label className="text-xs">Vehicle</Label>
            <Select
              value={newVehicle.vehicle}
              onValueChange={(value) => setNewVehicle({ ...newVehicle, vehicle: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <Input
              placeholder="Color (optional)"
              value={newVehicle.color}
              onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plate</Label>
            <Input
              placeholder="Plate (optional)"
              value={newVehicle.plate}
              onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={addVehicle}
              disabled={!newVehicle.vehicle}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
