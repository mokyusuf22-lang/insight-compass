export interface Question {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    description?: string;
  }[];
  isPaid: boolean;
}

export const freeQuestions: Question[] = [
  {
    id: 'q1_energy',
    question: 'When you have free time, how do you prefer to recharge?',
    options: [
      { value: 'alone', label: 'Time Alone', description: 'Reading, reflecting, or pursuing solo activities' },
      { value: 'small_group', label: 'Small Gatherings', description: 'Connecting deeply with one or two close friends' },
      { value: 'social', label: 'Social Events', description: 'Being around groups and meeting new people' },
      { value: 'mixed', label: 'It Depends', description: 'My preference changes based on my mood' },
    ],
    isPaid: false,
  },
  {
    id: 'q2_decisions',
    question: 'When making important decisions, what guides you most?',
    options: [
      { value: 'logic', label: 'Logic & Analysis', description: 'Facts, data, and objective reasoning' },
      { value: 'intuition', label: 'Gut Feeling', description: 'My instincts and inner sense of what\'s right' },
      { value: 'values', label: 'Personal Values', description: 'What aligns with my core beliefs' },
      { value: 'others', label: 'Others\' Input', description: 'Advice and perspectives from people I trust' },
    ],
    isPaid: false,
  },
  {
    id: 'q3_stress',
    question: 'When facing a challenge, your first instinct is to...',
    options: [
      { value: 'plan', label: 'Create a Plan', description: 'Break it down into actionable steps' },
      { value: 'adapt', label: 'Stay Flexible', description: 'Adapt as the situation evolves' },
      { value: 'research', label: 'Gather Information', description: 'Learn everything before acting' },
      { value: 'support', label: 'Seek Support', description: 'Talk it through with others' },
    ],
    isPaid: false,
  },
  {
    id: 'q4_communication',
    question: 'In conversations, you tend to...',
    options: [
      { value: 'listen', label: 'Listen First', description: 'Take in what others say before responding' },
      { value: 'share', label: 'Share Ideas', description: 'Express your thoughts enthusiastically' },
      { value: 'question', label: 'Ask Questions', description: 'Dig deeper to understand fully' },
      { value: 'observe', label: 'Observe Dynamics', description: 'Notice body language and unspoken cues' },
    ],
    isPaid: false,
  },
  {
    id: 'q5_motivation',
    question: 'What motivates you most in your daily life?',
    options: [
      { value: 'growth', label: 'Personal Growth', description: 'Becoming the best version of myself' },
      { value: 'connection', label: 'Meaningful Connections', description: 'Deep relationships with others' },
      { value: 'achievement', label: 'Achievement', description: 'Reaching goals and seeing results' },
      { value: 'peace', label: 'Inner Peace', description: 'Harmony and balance in life' },
    ],
    isPaid: false,
  },
];

export const paidQuestions: Question[] = [
  {
    id: 'q6_conflict',
    question: 'How do you typically handle disagreements?',
    options: [
      { value: 'direct', label: 'Address Directly', description: 'Confront the issue head-on' },
      { value: 'compromise', label: 'Find Middle Ground', description: 'Look for solutions that satisfy everyone' },
      { value: 'avoid', label: 'Give Space', description: 'Let things cool down before discussing' },
      { value: 'mediate', label: 'Seek Understanding', description: 'Try to understand all perspectives deeply' },
    ],
    isPaid: true,
  },
  {
    id: 'q7_change',
    question: 'When unexpected changes happen, you usually...',
    options: [
      { value: 'embrace', label: 'Embrace It', description: 'See it as an opportunity for growth' },
      { value: 'process', label: 'Need Time', description: 'Take time to process and adjust' },
      { value: 'resist', label: 'Prefer Stability', description: 'Feel more comfortable with the familiar' },
      { value: 'analyze', label: 'Evaluate Impact', description: 'Assess how it affects your plans' },
    ],
    isPaid: true,
  },
  {
    id: 'q8_creativity',
    question: 'Where does your creativity shine most?',
    options: [
      { value: 'problem', label: 'Problem Solving', description: 'Finding innovative solutions' },
      { value: 'artistic', label: 'Artistic Expression', description: 'Creating art, music, or writing' },
      { value: 'ideas', label: 'Big Picture Thinking', description: 'Envisioning possibilities and futures' },
      { value: 'practical', label: 'Practical Innovation', description: 'Improving how things work' },
    ],
    isPaid: true,
  },
  {
    id: 'q9_leadership',
    question: 'In a team setting, you naturally tend to...',
    options: [
      { value: 'lead', label: 'Take the Lead', description: 'Guide and direct the group' },
      { value: 'support', label: 'Support Others', description: 'Help teammates succeed' },
      { value: 'contribute', label: 'Contribute Ideas', description: 'Focus on your specific strengths' },
      { value: 'coordinate', label: 'Coordinate', description: 'Ensure everyone is aligned' },
    ],
    isPaid: true,
  },
  {
    id: 'q10_fulfillment',
    question: 'What brings you the deepest sense of fulfillment?',
    options: [
      { value: 'impact', label: 'Making Impact', description: 'Creating positive change in the world' },
      { value: 'mastery', label: 'Mastering Skills', description: 'Becoming excellent at something' },
      { value: 'belonging', label: 'Belonging', description: 'Being part of something meaningful' },
      { value: 'freedom', label: 'Freedom', description: 'Living life on your own terms' },
    ],
    isPaid: true,
  },
  {
    id: 'q11_learning',
    question: 'Your preferred way of learning something new is...',
    options: [
      { value: 'hands_on', label: 'Hands-On Practice', description: 'Learning by doing' },
      { value: 'reading', label: 'Reading & Research', description: 'Diving deep into materials' },
      { value: 'discussion', label: 'Discussion', description: 'Talking it through with others' },
      { value: 'observation', label: 'Observation', description: 'Watching and then trying' },
    ],
    isPaid: true,
  },
  {
    id: 'q12_values',
    question: 'Which value resonates most deeply with you?',
    options: [
      { value: 'authenticity', label: 'Authenticity', description: 'Being true to yourself' },
      { value: 'compassion', label: 'Compassion', description: 'Caring for others\' wellbeing' },
      { value: 'excellence', label: 'Excellence', description: 'Striving for the best' },
      { value: 'adventure', label: 'Adventure', description: 'Exploring and experiencing' },
    ],
    isPaid: true,
  },
];

export const allQuestions = [...freeQuestions, ...paidQuestions];
