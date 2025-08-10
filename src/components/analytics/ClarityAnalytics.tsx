import { useEffect } from 'react'

interface ClarityAnalyticsProps {
  projectId?: string
}

export default function ClarityAnalytics({ projectId }: ClarityAnalyticsProps) {
  useEffect(() => {
    // Get project ID from props or environment variable
    const clarityProjectId = projectId || import.meta.env.PUBLIC_CLARITY_PROJECT_ID
    
    if (!clarityProjectId) {
      console.warn('Clarity project ID not found. Skipping initialization.')
      return
    }

    // Dynamically import Clarity only on client side
    import('@microsoft/clarity').then((ClarityModule) => {
      const Clarity = ClarityModule.default
      try {
        // Initialize Clarity
        Clarity.init(clarityProjectId)
      
      // Optional: Set custom tags for better filtering
      // You can add custom tags based on your needs
      Clarity.setTag('site', 'tours.albaniavisit.com')
      Clarity.setTag('version', '1.0.0')
      
      // Optional: Identify logged-in users (if you have user auth)
      // const userId = getUserId() // Replace with your actual user ID logic
      // if (userId) {
      //   Clarity.identify(userId)
      // }
      
      } catch (error) {
        console.error('Failed to initialize Microsoft Clarity:', error)
      }
    }).catch(error => {
      console.error('Failed to load Microsoft Clarity module:', error)
    })
  }, [projectId])

  // This component doesn't render anything
  return null
}