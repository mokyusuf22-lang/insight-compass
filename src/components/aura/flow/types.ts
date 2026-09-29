import type { AuraFlowState, ResolvedGoal } from '@/lib/auraFlow';

export interface StepProps {
  s: AuraFlowState;
  m: ResolvedGoal;
  update: (patch: Partial<AuraFlowState>) => void;
  go: (step: number) => void;
}
