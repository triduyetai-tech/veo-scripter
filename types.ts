
export interface Scene {
  id: number;
  description: string;
  generatedPrompt: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  isLoading: boolean;
  error: string | null;
}