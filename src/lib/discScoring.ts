import { discQuestions, DISCDimension } from '@/data/discQuestions';

export interface DISCResponse {
  questionId: string;
  answer: number; // 1-5
}

export interface DISCResult {
  D: number; // 0-100 percentage
  I: number;
  S: number;
  C: number;
  primaryStyle: string;
  secondaryStyle: string | null;
  summary: string;
}

export function calculateDISCResult(responses: DISCResponse[]): DISCResult {
  // Initialize scores for each dimension
  const dimensionScores: Record<DISCDimension, { total: number; count: number }> = {
    D: { total: 0, count: 0 },
    I: { total: 0, count: 0 },
    S: { total: 0, count: 0 },
    C: { total: 0, count: 0 },
  };

  // Calculate raw scores for each dimension
  responses.forEach((response) => {
    const question = discQuestions.find((q) => q.id === response.questionId);
    if (!question) return;

    const dimension = question.dimension;
    // Convert 1-5 scale to 0-4 for calculation
    // 1 (Strongly Disagree) = 0, 5 (Strongly Agree) = 4
    const score = response.answer - 1;
    
    dimensionScores[dimension].total += score;
    dimensionScores[dimension].count++;
  });

  // Convert to percentages (0-100)
  const calculatePercentage = (dim: DISCDimension): number => {
    const data = dimensionScores[dim];
    if (data.count === 0) return 0;
    // Max possible score per question is 4 (answer 5 - 1)
    const maxScore = data.count * 4;
    return Math.round((data.total / maxScore) * 100);
  };

  const D = calculatePercentage('D');
  const I = calculatePercentage('I');
  const S = calculatePercentage('S');
  const C = calculatePercentage('C');

  // Determine primary and secondary styles
  const scores = [
    { dim: 'D' as DISCDimension, score: D },
    { dim: 'I' as DISCDimension, score: I },
    { dim: 'S' as DISCDimension, score: S },
    { dim: 'C' as DISCDimension, score: C },
  ].sort((a, b) => b.score - a.score);

  const primaryStyle = scores[0].dim;
  const secondaryStyle = scores[1].score >= 50 ? scores[1].dim : null;

  // Generate primary style string
  const styleLabels: Record<DISCDimension, string> = {
    D: 'High D',
    I: 'High I',
    S: 'High S',
    C: 'High C',
  };

  const primaryStyleStr = secondaryStyle
    ? `${styleLabels[primaryStyle]} / ${styleLabels[secondaryStyle]}`
    : styleLabels[primaryStyle];

  // Generate summary based on primary style
  const summary = generateSummary(primaryStyle, secondaryStyle, { D, I, S, C });

  return {
    D,
    I,
    S,
    C,
    primaryStyle: primaryStyleStr,
    secondaryStyle: secondaryStyle ? styleLabels[secondaryStyle] : null,
    summary,
  };
}

function generateSummary(
  primary: DISCDimension,
  secondary: DISCDimension | null,
  scores: Record<DISCDimension, number>
): string {
  const summaries: Record<DISCDimension, Partial<Record<DISCDimension | 'solo', string>>> = {
    D: {
      solo: 'Direct, decisive, and results-focused. You prioritize efficiency and are comfortable taking charge.',
      I: 'Direct and influential. You drive results while building enthusiasm in others.',
      S: 'Results-oriented yet steady. You balance decisiveness with patience and follow-through.',
      C: 'Direct and analytical. You combine assertiveness with attention to detail and accuracy.',
    },
    I: {
      solo: 'Outgoing, enthusiastic, and people-oriented. You thrive on collaboration and inspire others.',
      D: 'Enthusiastic and driven. You motivate others while pushing for results.',
      S: 'Warm and supportive. You build relationships while maintaining stability and harmony.',
      C: 'Engaging yet analytical. You connect with people while valuing accuracy and quality.',
    },
    S: {
      solo: 'Patient, reliable, and team-focused. You value stability and are a dependable collaborator.',
      D: 'Steady yet assertive. You maintain stability while stepping up when leadership is needed.',
      I: 'Supportive and personable. You provide consistency while building positive relationships.',
      C: 'Reliable and precise. You combine dependability with careful attention to detail.',
    },
    C: {
      solo: 'Analytical, precise, and quality-focused. You excel at detailed work and systematic approaches.',
      D: 'Analytical and decisive. You combine thorough analysis with the drive to take action.',
      I: 'Detail-oriented yet engaging. You balance precision with the ability to communicate effectively.',
      S: 'Careful and consistent. You value both accuracy and stability in your approach.',
    },
  };

  if (!secondary) {
    return summaries[primary].solo;
  }

  return summaries[primary][secondary] || summaries[primary].solo;
}

export function getDISCStyleDescription(result: DISCResult): {
  strengths: string[];
  challenges: string[];
  workStyle: string;
} {
  // Parse primary dimension from style string
  const primaryDim = result.primaryStyle.includes('High D')
    ? 'D'
    : result.primaryStyle.includes('High I')
    ? 'I'
    : result.primaryStyle.includes('High S')
    ? 'S'
    : 'C';

  const descriptions: Record<string, { strengths: string[]; challenges: string[]; workStyle: string }> = {
    D: {
      strengths: [
        'Makes quick decisions',
        'Drives results',
        'Takes initiative',
        'Handles pressure well',
      ],
      challenges: [
        'May overlook details',
        'Can be perceived as impatient',
        'May prioritize tasks over relationships',
      ],
      workStyle: 'You prefer autonomy, challenges, and direct communication. You work best with clear goals and the authority to achieve them.',
    },
    I: {
      strengths: [
        'Builds relationships easily',
        'Motivates and inspires others',
        'Adapts to new situations',
        'Brings energy to teams',
      ],
      challenges: [
        'May struggle with details',
        'Can be overly optimistic',
        'May need more structure',
      ],
      workStyle: 'You thrive in collaborative, dynamic environments. You work best with variety, recognition, and opportunities to interact with others.',
    },
    S: {
      strengths: [
        'Provides consistent support',
        'Builds trust over time',
        'Creates harmony in teams',
        'Follows through reliably',
      ],
      challenges: [
        'May resist change',
        'Can avoid confrontation',
        'May need time to adapt',
      ],
      workStyle: 'You prefer stable, predictable environments with clear expectations. You work best with supportive teams and time to process changes.',
    },
    C: {
      strengths: [
        'Produces high-quality work',
        'Catches errors others miss',
        'Makes well-researched decisions',
        'Creates systematic processes',
      ],
      challenges: [
        'May over-analyze',
        'Can be perceived as critical',
        'May need help seeing big picture',
      ],
      workStyle: 'You thrive with clear standards, access to information, and time to ensure quality. You work best when given autonomy over processes.',
    },
  };

  return descriptions[primaryDim] || descriptions.C;
}
