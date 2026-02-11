export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  originalFolder?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
