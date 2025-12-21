// MBTI Scoring Logic with Inconsistency Detection

import { mbtiQuestions, mbtiAnswerOptions, MBTIAxis, MBTIDirection } from '@/data/mbtiQuestions';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface MBTIAxisResult {
  percentage: number; // 0-100, where 50 is neutral
  dominant: MBTIDirection;
  confidence: ConfidenceLevel;
  validQuestions: number;
  totalQuestions: number;
}

export interface MBTIResult {
  type: string; // e.g., "INTJ"
  axes: {
    I: number;
    E: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  confidence: {
    energy: ConfidenceLevel;
    information: ConfidenceLevel;
    decision: ConfidenceLevel;
    structure: ConfidenceLevel;
  };
  axisResults: {
    EI: MBTIAxisResult;
    SN: MBTIAxisResult;
    TF: MBTIAxisResult;
    JP: MBTIAxisResult;
  };
  invalidatedQuestions: number;
}

interface Response {
  questionId: number;
  answer: string;
}

// Get the numeric score for an answer
function getAnswerScore(answer: string): number {
  const option = mbtiAnswerOptions.find(o => o.value === answer);
  return option?.score ?? 0;
}

// Detect contradictions and return invalidated question IDs
function detectContradictions(responses: Response[]): Set<number> {
  const invalidated = new Set<number>();
  
  // Group questions by contradiction_group_id
  const contradictionGroups = new Map<number, number[]>();
  
  for (const question of mbtiQuestions) {
    if (question.contradictionGroupId !== undefined) {
      const group = contradictionGroups.get(question.contradictionGroupId) || [];
      group.push(question.id);
      contradictionGroups.set(question.contradictionGroupId, group);
    }
  }
  
  // Check each contradiction group
  for (const [, questionIds] of contradictionGroups) {
    if (questionIds.length < 2) continue;
    
    const groupResponses = questionIds.map(qId => {
      const response = responses.find(r => r.questionId === qId);
      const question = mbtiQuestions.find(q => q.id === qId);
      return { questionId: qId, response, question };
    }).filter(r => r.response && r.question);
    
    if (groupResponses.length < 2) continue;
    
    // Check for contradictory responses
    // A contradiction occurs when the user agrees with both opposing statements
    // or disagrees with both opposing statements
    const scores = groupResponses.map(r => {
      const score = getAnswerScore(r.response!.answer);
      // Normalize based on question direction - we want to see if they're agreeing/disagreeing
      // with logically opposite statements in the same way
      return { questionId: r.questionId, score, direction: r.question!.direction };
    });
    
    // Group by direction polarity within this contradiction group
    const firstScore = scores[0];
    const secondScore = scores[1];
    
    if (firstScore && secondScore) {
      // They have opposite directions, so we check if user gave same polarity answers
      // to both (both agree or both disagree = contradiction)
      const firstAgrees = firstScore.score > 0;
      const firstDisagrees = firstScore.score < 0;
      const secondAgrees = secondScore.score > 0;
      const secondDisagrees = secondScore.score < 0;
      
      // Contradiction: both agree OR both disagree with logically opposite statements
      const bothAgree = firstAgrees && secondAgrees;
      const bothDisagree = firstDisagrees && secondDisagrees;
      
      if (bothAgree || bothDisagree) {
        questionIds.forEach(qId => invalidated.add(qId));
      }
    }
  }
  
  return invalidated;
}

// Calculate axis score from valid responses
function calculateAxisScore(
  axis: MBTIAxis,
  responses: Response[],
  invalidatedIds: Set<number>
): MBTIAxisResult {
  const axisQuestions = mbtiQuestions.filter(q => q.axis === axis);
  const totalQuestions = axisQuestions.length;
  
  // Get valid responses for this axis
  const validResponses = responses.filter(r => {
    const question = axisQuestions.find(q => q.id === r.questionId);
    return question && !invalidatedIds.has(r.questionId);
  });
  
  const validQuestions = validResponses.length;
  
  if (validQuestions === 0) {
    // Default to neutral if no valid questions
    return {
      percentage: 50,
      dominant: axis[0] as MBTIDirection,
      confidence: 'low',
      validQuestions: 0,
      totalQuestions
    };
  }
  
  // Calculate weighted score
  // For each question, the score contributes to the direction it points to
  let positiveScore = 0; // First letter of axis (I, S, T, J)
  let negativeScore = 0; // Second letter of axis (E, N, F, P)
  
  const firstPole = axis[0] as MBTIDirection;
  const secondPole = axis[1] as MBTIDirection;
  
  for (const response of validResponses) {
    const question = axisQuestions.find(q => q.id === response.questionId);
    if (!question) continue;
    
    const answerScore = getAnswerScore(response.answer);
    
    if (question.direction === firstPole) {
      // Question scores toward first pole (I, S, T, J)
      if (answerScore > 0) {
        positiveScore += answerScore;
      } else if (answerScore < 0) {
        negativeScore += Math.abs(answerScore);
      }
    } else {
      // Question scores toward second pole (E, N, F, P)
      if (answerScore > 0) {
        negativeScore += answerScore;
      } else if (answerScore < 0) {
        positiveScore += Math.abs(answerScore);
      }
    }
  }
  
  // Calculate percentage (0-100 where 50 is neutral)
  const totalScore = positiveScore + negativeScore;
  let percentage: number;
  
  if (totalScore === 0) {
    percentage = 50;
  } else {
    // Percentage toward first pole
    percentage = Math.round((positiveScore / totalScore) * 100);
  }
  
  // Determine dominant type
  const dominant = percentage >= 50 ? firstPole : secondPole;
  
  // Calculate confidence based on how far from 50% we are
  const deviation = Math.abs(percentage - 50);
  let confidence: ConfidenceLevel;
  
  if (deviation > 20) {
    confidence = 'high';
  } else if (deviation >= 5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    percentage,
    dominant,
    confidence,
    validQuestions,
    totalQuestions
  };
}

// Main scoring function
export function calculateMBTIResult(responses: Response[]): MBTIResult {
  // Step 1: Detect contradictions
  const invalidatedIds = detectContradictions(responses);
  
  // Step 2: Calculate each axis
  const eiResult = calculateAxisScore('EI', responses, invalidatedIds);
  const snResult = calculateAxisScore('SN', responses, invalidatedIds);
  const tfResult = calculateAxisScore('TF', responses, invalidatedIds);
  const jpResult = calculateAxisScore('JP', responses, invalidatedIds);
  
  // Step 3: Construct type string
  const type = `${eiResult.dominant}${snResult.dominant}${tfResult.dominant}${jpResult.dominant}`;
  
  // Step 4: Calculate percentages for each pole
  const axes = {
    I: eiResult.percentage,
    E: 100 - eiResult.percentage,
    S: snResult.percentage,
    N: 100 - snResult.percentage,
    T: tfResult.percentage,
    F: 100 - tfResult.percentage,
    J: jpResult.percentage,
    P: 100 - jpResult.percentage,
  };
  
  return {
    type,
    axes,
    confidence: {
      energy: eiResult.confidence,
      information: snResult.confidence,
      decision: tfResult.confidence,
      structure: jpResult.confidence,
    },
    axisResults: {
      EI: eiResult,
      SN: snResult,
      TF: tfResult,
      JP: jpResult,
    },
    invalidatedQuestions: invalidatedIds.size,
  };
}

// Get a description of the MBTI type
export function getMBTITypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'INTJ': 'The Architect — Strategic, independent, and determined. You see the big picture and work systematically toward your vision.',
    'INTP': 'The Logician — Analytical, objective, and reserved. You love exploring ideas and understanding complex systems.',
    'ENTJ': 'The Commander — Bold, imaginative, and strong-willed. You lead with confidence and drive for achievement.',
    'ENTP': 'The Debater — Smart, curious, and intellectually quick. You enjoy challenging ideas and exploring new possibilities.',
    'INFJ': 'The Advocate — Insightful, principled, and compassionate. You seek meaning and connection in everything you do.',
    'INFP': 'The Mediator — Idealistic, empathetic, and creative. You are guided by your values and seek authenticity.',
    'ENFJ': 'The Protagonist — Charismatic, inspiring, and supportive. You naturally lead and help others reach their potential.',
    'ENFP': 'The Campaigner — Enthusiastic, creative, and sociable. You see life as full of possibilities and connections.',
    'ISTJ': 'The Logistician — Practical, fact-minded, and reliable. You value tradition and work diligently toward your goals.',
    'ISFJ': 'The Defender — Warm, dedicated, and protective. You care deeply about others and work to maintain harmony.',
    'ESTJ': 'The Executive — Organized, logical, and assertive. You excel at managing people and projects efficiently.',
    'ESFJ': 'The Consul — Caring, social, and traditional. You create harmony and are attentive to others\' needs.',
    'ISTP': 'The Virtuoso — Bold, practical, and experimental. You excel at troubleshooting and hands-on problem solving.',
    'ISFP': 'The Adventurer — Flexible, charming, and sensitive. You live in the moment and appreciate beauty and harmony.',
    'ESTP': 'The Entrepreneur — Smart, energetic, and perceptive. You thrive on action and can think quickly on your feet.',
    'ESFP': 'The Entertainer — Spontaneous, energetic, and enthusiastic. You love life and bring joy to those around you.',
  };
  
  return descriptions[type] || 'A unique combination of personality traits.';
}
