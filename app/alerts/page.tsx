"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditAlertDialog } from "@/components/edit-alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { deleteWatchlistItem } from "@/app/actions"
import { Pencil, Trash2, Search, Bell, Plus, BellOff } from "lucide-react"
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
  created_at?: string
  muted?: boolean
  hasNewListings?: boolean
  newListingsCount?: number
}

type MarketplaceFilter = "craigslist" | "facebook" | "offerup"
type SortOption = "price-low" | "price-high" | "newest" | "oldest"

export default function AlertsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null)
  const [deleteAlertKeyword, setDeleteAlertKeyword] = useState<string>("")
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>("craigslist")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
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
    // Navigate to home page with the current marketplace filter
    router.push(`/?marketplace=${marketplaceFilter}`)
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
    result.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())

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
    try {
      console.log("Fetching alerts data...")

      // Fetch data from Supabase
      const { data, error } = await supabase.from("watchlist").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      console.log("Data fetched:", data)

      // Add random hasNewListings for demo
      const alertsWithNewListings = data.map((alert) => ({
        ...alert,
        muted: false, // Default to notifications enabled
        hasNewListings: Math.random() > 0.5, // Randomly show new listings indicator for demo
        newListingsCount: Math.floor(Math.random() * 10) + 1, // Random number of new listings (1-10)
      }))

      setAlerts(alertsWithNewListings)
      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching alerts:", err)
      setError(err.message || "Failed to load search terms")
      setLoading(false)
    }
  }, [])

  // Initial data fetch and set up polling
  useEffect(() => {
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
  }, [fetchAlertsData])

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
        // If delete fails, restore the alert and show error
        if (alertToDelete) {
          setAlerts((currentAlerts) => [...currentAlerts, alertToDelete])
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete search term",
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

  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get marketplace tab style
  const getMarketplaceTabStyle = (marketplace: MarketplaceFilter) => {
    switch (marketplace) {
      case "craigslist":
        return marketplaceFilter === marketplace
          ? "bg-purple-100 text-purple-800 border-b-2 border-purple-500"
          : "text-purple-600 hover:text-purple-800 hover:bg-purple-50"
      case "facebook":
        return marketplaceFilter === marketplace
          ? "bg-blue-100 text-blue-800 border-b-2 border-blue-500"
          : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
      case "offerup":
        return marketplaceFilter === marketplace
          ? "bg-green-100 text-green-800 border-b-2 border-green-500"
          : "text-green-600 hover:text-green-800 hover:bg-green-50"
      default:
        return ""
    }
  }

  // Get marketplace icon
  const getMarketplaceIcon = (marketplaceOption: MarketplaceFilter) => {
    switch (marketplaceOption) {
      case "craigslist":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
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
            className="h-4 w-4 mr-1"
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
            className="h-4 w-4 mr-1"
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
      return <Bell className="h-4 w-4 text-green-600" />
    }
  }

  if (loading) {
    return (
      <div className="py-8 max-w-md mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Loading search terms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold">Saved Search Terms</h1>
      </div>

      {/* Marketplace filter tabs */}
      <div className="mb-4 border-b">
        <div className="flex">
          <button
            onClick={() => setMarketplaceFilter("craigslist")}
            className={`flex items-center justify-center py-2 px-3 text-center text-sm font-medium ${getMarketplaceTabStyle(
              "craigslist",
            )}`}
          >
            {getMarketplaceIcon("craigslist")}
            Craigslist
            <span className="ml-1 text-xs opacity-75">({searchTermCounts.craigslist}/5)</span>
          </button>
          <button
            onClick={() => setMarketplaceFilter("facebook")}
            className={`flex items-center justify-center py-2 px-3 text-center text-sm font-medium ${getMarketplaceTabStyle(
              "facebook",
            )}`}
          >
            {getMarketplaceIcon("facebook")}
            FB Marketplace
            <span className="ml-1 text-xs opacity-75">({searchTermCounts.facebook}/5)</span>
          </button>
          <button
            onClick={() => setMarketplaceFilter("offerup")}
            className={`flex items-center justify-center py-2 px-3 text-center text-sm font-medium ${getMarketplaceTabStyle(
              "offerup",
            )}`}
          >
            {getMarketplaceIcon("offerup")}
            OfferUp
            <span className="ml-1 text-xs opacity-75">({searchTermCounts.offerup}/5)</span>
          </button>
        </div>
      </div>

      {/* Add New button */}
      <div className="flex justify-end mb-4">
        {searchTermCounts[marketplaceFilter] < 5 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-primary hover:text-primary-foreground hover:bg-primary"
            onClick={handleAddNewSearchTerm}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add New
          </Button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No search terms found for {marketplaceFilter}.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleAddNewSearchTerm}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Search Term
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            // Get city and state from ZIP
            const { city, state } = getCityStateFromZip(alert.zip)
            const marketplaceType = (alert.marketplace as MarketplaceFilter) || "craigslist"

            return (
              <Card key={alert.id} className="border shadow-sm">
                <CardHeader className="p-3 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getMarketplaceIcon(marketplaceType)}
                      <CardTitle className="text-base font-medium">{alert.keyword}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-green-500 hover:bg-green-50"
                      onClick={() => toggleNotificationMute(alert.id)}
                    >
                      {renderNotificationBell(!!alert.muted)}
                      <span className="sr-only">{alert.muted ? "Enable notifications" : "Mute notifications"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col gap-1 text-sm">
                    <div>
                      {alert.min_price !== undefined && alert.min_price > 0 ? (
                        <p className="font-medium">
                          Range: {formatPrice(alert.min_price)} - {formatPrice(alert.max_price)}
                        </p>
                      ) : (
                        <p className="font-medium">
                          Range: {formatPrice(0)} - {formatPrice(alert.max_price)}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {city}, {state} ({alert.radius || 1} mile radius)
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700"
                          onClick={() => setEditAlert(alert)}
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs flex items-center gap-1 text-gray-500 hover:text-red-500 hover:bg-red-50"
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
                        {alert.hasNewListings && alert.newListingsCount && alert.newListingsCount > 0 && (
                          <span className="ml-1 bg-green-100 text-green-800 text-[10px] px-1 py-0.5 rounded-full">
                            {alert.newListingsCount} new listings
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
            <AlertDialogTitle>Delete Search Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAlertKeyword}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlert} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
