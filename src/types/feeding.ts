export interface FeedingRecord {
  id: string;
  timestamp: string; // ISO 8601
  grams: number;
  humidify: boolean;
  source: "manual" | "scheduled";
}

export interface AnalysisRecord {
  id: string;
  timestamp: string; // ISO 8601
  imageBase64: string; // miniatura JPEG
  analysisText?: string;
  analysisError?: string;
}

export interface UserProfile {
  username: string;
  createdAt: string;
}
