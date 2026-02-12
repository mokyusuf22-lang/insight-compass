export interface BlobInterpretation {
  id: number;
  title: string;
  description: string;
  traits: string[];
  advice?: string;
}

export const blobInterpretations: Record<number, BlobInterpretation> = {
  1: {
    id: 1,
    title: 'The Confident Optimist',
    description:
      'You are a self-confident person, happy with your life and optimistic. You are intelligent, able to see the great picture and put things into perspective.',
    traits: ['Self-confident', 'Optimistic', 'Big-picture thinker', 'Grounded'],
  },
  2: {
    id: 2,
    title: 'The Ambitious Climber',
    description:
      'You are an ambitious and confident person. You know that you will succeed at all times and that there will always be convenient situations to help you in your evolution.',
    traits: ['Ambitious', 'Confident', 'Determined', 'Growth-oriented'],
  },
  3: {
    id: 3,
    title: 'The Ambitious Climber',
    description:
      'You are an ambitious and confident person. You know that you will succeed at all times and that there will always be convenient situations to help you in your evolution.',
    traits: ['Ambitious', 'Confident', 'Determined', 'Growth-oriented'],
  },
  4: {
    id: 4,
    title: 'The Quick Surrenderer',
    description:
      "You give up too quickly and don't trust your extraordinary potential. You have incredible abilities within you, but self-doubt holds you back from reaching your goals.",
    traits: ['Self-doubting', 'Cautious', 'Untapped potential'],
    advice: 'Build self-belief by starting with small wins and celebrating each achievement.',
  },
  5: {
    id: 5,
    title: 'The Creative Spirit',
    description:
      'You are creative, love life, enjoy every moment, love and know how to be grateful for all the good things around you. This helps you maintain a positive outlook and keep doors open to the best!',
    traits: ['Creative', 'Grateful', 'Life-loving', 'Positive'],
  },
  6: {
    id: 6,
    title: 'The Love Seeker',
    description:
      'You need to feel loved, protected, and safe. You are the kind of person who always falls in love with the wrong person because of an inexhaustible need for affection and love.',
    traits: ['Affectionate', 'Vulnerable', 'Caring', 'Needs security'],
    advice:
      'Learn to look more closely for people who can help you grow, rather than those who don\'t understand your vulnerability.',
  },
  7: {
    id: 7,
    title: 'The Supportive Communicator',
    description:
      'You are a communicative person who knows how to offer support to friends. You are characterised by high emotional intelligence, which helps you cope successfully with life situations.',
    traits: ['Communicative', 'Emotionally intelligent', 'Supportive', 'Team player'],
  },
  8: {
    id: 8,
    title: 'The Dreamy Romantic',
    description:
      'You are dreamy and romantic. You like to have moments just for yourself. In this way, you regain your energy and zest for life and socialisation.',
    traits: ['Introspective', 'Romantic', 'Thoughtful', 'Needs solitude'],
    advice:
      "It's good for loved ones to understand your need for isolation and not misinterpret it — give yourself the space you need.",
  },
  9: {
    id: 9,
    title: 'The Lone Prover',
    description:
      'You would do anything to prove that you are also wonderful, but it is easier to keep away from others and stand alone because in this way you justify your distrust of others.',
    traits: ['Distrustful', 'Independent', 'Needs validation'],
    advice: 'Opening up to trusted people can help you find the connection you secretly crave.',
  },
  10: {
    id: 10,
    title: 'The Cautious Achiever',
    description:
      "You are ambitious but also very cautious. You are hardworking and determined — that's why you succeed in almost anything you set out to do. Your ideas always stand out and you are appreciated in any environment.",
    traits: ['Ambitious', 'Cautious', 'Hardworking', 'Appreciated'],
  },
  11: {
    id: 11,
    title: 'The Supportive Communicator',
    description:
      'You are a communicative person who knows how to offer support to friends. You have a team spirit, see the full side of the glass and always find solutions.',
    traits: ['Communicative', 'Emotionally intelligent', 'Supportive', 'Team player'],
  },
  12: {
    id: 12,
    title: 'The Supportive Communicator',
    description:
      'You are a communicative person who knows how to offer support to friends. High emotional intelligence helps you cope successfully with life situations.',
    traits: ['Communicative', 'Emotionally intelligent', 'Supportive', 'Solution-finder'],
  },
  13: {
    id: 13,
    title: 'The Despairing Soul',
    description:
      'You are filled with despair and loss of hope. You must do your best to recalibrate yourself in the tree of life.',
    traits: ['Struggling', 'Needs support', 'Vulnerable'],
    advice:
      'The easiest path forward is to regain self-confidence by seeking the support of loved ones.',
  },
  14: {
    id: 14,
    title: 'The Selfless Helper',
    description:
      'You are a soulmate, a philanthropist — you would do anything to help others. You are characterised by much empathy and are usually a "great soul."',
    traits: ['Empathetic', 'Philanthropic', 'Selfless', 'Caring'],
    advice: 'Learn to take great care of yourself, not just others.',
  },
  15: {
    id: 15,
    title: 'The Journey Lover',
    description:
      'You are motivated by the beauty of the road to success rather than the success itself. You are curious to learn new things, have new experiences, meet people, and learn something from each one.',
    traits: ['Curious', 'Experience-driven', 'Open-minded', 'Learner'],
  },
  16: {
    id: 16,
    title: 'The Optimistic Performer',
    description:
      'You are optimistic, full of life, with a team spirit. You perform in any field and look at challenges with detachment.',
    traits: ['Optimistic', 'Full of life', 'Team-spirited', 'High performer'],
  },
  17: {
    id: 17,
    title: 'The Optimistic Performer',
    description:
      'You are optimistic, full of life, with a team spirit. You perform in any field and look at challenges with detachment.',
    traits: ['Optimistic', 'Full of life', 'Team-spirited', 'High performer'],
  },
  18: {
    id: 18,
    title: 'The Loving Performer',
    description:
      'You like to feel loved and appreciated, and when you do, you become the best friend anyone could have. You are optimistic, full of life and perform in any field.',
    traits: ['Needs appreciation', 'Loyal friend', 'Optimistic', 'High performer'],
  },
  19: {
    id: 19,
    title: 'The Envious Observer',
    description:
      'You may have narcissistic inclinations and are envious of the success of others. You are unsociable and suspicious.',
    traits: ['Envious', 'Suspicious', 'Narcissistic tendencies'],
    advice: 'Focus on your own journey instead of comparing yourself to others.',
  },
  20: {
    id: 20,
    title: 'The Bold Innovator',
    description:
      'You are ambitious, confident, and full of life. You are an innovator and not afraid to take risks. Your detachment and passion bring you many successes and satisfactions.',
    traits: ['Ambitious', 'Innovative', 'Risk-taker', 'Passionate'],
  },
  21: {
    id: 21,
    title: 'The Struggling Seeker',
    description:
      'You try but do not know how to find the best solutions for your life. You must learn to ask for help from those around you and give up your suspicious nature.',
    traits: ['Struggling', 'Suspicious', 'Seeking answers'],
    advice: 'Reach out to others — asking for help is a sign of strength, not weakness.',
  },
};

// Approximate positions of blobs on the tree image (as percentages)
export const blobPositions: Record<number, { x: number; y: number }> = {
  1: { x: 40, y: 88 },
  2: { x: 30, y: 90 },
  3: { x: 35, y: 82 },
  4: { x: 72, y: 92 },
  5: { x: 75, y: 82 },
  6: { x: 42, y: 70 },
  7: { x: 32, y: 72 },
  8: { x: 78, y: 65 },
  9: { x: 78, y: 52 },
  10: { x: 28, y: 52 },
  11: { x: 45, y: 52 },
  12: { x: 55, y: 52 },
  13: { x: 12, y: 62 },
  14: { x: 8, y: 30 },
  15: { x: 32, y: 30 },
  16: { x: 60, y: 25 },
  17: { x: 52, y: 28 },
  18: { x: 55, y: 20 },
  19: { x: 85, y: 18 },
  20: { x: 35, y: 10 },
  21: { x: 8, y: 78 },
};
