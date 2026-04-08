import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, User, Circle } from 'lucide-react';

interface AssignedUser {
  assignment_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  email: string | null;
  unread_count: number;
}

export default function CoachDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AssignedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;
      setIsLoading(true);

      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select('id, user_id, status, notes')
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (!assignments?.length) {
        setClients([]);
        setIsLoading(false);
        return;
      }

      const userIds = assignments.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const assignmentIds = assignments.map(a => a.id);
      const { data: unreadMessages } = await supabase
        .from('coach_messages')
        .select('assignment_id')
        .in('assignment_id', assignmentIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      const unreadMap: Record<string, number> = {};
      unreadMessages?.forEach(m => {
        unreadMap[m.assignment_id] = (unreadMap[m.assignment_id] || 0) + 1;
      });

      const profileMap: Record<string, string | null> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p.email; });

      setClients(assignments.map(a => ({
        assignment_id: a.id,
        user_id: a.user_id,
        status: a.status,
        notes: a.notes,
        email: profileMap[a.user_id] || null,
        unread_count: unreadMap[a.id] || 0,
      })));
      setIsLoading(false);
    };
    loadClients();
  }, [user]);

  const filtered = clients.filter(c =>
    !search || (c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showHomeLink />
      <main className="container max-w-4xl py-8 px-4">
        <h1 className="text-3xl font-serif mb-6">Coach Dashboard</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No assigned clients yet.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <Card key={client.assignment_id} className="hover:shadow-card transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{client.email || 'Unknown user'}</p>
                      {client.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{client.notes}</p>
                      )}
                    </div>
                    {client.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {client.unread_count} new
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/coach/user/${client.user_id}`)}
                    >
                      <User className="w-4 h-4 mr-1" /> Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/coach/messages/${client.user_id}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
