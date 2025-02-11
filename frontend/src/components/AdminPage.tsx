import { useState } from 'react'
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Video } from '../types/video'
import { format } from 'date-fns'

interface AdminPageProps {
  videos: Video[];
  onUpdateVideo: (videoId: string, updatedVideo: Partial<Video>) => void;
  onDeleteVideo: (videoId: string) => void;
}

export function AdminPage({ videos, onUpdateVideo, onDeleteVideo }: AdminPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // No need for useEffect logging

  const handleEdit = (video: Video) => {
    console.log('Editing video:', video)
    console.log('Setting editingId to:', video.id)
    setEditingId(video.id)
    console.log('EditingId after set:', video.id)
    console.log('EditingVideo:', videos.find(v => v.id === video.id))
  }

  const handleSave = async (video: Video, formData: FormData) => {
    try {
      const updatedVideo = {
        ...video,
        title: formData.get('title') as string,
        coverUrl: formData.get('coverUrl') as string,
        length: formData.get('length') as string,
        author: {
          ...video.author,
          name: formData.get('authorName') as string,
        },
        stats: {
          ...video.stats,
          likes: parseInt(formData.get('likes') as string),
          views: parseInt(formData.get('views') as string),
          comments: parseInt(formData.get('comments') as string),
        }
      }
      await onUpdateVideo(video.id, updatedVideo)
      setEditingId(null)
    } catch (error) {
      alert('Failed to update video. Please try again.')
    }
  }

  return (
    <div className="relative" data-editing-id={editingId}>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Video Management</h2>
        {/* Removed EditVideoModal - implementing inline editing */}
        {videos.map(video => (
        <Card key={video.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {editingId === video.id ? (
                <Input 
                  name="title" 
                  defaultValue={video.title} 
                  className="max-w-md"
                  form={`edit-form-${video.id}`}
                />
              ) : (
                <span>{video.title}</span>
              )}
              <div className="space-x-2">
                {editingId === video.id ? (
                  <>
                    <Button 
                      variant="default"
                      onClick={(e) => {
                        e.preventDefault();
                        const form = document.getElementById(`edit-form-${video.id}`) as HTMLFormElement;
                        handleSave(video, new FormData(form));
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleEdit(video)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => onDeleteVideo(video.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id={`edit-form-${video.id}`} className="space-y-4">
              {editingId === video.id ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cover URL</label>
                    <Input name="coverUrl" defaultValue={video.coverUrl} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length</label>
                    <Input name="length" defaultValue={video.length} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Author Name</label>
                    <Input name="authorName" defaultValue={video.author.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Likes</label>
                    <Input 
                      name="likes" 
                      type="number" 
                      defaultValue={video.stats.likes} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Views</label>
                    <Input 
                      name="views" 
                      type="number" 
                      defaultValue={video.stats.views} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comments</label>
                    <Input 
                      name="comments" 
                      type="number" 
                      defaultValue={video.stats.comments} 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Cover URL:</strong> {video.coverUrl}</p>
                  <p><strong>Length:</strong> {video.length}</p>
                  <p><strong>Author:</strong> {video.author.name}</p>
                  <p><strong>Created:</strong> {format(new Date(video.createdAt), 'PPP')}</p>
                  <p><strong>Stats:</strong> {video.stats.likes} likes, {video.stats.views} views, {video.stats.comments} comments</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  )
}
