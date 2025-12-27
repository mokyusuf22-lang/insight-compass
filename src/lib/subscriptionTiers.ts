// Subscription tier configuration for frontend use
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number; // in pence
  priceDisplay: string;
  features: string[];
  limitations?: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: '£0',
    features: [
      'Limited AI coaching',
      'Limited assessments',
      'View Skill Path overview',
    ],
    limitations: [
      'No Skill Path regeneration',
      'Limited coaching responses',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4900,
    priceDisplay: '£49',
    features: [
      'Full AI coaching',
      'Up to 3 core assessments',
      'One active Skill Path',
      'Skill Path regeneration',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 14900,
    priceDisplay: '£149',
    features: [
      'AI + human coaching',
      'Full personality profile',
      'Unlimited assessments',
      'Priority Skill Path regeneration',
      'Advanced coaching insights',
    ],
  },
};

export function canRegenerateSkillPath(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'premium';
}

export function hasFullAICoaching(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'premium';
}

export function hasHumanCoaching(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}

export function hasUnlimitedAssessments(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}

export function getRequiredTierForFeature(feature: string): SubscriptionTier {
  const premiumFeatures = ['human_coaching', 'advanced_insights', 'unlimited_assessments'];
  const proFeatures = ['skill_path_regeneration', 'full_ai_coaching'];
  
  if (premiumFeatures.includes(feature)) return 'premium';
  if (proFeatures.includes(feature)) return 'pro';
  return 'free';
}
