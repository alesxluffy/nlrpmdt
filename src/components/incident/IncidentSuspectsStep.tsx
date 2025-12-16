import { useState, useMemo } from 'react';
import { VEHICLES, SUSPECT_STATUSES } from '@/data/incidentData';
import { PENAL_CODES, PLEAD_OPTIONS, ENHANCEMENT_MULTIPLIERS, calculateTotals, type PenalCode, type ChargeWithCount, type EnhancementMultiplier } from '@/data/penalCodes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Trash2, User, Car, Search, X, AlertTriangle, DollarSign, Clock, Percent, Eye } from 'lucide-react';
import type { IncidentFormData } from '@/pages/NewIncident';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';

interface SuspectData {
  name: string;
  cid: string;
  mugshot: string;
  charges: ChargeWithCount[];
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

interface IncidentSuspectsStepProps {
  formData: IncidentFormData;
  updateFormData: (updates: Partial<IncidentFormData>) => void;
}

const emptySuspect: SuspectData = {
  name: '',
  cid: '',
  mugshot: '',
  charges: [],
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

export default function IncidentSuspectsStep({ formData, updateFormData }: IncidentSuspectsStepProps) {
  const [newSuspect, setNewSuspect] = useState<SuspectData>({ ...emptySuspect });
  const [newVehicle, setNewVehicle] = useState({ vehicle: '', plate: '', color: '' });
  const [chargeSearchOpen, setChargeSearchOpen] = useState(false);
  const [chargeSearch, setChargeSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredCharges = useMemo(() => {
    if (!chargeSearch) return PENAL_CODES;
    const search = chargeSearch.toLowerCase();
    return PENAL_CODES.filter(
      (pc) =>
        pc.code.toLowerCase().includes(search) ||
        pc.title.toLowerCase().includes(search)
    );
  }, [chargeSearch]);

  const addCharge = (charge: PenalCode) => {
    const existing = newSuspect.charges.find((c) => c.charge.code === charge.code);
    let updatedCharges: ChargeWithCount[];
    
    if (existing) {
      updatedCharges = newSuspect.charges.map((c) =>
        c.charge.code === charge.code ? { ...c, count: c.count + 1 } : c
      );
    } else {
      updatedCharges = [...newSuspect.charges, { charge, count: 1 }];
    }

    const totals = calculateTotals(updatedCharges, newSuspect.enhancements);
    setNewSuspect({
      ...newSuspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
    setChargeSearch('');
  };

  const updateChargeCount = (code: string, delta: number) => {
    const updatedCharges = newSuspect.charges
      .map((c) => (c.charge.code === code ? { ...c, count: Math.max(0, c.count + delta) } : c))
      .filter((c) => c.count > 0);

    const totals = calculateTotals(updatedCharges, newSuspect.enhancements);
    setNewSuspect({
      ...newSuspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const removeCharge = (code: string) => {
    const updatedCharges = newSuspect.charges.filter((c) => c.charge.code !== code);
    const totals = calculateTotals(updatedCharges, newSuspect.enhancements);
    setNewSuspect({
      ...newSuspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const toggleEnhancement = (enhancement: EnhancementMultiplier) => {
    const exists = newSuspect.enhancements.find((e) => e.code === enhancement.code);
    let updatedEnhancements: EnhancementMultiplier[];
    
    if (exists) {
      updatedEnhancements = newSuspect.enhancements.filter((e) => e.code !== enhancement.code);
    } else {
      updatedEnhancements = [...newSuspect.enhancements, enhancement];
    }

    const totals = calculateTotals(newSuspect.charges, updatedEnhancements);
    setNewSuspect({
      ...newSuspect,
      enhancements: updatedEnhancements,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const addSuspect = () => {
    if (newSuspect.name) {
      const enhancementStr = newSuspect.enhancements.map((e) => `${e.abbreviation} (${Math.round(e.multiplier * 100)}%)`).join(', ');
      const suspectForStorage = {
        name: newSuspect.name,
        charges: newSuspect.charges.map((c) => `${c.charge.code} ${c.charge.title}${c.count > 1 ? ` x${c.count}` : ''}`).join(', '),
        enhancements: enhancementStr,
        status: newSuspect.status,
        cid: newSuspect.cid,
        mugshot: newSuspect.mugshot,
        confiscatedItems: newSuspect.confiscatedItems,
        evidences: newSuspect.evidences,
        plead: newSuspect.plead,
        fine: newSuspect.isHUT ? 0 : newSuspect.fine,
        jail: newSuspect.isHUT ? 0 : newSuspect.jail,
        tag: newSuspect.tag,
        isHUT: newSuspect.isHUT,
      };
      updateFormData({ suspects: [...formData.suspects, suspectForStorage] });
      setNewSuspect({ ...emptySuspect });
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
            {formData.suspects.map((suspect: any, index: number) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex gap-4">
                  {suspect.mugshot && (
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => setPreviewImage(suspect.mugshot)}
                    >
                      <img
                        src={suspect.mugshot}
                        alt="Mugshot"
                        className="w-16 h-16 rounded-lg object-cover border border-border"
                      />
                      <div className="absolute inset-0 rounded-lg bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-4 h-4 text-foreground" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{suspect.name}</p>
                    {suspect.cid && <p className="text-xs text-muted-foreground">CID: {suspect.cid}</p>}
                    <p className="text-sm text-muted-foreground">
                      {suspect.status} • {suspect.plead}
                    </p>
                    {suspect.charges && (
                      <p className="text-xs text-muted-foreground max-w-md truncate">{suspect.charges}</p>
                    )}
                    {suspect.enhancements && (
                      <p className="text-xs text-police-blue flex items-center gap-1">
                        <Percent className="w-3 h-3" /> {suspect.enhancements}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs">
                      {suspect.isHUT ? (
                        <span className="text-police-red font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> HUT
                        </span>
                      ) : (
                        <>
                          <span className="text-police-blue flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {suspect.jail} months
                          </span>
                          <span className="text-green-500 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> ${suspect.fine?.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
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

        {/* Add new suspect form */}
        <div className="p-4 rounded-lg bg-secondary/20 border border-border/50 space-y-4">
          <p className="text-sm font-medium text-foreground">Add New Suspect</p>
          
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                placeholder="Suspect name"
                value={newSuspect.name}
                onChange={(e) => setNewSuspect({ ...newSuspect, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CID</Label>
              <Input
                placeholder="Criminal ID"
                value={newSuspect.cid}
                onChange={(e) => setNewSuspect({ ...newSuspect, cid: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mugshot URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Discord image URL"
                  value={newSuspect.mugshot}
                  onChange={(e) => setNewSuspect({ ...newSuspect, mugshot: e.target.value })}
                />
                {newSuspect.mugshot && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPreviewImage(newSuspect.mugshot)}
                    title="Preview image"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {newSuspect.mugshot && (
                <div 
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-background cursor-pointer group mt-2"
                  onClick={() => setPreviewImage(newSuspect.mugshot)}
                >
                  <img 
                    src={newSuspect.mugshot} 
                    alt="Mugshot preview"
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
          </div>

          {/* Row 2: Charges */}
          <div className="space-y-2">
            <Label className="text-xs">Charges</Label>
            <Popover open={chargeSearchOpen} onOpenChange={setChargeSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
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
                      {filteredCharges.map((charge) => (
                        <CommandItem
                          key={charge.code}
                          value={charge.code}
                          onSelect={() => {
                            addCharge(charge);
                            setChargeSearchOpen(false);
                          }}
                          className="flex justify-between"
                        >
                          <div>
                            <span className="font-mono text-xs text-police-blue mr-2">{charge.code}</span>
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

            {/* Selected charges with enhancement counts */}
            {newSuspect.charges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newSuspect.charges.map(({ charge, count }) => (
                  <Badge
                    key={charge.code}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <span className="font-mono text-xs">{charge.code}</span>
                    <span className="truncate max-w-[150px]">{charge.title}</span>
                    {charge.flags.includes('Per') && (
                      <div className="flex items-center gap-1 ml-1 border-l border-border pl-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => updateChargeCount(charge.code, -1)}
                        >
                          -
                        </Button>
                        <span className="text-xs font-bold min-w-[16px] text-center">{count}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => updateChargeCount(charge.code, 1)}
                        >
                          +
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeCharge(charge.code)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enhancement Multipliers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-police-blue" />
              <Label className="text-xs">Enhancement Multipliers</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 rounded-lg bg-background/30 border border-border/50">
              {ENHANCEMENT_MULTIPLIERS.map((enhancement) => {
                const isSelected = newSuspect.enhancements.some((e) => e.code === enhancement.code);
                return (
                  <div
                    key={enhancement.code}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-police-blue/20 border border-police-blue/50' : 'hover:bg-secondary/50'
                    }`}
                    onClick={() => toggleEnhancement(enhancement)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleEnhancement(enhancement)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{enhancement.abbreviation}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{enhancement.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {Math.round(enhancement.multiplier * 100)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
            {newSuspect.enhancements.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Total multiplier: {Math.round(newSuspect.enhancements.reduce((sum, e) => sum + e.multiplier, 0) * 100)}%
              </p>
            )}
          </div>

          {/* Row 3: Confiscated Items & Evidences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Confiscated Items</Label>
              <Textarea
                placeholder="List confiscated items..."
                value={newSuspect.confiscatedItems}
                onChange={(e) => setNewSuspect({ ...newSuspect, confiscatedItems: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Evidences (Discord URLs)</Label>
              <Textarea
                placeholder="Paste evidence image URLs (one per line)..."
                value={newSuspect.evidences}
                onChange={(e) => setNewSuspect({ ...newSuspect, evidences: e.target.value })}
                rows={2}
              />
              {newSuspect.evidences && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newSuspect.evidences.split('\n').filter(url => url.trim()).map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-background cursor-pointer group"
                      onClick={() => setPreviewImage(url.trim())}
                    >
                      <img 
                        src={url.trim()} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-3 h-3 text-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Plead, Status, Tag */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Plead</Label>
              <Select
                value={newSuspect.plead}
                onValueChange={(value) => setNewSuspect({ ...newSuspect, plead: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLEAD_OPTIONS.map((plead) => (
                    <SelectItem key={plead} value={plead}>{plead}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-1">
              <Label className="text-xs">Tag (Optional)</Label>
              <Input
                placeholder="Gang tag, etc."
                value={newSuspect.tag}
                onChange={(e) => setNewSuspect({ ...newSuspect, tag: e.target.value })}
              />
            </div>
          </div>

          {/* Totals Display */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-police-blue" />
                <span className="text-sm font-medium">Jail:</span>
                {newSuspect.isHUT ? (
                  <span className="text-police-red font-bold">HUT</span>
                ) : (
                  <span className="text-foreground">{newSuspect.jail} months</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Fine:</span>
                {newSuspect.isHUT ? (
                  <span className="text-police-red font-bold">HUT</span>
                ) : (
                  <span className="text-foreground">${newSuspect.fine.toLocaleString()}</span>
                )}
              </div>
            </div>
            <Button
              type="button"
              onClick={addSuspect}
              disabled={!newSuspect.name}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Suspect
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

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
