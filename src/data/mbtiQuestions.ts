// MBTI Assessment Questions - 93 questions across 4 axes
// Each question maps to exactly one axis with a direction

export type MBTIAxis = 'EI' | 'SN' | 'TF' | 'JP';
export type MBTIDirection = 'I' | 'E' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface MBTIQuestion {
  id: number;
  text: string;
  axis: MBTIAxis;
  direction: MBTIDirection; // The pole this question scores toward when agreeing
  contradictionGroupId?: number; // Questions that logically contradict each other
}

export const mbtiAnswerOptions = [
  { value: 'strongly_disagree', label: 'Strongly Disagree', score: -2 },
  { value: 'disagree', label: 'Disagree', score: -1 },
  { value: 'neutral', label: 'Neutral', score: 0 },
  { value: 'agree', label: 'Agree', score: 1 },
  { value: 'strongly_agree', label: 'Strongly Agree', score: 2 },
];

export const mbtiQuestions: MBTIQuestion[] = [
  // ============================================
  // INTROVERSION (I) vs EXTRAVERSION (E) — 24 QUESTIONS
  // ============================================
  
  // Direction: I (Questions 1-12)
  { id: 1, text: "I regain energy by spending time alone.", axis: 'EI', direction: 'I' },
  { id: 2, text: "I prefer thinking things through privately before discussing them.", axis: 'EI', direction: 'I' },
  { id: 3, text: "I feel drained after long social interactions.", axis: 'EI', direction: 'I', contradictionGroupId: 1 },
  { id: 4, text: "I work best when I can focus without interruption.", axis: 'EI', direction: 'I' },
  { id: 5, text: "I am comfortable being quiet in group settings.", axis: 'EI', direction: 'I' },
  { id: 6, text: "I prefer written communication over verbal discussion.", axis: 'EI', direction: 'I' },
  { id: 7, text: "I need alone time to process my thoughts.", axis: 'EI', direction: 'I' },
  { id: 8, text: "I enjoy deep conversations more than casual small talk.", axis: 'EI', direction: 'I' },
  { id: 9, text: "I feel most productive working independently.", axis: 'EI', direction: 'I' },
  { id: 10, text: "I prefer observing before participating.", axis: 'EI', direction: 'I' },
  { id: 11, text: "I think before I speak.", axis: 'EI', direction: 'I' },
  { id: 12, text: "I am selective about who I share personal thoughts with.", axis: 'EI', direction: 'I' },
  
  // Direction: E (Questions 13-24)
  { id: 13, text: "I gain energy from interacting with other people.", axis: 'EI', direction: 'E', contradictionGroupId: 1 },
  { id: 14, text: "I think best by talking ideas out loud.", axis: 'EI', direction: 'E' },
  { id: 15, text: "I enjoy being at the center of group activities.", axis: 'EI', direction: 'E' },
  { id: 16, text: "I feel restless when I spend too much time alone.", axis: 'EI', direction: 'E' },
  { id: 17, text: "I prefer face-to-face conversations.", axis: 'EI', direction: 'E' },
  { id: 18, text: "I enjoy meeting new people frequently.", axis: 'EI', direction: 'E' },
  { id: 19, text: "I feel energized in busy environments.", axis: 'EI', direction: 'E' },
  { id: 20, text: "I process ideas faster when collaborating.", axis: 'EI', direction: 'E' },
  { id: 21, text: "I speak easily in group discussions.", axis: 'EI', direction: 'E' },
  { id: 22, text: "I enjoy spontaneous social plans.", axis: 'EI', direction: 'E' },
  { id: 23, text: "I prefer action over reflection.", axis: 'EI', direction: 'E' },
  { id: 24, text: "I feel motivated by external engagement.", axis: 'EI', direction: 'E' },
  
  // ============================================
  // SENSING (S) vs INTUITION (N) — 23 QUESTIONS
  // ============================================
  
  // Direction: S (Questions 25-35)
  { id: 25, text: "I focus on facts more than possibilities.", axis: 'SN', direction: 'S', contradictionGroupId: 2 },
  { id: 26, text: "I trust experience over theory.", axis: 'SN', direction: 'S' },
  { id: 27, text: "I prefer clear instructions.", axis: 'SN', direction: 'S' },
  { id: 28, text: "I value practicality over innovation.", axis: 'SN', direction: 'S' },
  { id: 29, text: "I focus on what is happening now.", axis: 'SN', direction: 'S', contradictionGroupId: 3 },
  { id: 30, text: "I rely on proven methods.", axis: 'SN', direction: 'S' },
  { id: 31, text: "I notice details others might miss.", axis: 'SN', direction: 'S' },
  { id: 32, text: "I prefer step-by-step approaches.", axis: 'SN', direction: 'S' },
  { id: 33, text: "I trust what I can verify.", axis: 'SN', direction: 'S' },
  { id: 34, text: "I like concrete examples.", axis: 'SN', direction: 'S' },
  { id: 35, text: "I focus on realistic outcomes.", axis: 'SN', direction: 'S' },
  
  // Direction: N (Questions 36-47)
  { id: 36, text: "I enjoy exploring new ideas.", axis: 'SN', direction: 'N' },
  { id: 37, text: "I think about future possibilities often.", axis: 'SN', direction: 'N', contradictionGroupId: 3 },
  { id: 38, text: "I like connecting patterns and concepts.", axis: 'SN', direction: 'N' },
  { id: 39, text: "I trust intuition when making decisions.", axis: 'SN', direction: 'N' },
  { id: 40, text: "I enjoy abstract thinking.", axis: 'SN', direction: 'N', contradictionGroupId: 2 },
  { id: 41, text: "I focus on the big picture.", axis: 'SN', direction: 'N' },
  { id: 42, text: "I like imagining how things could be.", axis: 'SN', direction: 'N' },
  { id: 43, text: "I enjoy change and innovation.", axis: 'SN', direction: 'N' },
  { id: 44, text: "I prefer concepts over details.", axis: 'SN', direction: 'N' },
  { id: 45, text: "I am drawn to theoretical discussions.", axis: 'SN', direction: 'N' },
  { id: 46, text: "I think in metaphors and analogies.", axis: 'SN', direction: 'N' },
  { id: 47, text: "I look for meaning beyond facts.", axis: 'SN', direction: 'N' },
  
  // ============================================
  // THINKING (T) vs FEELING (F) — 23 QUESTIONS
  // ============================================
  
  // Direction: T (Questions 48-58)
  { id: 48, text: "I prioritize logic over emotions in decisions.", axis: 'TF', direction: 'T', contradictionGroupId: 4 },
  { id: 49, text: "I value objective analysis.", axis: 'TF', direction: 'T' },
  { id: 50, text: "I prefer fairness over harmony.", axis: 'TF', direction: 'F', contradictionGroupId: 5 }, // Note: This pairs with harmony preference
  { id: 51, text: "I make decisions based on facts.", axis: 'TF', direction: 'T' },
  { id: 52, text: "I value competence over empathy.", axis: 'TF', direction: 'T' },
  { id: 53, text: "I am comfortable giving critical feedback.", axis: 'TF', direction: 'T' },
  { id: 54, text: "I separate feelings from decisions.", axis: 'TF', direction: 'T' },
  { id: 55, text: "I believe truth matters more than tact.", axis: 'TF', direction: 'T' },
  { id: 56, text: "I stay calm under pressure.", axis: 'TF', direction: 'T' },
  { id: 57, text: "I focus on results rather than emotions.", axis: 'TF', direction: 'T' },
  { id: 58, text: "I prefer rational explanations.", axis: 'TF', direction: 'T' },
  
  // Direction: F (Questions 59-70)
  { id: 59, text: "I consider how decisions affect others.", axis: 'TF', direction: 'F' },
  { id: 60, text: "I value empathy in leadership.", axis: 'TF', direction: 'F' },
  { id: 61, text: "I prioritize harmony in groups.", axis: 'TF', direction: 'F', contradictionGroupId: 5 },
  { id: 62, text: "I make decisions based on personal values.", axis: 'TF', direction: 'F' },
  { id: 63, text: "I am sensitive to others' emotions.", axis: 'TF', direction: 'F' },
  { id: 64, text: "I try to avoid conflict.", axis: 'TF', direction: 'F' },
  { id: 65, text: "I value kindness over efficiency.", axis: 'TF', direction: 'F' },
  { id: 66, text: "I seek emotional connection.", axis: 'TF', direction: 'F' },
  { id: 67, text: "I trust my feelings when deciding.", axis: 'TF', direction: 'F', contradictionGroupId: 4 },
  { id: 68, text: "I adapt decisions to people involved.", axis: 'TF', direction: 'F' },
  { id: 69, text: "I value compassion highly.", axis: 'TF', direction: 'F' },
  { id: 70, text: "I am motivated by helping others.", axis: 'TF', direction: 'F' },
  
  // ============================================
  // JUDGING (J) vs PERCEIVING (P) — 23 QUESTIONS
  // ============================================
  
  // Direction: J (Questions 71-82)
  { id: 71, text: "I like having a clear plan.", axis: 'JP', direction: 'J' },
  { id: 72, text: "I prefer structure over flexibility.", axis: 'JP', direction: 'J', contradictionGroupId: 6 },
  { id: 73, text: "I complete tasks early.", axis: 'JP', direction: 'J' },
  { id: 74, text: "I feel stressed by last-minute changes.", axis: 'JP', direction: 'J', contradictionGroupId: 7 },
  { id: 75, text: "I like closure and decisions.", axis: 'JP', direction: 'J' },
  { id: 76, text: "I organize my time carefully.", axis: 'JP', direction: 'J' },
  { id: 77, text: "I prefer predictability.", axis: 'JP', direction: 'J' },
  { id: 78, text: "I follow schedules closely.", axis: 'JP', direction: 'J' },
  { id: 79, text: "I like defined goals.", axis: 'JP', direction: 'J' },
  { id: 80, text: "I prefer order in my environment.", axis: 'JP', direction: 'J' },
  { id: 81, text: "I stick to plans once made.", axis: 'JP', direction: 'J' },
  { id: 82, text: "I feel satisfied when things are settled.", axis: 'JP', direction: 'J' },
  
  // Direction: P (Questions 83-93)
  { id: 83, text: "I prefer keeping options open.", axis: 'JP', direction: 'P' },
  { id: 84, text: "I adapt easily to change.", axis: 'JP', direction: 'P' },
  { id: 85, text: "I enjoy spontaneity.", axis: 'JP', direction: 'P' },
  { id: 86, text: "I work best under flexible timelines.", axis: 'JP', direction: 'P', contradictionGroupId: 6 },
  { id: 87, text: "I dislike rigid schedules.", axis: 'JP', direction: 'P' },
  { id: 88, text: "I like exploring multiple paths.", axis: 'JP', direction: 'P' },
  { id: 89, text: "I decide as I go.", axis: 'JP', direction: 'P' },
  { id: 90, text: "I feel constrained by strict plans.", axis: 'JP', direction: 'P' },
  { id: 91, text: "I enjoy last-minute adjustments.", axis: 'JP', direction: 'P', contradictionGroupId: 7 },
  { id: 92, text: "I value freedom over structure.", axis: 'JP', direction: 'P' },
  { id: 93, text: "I keep plans open until necessary.", axis: 'JP', direction: 'P' },
];

// Get axis label for display
export function getAxisLabel(axis: MBTIAxis): { left: string; right: string; name: string } {
  switch (axis) {
    case 'EI': return { left: 'Introversion', right: 'Extraversion', name: 'Energy' };
    case 'SN': return { left: 'Sensing', right: 'Intuition', name: 'Information' };
    case 'TF': return { left: 'Thinking', right: 'Feeling', name: 'Decision' };
    case 'JP': return { left: 'Judging', right: 'Perceiving', name: 'Structure' };
  }
}
