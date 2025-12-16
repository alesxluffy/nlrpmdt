import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Users, Shield, Filter, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const rankColors: Record<string, string> = {
  'Chief of Police': 'bg-police-gold text-background',
  'Assistant Chief of Police': 'bg-police-gold/90 text-background',
  'Deputy Chief of Police': 'bg-police-gold/80 text-background',
  'Sheriff': 'bg-police-gold text-background',
  'Under Sheriff': 'bg-police-gold/90 text-background',
  'Deputy Sheriff': 'bg-police-gold/80 text-background',
  'Captain': 'bg-police-blue text-primary-foreground',
  'Lieutenant': 'bg-police-blue/80 text-primary-foreground',
  'Sergeant First Class': 'bg-primary/70 text-primary-foreground',
  'Sergeant': 'bg-primary/60 text-primary-foreground',
  'Corporal': 'bg-primary/50 text-primary-foreground',
  'Senior Trooper': 'bg-primary/40 text-primary-foreground',
  'Trooper First Class': 'bg-primary/35 text-primary-foreground',
  'Trooper': 'bg-secondary text-foreground',
  'Senior Deputy': 'bg-primary/40 text-primary-foreground',
  'Deputy First Class': 'bg-primary/35 text-primary-foreground',
  'Deputy': 'bg-secondary text-foreground',
  'Cadet': 'bg-muted text-muted-foreground',
  'Recruit': 'bg-muted text-muted-foreground',
};

const statusColors: Record<string, string> = {
  'Active': 'bg-success/20 text-success border-success/30',
  'On Duty': 'bg-police-blue/20 text-police-blue border-police-blue/30',
  'Off Duty': 'bg-muted text-muted-foreground border-border',
  'LOA': 'bg-warning/20 text-warning border-warning/30',
  'Suspended': 'bg-destructive/20 text-destructive border-destructive/30',
};

const ranks = [
  'Chief of Police',
  'Assistant Chief of Police',
  'Deputy Chief of Police',
  'Sheriff',
  'Under Sheriff',
  'Deputy Sheriff',
  'Captain',
  'Lieutenant',
  'Sergeant First Class',
  'Sergeant',
  'Corporal',
  'Senior Trooper',
  'Trooper First Class',
  'Trooper',
  'Senior Deputy',
  'Deputy First Class',
  'Deputy',
  'Cadet',
  'Recruit',
];
const statuses = ['Active', 'On Duty', 'Off Duty', 'LOA', 'Suspended'];
const divisions = ['SASP', 'BCSO', 'SAHP', 'Patrol', 'Detectives', 'SWAT', 'Traffic', 'K-9', 'Training'];

export default function Roster() {
  const { canEditRoster } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [editingOfficer, setEditingOfficer] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    badge_number: '',
    rank: '',
    division: '',
    status: '',
  });

  const { data: officers, isLoading } = useQuery({
    queryKey: ['officers-roster'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank');

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers-roster'] });
      toast.success('Officer updated successfully');
      setEditingOfficer(null);
    },
    onError: () => {
      toast.error('Failed to update officer');
    },
  });

  const handleEdit = (officer: any) => {
    setEditingOfficer(officer);
    setEditForm({
      badge_number: officer.badge_number || '',
      rank: officer.rank || 'Cadet',
      division: officer.division || 'Patrol',
      status: officer.status || 'Active',
    });
  };

  const handleSave = () => {
    if (editingOfficer) {
      updateMutation.mutate({
        id: editingOfficer.id,
        updates: editForm,
      });
    }
  };

  const uniqueDivisions = [...new Set(officers?.map(o => o.division).filter(Boolean) || [])];
  const uniqueRanks = [...new Set(officers?.map(o => o.rank).filter(Boolean) || [])];

  const filteredOfficers = officers?.filter(officer => {
    const matchesSearch = 
      `${officer.first_name} ${officer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.badge_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDivision = divisionFilter === 'all' || officer.division === divisionFilter;
    const matchesRank = rankFilter === 'all' || officer.rank === rankFilter;

    return matchesSearch && matchesDivision && matchesRank;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Officer Roster
          </h1>
          <p className="text-muted-foreground mt-1">
            {officers?.length || 0} officers registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or badge number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {uniqueDivisions.map(division => (
                    <SelectItem key={division} value={division!}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-40">
                  <Shield className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranks</SelectItem>
                  {uniqueRanks.map(rank => (
                    <SelectItem key={rank} value={rank!}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-secondary rounded" />
                ))}
              </div>
            </div>
          ) : filteredOfficers && filteredOfficers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Badge #</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Division</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  {canEditRoster && <TableHead className="text-muted-foreground w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfficers.map((officer) => (
                  <TableRow key={officer.id} className="border-border">
                    <TableCell className="font-mono text-primary">
                      {officer.badge_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {officer.first_name} {officer.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge className={rankColors[officer.rank || 'Cadet'] || rankColors['Cadet']}>
                        {officer.rank || 'Cadet'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {officer.division || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusColors[officer.status || 'Active'] || statusColors['Active']}
                      >
                        {officer.status || 'Active'}
                      </Badge>
                    </TableCell>
                    {canEditRoster && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(officer)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No officers found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || divisionFilter !== 'all' || rankFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No officers have registered yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingOfficer} onOpenChange={() => setEditingOfficer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingOfficer?.first_name} {editingOfficer?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Badge Number</Label>
              <Input
                value={editForm.badge_number}
                onChange={(e) => setEditForm(f => ({ ...f, badge_number: e.target.value }))}
                placeholder="Enter badge number"
              />
            </div>

            <div className="space-y-2">
              <Label>Rank</Label>
              <Select value={editForm.rank} onValueChange={(v) => setEditForm(f => ({ ...f, rank: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ranks.map(rank => (
                    <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={editForm.division} onValueChange={(v) => setEditForm(f => ({ ...f, division: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map(division => (
                    <SelectItem key={division} value={division}>{division}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOfficer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
