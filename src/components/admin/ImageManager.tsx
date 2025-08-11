import React, { useState, useEffect } from 'react'

interface Tour {
  id: string
  slug: string
  title: string
  affiliate_url: string
  image_count?: number
}

interface SyncLog {
  id: string
  sync_type: string
  started_at: string
  completed_at: string | null
  tours_processed: number
  images_added: number
  images_updated: number
  duplicates_found: number
  status: string
  errors_count: number
}

interface TourImage {
  id: string
  image_url: string
  image_alt: string
  image_type: string
  is_duplicate: boolean
  validation_status: string
  display_order: number
}

export default function ImageManager() {
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTour, setSelectedTour] = useState<string>('')
  const [tourImages, setTourImages] = useState<TourImage[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'sync' | 'images' | 'logs'>('sync')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTours()
    fetchSyncLogs()
  }, [])

  useEffect(() => {
    if (selectedTour) {
      fetchTourImages(selectedTour)
    }
  }, [selectedTour])

  const fetchTours = async () => {
    try {
      const response = await fetch('/api/tours?limit=100')
      const data = await response.json()
      setTours(data.items || [])
    } catch (error) {
      console.error('Failed to fetch tours:', error)
    }
  }

  const fetchTourImages = async (tourSlug: string) => {
    try {
      const response = await fetch(`/api/admin/sync-images?tour=${tourSlug}`)
      const data = await response.json()
      setTourImages(data.images || [])
    } catch (error) {
      console.error('Failed to fetch tour images:', error)
    }
  }

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch('/api/admin/sync-images')
      const data = await response.json()
      setSyncLogs(data.syncLogs || [])
    } catch (error) {
      console.error('Failed to fetch sync logs:', error)
    }
  }

  const syncSingleTour = async (tourSlug: string) => {
    setIsSyncing(true)
    setSyncMessage(`Syncing images for ${tourSlug}...`)
    
    try {
      const response = await fetch('/api/admin/sync-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your admin token here
          // 'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ tourSlug })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSyncMessage(`Success: ${data.message}`)
        await fetchTourImages(tourSlug)
        await fetchSyncLogs()
      } else {
        setSyncMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setSyncMessage(`Error: ${error}`)
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncMessage(''), 5000)
    }
  }

  const syncAllTours = async () => {
    if (!confirm('This will sync images for all tours. This may take several minutes. Continue?')) {
      return
    }
    
    setIsSyncing(true)
    setSyncMessage('Syncing all tour images... This may take several minutes.')
    
    try {
      const response = await fetch('/api/admin/sync-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your admin token here
          // 'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ fullSync: true })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSyncMessage(`Success: Processed ${data.stats.toursProcessed} tours, added ${data.stats.imagesAdded} images`)
        await fetchSyncLogs()
      } else {
        setSyncMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setSyncMessage(`Error: ${error}`)
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncMessage(''), 10000)
    }
  }

  const filteredTours = tours.filter(tour => 
    tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tour.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Images
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            View Images
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Logs
          </button>
        </nav>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`mb-4 p-4 rounded-md ${
          syncMessage.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <div>
          <div className="mb-6">
            <button
              onClick={syncAllTours}
              disabled={isSyncing}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Syncing...' : 'Sync All Tours'}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              This will fetch and sync images for all active tours from BNAdventure.
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Sync Individual Tour</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTours.map(tour => (
                <div key={tour.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">{tour.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">Slug: {tour.slug}</p>
                  <button
                    onClick={() => syncSingleTour(tour.slug)}
                    disabled={isSyncing}
                    className="w-full bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    Sync Images
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div>
          <div className="mb-4">
            <select
              value={selectedTour}
              onChange={(e) => setSelectedTour(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select a tour to view images</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.slug}>
                  {tour.title}
                </option>
              ))}
            </select>
          </div>

          {selectedTour && tourImages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Images for {tours.find(t => t.slug === selectedTour)?.title}
              </h3>
              
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {tourImages.map(image => (
                  <div key={image.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                      <img
                        src={image.image_url}
                        alt={image.image_alt}
                        className="object-cover w-full h-48"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          image.image_type === 'primary'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {image.image_type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          image.validation_status === 'valid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {image.validation_status}
                        </span>
                      </div>
                      {image.is_duplicate && (
                        <p className="text-xs text-orange-600">Duplicate</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">Order: {image.display_order}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTour && tourImages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No images found for this tour. Try syncing first.
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Sync Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Images Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duplicates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syncLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.sync_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : log.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.tours_processed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.images_added}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.duplicates_found}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.errors_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}