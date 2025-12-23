export type StrengthDomain = 
  | 'Strategic Thinking'
  | 'Analytical Thinking'
  | 'Execution & Delivery'
  | 'Influence & Communication'
  | 'Relationship Building'
  | 'Learning & Curiosity'
  | 'Leadership & Ownership'
  | 'Adaptability & Problem Solving';

export interface StrengthsQuestion {
  id: string;
  strength: StrengthDomain;
  text: string;
}

export const strengthsQuestions: StrengthsQuestion[] = [
  // Strategic Thinking (6 questions)
  { id: 'STRAT_01', strength: 'Strategic Thinking', text: 'I naturally think several steps ahead when making decisions.' },
  { id: 'STRAT_02', strength: 'Strategic Thinking', text: 'I enjoy mapping out long-term possibilities.' },
  { id: 'STRAT_03', strength: 'Strategic Thinking', text: 'I anticipate outcomes before others do.' },
  { id: 'STRAT_04', strength: 'Strategic Thinking', text: 'I connect present actions to future impact.' },
  { id: 'STRAT_05', strength: 'Strategic Thinking', text: 'I enjoy defining direction for projects or teams.' },
  { id: 'STRAT_06', strength: 'Strategic Thinking', text: 'I see patterns across complex situations.' },

  // Analytical Thinking (6 questions)
  { id: 'ANLY_01', strength: 'Analytical Thinking', text: 'I enjoy breaking problems into smaller parts.' },
  { id: 'ANLY_02', strength: 'Analytical Thinking', text: 'I rely on data when making decisions.' },
  { id: 'ANLY_03', strength: 'Analytical Thinking', text: 'I question assumptions regularly.' },
  { id: 'ANLY_04', strength: 'Analytical Thinking', text: 'I compare multiple options before deciding.' },
  { id: 'ANLY_05', strength: 'Analytical Thinking', text: 'I enjoy structured reasoning.' },
  { id: 'ANLY_06', strength: 'Analytical Thinking', text: 'I notice inconsistencies quickly.' },

  // Execution & Delivery (6 questions)
  { id: 'EXEC_01', strength: 'Execution & Delivery', text: 'I reliably turn ideas into action.' },
  { id: 'EXEC_02', strength: 'Execution & Delivery', text: 'I finish what I start.' },
  { id: 'EXEC_03', strength: 'Execution & Delivery', text: 'I feel satisfaction from completing tasks.' },
  { id: 'EXEC_04', strength: 'Execution & Delivery', text: 'I move projects forward consistently.' },
  { id: 'EXEC_05', strength: 'Execution & Delivery', text: 'I prioritize outcomes over discussion.' },
  { id: 'EXEC_06', strength: 'Execution & Delivery', text: 'I follow through even when it gets hard.' },

  // Influence & Communication (6 questions)
  { id: 'INFL_01', strength: 'Influence & Communication', text: 'I can persuade others of my ideas.' },
  { id: 'INFL_02', strength: 'Influence & Communication', text: 'I communicate clearly and confidently.' },
  { id: 'INFL_03', strength: 'Influence & Communication', text: 'I adjust my message to the audience.' },
  { id: 'INFL_04', strength: 'Influence & Communication', text: 'I enjoy presenting ideas to groups.' },
  { id: 'INFL_05', strength: 'Influence & Communication', text: 'I can rally people around a goal.' },
  { id: 'INFL_06', strength: 'Influence & Communication', text: 'I influence decisions effectively.' },

  // Relationship Building (6 questions)
  { id: 'RELA_01', strength: 'Relationship Building', text: 'I build trust easily with others.' },
  { id: 'RELA_02', strength: 'Relationship Building', text: 'I maintain strong professional relationships.' },
  { id: 'RELA_03', strength: 'Relationship Building', text: 'I support others consistently.' },
  { id: 'RELA_04', strength: 'Relationship Building', text: 'I am attentive to people\'s needs.' },
  { id: 'RELA_05', strength: 'Relationship Building', text: 'I create psychological safety in teams.' },
  { id: 'RELA_06', strength: 'Relationship Building', text: 'I value collaboration over competition.' },

  // Learning & Curiosity (6 questions)
  { id: 'LERN_01', strength: 'Learning & Curiosity', text: 'I enjoy learning new skills.' },
  { id: 'LERN_02', strength: 'Learning & Curiosity', text: 'I seek feedback to improve.' },
  { id: 'LERN_03', strength: 'Learning & Curiosity', text: 'I explore topics deeply.' },
  { id: 'LERN_04', strength: 'Learning & Curiosity', text: 'I enjoy mastering new concepts.' },
  { id: 'LERN_05', strength: 'Learning & Curiosity', text: 'I invest time in self-improvement.' },
  { id: 'LERN_06', strength: 'Learning & Curiosity', text: 'I stay curious about change and new developments.' },

  // Leadership & Ownership (6 questions)
  { id: 'LEAD_01', strength: 'Leadership & Ownership', text: 'I take responsibility naturally.' },
  { id: 'LEAD_02', strength: 'Leadership & Ownership', text: 'I step up when something needs doing.' },
  { id: 'LEAD_03', strength: 'Leadership & Ownership', text: 'I hold myself accountable.' },
  { id: 'LEAD_04', strength: 'Leadership & Ownership', text: 'I make decisions when others hesitate.' },
  { id: 'LEAD_05', strength: 'Leadership & Ownership', text: 'I feel ownership over outcomes.' },
  { id: 'LEAD_06', strength: 'Leadership & Ownership', text: 'I am comfortable leading without formal authority.' },

  // Adaptability & Problem Solving (6 questions)
  { id: 'ADPT_01', strength: 'Adaptability & Problem Solving', text: 'I adjust quickly to new situations.' },
  { id: 'ADPT_02', strength: 'Adaptability & Problem Solving', text: 'I stay calm when plans change.' },
  { id: 'ADPT_03', strength: 'Adaptability & Problem Solving', text: 'I solve problems creatively.' },
  { id: 'ADPT_04', strength: 'Adaptability & Problem Solving', text: 'I find alternatives when blocked.' },
  { id: 'ADPT_05', strength: 'Adaptability & Problem Solving', text: 'I respond well under pressure.' },
  { id: 'ADPT_06', strength: 'Adaptability & Problem Solving', text: 'I adapt my approach as needed.' },
];

export const answerOptions = [
  { value: -2, label: 'Strongly Disagree' },
  { value: -1, label: 'Disagree' },
  { value: 0, label: 'Neutral' },
  { value: 1, label: 'Agree' },
  { value: 2, label: 'Strongly Agree' },
];

export const strengthDomains: StrengthDomain[] = [
  'Strategic Thinking',
  'Analytical Thinking',
  'Execution & Delivery',
  'Influence & Communication',
  'Relationship Building',
  'Learning & Curiosity',
  'Leadership & Ownership',
  'Adaptability & Problem Solving',
];

export function getStrengthDescription(strength: StrengthDomain): string {
  const descriptions: Record<StrengthDomain, string> = {
    'Strategic Thinking': 'You excel at seeing the big picture and planning for the future.',
    'Analytical Thinking': 'You thrive when breaking down complex problems with data and logic.',
    'Execution & Delivery': 'You reliably turn ideas into tangible results.',
    'Influence & Communication': 'You persuade and inspire others effectively.',
    'Relationship Building': 'You build and maintain strong, trusting relationships.',
    'Learning & Curiosity': 'You constantly seek growth and new knowledge.',
    'Leadership & Ownership': 'You naturally take charge and drive outcomes.',
    'Adaptability & Problem Solving': 'You thrive in change and find creative solutions.',
  };
  return descriptions[strength];
}
