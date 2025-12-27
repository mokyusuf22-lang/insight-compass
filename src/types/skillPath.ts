// Skill Path Types - Simplified structure: Path → Phases → Tasks

export interface PathTask {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'practice' | 'reflection' | 'project';
  estimatedMinutes: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  successCriteria: string;
  instructions?: string[];
}

export interface PathPhase {
  id: string;
  phaseNumber: number;
  title: string;
  duration: string;
  goal: string;
  successDefinition: string;
  progress: number;
  image: string;
  tasks: PathTask[];
}

export interface SkillPathData {
  id: string;
  title: string;
  description: string;
  totalProgress: number;
  phases: PathPhase[];
  todaysFocus?: {
    taskId: string;
    phaseId: string;
    reason: string;
  };
  createdAt?: string;
  assessmentHash?: string;
}

export interface UserProfile {
  mbtiType?: string;
  discStyle?: string;
  topStrengths?: string[];
  careerGoal?: string;
}

// Phase images mapping
export const phaseImages = [
  'phase-analysis',
  'phase-foundation',
  'phase-application',
  'phase-mastery',
];
