export interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  about: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  recommendations: number;
  connections: number;
  url?: string;
  score: number;
  analysis: string;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface Education {
  insitutution: string;
  degree: string;
  field: string;
  duration: string;
}

export interface ScoreResult {
  score: number;
  analysis: string;
}
