import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Plus, Trash2, Check, Clock, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface ApprovedEmail {
  id: string;
  email: string;
  added_by: string | null;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}

export default function Management() {
  const { canManageRoles, user } = useAuth();
  const [emails, setEmails] = useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (canManageRoles) {
      fetchEmails();
    }
  }, [canManageRoles]);

  const fetchEmails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('approved_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch approved emails');
    } else {
      setEmails(data || []);
    }
    setLoading(false);
  };

  const addEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    const { error } = await supabase
      .from('approved_emails')
      .insert({
        email: newEmail.trim().toLowerCase(),
        added_by: user?.id
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('This email is already in the approved list');
      } else {
        toast.error('Failed to add email');
      }
    } else {
      toast.success('Email added to approved list');
      setNewEmail('');
      setIsDialogOpen(false);
      fetchEmails();
    }
  };

  const deleteEmail = async (id: string) => {
    const { error } = await supabase
      .from('approved_emails')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete email');
    } else {
      toast.success('Email removed from approved list');
      fetchEmails();
    }
  };

  if (!canManageRoles) {
    return <Navigate to="/" replace />;
  }

  const filteredEmails = emails.filter(email =>
    email.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Access Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage approved emails for MDT access
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Approved Email</DialogTitle>
              <DialogDescription>
                Add an email address to allow registration access to the MDT.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@lspd.gov"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addEmail}>Add Email</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Emails</CardTitle>
          <CardDescription>
            Only users with approved emails can register for MDT access. {filteredEmails.length} email(s) in list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No emails match your search' : 'No approved emails yet. Add one to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.email}</TableCell>
                    <TableCell>
                      {email.used_by ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(email.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteEmail(email.id)}
                        disabled={!!email.used_by}
                        title={email.used_by ? 'Cannot delete registered email' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}