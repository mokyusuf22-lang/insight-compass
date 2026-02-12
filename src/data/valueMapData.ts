export interface CoreValue {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'social' | 'professional' | 'spiritual';
  emoji: string;
}

export const coreValues: CoreValue[] = [
  // Personal
  { id: 'freedom', name: 'Freedom', description: 'Independence and autonomy in choices', category: 'personal', emoji: '🕊️' },
  { id: 'creativity', name: 'Creativity', description: 'Self-expression and innovation', category: 'personal', emoji: '🎨' },
  { id: 'adventure', name: 'Adventure', description: 'New experiences and exploration', category: 'personal', emoji: '🧭' },
  { id: 'authenticity', name: 'Authenticity', description: 'Being true to yourself', category: 'personal', emoji: '💎' },
  { id: 'balance', name: 'Balance', description: 'Harmony between life areas', category: 'personal', emoji: '⚖️' },
  { id: 'courage', name: 'Courage', description: 'Facing fears and taking bold action', category: 'personal', emoji: '🦁' },
  { id: 'health', name: 'Health', description: 'Physical and mental well-being', category: 'personal', emoji: '💪' },
  { id: 'joy', name: 'Joy', description: 'Happiness and fulfillment', category: 'personal', emoji: '✨' },
  { id: 'growth', name: 'Growth', description: 'Continuous learning and self-improvement', category: 'personal', emoji: '🌱' },
  { id: 'resilience', name: 'Resilience', description: 'Bouncing back from adversity', category: 'personal', emoji: '🏔️' },

  // Social
  { id: 'family', name: 'Family', description: 'Close bonds with loved ones', category: 'social', emoji: '👨‍👩‍👧‍👦' },
  { id: 'community', name: 'Community', description: 'Belonging and collective support', category: 'social', emoji: '🤝' },
  { id: 'compassion', name: 'Compassion', description: 'Empathy and caring for others', category: 'social', emoji: '💛' },
  { id: 'loyalty', name: 'Loyalty', description: 'Faithfulness and commitment', category: 'social', emoji: '🛡️' },
  { id: 'justice', name: 'Justice', description: 'Fairness and equality', category: 'social', emoji: '⚔️' },
  { id: 'kindness', name: 'Kindness', description: 'Generosity and warmth', category: 'social', emoji: '🌸' },
  { id: 'love', name: 'Love', description: 'Deep connection and affection', category: 'social', emoji: '❤️' },
  { id: 'respect', name: 'Respect', description: 'Dignity and mutual regard', category: 'social', emoji: '🙏' },

  // Professional
  { id: 'achievement', name: 'Achievement', description: 'Accomplishment and success', category: 'professional', emoji: '🏆' },
  { id: 'leadership', name: 'Leadership', description: 'Guiding and inspiring others', category: 'professional', emoji: '👑' },
  { id: 'excellence', name: 'Excellence', description: 'Striving for the highest quality', category: 'professional', emoji: '⭐' },
  { id: 'wealth', name: 'Wealth', description: 'Financial security and abundance', category: 'professional', emoji: '💰' },
  { id: 'influence', name: 'Influence', description: 'Making an impact on the world', category: 'professional', emoji: '🌍' },
  { id: 'knowledge', name: 'Knowledge', description: 'Deep understanding and wisdom', category: 'professional', emoji: '📚' },
  { id: 'innovation', name: 'Innovation', description: 'Creating new solutions', category: 'professional', emoji: '💡' },
  { id: 'service', name: 'Service', description: 'Contributing to others\' success', category: 'professional', emoji: '🎯' },
  { id: 'recognition', name: 'Recognition', description: 'Being acknowledged for contributions', category: 'professional', emoji: '🌟' },

  // Spiritual
  { id: 'peace', name: 'Peace', description: 'Inner calm and serenity', category: 'spiritual', emoji: '☮️' },
  { id: 'faith', name: 'Faith', description: 'Trust in something greater', category: 'spiritual', emoji: '🕯️' },
  { id: 'purpose', name: 'Purpose', description: 'Living with meaning and direction', category: 'spiritual', emoji: '🧿' },
  { id: 'gratitude', name: 'Gratitude', description: 'Appreciation for what you have', category: 'spiritual', emoji: '🙌' },
  { id: 'integrity', name: 'Integrity', description: 'Alignment between values and actions', category: 'spiritual', emoji: '🔑' },
  { id: 'humility', name: 'Humility', description: 'Modesty and openness', category: 'spiritual', emoji: '🌿' },
  { id: 'wisdom', name: 'Wisdom', description: 'Sound judgment from experience', category: 'spiritual', emoji: '🦉' },
];

export const categoryLabels: Record<CoreValue['category'], string> = {
  personal: 'Personal & Self',
  social: 'Social & Relationships',
  professional: 'Professional & Career',
  spiritual: 'Spiritual & Inner Life',
};

export const categoryColors: Record<CoreValue['category'], string> = {
  personal: 'bg-primary/10 text-primary border-primary/20',
  social: 'bg-accent/30 text-accent-foreground border-accent/40',
  professional: 'bg-secondary text-secondary-foreground border-secondary',
  spiritual: 'bg-muted text-muted-foreground border-muted',
};

export function getValueInsights(rankedValues: string[]): { archetype: string; description: string; strengths: string[]; watchOuts: string[] } {
  const top = rankedValues.slice(0, 3);
  const hasPersonal = top.some(v => coreValues.find(cv => cv.id === v)?.category === 'personal');
  const hasSocial = top.some(v => coreValues.find(cv => cv.id === v)?.category === 'social');
  const hasProfessional = top.some(v => coreValues.find(cv => cv.id === v)?.category === 'professional');
  const hasSpiritual = top.some(v => coreValues.find(cv => cv.id === v)?.category === 'spiritual');

  if (hasProfessional && hasPersonal) {
    return {
      archetype: 'The Ambitious Individualist',
      description: 'You blend personal drive with professional ambition. You want to succeed on your own terms and refuse to sacrifice who you are for what you do.',
      strengths: ['Self-motivated', 'Authentic leadership', 'Clear personal vision'],
      watchOuts: ['May resist team conformity', 'Could prioritize self over collaboration'],
    };
  }
  if (hasSocial && hasSpiritual) {
    return {
      archetype: 'The Compassionate Guide',
      description: 'You lead with heart and purpose. Your decisions are rooted in meaning and connection, making you a natural mentor and community builder.',
      strengths: ['Deep empathy', 'Purpose-driven', 'Builds trust naturally'],
      watchOuts: ['May neglect personal ambition', 'Could struggle with tough decisions'],
    };
  }
  if (hasProfessional && hasSocial) {
    return {
      archetype: 'The Impact Builder',
      description: 'You want to achieve big things AND bring people along. You see success as something shared and are driven by collective wins.',
      strengths: ['Collaborative achiever', 'Team motivator', 'Results with relationships'],
      watchOuts: ['May overcommit to others', 'Could struggle with solo decisions'],
    };
  }
  if (hasPersonal && hasSpiritual) {
    return {
      archetype: 'The Inner Explorer',
      description: 'You are on a journey of self-discovery and meaning. You prioritize inner growth over external validation and seek depth in all things.',
      strengths: ['Self-aware', 'Deeply reflective', 'Resilient under pressure'],
      watchOuts: ['May avoid external challenges', 'Could overthink before acting'],
    };
  }
  return {
    archetype: 'The Balanced Seeker',
    description: 'You draw from multiple dimensions of life. Your values span across personal, social, and professional domains, giving you a well-rounded perspective.',
    strengths: ['Versatile', 'Adaptable', 'Sees the big picture'],
    watchOuts: ['May lack singular focus', 'Could spread energy too thin'],
  };
}
