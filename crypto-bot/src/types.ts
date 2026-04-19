export interface Tweet {
  id: string;
  author: string;
  created_at: string;
  text: string;
  url?: string;
  is_reply?: boolean;
  reply_to?: string;
}

export interface MentionedProject {
  name: string;
  ticker?: string;
  chain?: string;
  contract_address?: string;
}

export interface Classification {
  tweet_id: string;
  is_negative: boolean;
  confidence: number;
  reason: string;
  mentioned_projects: MentionedProject[];
  actionable: boolean;
  actionable_reason: string;
}

export interface ClassifiedTweet {
  tweet: Tweet;
  classification: Classification;
}
