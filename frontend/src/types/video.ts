export interface Video {
  id: string;
  title: string;
  coverUrl: string;
  length: string;
  author: {
    name: string;
    id: string;
  };
  stats: {
    likes: number;
    views: number;
    comments: number;
  };
  createdAt: string;
}

export type SortBy = 'likes' | 'date';
export type DateFilter = 'all' | 'today' | 'week' | 'month';
