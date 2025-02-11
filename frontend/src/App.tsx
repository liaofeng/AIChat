import { useState, useEffect } from 'react'
import { SearchBox } from './components/SearchBox'
import { VideoList } from './components/VideoList'
import { AdminPage } from './components/AdminPage'
import { Navbar } from './components/Navbar'
import { Video } from './types/video'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/videos?page=${currentPage}&per_page=10`
        )
        if (!response.ok) throw new Error('Failed to fetch videos')
        const data = await response.json()
        setVideos(data.videos)
        setTotalPages(Math.ceil(data.total / data.per_page))
      } catch (error) {
        console.error('Error fetching videos:', error)
      }
    }
    fetchVideos()
  }, [currentPage])
  const [isAdminMode, setIsAdminMode] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // We'll implement the actual API call in a later step
    console.log('Searching for:', query)
  }

  const handleUpdateVideo = async (videoId: string, updatedVideo: Partial<Video>) => {
    try {
      const existingVideo = videos.find(v => v.id === videoId)
      if (!existingVideo) throw new Error('Video not found')
      
      const fullVideo = {
        ...existingVideo,
        ...updatedVideo
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullVideo)
      })
      if (!response.ok) throw new Error('Failed to update video')
      const data = await response.json()
      setVideos(videos.map(video => video.id === videoId ? data : video))
    } catch (error) {
      throw error
    }
  }

  const handleDeleteVideo = (videoId: string) => {
    setVideos(videos.filter(video => video.id !== videoId))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <Navbar 
            isAdminMode={isAdminMode} 
            onModeChange={setIsAdminMode} 
          />
          {!isAdminMode && <SearchBox onSearch={handleSearch} />}
        </div>
      </header>
      <main className="container mx-auto py-8">
        {!isAdminMode ? (
          <>
            {searchQuery && (
              <p className="text-muted-foreground mb-4">
                Search results for: {searchQuery}
              </p>
            )}
            <VideoList videos={videos} />
          </>
        ) : (
          <AdminPage 
            videos={videos}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        )}
      </main>
    </div>
  )
}

export default App
