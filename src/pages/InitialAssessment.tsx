import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/assessment/QuestionCard';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { Brain, ArrowLeft, ArrowRight } from 'lucide-react';

// 20 questions for Initial Personality Hypothesis
const initialQuestions = [
  {
    id: 'ip_1',
    question: 'When you have free time, how do you prefer to recharge?',
    options: [
      { value: 'alone', label: 'Time Alone', description: 'Reading, reflecting, or pursuing solo activities' },
      { value: 'small_group', label: 'Small Gatherings', description: 'Connecting deeply with one or two close friends' },
      { value: 'social', label: 'Social Events', description: 'Being around groups and meeting new people' },
      { value: 'mixed', label: 'It Depends', description: 'My preference changes based on my mood' },
    ],
  },
  {
    id: 'ip_2',
    question: 'When making important decisions, what guides you most?',
    options: [
      { value: 'logic', label: 'Logic & Analysis', description: 'Facts, data, and objective reasoning' },
      { value: 'intuition', label: 'Gut Feeling', description: 'My instincts and inner sense of what\'s right' },
      { value: 'values', label: 'Personal Values', description: 'What aligns with my core beliefs' },
      { value: 'others', label: 'Others\' Input', description: 'Advice and perspectives from people I trust' },
    ],
  },
  {
    id: 'ip_3',
    question: 'When facing a challenge, your first instinct is to...',
    options: [
      { value: 'plan', label: 'Create a Plan', description: 'Break it down into actionable steps' },
      { value: 'adapt', label: 'Stay Flexible', description: 'Adapt as the situation evolves' },
      { value: 'research', label: 'Gather Information', description: 'Learn everything before acting' },
      { value: 'support', label: 'Seek Support', description: 'Talk it through with others' },
    ],
  },
  {
    id: 'ip_4',
    question: 'In conversations, you tend to...',
    options: [
      { value: 'listen', label: 'Listen First', description: 'Take in what others say before responding' },
      { value: 'share', label: 'Share Ideas', description: 'Express your thoughts enthusiastically' },
      { value: 'question', label: 'Ask Questions', description: 'Dig deeper to understand fully' },
      { value: 'observe', label: 'Observe Dynamics', description: 'Notice body language and unspoken cues' },
    ],
  },
  {
    id: 'ip_5',
    question: 'What motivates you most in your daily life?',
    options: [
      { value: 'growth', label: 'Personal Growth', description: 'Becoming the best version of myself' },
      { value: 'connection', label: 'Meaningful Connections', description: 'Deep relationships with others' },
      { value: 'achievement', label: 'Achievement', description: 'Reaching goals and seeing results' },
      { value: 'peace', label: 'Inner Peace', description: 'Harmony and balance in life' },
    ],
  },
  {
    id: 'ip_6',
    question: 'How do you typically handle disagreements?',
    options: [
      { value: 'direct', label: 'Address Directly', description: 'Confront the issue head-on' },
      { value: 'compromise', label: 'Find Middle Ground', description: 'Look for solutions that satisfy everyone' },
      { value: 'avoid', label: 'Give Space', description: 'Let things cool down before discussing' },
      { value: 'mediate', label: 'Seek Understanding', description: 'Try to understand all perspectives deeply' },
    ],
  },
  {
    id: 'ip_7',
    question: 'When unexpected changes happen, you usually...',
    options: [
      { value: 'embrace', label: 'Embrace It', description: 'See it as an opportunity for growth' },
      { value: 'process', label: 'Need Time', description: 'Take time to process and adjust' },
      { value: 'resist', label: 'Prefer Stability', description: 'Feel more comfortable with the familiar' },
      { value: 'analyze', label: 'Evaluate Impact', description: 'Assess how it affects your plans' },
    ],
  },
  {
    id: 'ip_8',
    question: 'Where does your creativity shine most?',
    options: [
      { value: 'problem', label: 'Problem Solving', description: 'Finding innovative solutions' },
      { value: 'artistic', label: 'Artistic Expression', description: 'Creating art, music, or writing' },
      { value: 'ideas', label: 'Big Picture Thinking', description: 'Envisioning possibilities and futures' },
      { value: 'practical', label: 'Practical Innovation', description: 'Improving how things work' },
    ],
  },
  {
    id: 'ip_9',
    question: 'In a team setting, you naturally tend to...',
    options: [
      { value: 'lead', label: 'Take the Lead', description: 'Guide and direct the group' },
      { value: 'support', label: 'Support Others', description: 'Help teammates succeed' },
      { value: 'contribute', label: 'Contribute Ideas', description: 'Focus on your specific strengths' },
      { value: 'coordinate', label: 'Coordinate', description: 'Ensure everyone is aligned' },
    ],
  },
  {
    id: 'ip_10',
    question: 'What brings you the deepest sense of fulfillment?',
    options: [
      { value: 'impact', label: 'Making Impact', description: 'Creating positive change in the world' },
      { value: 'mastery', label: 'Mastering Skills', description: 'Becoming excellent at something' },
      { value: 'belonging', label: 'Belonging', description: 'Being part of something meaningful' },
      { value: 'freedom', label: 'Freedom', description: 'Living life on your own terms' },
    ],
  },
  {
    id: 'ip_11',
    question: 'Your preferred way of learning something new is...',
    options: [
      { value: 'hands_on', label: 'Hands-On Practice', description: 'Learning by doing' },
      { value: 'reading', label: 'Reading & Research', description: 'Diving deep into materials' },
      { value: 'discussion', label: 'Discussion', description: 'Talking it through with others' },
      { value: 'observation', label: 'Observation', description: 'Watching and then trying' },
    ],
  },
  {
    id: 'ip_12',
    question: 'Which value resonates most deeply with you?',
    options: [
      { value: 'authenticity', label: 'Authenticity', description: 'Being true to yourself' },
      { value: 'compassion', label: 'Compassion', description: 'Caring for others\' wellbeing' },
      { value: 'excellence', label: 'Excellence', description: 'Striving for the best' },
      { value: 'adventure', label: 'Adventure', description: 'Exploring and experiencing' },
    ],
  },
  {
    id: 'ip_13',
    question: 'When starting a new project, you prefer to...',
    options: [
      { value: 'plan_detailed', label: 'Plan in Detail', description: 'Map out every step before beginning' },
      { value: 'start_quickly', label: 'Start Quickly', description: 'Dive in and figure it out as you go' },
      { value: 'research_first', label: 'Research First', description: 'Understand the context thoroughly' },
      { value: 'collaborate', label: 'Collaborate', description: 'Involve others from the start' },
    ],
  },
  {
    id: 'ip_14',
    question: 'How do you typically respond to feedback?',
    options: [
      { value: 'reflect', label: 'Reflect Deeply', description: 'Take time to process and internalize' },
      { value: 'act_immediately', label: 'Act Immediately', description: 'Make changes right away' },
      { value: 'discuss', label: 'Discuss Further', description: 'Ask questions to understand better' },
      { value: 'evaluate', label: 'Evaluate Objectively', description: 'Assess if the feedback is valid' },
    ],
  },
  {
    id: 'ip_15',
    question: 'In social situations, you are more likely to...',
    options: [
      { value: 'initiate', label: 'Initiate Conversations', description: 'Approach new people easily' },
      { value: 'wait', label: 'Wait to Be Approached', description: 'Let others come to you' },
      { value: 'observe_first', label: 'Observe First', description: 'Watch the room before engaging' },
      { value: 'find_familiar', label: 'Find Familiar Faces', description: 'Stick with people you know' },
    ],
  },
  {
    id: 'ip_16',
    question: 'When you feel stressed, you tend to...',
    options: [
      { value: 'withdraw', label: 'Withdraw', description: 'Need alone time to recharge' },
      { value: 'talk_it_out', label: 'Talk It Out', description: 'Process by discussing with others' },
      { value: 'take_action', label: 'Take Action', description: 'Do something productive' },
      { value: 'distract', label: 'Find Distraction', description: 'Engage in something unrelated' },
    ],
  },
  {
    id: 'ip_17',
    question: 'What kind of environment do you thrive in?',
    options: [
      { value: 'structured', label: 'Structured & Predictable', description: 'Clear routines and expectations' },
      { value: 'flexible', label: 'Flexible & Dynamic', description: 'Variety and spontaneity' },
      { value: 'collaborative', label: 'Collaborative', description: 'Working closely with others' },
      { value: 'independent', label: 'Independent', description: 'Freedom to work on your own' },
    ],
  },
  {
    id: 'ip_18',
    question: 'How do you approach setting goals?',
    options: [
      { value: 'ambitious', label: 'Ambitious Stretch Goals', description: 'Aim high, push your limits' },
      { value: 'realistic', label: 'Realistic & Achievable', description: 'Set goals you know you can reach' },
      { value: 'flexible_goals', label: 'Flexible & Adaptable', description: 'Goals that can evolve' },
      { value: 'collaborative_goals', label: 'Shared Goals', description: 'Goals aligned with others' },
    ],
  },
  {
    id: 'ip_19',
    question: 'What energizes you most in your work?',
    options: [
      { value: 'solving_problems', label: 'Solving Problems', description: 'Tackling complex challenges' },
      { value: 'helping_others', label: 'Helping Others', description: 'Making a difference for people' },
      { value: 'creating_new', label: 'Creating Something New', description: 'Innovation and building' },
      { value: 'achieving_results', label: 'Achieving Results', description: 'Seeing measurable outcomes' },
    ],
  },
  {
    id: 'ip_20',
    question: 'How would close friends describe you?',
    options: [
      { value: 'thoughtful', label: 'Thoughtful & Reflective', description: 'Deep thinker, considerate' },
      { value: 'energetic', label: 'Energetic & Enthusiastic', description: 'Full of life and ideas' },
      { value: 'reliable', label: 'Reliable & Steady', description: 'Dependable and consistent' },
      { value: 'driven', label: 'Driven & Ambitious', description: 'Focused and determined' },
    ],
  },
];

const STORAGE_KEY = 'initial_assessment_responses';

export default function InitialAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load responses from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResponses(parsed.responses || {});
        setCurrentQuestion(parsed.currentQuestion || 0);
      } catch {
        // Invalid data, start fresh
      }
    }
  }, []);

  // Save responses to localStorage on change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        responses,
        currentQuestion,
        timestamp: Date.now(),
      }));
    }
  }, [responses, currentQuestion]);

  const handleSelect = (value: string) => {
    const question = initialQuestions[currentQuestion];
    setResponses({ ...responses, [question.id]: value });
  };

  const goNext = () => {
    if (currentQuestion < initialQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Assessment complete - save to localStorage and go to results
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        responses,
        currentQuestion: initialQuestions.length,
        completed: true,
        timestamp: Date.now(),
      }));
      navigate('/initial-results');
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      navigate('/');
    }
  };

  const question = initialQuestions[currentQuestion];
  const hasAnswer = !!responses[question.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 chamfer-sm bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-serif font-semibold block">Initial Personality Hypothesis</span>
              <span className="text-xs text-muted-foreground">Provides a preliminary analysis of your personality tendencies</span>
            </div>
          </div>
          {user && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Progress auto-saved
            </span>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="container max-w-3xl py-6 px-4">
        <div className="mb-2 text-sm text-muted-foreground">
          20 questions to understand you and your personality tendencies
        </div>
        <ProgressBar current={currentQuestion + 1} total={initialQuestions.length} />
      </div>

      {/* Question */}
      <main className="flex-1 container max-w-3xl px-4 pb-8">
        <QuestionCard
          question={question.question}
          options={question.options}
          selectedValue={responses[question.id]}
          onSelect={handleSelect}
        />
      </main>

      {/* Navigation */}
      <footer className="border-t border-border p-4 md:p-6 bg-card">
        <div className="container max-w-3xl flex justify-between">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!hasAnswer}
            className={hasAnswer ? 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-full' : 'rounded-full'}
          >
            {currentQuestion === initialQuestions.length - 1 ? 'See Results' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
