import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'practice' | 'reflection' | 'project';
  estimatedMinutes: number;
  successCriteria: string;
}

interface Phase {
  id: string;
  title: string;
  duration: string;
  goal: string;
  tasks: Task[];
}

const generateId = () => crypto.randomUUID();

export default function CoachPathBuilder() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isCoach, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingPathId, setExistingPathId] = useState<string | null>(null);
  const [menteeName, setMenteeName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [editingTask, setEditingTask] = useState<{ phaseIdx: number; taskIdx: number } | null>(null);
  const [taskForm, setTaskForm] = useState<Task>({ id: '', title: '', description: '', type: 'practice', estimatedMinutes: 30, successCriteria: '' });

  useEffect(() => {
    if (!loading && (!user || (!isCoach && !isAdmin))) {
      navigate('/');
      return;
    }
  }, [user, loading, isCoach, isAdmin]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      // Verify assignment
      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('id')
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!assignment && !isAdmin) {
        navigate('/coach');
        return;
      }

      // Get mentee name from aura
      const { data: aura } = await supabase
        .from('aura_sessions')
        .select('name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (aura?.name) setMenteeName(aura.name);

      // Load existing path
      const { data: path } = await supabase
        .from('personal_paths')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (path) {
        setExistingPathId(path.id);
        setTitle(path.title);
        setDescription(path.description || '');
        const dbPhases = (path.phases as any[]) || [];
        setPhases(dbPhases.map((p: any) => ({
          id: p.id || generateId(),
          title: p.title || '',
          duration: p.duration || '',
          goal: p.goal || '',
          tasks: (p.tasks || []).map((t: any) => ({
            id: t.id || generateId(),
            title: t.title || '',
            description: t.description || '',
            type: t.type || 'practice',
            estimatedMinutes: t.estimatedMinutes || 30,
            successCriteria: t.successCriteria || '',
          })),
        })));
      }

      setIsLoading(false);
    };

    if (!loading && user) load();
  }, [user, userId, loading, isAdmin]);

  const addPhase = () => {
    setPhases([...phases, { id: generateId(), title: '', duration: '', goal: '', tasks: [] }]);
  };

  const removePhase = (idx: number) => {
    setPhases(phases.filter((_, i) => i !== idx));
  };

  const updatePhase = (idx: number, field: keyof Phase, value: string) => {
    const updated = [...phases];
    (updated[idx] as any)[field] = value;
    setPhases(updated);
  };

  const addTask = (phaseIdx: number) => {
    const newTask: Task = { id: generateId(), title: '', description: '', type: 'practice', estimatedMinutes: 30, successCriteria: '' };
    setTaskForm(newTask);
    const updated = [...phases];
    updated[phaseIdx].tasks.push(newTask);
    setPhases(updated);
    setEditingTask({ phaseIdx, taskIdx: updated[phaseIdx].tasks.length - 1 });
  };

  const removeTask = (phaseIdx: number, taskIdx: number) => {
    const updated = [...phases];
    updated[phaseIdx].tasks.splice(taskIdx, 1);
    setPhases(updated);
  };

  const openTaskEditor = (phaseIdx: number, taskIdx: number) => {
    setTaskForm({ ...phases[phaseIdx].tasks[taskIdx] });
    setEditingTask({ phaseIdx, taskIdx });
  };

  const saveTask = () => {
    if (!editingTask) return;
    const updated = [...phases];
    updated[editingTask.phaseIdx].tasks[editingTask.taskIdx] = { ...taskForm };
    setPhases(updated);
    setEditingTask(null);
  };

  const publish = async () => {
    if (!user || !userId) return;
    if (!title.trim()) {
      toast.error('Please enter a path title');
      return;
    }
    if (phases.length === 0) {
      toast.error('Please add at least one phase');
      return;
    }

    setIsSaving(true);

    // Set first task of first phase to 'available', all others 'locked'
    const preparedPhases = phases.map((phase, pi) => ({
      ...phase,
      phaseNumber: pi + 1,
      tasks: phase.tasks.map((task, ti) => ({
        ...task,
        status: pi === 0 && ti === 0 ? 'available' : 'locked',
      })),
    }));

    const pathData = {
      user_id: userId,
      coach_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      phases: preparedPhases as unknown as Json,
      total_progress: 0,
      is_active: true,
    };

    try {
      if (existingPathId) {
        const { error } = await supabase
          .from('personal_paths')
          .update(pathData)
          .eq('id', existingPathId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('personal_paths')
          .insert(pathData);
        if (error) throw error;

        // Update mentee profile
        await supabase
          .from('profiles')
          .update({ personal_path_generated: true } as any)
          .eq('user_id', userId);
      }

      toast.success('Path published successfully!');
      navigate(`/coach/user/${userId}`);
    } catch (err: any) {
      console.error('Error saving path:', err);
      toast.error('Failed to save path');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container max-w-4xl py-4 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/coach/user/${userId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-serif font-semibold">
                {existingPathId ? 'Edit' : 'Build'} Skill Path
              </h1>
              {menteeName && <p className="text-sm text-muted-foreground">For {menteeName}</p>}
            </div>
          </div>
          <Button onClick={publish} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-6 px-4 md:px-8 space-y-6">
        {/* Path-level fields */}
        <div className="space-y-4 chamfer bg-card border border-border p-6">
          <div>
            <Label>Path Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Leadership Development Path" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this path..." rows={3} />
          </div>
        </div>

        {/* Phases */}
        {phases.map((phase, pi) => (
          <div key={phase.id} className="chamfer bg-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-semibold">Phase {pi + 1}</h3>
              <Button variant="ghost" size="icon" onClick={() => removePhase(pi)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={phase.title} onChange={e => updatePhase(pi, 'title', e.target.value)} placeholder="Phase title" />
              </div>
              <div>
                <Label>Duration</Label>
                <Input value={phase.duration} onChange={e => updatePhase(pi, 'duration', e.target.value)} placeholder="e.g. 2 weeks" />
              </div>
            </div>
            <div>
              <Label>Goal</Label>
              <Textarea value={phase.goal} onChange={e => updatePhase(pi, 'goal', e.target.value)} placeholder="What should the mentee achieve?" rows={2} />
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tasks ({phase.tasks.length})</Label>
                <Button variant="outline" size="sm" onClick={() => addTask(pi)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Task
                </Button>
              </div>
              {phase.tasks.map((task, ti) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => openTaskEditor(pi, ti)}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title || 'Untitled task'}</p>
                    <p className="text-xs text-muted-foreground">{task.type} · {task.estimatedMinutes}min</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); removeTask(pi, ti); }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addPhase} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Phase
        </Button>
      </main>

      {/* Task Editor Sheet */}
      <Sheet open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Title</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={taskForm.type} onValueChange={v => setTaskForm({ ...taskForm, type: v as Task['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Minutes</Label>
              <Input type="number" value={taskForm.estimatedMinutes} onChange={e => setTaskForm({ ...taskForm, estimatedMinutes: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Success Criteria</Label>
              <Textarea value={taskForm.successCriteria} onChange={e => setTaskForm({ ...taskForm, successCriteria: e.target.value })} rows={2} />
            </div>
            <Button onClick={saveTask} className="w-full">Save Task</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
