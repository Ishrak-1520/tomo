export type RiskTier = 'high' | 'moderate' | 'low' | 'none';

export interface PatternMatchResult {
  isRisk: boolean;
  tier: RiskTier;
  matchedPattern?: string;
  category?: string;
}

// A simple dictionary of crisis patterns in English, Bangla, and Banglish.
// This is not exhaustive; in production, this should be maintained outside code if possible.
const CRISIS_PATTERNS = [
  // English
  { regex: /\b(kill myself|commit suicide|end my life|want to die|take my own life|sleep forever and never wake up)\b/i, tier: 'high', category: 'explicit_suicidal_intent' },
  { regex: /\b(better off dead|no reason to live|can't go on anymore|better off without me)\b/i, tier: 'high', category: 'hopelessness' },
  { regex: /\b(cut myself|hurt myself|burn myself|harm myself)\b/i, tier: 'high', category: 'self_harm' },
  { regex: /\b(kill him|kill her|kill them|hurt them)\b/i, tier: 'high', category: 'harm_to_others' },
  
  // Bangla Script
  { regex: /(আত্মহত্যা|মরে যেতে চাই|বেঁচে থাকার কোন অর্থ নেই|নিজেকে শেষ করে দিতে চাই|মরতে চাই|খুন করে ফেলতে ইচ্ছা)/u, tier: 'high', category: 'explicit_suicidal_intent_bangla' },
  { regex: /(নিজের ক্ষতি|হাত কাটতে)/u, tier: 'high', category: 'self_harm_bangla' },
  { regex: /(ওকে মেরে ফেলবো|ওকে খুন করবো)/u, tier: 'high', category: 'harm_to_others_bangla' },

  // Banglish
  { regex: /\b(more jete chai|morte chai|morte iccha|sucide korbo|suicide korbo|nijeke (sesh|shesh) kore (dibo|feli)|bachar iccha nai|more jabo|nijeke khun kore)\b/i, tier: 'high', category: 'explicit_suicidal_intent_banglish' },
  { regex: /\b(hat katbo|nizer khoti)\b/i, tier: 'high', category: 'self_harm_banglish' },
  { regex: /\b(oke mere felbo|khun korbo)\b/i, tier: 'high', category: 'harm_to_others_banglish' }
];

export function checkPatterns(message: string): PatternMatchResult {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.regex.test(message)) {
      return {
        isRisk: true,
        tier: pattern.tier as RiskTier,
        matchedPattern: pattern.regex.toString(),
        category: pattern.category
      };
    }
  }

  return { isRisk: false, tier: 'none' };
}
