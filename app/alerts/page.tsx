"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { EditAlertDialog } from "@/components/edit-alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { deleteWatchlistItem } from "@/app/actions"
import { MoreVertical, Pencil, Trash2, Search, BellOff, Bell, ArrowUpDown, Trash } from "lucide-react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Placeholder images for different categories
const categoryImages: Record<string, string> = {
  iphone: "/modern-smartphone.png",
  phone: "/modern-smartphone.png",
  smartphone: "/modern-smartphone.png",
  playstation: "/gaming-console-setup.png",
  xbox: "/gaming-console-setup.png",
  nintendo: "/gaming-console-setup.png",
  gaming: "/gaming-console-setup.png",
  furniture: "/modern-living-room-coffee-table.png",
  table: "/modern-living-room-coffee-table.png",
  chair: "/modern-living-room-coffee-table.png",
  bike: "/mountain-bike-trail.png",
  bicycle: "/mountain-bike-trail.png",
}

// Function to get an image based on keyword
function getImageForKeyword(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase()

  for (const [key, value] of Object.entries(categoryImages)) {
    if (lowerKeyword.includes(key)) {
      return value
    }
  }

  // Default image if no match
  return "/marketplace-item.png"
}

// Function to get marketplace display text
function getMarketplaceDisplay(marketplace: string): string {
  switch (marketplace) {
    case "craigslist":
      return "CL"
    case "facebook":
      return "FB"
    case "offerup":
      return "OU"
    case "all":
      return "ALL"
    default:
      return marketplace.substring(0, 2).toUpperCase()
  }
}

// Function to get marketplace badge color
function getMarketplaceBadgeColor(marketplace: string): string {
  switch (marketplace) {
    case "craigslist":
      return "bg-purple-900"
    case "facebook":
      return "bg-blue-800"
    case "offerup":
      return "bg-green-800"
    case "all":
      return "bg-gray-800"
    default:
      return "bg-gray-800"
  }
}

interface Alert {
  id: string
  keyword: string
  max_price: number
  zip: string
  radius: number
  marketplace?: string
  image?: string
  created_at?: string
  muted?: boolean
  hasNewListings?: boolean
  newListingsCount?: number
}

type MarketplaceFilter = "all" | "craigslist" | "facebook" | "offerup"
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "a-z" | "z-a"

export default function AlertsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null)
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const deleteInProgressRef = useRef(false)
  const alertDialogOpenRef = useRef(false)

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

  // Toggle mute status for an alert
  const toggleMute = (alertId: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) => (alert.id === alertId ? { ...alert, muted: !alert.muted } : alert)),
    )

    // In a real app, you would save this to the database
    toast({
      title: "Notification settings updated",
      description: "Your changes have been saved",
      duration: 2000,
    })
  }

  // Delete all alerts
  const deleteAllAlerts = async () => {
    setIsDeleteAllOpen(false)
    setIsDeletingAll(true)

    // Show optimistic toast
    toast({
      title: "Deleting all search terms...",
      duration: 2000,
    })

    try {
      // In a real app, we would delete all from the database
      // For now, we'll use a simple approach to delete each alert
      for (const alert of alerts) {
        await supabase.from("watchlist").delete().eq("id", alert.id)
      }

      // Clear the state
      setAlerts([])

      toast({
        title: "All search terms deleted",
        description: "Your saved search terms have been removed",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error deleting all alerts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete all search terms",
        duration: 3000,
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let result = [...alerts]

    // Apply marketplace filter
    if (marketplaceFilter !== "all") {
      result = result.filter((alert) => alert.marketplace === marketplaceFilter || alert.marketplace === "all")
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime())
        break
      case "price-high":
        result.sort((a, b) => b.max_price - a.max_price)
        break
      case "price-low":
        result.sort((a, b) => a.max_price - b.max_price)
        break
      case "a-z":
        result.sort((a, b) => a.keyword.localeCompare(b.keyword))
        break
      case "z-a":
        result.sort((a, b) => b.keyword.localeCompare(a.keyword))
        break
    }

    setFilteredAlerts(result)
  }, [alerts, marketplaceFilter, sortOption])

  // Fetch alerts and set up real-time subscription
  useEffect(() => {
    let realtimeChannel: RealtimeChannel

    async function fetchAlerts() {
      try {
        setLoading(true)
        console.log("Fetching initial alerts data...")

        // Fetch initial data
        const { data, error } = await supabase.from("watchlist").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        console.log("Initial data fetched:", data)

        // Add images to alerts and randomly add hasNewListings for demo
        const alertsWithImages = data.map((alert) => ({
          ...alert,
          image: getImageForKeyword(alert.keyword),
          muted: false, // Default to notifications enabled
          hasNewListings: Math.random() > 0.5, // Randomly show new listings indicator for demo
          newListingsCount: Math.floor(Math.random() * 10) + 1, // Random number of new listings (1-10)
        }))

        setAlerts(alertsWithImages)

        // Set up real-time subscription
        console.log("Setting up real-time subscription...")
        realtimeChannel = supabase
          .channel("watchlist-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "watchlist",
            },
            (payload) => {
              console.log("Real-time change received:", payload)

              // Handle different types of changes
              if (payload.eventType === "INSERT") {
                const newAlert = payload.new as Alert
                newAlert.image = getImageForKeyword(newAlert.keyword)
                newAlert.hasNewListings = true // New alerts have new listings
                newAlert.newListingsCount = Math.floor(Math.random() * 5) + 1 // Random number of new listings (1-5)
                newAlert.muted = false // Default to notifications enabled

                setAlerts((currentAlerts) => {
                  // Check if the alert already exists to prevent duplicates
                  const exists = currentAlerts.some((alert) => alert.id === newAlert.id)
                  if (exists) return currentAlerts

                  // Check if we've reached the limit of 5 alerts
                  if (currentAlerts.length >= 5) {
                    toast({
                      title: "Maximum limit reached",
                      description: "You can only have 5 saved search terms. Please delete one to add more.",
                      variant: "destructive",
                      duration: 5000,
                    })
                    return currentAlerts
                  }

                  return [newAlert, ...currentAlerts]
                })

                toast({
                  title: "New Search Term Added",
                  description: `Search term for "${newAlert.keyword}" has been added`,
                  duration: 3000,
                })
              } else if (payload.eventType === "UPDATE") {
                const updatedAlert = payload.new as Alert
                updatedAlert.image = getImageForKeyword(updatedAlert.keyword)

                console.log("Updating alert:", updatedAlert)

                setAlerts((currentAlerts) => {
                  return currentAlerts.map((alert) => {
                    if (alert.id === updatedAlert.id) {
                      console.log("Found alert to update:", alert.id)
                      return {
                        ...updatedAlert,
                        image: getImageForKeyword(updatedAlert.keyword),
                        muted: alert.muted, // Preserve mute state
                        hasNewListings: alert.hasNewListings, // Preserve new listings state
                        newListingsCount: alert.newListingsCount, // Preserve new listings count
                      }
                    }
                    return alert
                  })
                })

                // Only show toast if this wasn't triggered by the current user's edit
                if (!editAlert || editAlert.id !== updatedAlert.id) {
                  toast({
                    title: "Search Term Updated",
                    description: `Search term for "${updatedAlert.keyword}" has been updated`,
                    duration: 3000,
                  })
                }
              } else if (payload.eventType === "DELETE") {
                const deletedAlertId = payload.old.id
                console.log("Deleting alert:", deletedAlertId)

                setAlerts((currentAlerts) => {
                  return currentAlerts.filter((alert) => {
                    const shouldKeep = alert.id !== deletedAlertId
                    if (!shouldKeep) console.log("Removing alert:", alert.id)
                    return shouldKeep
                  })
                })

                // Only show toast if this wasn't triggered by the current user's delete
                if (deleteAlertId !== deletedAlertId && !deleteInProgressRef.current) {
                  toast({
                    title: "Search Term Deleted",
                    description: "A search term has been deleted",
                    duration: 3000,
                  })
                }
              }
            },
          )
          .subscribe()
      } catch (err: any) {
        console.error("Error fetching alerts:", err)
        setError(err.message || "Failed to load search terms")
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    // Clean up subscription when component unmounts
    return () => {
      console.log("Cleaning up real-time subscription...")
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [toast]) // Include toast in dependencies to avoid lint warnings

  // Track when the alert dialog opens/closes
  useEffect(() => {
    alertDialogOpenRef.current = !!deleteAlertId
  }, [deleteAlertId])

  // Handle delete alert
  const handleDeleteAlert = async () => {
    if (!deleteAlertId || isDeleting) return

    setIsDeleting(true)
    deleteInProgressRef.current = true

    try {
      // Find the alert to delete
      const alertToDelete = alerts.find((alert) => alert.id === deleteAlertId)
      const idToDelete = deleteAlertId

      // Remove from UI immediately
      setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== idToDelete))

      // Close the dialog
      setDeleteAlertId(null)

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
      // Use a small timeout to prevent race conditions with realtime events
      setTimeout(() => {
        deleteInProgressRef.current = false
      }, 500)
    }
  }

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteAlertId(null)
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
      <Tabs
        defaultValue="all"
        className="mb-4"
        value={marketplaceFilter}
        onValueChange={(value) => setMarketplaceFilter(value as MarketplaceFilter)}
      >
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="all" className="text-xs">
            All Markets
          </TabsTrigger>
          <TabsTrigger value="craigslist" className="text-xs">
            Craigslist
          </TabsTrigger>
          <TabsTrigger value="facebook" className="text-xs">
            FB Marketplace
          </TabsTrigger>
          <TabsTrigger value="offerup" className="text-xs">
            OfferUp
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sort and filter controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="a-z">A to Z</SelectItem>
              <SelectItem value="z-a">Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {alerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteAllOpen(true)}
            disabled={isDeletingAll}
          >
            <Trash className="mr-1 h-3 w-3" />
            Delete All
          </Button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No search terms found. Add some on the home page!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="overflow-hidden border-none shadow-md">
              <div className="flex">
                <div className="w-1/3 relative">
                  <Image
                    src={alert.image || "/placeholder.svg"}
                    alt={alert.keyword}
                    width={300}
                    height={200}
                    className="h-full object-cover"
                  />
                  {alert.marketplace && (
                    <div
                      className={`absolute top-1 left-1 ${getMarketplaceBadgeColor(alert.marketplace)} text-white text-xs px-1.5 py-0.5 rounded`}
                    >
                      {getMarketplaceDisplay(alert.marketplace)}
                    </div>
                  )}
                </div>
                <div className="w-2/3 flex flex-col">
                  <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start">
                    <div className="flex items-start gap-2">
                      <CardTitle className="text-base font-medium line-clamp-2 pr-6">{alert.keyword}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mt-1 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditAlert(alert)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMute(alert.id)}>
                          {alert.muted ? (
                            <>
                              <Bell className="mr-2 h-4 w-4" />
                              Unmute Notifications
                            </>
                          ) : (
                            <>
                              <BellOff className="mr-2 h-4 w-4" />
                              Mute Notifications
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteAlertId(alert.id)}
                          className="text-red-600 focus:text-red-600"
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 pb-0 text-sm">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-lg">{formatPrice(alert.max_price)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleMute(alert.id)}
                        title={alert.muted ? "Unmute notifications" : "Mute notifications"}
                      >
                        {alert.muted ? (
                          <BellOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Bell className="h-5 w-5 text-green-600" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        📍{alert.zip} ({alert.radius || 1}-{(alert.radius || 1) === 1 ? "mile" : "miles"} radius)
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 mt-auto">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1"
                      onClick={() => handleViewListings(alert)}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>View Listings</span>
                      {alert.hasNewListings && alert.newListingsCount && alert.newListingsCount > 0 && (
                        <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                          {alert.newListingsCount} new
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAlertId} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this search term. You won't receive any more notifications for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAlert()
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all search terms?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your saved search terms. You won't receive any more notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteAllAlerts()
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </div>
  )
}
