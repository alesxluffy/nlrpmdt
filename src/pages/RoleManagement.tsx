import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Search, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

type AppRole = 'patrol' | 'ftd' | 'high_command';

const roleLabels: Record<AppRole, string> = {
  patrol: 'Patrol',
  ftd: 'FTD',
  high_command: 'High Command',
};

const roleColors: Record<AppRole, string> = {
  patrol: 'bg-secondary text-foreground',
  ftd: 'bg-police-blue text-primary-foreground',
  high_command: 'bg-police-gold text-background',
};

export default function RoleManagement() {
  const { canManageRoles } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profileError) throw profileError;

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (roleError) throw roleError;

      return profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.id)?.role as AppRole || 'patrol',
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role updated');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });

  if (!canManageRoles) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = usersWithRoles?.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.badge_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign roles and permissions to officers
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or badge number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-secondary rounded" />
                ))}
              </div>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Badge #</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Current Role</TableHead>
                  <TableHead className="text-muted-foreground">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-mono text-primary">
                      {user.badge_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: AppRole) => 
                          updateRoleMutation.mutate({ userId: user.id, role: value })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patrol">Patrol</SelectItem>
                          <SelectItem value="ftd">FTD</SelectItem>
                          <SelectItem value="high_command">High Command</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
