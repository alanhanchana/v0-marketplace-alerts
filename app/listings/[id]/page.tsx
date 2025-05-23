"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, SlidersHorizontal, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { KeywordFilter } from "@/components/keyword-filter"
import { DealCard } from "@/components/deal-card"
import { motion } from "framer-motion"
import { useUser } from "@/contexts/user-context"

// Mock listing data generator
const generateMockListings = (keyword: string, maxPrice: number, marketplace: string, count = 15) => {
  const listings = []
  const basePrice = maxPrice * 0.7 // Most listings will be below max price
  const images = [
    "/modern-smartphone.png",
    "/gaming-console-setup.png",
    "/modern-living-room-coffee-table.png",
    "/mountain-bike-trail.png",
    "/marketplace-item.png",
  ]

  // Generate marketplace-specific URLs
  const getMarketplaceUrl = (marketplace: string, keyword: string) => {
    const encodedKeyword = encodeURIComponent(keyword)
    switch (marketplace) {
      case "craigslist":
        return `https://craigslist.org/search/sss?query=${encodedKeyword}`
      case "facebook":
        return `https://www.facebook.com/marketplace/search/?query=${encodedKeyword}`
      case "offerup":
        return `https://offerup.com/search?q=${encodedKeyword}`
      default:
        return "#"
    }
  }

  // Generate listings for the specific marketplace only
  for (let i = 0; i < count; i++) {
    // Generate a price that's mostly below max price but occasionally above
    const priceMultiplier = Math.random() * 1.3 // 0 to 1.3
    const price = Math.round(basePrice * priceMultiplier)

    // Generate original price (higher than actual price)
    const originalPrice = Math.random() > 0.3 ? Math.round(price * (1 + Math.random() * 0.5)) : price

    // Calculate discount percentage
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

    // Generate a random date within the last 7 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 7))

    // Calculate if this is a new listing (less than 4 hours old)
    const isNew = Date.now() - date.getTime() < 4 * 60 * 60 * 1000

    // Random end time for countdown (between 1 and 24 hours from now)
    const endTime = new Date()
    endTime.setHours(endTime.getHours() + Math.floor(Math.random() * 23) + 1)

    // Determine if it's a hot deal (significant discount)
    const isHot = discount > 30

    // Determine if it's exclusive (random, but less common)
    const isExclusive = Math.random() > 0.85

    // Generate time posted string
    const hoursAgo = Math.floor(Math.random() * 24) + 1
    const timePosted = hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`

    listings.push({
      id: `listing-${i}`,
      title: `${keyword} ${["Pro", "Like New", "Barely Used", "Great Condition", "Must Sell", "Best Deal"][Math.floor(Math.random() * 6)]}`,
      price,
      originalPrice,
      discount,
      image: images[Math.floor(Math.random() * images.length)],
      location: ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"][Math.floor(Math.random() * 5)],
      timePosted,
      source: marketplace,
      distance: Math.floor(Math.random() * 20) + 1, // 1-20 miles
      condition: ["New", "Like New", "Good", "Fair", "Poor"][Math.floor(Math.random() * 5)],
      isNew,
      isHot,
      isExclusive,
      endTime,
      url: getMarketplaceUrl(marketplace, keyword), // Use the marketplace-specific URL
      category: "electronics", // Default category for consistency
    })
  }

  return listings
}

export default function ListingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [alert, setAlert] = useState<any>(null)
  const [allListings, setAllListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState({
    keywords: [] as string[],
    priceRange: [0, 5000] as [number, number],
    condition: [] as string[],
    distance: 50,
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  useEffect(() => {
    async function fetchAlertAndListings() {
      try {
        if (!user) return

        setLoading(true)
        const alertId = params.id as string

        // Fetch the alert details
        const { data, error } = await supabase
          .from("watchlist")
          .select("*")
          .eq("id", alertId)
          .eq("user_id", user.id) // Only fetch if it belongs to the current user
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Alert not found or you don't have permission to view it")
        }

        setAlert(data)

        // Generate mock listings based on the alert criteria and specific marketplace
        const mockListings = generateMockListings(data.keyword, data.max_price, data.marketplace, 20)
        setAllListings(mockListings)
        setFilteredListings(mockListings)

        // Set initial price range based on listings
        const prices = mockListings.map((listing) => listing.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        setFilterOptions((prev) => ({
          ...prev,
          priceRange: [minPrice, maxPrice],
        }))
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load listings")
      } finally {
        setLoading(false)
      }
    }

    fetchAlertAndListings()
  }, [params.id, user, userLoading])

  // Apply filters
  useEffect(() => {
    if (!allListings.length) return

    let result = [...allListings]

    // Apply keyword filter
    if (filterOptions.keywords.length > 0) {
      result = result.filter((listing) => {
        return filterOptions.keywords.some((keyword) => listing.title.toLowerCase().includes(keyword.toLowerCase()))
      })
    }

    // Apply price filter
    result = result.filter(
      (listing) => listing.price >= filterOptions.priceRange[0] && listing.price <= filterOptions.priceRange[1],
    )

    // Apply distance filter
    result = result.filter((listing) => listing.distance <= filterOptions.distance)

    // Apply condition filter if any are selected
    if (filterOptions.condition.length > 0) {
      result = result.filter((listing) => filterOptions.condition.includes(listing.condition))
    }

    setFilteredListings(result)
  }, [allListings, filterOptions])

  // Handle listing click
  const handleViewListing = (url: string) => {
    // In a real app, this would open the listing in a new tab
    window.open(url, "_blank")
  }

  // Handle filter change
  const handleFilterChange = (newFilters: {
    keywords: string[]
    priceRange: [number, number]
    condition: string[]
    distance: number
  }) => {
    setFilterOptions(newFilters)
  }

  if (userLoading || loading) {
    return (
      <div className="py-8 max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-8 w-3/4" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !alert) {
    return (
      <div className="py-8 max-w-md mx-auto">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search Terms
        </Button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900/30 dark:border-red-900 dark:text-red-300">
          {error || "Failed to load search term details"}
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center">
                <Zap className="h-4 w-4 mr-1 text-primary" />
                {alert.keyword}
              </h1>
              <p className="text-xs text-muted-foreground">
                {alert.min_price ? `$${alert.min_price} - $${alert.max_price}` : `Up to $${alert.max_price}`} •{" "}
                {alert.zip} ({alert.radius || 1} mi)
              </p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Deals</SheetTitle>
                <SheetDescription>Narrow down results to find exactly what you're looking for</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <KeywordFilter onFilter={handleFilterChange} />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button className="w-full discord-button">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-4"
      >
        <KeywordFilter onFilter={handleFilterChange} />
      </motion.div>

      {filteredListings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center py-8 bg-secondary/50 rounded-lg border border-border"
        >
          <p className="text-muted-foreground">No deals found matching your criteria.</p>
          <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or check back later.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <DealCard
                deal={{
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  originalPrice: listing.originalPrice,
                  discount: listing.discount,
                  location: listing.location,
                  distance: listing.distance,
                  image: listing.image,
                  timePosted: listing.timePosted,
                  source: listing.source,
                  isHot: listing.isHot,
                  category: listing.category,
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Showing {filteredListings.length} of {allListings.length} deals
      </div>
    </div>
  )
}
