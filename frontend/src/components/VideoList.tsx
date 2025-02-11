import { useState } from 'react'
interface SelectProps<T extends string> extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: T) => void;
  value?: T;
}

function Select<T extends string>({ children, value, onValueChange, ...props }: SelectProps<T>) {
  return (
    <select 
      {...props} 
      value={value}
      onChange={(e) => onValueChange?.(e.target.value as T)}
      className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 ${props.className || ''}`}
    >
      {children}
    </select>
  )
}

function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return children;
}

function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return <option value={value}>{children}</option>
}

function SelectValue({ placeholder }: { placeholder: string }) {
  return placeholder;
}
import { 
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { ThumbsUp, Eye, MessageCircle, Clock } from "lucide-react"
import { Video, SortBy, DateFilter } from '../types/video'
import { format } from 'date-fns'

interface VideoListProps {
  videos: Video[];
}

export function VideoList({ videos }: VideoListProps) {
  const [sortBy, setSortBy] = useState<SortBy>('likes')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const filteredAndSortedVideos = videos
    .filter(video => {
      if (!video.createdAt) return true;
      try {
        const date = new Date(video.createdAt)
        const now = new Date()
        switch (dateFilter) {
          case 'today':
            return date.getDate() === now.getDate()
          case 'week':
            const weekAgo = new Date()
            weekAgo.setDate(now.getDate() - 7)
            return date > weekAgo
          case 'month':
            const monthAgo = new Date()
            monthAgo.setMonth(now.getMonth() - 1)
            return date > monthAgo
          default:
            return true
        }
      } catch (error) {
        console.error('Invalid date:', video.createdAt)
        return true
      }
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.stats.likes - a.stats.likes
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likes">Most Liked</SelectItem>
            <SelectItem value="date">Latest</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedVideos.map(video => (
          <Card key={video.id}>
            <CardHeader className="relative p-0">
              <img 
                src={video.coverUrl} 
                alt={video.title}
                className="w-full aspect-video object-cover rounded-t-lg"
              />
              <span className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 text-sm rounded flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {video.length}
              </span>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <span>{video.author.name}</span>
                <span className="mx-2">•</span>
                <span>{format(new Date(video.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {(video.stats?.likes ?? 0).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {(video.stats?.views ?? 0).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {(video.stats?.comments ?? 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
