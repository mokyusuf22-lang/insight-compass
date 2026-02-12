export interface WheelCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  color: string; // HSL color for radar chart
}

export const wheelCategories: WheelCategory[] = [
  {
    id: 'career',
    name: 'Career & Work',
    description: 'Job satisfaction, professional growth, and sense of purpose at work',
    icon: '💼',
    color: 'hsl(220, 70%, 55%)',
  },
  {
    id: 'finances',
    name: 'Finances',
    description: 'Financial security, savings, investments, and money management',
    icon: '💰',
    color: 'hsl(145, 60%, 42%)',
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    description: 'Physical health, exercise, nutrition, sleep, and energy levels',
    icon: '🏃',
    color: 'hsl(0, 70%, 55%)',
  },
  {
    id: 'relationships',
    name: 'Family & Friends',
    description: 'Quality of relationships with family, friends, and community',
    icon: '👥',
    color: 'hsl(30, 80%, 55%)',
  },
  {
    id: 'romance',
    name: 'Romance & Love',
    description: 'Romantic relationship, intimacy, connection, and partnership',
    icon: '❤️',
    color: 'hsl(340, 70%, 55%)',
  },
  {
    id: 'growth',
    name: 'Personal Growth',
    description: 'Learning, self-improvement, mindset, and personal development',
    icon: '🌱',
    color: 'hsl(160, 60%, 45%)',
  },
  {
    id: 'fun',
    name: 'Fun & Recreation',
    description: 'Hobbies, leisure, creativity, and enjoyment of life',
    icon: '🎯',
    color: 'hsl(270, 60%, 55%)',
  },
  {
    id: 'environment',
    name: 'Physical Environment',
    description: 'Living space, surroundings, comfort, and sense of belonging',
    icon: '🏠',
    color: 'hsl(195, 65%, 50%)',
  },
];
