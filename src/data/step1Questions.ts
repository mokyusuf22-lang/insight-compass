// MBTI Axis Types
export type MBTIPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface Step1Question {
  id: string;
  question: string;
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  pole: MBTIPole; // The pole that "Agree" scores towards
}

export interface AxisScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

// Answer options with Likert scale
export const answerOptions = [
  { value: '0', label: 'Strongly Disagree', score: 0 },
  { value: '1', label: 'Disagree', score: 1 },
  { value: '2', label: 'Neutral', score: 2 },
  { value: '3', label: 'Agree', score: 3 },
  { value: '4', label: 'Strongly Agree', score: 4 },
];

// 20 MBTI-mapped questions
export const step1Questions: Step1Question[] = [
  // Axis 1: Introversion (I) vs Extraversion (E) - 5 questions
  {
    id: 's1_q1',
    question: 'I prefer working through problems alone before discussing them with others.',
    axis: 'EI',
    pole: 'I',
  },
  {
    id: 's1_q2',
    question: 'Extended social interaction drains my energy.',
    axis: 'EI',
    pole: 'I',
  },
  {
    id: 's1_q3',
    question: 'I think more clearly when I have uninterrupted focus time.',
    axis: 'EI',
    pole: 'I',
  },
  {
    id: 's1_q4',
    question: 'I enjoy leading group discussions.',
    axis: 'EI',
    pole: 'E',
  },
  {
    id: 's1_q5',
    question: 'I gain energy from collaborating with many people.',
    axis: 'EI',
    pole: 'E',
  },

  // Axis 2: Sensing (S) vs Intuition (N) - 5 questions
  {
    id: 's1_q6',
    question: 'I focus more on future possibilities than present realities.',
    axis: 'SN',
    pole: 'N',
  },
  {
    id: 's1_q7',
    question: 'I enjoy abstract concepts and theoretical frameworks.',
    axis: 'SN',
    pole: 'N',
  },
  {
    id: 's1_q8',
    question: 'I prefer proven methods over untested ideas.',
    axis: 'SN',
    pole: 'S',
  },
  {
    id: 's1_q9',
    question: 'I rely on patterns and insights rather than concrete details.',
    axis: 'SN',
    pole: 'N',
  },
  {
    id: 's1_q10',
    question: 'I trust direct experience more than intuition.',
    axis: 'SN',
    pole: 'S',
  },

  // Axis 3: Thinking (T) vs Feeling (F) - 5 questions
  {
    id: 's1_q11',
    question: 'I prioritize logic over emotions when making decisions.',
    axis: 'TF',
    pole: 'T',
  },
  {
    id: 's1_q12',
    question: 'Objective truth matters more to me than maintaining harmony.',
    axis: 'TF',
    pole: 'T',
  },
  {
    id: 's1_q13',
    question: 'I often consider how decisions will affect people emotionally.',
    axis: 'TF',
    pole: 'F',
  },
  {
    id: 's1_q14',
    question: 'Clear reasoning is more important than empathy in problem-solving.',
    axis: 'TF',
    pole: 'T',
  },
  {
    id: 's1_q15',
    question: 'I adjust decisions to avoid hurting others when possible.',
    axis: 'TF',
    pole: 'F',
  },

  // Axis 4: Judging (J) vs Perceiving (P) - 5 questions
  {
    id: 's1_q16',
    question: 'I prefer having a clear plan rather than keeping options open.',
    axis: 'JP',
    pole: 'J',
  },
  {
    id: 's1_q17',
    question: 'I feel stressed when things are left undecided.',
    axis: 'JP',
    pole: 'J',
  },
  {
    id: 's1_q18',
    question: 'I like adapting as I go rather than following strict plans.',
    axis: 'JP',
    pole: 'P',
  },
  {
    id: 's1_q19',
    question: 'Deadlines help me perform better.',
    axis: 'JP',
    pole: 'J',
  },
  {
    id: 's1_q20',
    question: 'I prefer flexibility over structure in my work.',
    axis: 'JP',
    pole: 'P',
  },
];

// Calculate axis scores from responses
export function calculateAxisScores(responses: Record<string, string>): AxisScores {
  const scores: AxisScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  step1Questions.forEach((question) => {
    const answer = responses[question.id];
    if (answer !== undefined) {
      const answerValue = parseInt(answer, 10);
      scores[question.pole] += answerValue;
    }
  });

  return scores;
}

// Derive MBTI tendency from scores
export function deriveMBTITendency(scores: AxisScores): string {
  const e_i = scores.E > scores.I ? 'E' : 'I';
  const s_n = scores.N > scores.S ? 'N' : 'S';
  const t_f = scores.T > scores.F ? 'T' : 'F';
  const j_p = scores.J > scores.P ? 'J' : 'P';

  return `${e_i}${s_n}${t_f}${j_p}`;
}

// Calculate confidence heuristic (0.55 to 0.70)
export function calculateConfidence(scores: AxisScores): number {
  const axisDifferences = [
    Math.abs(scores.E - scores.I),
    Math.abs(scores.S - scores.N),
    Math.abs(scores.T - scores.F),
    Math.abs(scores.J - scores.P),
  ];

  const avgDifference = axisDifferences.reduce((a, b) => a + b, 0) / 4;
  // Max possible per axis is 20 (5 questions × 4 max score)
  const maxDifference = 20;
  
  const confidence = 0.55 + (avgDifference / maxDifference) * 0.15;
  return Math.min(0.70, Math.max(0.55, confidence));
}

// Time horizon options
export const timeHorizonOptions = [
  { value: '3-6', label: '3–6 months' },
  { value: '6-12', label: '6–12 months' },
  { value: '12+', label: '12+ months' },
];
