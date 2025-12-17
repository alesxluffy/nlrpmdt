import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SUSPECT_STATUSES } from '@/data/incidentData';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, X, AlertTriangle, DollarSign, Clock, Percent, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
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

interface AddSuspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
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

export function AddSuspectDialog({ open, onOpenChange, incidentId }: AddSuspectDialogProps) {
  const queryClient = useQueryClient();
  const [suspect, setSuspect] = useState<SuspectData>({ ...emptySuspect });
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
    setSuspect({
      ...suspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
    setChargeSearch('');
  };

  const updateChargeCount = (code: string, delta: number) => {
    const updatedCharges = suspect.charges
      .map((c) => (c.charge.code === code ? { ...c, count: Math.max(0, c.count + delta) } : c))
      .filter((c) => c.count > 0);

    const totals = calculateTotals(updatedCharges, suspect.enhancements);
    setSuspect({
      ...suspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const removeCharge = (code: string) => {
    const updatedCharges = suspect.charges.filter((c) => c.charge.code !== code);
    const totals = calculateTotals(updatedCharges, suspect.enhancements);
    setSuspect({
      ...suspect,
      charges: updatedCharges,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const toggleEnhancement = (enhancement: EnhancementMultiplier) => {
    const exists = suspect.enhancements.find((e) => e.code === enhancement.code);
    let updatedEnhancements: EnhancementMultiplier[];
    
    if (exists) {
      updatedEnhancements = suspect.enhancements.filter((e) => e.code !== enhancement.code);
    } else {
      updatedEnhancements = [...suspect.enhancements, enhancement];
    }

    const totals = calculateTotals(suspect.charges, updatedEnhancements);
    setSuspect({
      ...suspect,
      enhancements: updatedEnhancements,
      jail: totals.totalJail === 'HUT' ? 0 : totals.totalJail,
      fine: totals.totalFine === 'HUT' ? 0 : totals.totalFine,
      isHUT: totals.isHUT,
    });
  };

  const addSuspectMutation = useMutation({
    mutationFn: async () => {
      const chargesStr = suspect.charges.map((c) => `${c.charge.code} ${c.charge.title}${c.count > 1 ? ` x${c.count}` : ''}`).join(', ');
      
      const { error } = await supabase.from('incident_suspects').insert({
        incident_id: incidentId,
        name: suspect.name,
        cid: suspect.cid || null,
        mugshot: suspect.mugshot || null,
        charges: chargesStr || null,
        status: suspect.status,
        plead: suspect.plead,
        confiscated_items: suspect.confiscatedItems || null,
        evidences: suspect.evidences || null,
        fine: suspect.isHUT ? 0 : suspect.fine,
        jail: suspect.isHUT ? 0 : suspect.jail,
        tag: suspect.tag || null,
        is_hut: suspect.isHUT,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-history'] });
      toast.success('Suspect added');
      onOpenChange(false);
      setSuspect({ ...emptySuspect });
    },
    onError: () => {
      toast.error('Failed to add suspect');
    },
  });

  const handleSubmit = () => {
    if (!suspect.name.trim()) {
      toast.error('Suspect name is required');
      return;
    }
    addSuspectMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuspect({ ...emptySuspect });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Suspect
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  placeholder="Suspect name"
                  value={suspect.name}
                  onChange={(e) => setSuspect({ ...suspect, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CID</Label>
                <Input
                  placeholder="Criminal ID"
                  value={suspect.cid}
                  onChange={(e) => setSuspect({ ...suspect, cid: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mugshot URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    value={suspect.mugshot}
                    onChange={(e) => setSuspect({ ...suspect, mugshot: e.target.value })}
                    className="flex-1"
                  />
                  {suspect.mugshot && (
                    <Button
                      type="button"
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
                        {filteredCharges.slice(0, 20).map((charge) => (
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

              {/* Selected charges */}
              {suspect.charges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suspect.charges.map(({ charge, count }) => (
                    <Badge
                      key={charge.code}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      <span className="font-mono text-xs">{charge.code}</span>
                      <span className="truncate max-w-[120px]">{charge.title}</span>
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
                <Percent className="w-4 h-4 text-primary" />
                <Label className="text-xs">Enhancement Multipliers</Label>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
                {ENHANCEMENT_MULTIPLIERS.map((enhancement) => {
                  const isSelected = suspect.enhancements.some((e) => e.code === enhancement.code);
                  return (
                    <div
                      key={enhancement.code}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/20 border border-primary/50' : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => toggleEnhancement(enhancement)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEnhancement(enhancement)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{enhancement.abbreviation}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {Math.round(enhancement.multiplier * 100)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status & Plead */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={suspect.status} onValueChange={(v) => setSuspect({ ...suspect, status: v })}>
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
                <Select value={suspect.plead} onValueChange={(v) => setSuspect({ ...suspect, plead: v })}>
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
                  onChange={(e) => setSuspect({ ...suspect, tag: e.target.value })}
                />
              </div>
            </div>

            {/* Confiscated Items & Evidences */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Confiscated Items</Label>
                <Textarea
                  placeholder="List confiscated items..."
                  value={suspect.confiscatedItems}
                  onChange={(e) => setSuspect({ ...suspect, confiscatedItems: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Evidences (URLs, one per line)</Label>
                <Textarea
                  placeholder="Paste evidence image URLs..."
                  value={suspect.evidences}
                  onChange={(e) => setSuspect({ ...suspect, evidences: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Totals Display */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Jail:</span>
                  {suspect.isHUT ? (
                    <span className="text-destructive font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> HUT
                    </span>
                  ) : (
                    <span className="text-foreground">{suspect.jail} months</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Fine:</span>
                  {suspect.isHUT ? (
                    <span className="text-destructive font-bold">HUT</span>
                  ) : (
                    <span className="text-foreground">${suspect.fine.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addSuspectMutation.isPending}>
              {addSuspectMutation.isPending ? 'Adding...' : 'Add Suspect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
