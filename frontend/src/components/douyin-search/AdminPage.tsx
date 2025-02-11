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

import { v4 as uuid } from 'uuid';

interface AdminPageProps {
  videos: Video[];
  onUpdateVideo: (videoId: string, updatedVideo: Partial<Video>) => void;
  onDeleteVideo: (videoId: string) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  onRefresh: () => void;
}

export function AdminPage({ videos, onUpdateVideo, onDeleteVideo, currentPage, setCurrentPage, totalPages, onRefresh }: AdminPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (formData: FormData) => {
    try {
      const newVideo = {
        title: formData.get('title') as string,
        coverUrl: formData.get('coverUrl') as string,
        length: formData.get('length') as string,
        author: {
          name: formData.get('authorName') as string,
          id: uuid(),
        },
        stats: {
          likes: parseInt(formData.get('likes') as string) || 0,
          views: parseInt(formData.get('views') as string) || 0,
          comments: parseInt(formData.get('comments') as string) || 0,
        },
        createdAt: new Date().toISOString(),
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo)
      })
      
      if (!response.ok) throw new Error('Failed to create video')
      setIsCreating(false)
      setCurrentPage(1) // Reset to first page after creating
      onRefresh() // Refresh the video list
    } catch (error) {
      alert('Failed to create video. Please try again.')
    }
  }

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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Video Management</h2>
          <Button onClick={() => setIsCreating(true)}>Create Video</Button>
        </div>
        
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Video</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="create-form" onSubmit={(e) => {
                e.preventDefault()
                handleCreate(new FormData(e.currentTarget))
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input name="title" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cover URL</label>
                    <Input name="coverUrl" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length</label>
                    <Input name="length" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Author Name</label>
                    <Input name="authorName" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Likes</label>
                    <Input name="likes" type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Views</label>
                    <Input name="views" type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comments</label>
                    <Input name="comments" type="number" defaultValue="0" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="submit">Create</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
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

      <div className="flex justify-center gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="py-2">Page {currentPage}</span>
        <Button 
          variant="outline" 
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
      </div>
    </div>
  )
}
