// DISC Behavioral Assessment - 40 Questions
// D = Dominance, I = Influence, S = Steadiness, C = Conscientiousness

export type DISCDimension = 'D' | 'I' | 'S' | 'C';

export interface DISCQuestion {
  id: string;
  text: string;
  dimension: DISCDimension;
}

export const discQuestions: DISCQuestion[] = [
  // DOMINANCE (D) - 10 Questions
  { id: 'D1', text: 'I take charge quickly in group situations.', dimension: 'D' },
  { id: 'D2', text: 'I am comfortable making tough decisions.', dimension: 'D' },
  { id: 'D3', text: 'I focus on achieving results above all else.', dimension: 'D' },
  { id: 'D4', text: 'I prefer direct and straightforward communication.', dimension: 'D' },
  { id: 'D5', text: 'I am competitive and driven to win.', dimension: 'D' },
  { id: 'D6', text: 'I challenge the status quo when I see a better way.', dimension: 'D' },
  { id: 'D7', text: 'I thrive under pressure and tight deadlines.', dimension: 'D' },
  { id: 'D8', text: 'I prefer to lead rather than follow.', dimension: 'D' },
  { id: 'D9', text: 'I am assertive in expressing my opinions.', dimension: 'D' },
  { id: 'D10', text: 'I make quick decisions with available information.', dimension: 'D' },

  // INFLUENCE (I) - 10 Questions
  { id: 'I1', text: 'I enjoy persuading and motivating others.', dimension: 'I' },
  { id: 'I2', text: 'I build relationships easily in new environments.', dimension: 'I' },
  { id: 'I3', text: 'I am enthusiastic and optimistic by nature.', dimension: 'I' },
  { id: 'I4', text: 'I prefer collaborative work over solo projects.', dimension: 'I' },
  { id: 'I5', text: 'I enjoy being the center of attention.', dimension: 'I' },
  { id: 'I6', text: 'I use storytelling and humor to make points.', dimension: 'I' },
  { id: 'I7', text: 'I trust my gut feelings about people.', dimension: 'I' },
  { id: 'I8', text: 'I am skilled at networking and making connections.', dimension: 'I' },
  { id: 'I9', text: 'I prefer variety over routine in my work.', dimension: 'I' },
  { id: 'I10', text: 'I can inspire others to take action.', dimension: 'I' },

  // STEADINESS (S) - 10 Questions
  { id: 'S1', text: 'I prefer a stable and predictable environment.', dimension: 'S' },
  { id: 'S2', text: 'I am patient and supportive with others.', dimension: 'S' },
  { id: 'S3', text: 'I value loyalty and long-term commitments.', dimension: 'S' },
  { id: 'S4', text: 'I prefer working at a steady, consistent pace.', dimension: 'S' },
  { id: 'S5', text: 'I am a good listener and team player.', dimension: 'S' },
  { id: 'S6', text: 'I avoid unnecessary conflict when possible.', dimension: 'S' },
  { id: 'S7', text: 'I find comfort in established routines.', dimension: 'S' },
  { id: 'S8', text: 'I am dependable and follow through on commitments.', dimension: 'S' },
  { id: 'S9', text: 'I prefer to think before responding.', dimension: 'S' },
  { id: 'S10', text: 'I value harmony in my relationships.', dimension: 'S' },

  // CONSCIENTIOUSNESS (C) - 10 Questions
  { id: 'C1', text: 'I pay close attention to details and accuracy.', dimension: 'C' },
  { id: 'C2', text: 'I prefer working with clear guidelines and standards.', dimension: 'C' },
  { id: 'C3', text: 'I analyze situations thoroughly before acting.', dimension: 'C' },
  { id: 'C4', text: 'I hold myself to high quality standards.', dimension: 'C' },
  { id: 'C5', text: 'I prefer logic and data over intuition.', dimension: 'C' },
  { id: 'C6', text: 'I am systematic and organized in my approach.', dimension: 'C' },
  { id: 'C7', text: 'I check my work multiple times for errors.', dimension: 'C' },
  { id: 'C8', text: 'I prefer to understand all the facts before deciding.', dimension: 'C' },
  { id: 'C9', text: 'I value precision and correctness.', dimension: 'C' },
  { id: 'C10', text: 'I follow rules and procedures carefully.', dimension: 'C' },
];

export const answerOptions = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export function getDimensionLabel(dimension: DISCDimension): { name: string; description: string } {
  const labels: Record<DISCDimension, { name: string; description: string }> = {
    D: { name: 'Dominance', description: 'Direct, results-oriented, decisive' },
    I: { name: 'Influence', description: 'Outgoing, enthusiastic, optimistic' },
    S: { name: 'Steadiness', description: 'Patient, reliable, team-oriented' },
    C: { name: 'Conscientiousness', description: 'Analytical, accurate, detail-focused' },
  };
  return labels[dimension];
}
