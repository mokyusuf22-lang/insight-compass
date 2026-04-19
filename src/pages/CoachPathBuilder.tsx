import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  BookOpen,
  Dumbbell,
  Brain,
  FolderKanban,
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type TaskType = 'reading' | 'practice' | 'reflection' | 'project';

interface DraftTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimatedMinutes: number;
  successCriteria: string;
}

interface DraftPhase {
  id: string;
  title: string;
  duration: string;
  goal: string;
  tasks: DraftTask[];
  expanded: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const TASK_TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  reading:    <BookOpen    className="w-3.5 h-3.5" />,
  practice:   <Dumbbell    className="w-3.5 h-3.5" />,
  reflection: <Brain       className="w-3.5 h-3.5" />,
  project:    <FolderKanban className="w-3.5 h-3.5" />,
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  reading:    'Reading',
  practice:   'Practice',
  reflection: 'Reflection',
  project:    'Project',
};

const emptyTask = (): DraftTask => ({
  id: uid(),
  title: '',
  description: '',
  type: 'practice',
  estimatedMinutes: 30,
  successCriteria: '',
});

const emptyPhase = (index: number): DraftPhase => ({
  id: uid(),
  title: `Phase ${index + 1}`,
  duration: '2 weeks',
  goal: '',
  tasks: [],
  expanded: true,
});

export default function CoachPathBuilder() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [clientName, setClientName]     = useState('');
  const [pathTitle, setPathTitle]       = useState('');
  const [pathDesc, setPathDesc]         = useState('');
  const [phases, setPhases]             = useState<DraftPhase[]>([]);
  const [existingPathId, setExistingId] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen]       = useState(false);
  const [editPhaseId, setEditPhaseId]   = useState<string | null>(null);
  const [editTask, setEditTask]         = useState<DraftTask>(emptyTask());

  const [loading, setLoading]           = useState(true);
  const [publishing, setPublishing]     = useState(false);
  const [notFound, setNotFound]         = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      const { data: assignment } = await supabase
        .from('coach_assignments' as any)
        .select('id')
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .maybeSingle();

      const { data: myRoles } = await supabase.rpc('get_my_roles');
      const isAdmin = myRoles?.some((r) => r.role === 'admin') ?? false;

      if (!assignment && !isAdmin) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: aura } = await supabase
        .from('aura_sessions')
        .select('name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .maybeSingle();

      setClientName((aura as any)?.name || profileRow?.email || userId.slice(0, 8));

      const { data: existing } = await supabase
        .from('personal_paths')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setExistingId(existing.id);
        setPathTitle(existing.title);
        setPathDesc(existing.description || '');

        const rawPhases = (existing.phases as any[]) || [];
        setPhases(
          rawPhases.map((p: any) => ({
            id: p.id || uid(),
            title: p.title || '',
            duration: p.duration || '2 weeks',
            goal: p.goal || '',
            expanded: false,
            tasks: (p.tasks || []).map((t: any) => ({
              id: t.id || uid(),
              title: t.title || '',
              description: t.description || '',
              type: (t.type as TaskType) || 'practice',
              estimatedMinutes: t.estimatedMinutes || 30,
              successCriteria: t.successCriteria || '',
            })),
          }))
        );
      }

      setLoading(false);
    };

    if (!authLoading && user) load();
  }, [user, authLoading, userId]);

  const addPhase = () =>
    setPhases(prev => [...prev, emptyPhase(prev.length)]);

  const deletePhase = (phaseId: string) =>
    setPhases(prev => prev.filter(p => p.id !== phaseId));

  const updatePhase = (phaseId: string, field: keyof DraftPhase, value: any) =>
    setPhases(prev =>
      prev.map(p => (p.id === phaseId ? { ...p, [field]: value } : p))
    );

  const toggleExpand = (phaseId: string) =>
    setPhases(prev =>
      prev.map(p => (p.id === phaseId ? { ...p, expanded: !p.expanded } : p))
    );

  const openAddTask = (phaseId: string) => {
    setEditPhaseId(phaseId);
    setEditTask(emptyTask());
    setSheetOpen(true);
  };

  const openEditTask = (phaseId: string, task: DraftTask) => {
    setEditPhaseId(phaseId);
    setEditTask({ ...task });
    setSheetOpen(true);
  };

  const saveTask = () => {
    if (!editTask.title.trim()) {
      toast.error('Task title is required.');
      return;
    }
    setPhases(prev =>
      prev.map(p => {
        if (p.id !== editPhaseId) return p;
        const exists = p.tasks.find(t => t.id === editTask.id);
        return {
          ...p,
          tasks: exists
            ? p.tasks.map(t => (t.id === editTask.id ? editTask : t))
            : [...p.tasks, editTask],
        };
      })
    );
    setSheetOpen(false);
  };

  const deleteTask = (phaseId: string, taskId: string) =>
    setPhases(prev =>
      prev.map(p =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      )
    );

  const publish = async () => {
    if (!pathTitle.trim()) { toast.error('Path title is required.'); return; }
    if (phases.length === 0) { toast.error('Add at least one phase.'); return; }
    const hasEmptyPhase = phases.some(p => !p.title.trim());
    if (hasEmptyPhase) { toast.error('All phases must have a title.'); return; }
    if (phases.some(p => p.tasks.length === 0)) {
      toast.error('Each phase must have at least one task.');
      return;
    }

    setPublishing(true);

    try {
      const builtPhases = phases.map((phase, phaseIdx) => ({
        id: phase.id,
        phaseNumber: phaseIdx + 1,
        title: phase.title,
        duration: phase.duration,
        goal: phase.goal,
        successDefinition: phase.goal,
        tasks: phase.tasks.map((task, taskIdx) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          estimatedMinutes: task.estimatedMinutes,
          successCriteria: task.successCriteria || '',
          instructions: [],
          status: phaseIdx === 0 && taskIdx === 0 ? 'available' : 'locked',
        })),
      }));

      const payload: any = {
        user_id: userId,
        coach_id: user!.id,
        title: pathTitle.trim(),
        description: pathDesc.trim() || null,
        phases: builtPhases,
        total_progress: 0,
        is_active: true,
      };

      if (existingPathId) {
        const { error } = await supabase
          .from('personal_paths')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existingPathId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('personal_paths')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setExistingId((data as any).id);
      }

      toast.success('Skill path published to mentee!');
      navigate(`/coach/user/${userId}`);
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Failed to publish path. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Client not found or access denied.</p>
        <Button onClick={() => navigate('/coach')} variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 flex items-center gap-3">
        <Button
          variant="ghost" size="icon"
          onClick={() => navigate(`/coach/user/${userId}`)}
          className="rounded-full flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Building path for</p>
          <h1 className="font-semibold text-base truncate">{clientName}</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {existingPathId && (
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              Editing existing path
            </Badge>
          )}
          <Button
            onClick={publish}
            disabled={publishing || phases.length === 0}
            className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift gap-2"
          >
            {publishing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? 'Publishing…' : 'Publish to Mentee'}
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
        <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Path Details
          </h2>
          <div className="space-y-1">
            <Label htmlFor="ptitle">Title</Label>
            <Input
              id="ptitle"
              placeholder="e.g. Leadership Foundations"
              value={pathTitle}
              onChange={e => setPathTitle(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pdesc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="pdesc"
              placeholder="A brief overview of what this path will help the mentee achieve…"
              value={pathDesc}
              onChange={e => setPathDesc(e.target.value)}
              className="resize-none min-h-[80px]"
            />
          </div>
          <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
            <span>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {phases.length > 0 && (
          <div className="space-y-4">
            {phases.map((phase, phaseIdx) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={phaseIdx}
                onUpdate={updatePhase}
                onDelete={deletePhase}
                onToggle={toggleExpand}
                onAddTask={openAddTask}
                onEditTask={openEditTask}
                onDeleteTask={deleteTask}
              />
            ))}
          </div>
        )}

        <button
          onClick={addPhase}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-border/60 hover:border-accent/40 hover:bg-accent/5 transition-all text-sm text-muted-foreground hover:text-accent flex items-center justify-center gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Add Phase
        </button>
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editTask.id && phases.some(p => p.tasks.some(t => t.id === editTask.id)) ? 'Edit Task' : 'Add Task'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Read chapters 1–3"
                value={editTask.title}
                onChange={e => setEditTask(t => ({ ...t, title: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                placeholder="What should the mentee do and why…"
                value={editTask.description}
                onChange={e => setEditTask(t => ({ ...t, description: e.target.value }))}
                className="resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={editTask.type}
                  onValueChange={v => setEditTask(t => ({ ...t, type: v as TaskType }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(k => (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">
                          {TASK_TYPE_ICONS[k]}
                          {TASK_TYPE_LABELS[k]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Est. minutes</Label>
                <Input
                  type="number"
                  min={5}
                  max={300}
                  step={5}
                  value={editTask.estimatedMinutes}
                  onChange={e => setEditTask(t => ({ ...t, estimatedMinutes: Math.max(5, parseInt(e.target.value) || 5) }))}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Success criteria <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Textarea
                placeholder="How will the mentee know they've completed this successfully?"
                value={editTask.successCriteria}
                onChange={e => setEditTask(t => ({ ...t, successCriteria: e.target.value }))}
                className="resize-none min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={saveTask} className="flex-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Task
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-full">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface PhaseCardProps {
  phase: DraftPhase;
  index: number;
  onUpdate: (id: string, field: keyof DraftPhase, value: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onAddTask: (phaseId: string) => void;
  onEditTask: (phaseId: string, task: DraftTask) => void;
  onDeleteTask: (phaseId: string, taskId: string) => void;
}

function PhaseCard({ phase, index, onUpdate, onDelete, onToggle, onAddTask, onEditTask, onDeleteTask }: PhaseCardProps) {
  return (
    <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-card">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-7 h-7 chamfer-sm bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-accent">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <Input
              placeholder="Phase title"
              value={phase.title}
              onChange={e => onUpdate(phase.id, 'title', e.target.value)}
              className="font-medium h-10"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Duration</Label>
                <Input
                  placeholder="e.g. 2 weeks"
                  value={phase.duration}
                  onChange={e => onUpdate(phase.id, 'duration', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tasks</Label>
                <div className="h-9 flex items-center text-sm text-muted-foreground">
                  {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Goal / objective</Label>
              <Textarea
                placeholder="What will the mentee achieve in this phase?"
                value={phase.goal}
                onChange={e => onUpdate(phase.id, 'goal', e.target.value)}
                className="resize-none min-h-[64px] text-sm"
              />
            </div>
          </div>
          <Button
            variant="ghost" size="icon"
            className="text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => onDelete(phase.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <button
          onClick={() => onToggle(phase.id)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {phase.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {phase.expanded ? 'Hide tasks' : `Show ${phase.tasks.length} task${phase.tasks.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {phase.expanded && (
        <div className="border-t border-border/50 bg-secondary/20 p-4 space-y-2">
          {phase.tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No tasks yet — add one below</p>
          )}

          {phase.tasks.map((task, taskIdx) => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-3"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground">{taskIdx + 1}</span>
              </div>
              <span className="flex-shrink-0 text-muted-foreground">
                {TASK_TYPE_ICONS[task.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title || <span className="text-muted-foreground italic">Untitled task</span>}</p>
                <p className="text-xs text-muted-foreground">{task.estimatedMinutes} min · {TASK_TYPE_LABELS[task.type]}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEditTask(phase.id, task)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteTask(phase.id, task.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline" size="sm"
            onClick={() => onAddTask(phase.id)}
            className="w-full rounded-xl border-dashed h-9 gap-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
}
