"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditAlertDialog } from "@/components/edit-alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { deleteWatchlistItem } from "@/app/actions"
import { Pencil, Trash2, Search, Bell, Plus, BellOff, Zap, Target, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SwipeableCard } from "@/components/swipeable-card"
import { CountdownTimer } from "@/components/countdown-timer"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabaseClient"

// Function to get city and state from ZIP code
function getCityStateFromZip(zip: string): { city: string; state: string } {
  // This would normally be an API call or database lookup
  // For demo purposes, we'll use a simple mapping
  const zipMappings: Record<string, { city: string; state: string }> = {
    "10001": { city: "New York", state: "NY" },
    "90210": { city: "Beverly Hills", state: "CA" },
    "60601": { city: "Chicago", state: "IL" },
    "75001": { city: "Dallas", state: "TX" },
    "33101": { city: "Miami", state: "FL" },
    "91765": { city: "Diamond Bar", state: "CA" },
    // Add more as needed
  }

  return zipMappings[zip] || { city: "Unknown", state: "??" }
}

interface Alert {
  id: string
  keyword: string
  min_price?: number
  max_price: number
  zip: string
  radius: number
  marketplace?: string
  category?: string
  created_at?: string
  muted?: boolean
  hasNewListings?: boolean
  newListingsCount?: number
  user_id: string
}

type MarketplaceFilter = "craigslist" | "facebook" | "offerup"

export default function AlertsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, status } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null)
  const [deleteAlertKeyword, setDeleteAlertKeyword] = useState<string>("")
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>("craigslist")
  const deleteInProgressRef = useRef(false)
  const alertDialogOpenRef = useRef(false)
  const [searchTermCounts, setSearchTermCounts] = useState<Record<MarketplaceFilter, number>>({
    craigslist: 0,
    facebook: 0,
    offerup: 0,
  })
  // Add polling interval reference
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fetchAttempts, setFetchAttempts] = useState(0)

  // Get Supabase client
  const supabase = getSupabaseClient()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Handle alert update from edit dialog
  const handleAlertUpdated = useCallback((updatedAlert: Alert) => {
    setAlerts((currentAlerts) => currentAlerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)))
  }, [])

  // Handle view listings click
  const handleViewListings = (alert: Alert) => {
    // Navigate to the listings page with the alert parameters
    router.push(`/listings/${alert.id}`)

    // Mark as viewed (remove new listings indicator)
    if (alert.hasNewListings) {
      setAlerts((currentAlerts) =>
        currentAlerts.map((a) => (a.id === alert.id ? { ...a, hasNewListings: false, newListingsCount: 0 } : a)),
      )
    }
  }

  // Handle add new search term
  const handleAddNewSearchTerm = () => {
    // Navigate to target page with the current marketplace filter
    router.push(`/target?marketplace=${marketplaceFilter}`)
  }

  // Toggle notification mute status
  const toggleNotificationMute = (alertId: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) => (alert.id === alertId ? { ...alert, muted: !alert.muted } : alert)),
    )
  }

  // Apply filters and sorting
  useEffect(() => {
    let result = [...alerts]

    // Apply marketplace filter
    result = result.filter((alert) => {
      // If the alert has no marketplace specified, don't show it in any filter
      if (!alert.marketplace) return false

      // Only show alerts that match the selected marketplace
      return alert.marketplace === marketplaceFilter
    })

    // Apply sorting - default to newest first
    result.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredAlerts(result)
  }, [alerts, marketplaceFilter])

  // Count alerts by marketplace
  useEffect(() => {
    const counts: Record<MarketplaceFilter, number> = {
      craigslist: 0,
      facebook: 0,
      offerup: 0,
    }

    alerts.forEach((alert) => {
      const market = alert.marketplace as MarketplaceFilter
      if (market && counts[market] !== undefined) {
        counts[market]++
      }
    })

    setSearchTermCounts(counts)
  }, [alerts])

  // Function to fetch alerts data
  const fetchAlertsData = useCallback(async () => {
    if (!user) return

    try {
      console.log("Fetching alerts data for user:", user.id)
      setLoading(true)

      // Fetch data from Supabase
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching watchlist data:", error)
        setError("Failed to load your watchlist items. Please try again.")
        return
      }

      console.log("Data fetched:", data)

      if (!data || data.length === 0) {
        setAlerts([])
        setLoading(false)
        return
      }

      // Add random hasNewListings for demo
      const alertsWithNewListings = data.map((alert) => ({
        ...alert,
        muted: false, // Default to notifications enabled
        hasNewListings: Math.random() > 0.5, // Randomly show new listings indicator for demo
        newListingsCount: Math.floor(Math.random() * 10) + 1, // Random number of new listings (1-10)
      }))

      setAlerts(alertsWithNewListings)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching alerts:", err)
      setError(err.message || "Failed to load search terms")
    } finally {
      setLoading(false)
      setFetchAttempts((prev) => prev + 1)
    }
  }, [user, supabase])

  // Initial data fetch and set up polling
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchAlertsData()

      // Set up polling every 10 seconds
      pollingIntervalRef.current = setInterval(fetchAlertsData, 10000)

      // Clean up on unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [fetchAlertsData, user])

  // Retry fetch if initial attempt fails
  useEffect(() => {
    if (error && fetchAttempts < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Retry attempt ${fetchAttempts + 1} for fetching alerts data`)
        fetchAlertsData()
      }, 2000)

      return () => clearTimeout(retryTimer)
    }
  }, [error, fetchAttempts, fetchAlertsData])

  // Track when the alert dialog opens/closes
  useEffect(() => {
    alertDialogOpenRef.current = !!deleteAlertId
  }, [deleteAlertId])

  // Open delete confirmation dialog
  const confirmDelete = (id: string, keyword: string) => {
    setDeleteAlertId(id)
    setDeleteAlertKeyword(keyword)
    setShowDeleteConfirm(true)
  }

  // Handle delete alert
  const handleDeleteAlert = async () => {
    if (isDeleting || !deleteAlertId) return

    setIsDeleting(true)
    deleteInProgressRef.current = true
    setShowDeleteConfirm(false)

    try {
      // Find the alert to delete
      const alertToDelete = alerts.find((alert) => alert.id === deleteAlertId)
      const idToDelete = deleteAlertId

      // Remove from UI immediately
      setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== idToDelete))

      // Show optimistic toast
      toast({
        title: "Deleting Search Term...",
        description: alertToDelete ? `Removing "${alertToDelete.keyword}"` : "Removing search term",
        duration: 2000,
      })

      // Actually delete from database
      const result = await deleteWatchlistItem(idToDelete)

      if (!result.success) {
        // If delete fails, restore the alert
        if (alertToDelete) {
          setAlerts((currentAlerts) => [...currentAlerts, alertToDelete])
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete search term",
          duration: 3000,
        })
      } else {
        toast({
          title: "Search Term Deleted",
          description: alertToDelete ? `"${alertToDelete.keyword}" has been removed` : "Search term removed",
          duration: 3000,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An unexpected error occurred",
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
      setDeleteAlertId(null)
      // Use a small timeout to prevent race conditions with realtime events
      setTimeout(() => {
        deleteInProgressRef.current = false
      }, 500)
    }
  }

  // Handle swipe left (delete)
  const handleSwipeLeft = (alertId: string) => {
    const alertToDelete = alerts.find((alert) => alert.id === alertId)
    if (alertToDelete) {
      confirmDelete(alertId, alertToDelete.keyword)
    }
  }

  // Handle swipe right (view)
  const handleSwipeRight = (alert: Alert) => {
    handleViewListings(alert)
  }

  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get marketplace color class
  const getMarketplaceColorClass = (marketplaceOption: MarketplaceFilter): string => {
    switch (marketplaceOption) {
      case "craigslist":
        return "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/50"
      case "facebook":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
      case "offerup":
        return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
    }
  }

  // Get marketplace icon
  const getMarketplaceIcon = (marketplaceOption: MarketplaceFilter) => {
    switch (marketplaceOption) {
      case "craigslist":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
        )
      case "facebook":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        )
      case "offerup":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
          </svg>
        )
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "electronics":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="14" x2="23" y2="14"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="14" x2="4" y2="14"></line>
          </svg>
        )
      case "furniture":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="16" height="6" rx="2"></rect>
            <rect x="4" y="14" width="16" height="6" rx="2"></rect>
            <line x1="6" y1="10" x2="6" y2="14"></line>
            <line x1="18" y1="10" x2="18" y2="14"></line>
          </svg>
        )
      case "clothing":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"></path>
          </svg>
        )
      case "vehicles":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect>
            <circle cx="7" cy="18" r="2"></circle>
            <circle cx="17" cy="18" r="2"></circle>
          </svg>
        )
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
          </svg>
        )
    }
  }

  // Render notification bell with mute status
  const renderNotificationBell = (muted: boolean) => {
    if (muted) {
      return (
        <div className="relative">
          <BellOff className="h-4 w-4 text-red-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-0.5 bg-red-500 transform rotate-45 translate-y-0"></div>
          </div>
        </div>
      )
    } else {
      return <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
  }

  // Generate a random future date for countdown demo
  const getRandomFutureDate = () => {
    const now = new Date()
    // Random minutes between 10 and 120
    const minutesToAdd = Math.floor(Math.random() * 110) + 10
    now.setMinutes(now.getMinutes() + minutesToAdd)
    return now
  }

  if (status === "loading") {
    return (
      <div className="py-8 max-w-md mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8 max-w-md mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Loading your targets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-center mb-2"
      >
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <Target className="h-6 w-6 mr-2 text-primary" />
          <span>Your Targets</span>
        </h1>
      </motion.div>

      {/* Marketplace filter tabs - Updated to match target page style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-4"
      >
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1 bg-secondary rounded-lg flex-wrap justify-center">
            <button
              onClick={() => setMarketplaceFilter("craigslist")}
              className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                marketplaceFilter === "craigslist"
                  ? getMarketplaceColorClass("craigslist")
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {getMarketplaceIcon("craigslist")}
              Craigslist
              <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.craigslist}/5)</span>
            </button>
            <button
              onClick={() => setMarketplaceFilter("facebook")}
              className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                marketplaceFilter === "facebook"
                  ? getMarketplaceColorClass("facebook")
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {getMarketplaceIcon("facebook")}
              FB Marketplace
              <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.facebook}/5)</span>
            </button>
            <button
              onClick={() => setMarketplaceFilter("offerup")}
              className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                marketplaceFilter === "offerup"
                  ? getMarketplaceColorClass("offerup")
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {getMarketplaceIcon("offerup")}
              OfferUp
              <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.offerup}/5)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add New button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex justify-end mb-4"
      >
        {searchTermCounts[marketplaceFilter] < 5 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-primary hover:text-primary-foreground hover:bg-primary"
            onClick={handleAddNewSearchTerm}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Target
          </Button>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/30 dark:border-red-900 dark:text-red-300"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </motion.div>
      )}

      {filteredAlerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center py-8 bg-secondary/50 rounded-lg border border-border"
        >
          <div className="flex flex-col items-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No targets set for {marketplaceFilter}.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleAddNewSearchTerm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Target
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6 relative">
          <AnimatePresence>
            {filteredAlerts.map((alert, index) => {
              // Get city and state from ZIP
              const { city, state } = getCityStateFromZip(alert.zip)
              const marketplaceType = (alert.marketplace as MarketplaceFilter) || "craigslist"

              // Random future date for countdown demo
              const futureDate = getRandomFutureDate()

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="stacked-cards"
                >
                  <SwipeableCard
                    onSwipeLeft={() => handleSwipeLeft(alert.id)}
                    onSwipeRight={() => handleSwipeRight(alert)}
                  >
                    <Card className="discord-card overflow-visible">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {getMarketplaceIcon(marketplaceType)}
                            <h3 className="text-base font-medium">{alert.keyword}</h3>
                            {alert.hasNewListings && alert.newListingsCount && alert.newListingsCount > 0 && (
                              <div className="deal-badge-hot ml-2">
                                <Zap className="h-3 w-3 mr-1" />
                                {alert.newListingsCount} new
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => toggleNotificationMute(alert.id)}
                          >
                            {renderNotificationBell(!!alert.muted)}
                            <span className="sr-only">
                              {alert.muted ? "Enable notifications" : "Mute notifications"}
                            </span>
                          </Button>
                        </div>
                        <div className="flex flex-col gap-1 text-sm mt-2">
                          <div className="flex justify-between items-center">
                            {alert.min_price !== undefined && alert.min_price > 0 ? (
                              <p className="font-medium">
                                Range: {formatPrice(alert.min_price)} - {formatPrice(alert.max_price)}
                              </p>
                            ) : (
                              <p className="font-medium">Up to {formatPrice(alert.max_price)}</p>
                            )}
                            <CountdownTimer endTime={futureDate} className="ml-2" />
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {getCategoryIcon(alert.category || "all")}
                            <span className="capitalize">
                              {alert.category === "all" ? "All Categories" : alert.category}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {city}, {state} ({alert.radius || 1} mile radius)
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditAlert(alert)}
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => confirmDelete(alert.id, alert.keyword)}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs flex items-center gap-1 text-primary hover:text-primary-foreground hover:bg-primary"
                              onClick={() => handleViewListings(alert)}
                            >
                              <Search className="h-3 w-3" />
                              <span>View</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeableCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Alert Dialog */}
      {editAlert && (
        <EditAlertDialog
          alert={editAlert}
          open={!!editAlert}
          onOpenChange={(open) => {
            if (!open) setEditAlert(null)
          }}
          onAlertUpdated={handleAlertUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Target</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAlertKeyword}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlert} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
