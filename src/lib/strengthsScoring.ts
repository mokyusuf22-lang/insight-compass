import { StrengthDomain, strengthsQuestions, strengthDomains, getStrengthDescription } from '@/data/strengthsQuestions';

export interface StrengthScore {
  name: StrengthDomain;
  score: number;
}

export interface StrengthsResult {
  ranked_strengths: StrengthScore[];
  secondary_strengths: StrengthScore[];
  supporting_strengths: StrengthScore[];
  summary: string;
}

export interface StrengthsResponse {
  questionId: string;
  value: number; // -2 to +2
}

/**
 * Calculate the Strengths result from user responses
 */
export function calculateStrengthsResult(responses: StrengthsResponse[]): StrengthsResult {
  // Group questions by strength domain
  const questionsByStrength: Record<StrengthDomain, string[]> = {} as Record<StrengthDomain, string[]>;
  
  strengthDomains.forEach(domain => {
    questionsByStrength[domain] = strengthsQuestions
      .filter(q => q.strength === domain)
      .map(q => q.id);
  });

  // Calculate raw scores for each strength domain
  const rawScores: Record<StrengthDomain, number> = {} as Record<StrengthDomain, number>;
  
  strengthDomains.forEach(domain => {
    const domainQuestionIds = questionsByStrength[domain];
    let totalScore = 0;
    
    domainQuestionIds.forEach(questionId => {
      const response = responses.find(r => r.questionId === questionId);
      if (response) {
        totalScore += response.value;
      }
    });
    
    rawScores[domain] = totalScore;
  });

  // Normalize to percentage (0-100)
  // Max possible score per domain: 6 questions * 2 = 12
  // Min possible score per domain: 6 questions * -2 = -12
  // Range: 24 points
  const normalizedScores: StrengthScore[] = strengthDomains.map(domain => {
    const raw = rawScores[domain];
    // Convert from -12 to +12 range to 0-100
    const normalized = Math.round(((raw + 12) / 24) * 100);
    return {
      name: domain,
      score: Math.max(0, Math.min(100, normalized)),
    };
  });

  // Sort by score descending
  const rankedAll = [...normalizedScores].sort((a, b) => b.score - a.score);

  // Top 3 = Primary, Next 2 = Secondary, Remaining = Supporting
  const ranked_strengths = rankedAll.slice(0, 3);
  const secondary_strengths = rankedAll.slice(3, 5);
  const supporting_strengths = rankedAll.slice(5);

  // Generate summary based on top strengths
  const summary = generateSummary(ranked_strengths);

  return {
    ranked_strengths,
    secondary_strengths,
    supporting_strengths,
    summary,
  };
}

function generateSummary(topStrengths: StrengthScore[]): string {
  if (topStrengths.length === 0) {
    return 'Complete the assessment to discover your strengths.';
  }

  const strengthActions: Record<StrengthDomain, string> = {
    'Strategic Thinking': 'seeing patterns early and planning ahead',
    'Analytical Thinking': 'analyzing options deeply and reasoning through complexity',
    'Execution & Delivery': 'turning ideas into structured plans and delivering results',
    'Influence & Communication': 'persuading others and communicating with impact',
    'Relationship Building': 'building trust and fostering collaboration',
    'Learning & Curiosity': 'continuously learning and adapting to new knowledge',
    'Leadership & Ownership': 'taking charge and driving outcomes independently',
    'Adaptability & Problem Solving': 'solving problems creatively and adapting to change',
  };

  const top1 = topStrengths[0]?.name;
  const top2 = topStrengths[1]?.name;
  const top3 = topStrengths[2]?.name;

  let actions: string[] = [];
  if (top1 && strengthActions[top1]) actions.push(strengthActions[top1]);
  if (top2 && strengthActions[top2]) actions.push(strengthActions[top2]);
  if (top3 && strengthActions[top3]) actions.push(strengthActions[top3]);

  if (actions.length === 3) {
    return `You create the most value by ${actions[0]}, ${actions[1]}, and ${actions[2]}.`;
  } else if (actions.length === 2) {
    return `You create the most value by ${actions[0]} and ${actions[1]}.`;
  } else if (actions.length === 1) {
    return `You create the most value by ${actions[0]}.`;
  }
  
  return 'Complete the assessment to discover your strengths.';
}

/**
 * Get detailed descriptions for strengths results display
 */
export function getStrengthsInsights(result: StrengthsResult): {
  primaryInsight: string;
  careerImplication: string;
  growthOpportunity: string;
} {
  const topStrength = result.ranked_strengths[0]?.name;
  const lowestStrength = result.supporting_strengths[result.supporting_strengths.length - 1]?.name;

  const careerImplications: Record<StrengthDomain, string> = {
    'Strategic Thinking': 'Roles involving vision, planning, and long-term decision-making suit you well.',
    'Analytical Thinking': 'You thrive in positions that require data analysis, research, or systematic problem-solving.',
    'Execution & Delivery': 'Project management, operations, and roles with clear deliverables align with your strengths.',
    'Influence & Communication': 'Sales, marketing, leadership, and stakeholder management are natural fits.',
    'Relationship Building': 'Client success, HR, team leadership, and partnership roles leverage your abilities.',
    'Learning & Curiosity': 'R&D, consulting, and innovation-focused roles keep you engaged and growing.',
    'Leadership & Ownership': 'Management, entrepreneurship, and ownership roles match your drive.',
    'Adaptability & Problem Solving': 'Consulting, crisis management, and dynamic environments suit your flexibility.',
  };

  const growthAreas: Record<StrengthDomain, string> = {
    'Strategic Thinking': 'Consider developing this by practicing scenario planning and asking "what if" questions.',
    'Analytical Thinking': 'Try breaking problems into smaller parts and using data to support decisions.',
    'Execution & Delivery': 'Focus on completing smaller tasks consistently before taking on bigger projects.',
    'Influence & Communication': 'Practice articulating your ideas clearly and seeking feedback on your communication.',
    'Relationship Building': 'Invest more time in understanding others\' perspectives and maintaining connections.',
    'Learning & Curiosity': 'Set aside regular time for learning something new, even outside your comfort zone.',
    'Leadership & Ownership': 'Take on more responsibility in small areas to build your confidence in leading.',
    'Adaptability & Problem Solving': 'Embrace change by reframing obstacles as opportunities to find creative solutions.',
  };

  return {
    primaryInsight: topStrength ? getStrengthDescription(topStrength) : 'Your primary strengths are still being analyzed.',
    careerImplication: topStrength ? careerImplications[topStrength] : 'Complete the assessment to see career implications.',
    growthOpportunity: lowestStrength ? growthAreas[lowestStrength] : 'Complete the assessment to identify growth areas.',
  };
}
