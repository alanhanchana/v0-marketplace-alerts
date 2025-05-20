"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ExternalLink, ArrowUpDown, SlidersHorizontal } from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

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

    // Generate a random date within the last 7 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 7))

    // Calculate if this is a new listing (less than 4 hours old)
    const isNew = Date.now() - date.getTime() < 4 * 60 * 60 * 1000

    listings.push({
      id: `listing-${i}`,
      title: `${keyword} ${["Pro", "Like New", "Barely Used", "Great Condition", "Must Sell", "Best Deal"][Math.floor(Math.random() * 6)]}`,
      price,
      image: images[Math.floor(Math.random() * images.length)],
      location: ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"][Math.floor(Math.random() * 5)],
      date: date.toLocaleDateString(),
      source: marketplace,
      distance: Math.floor(Math.random() * 20) + 1, // 1-20 miles
      condition: ["New", "Like New", "Good", "Fair", "Poor"][Math.floor(Math.random() * 5)],
      isNew,
      url: getMarketplaceUrl(marketplace, keyword), // Use the marketplace-specific URL
    })
  }

  return listings
}

type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "distance"

type MarketplaceOption = "craigslist" | "facebook" | "offerup"

interface FilterOptions {
  priceRange: [number, number]
  distance: number
  conditions: string[]
  locations: string[]
}

export default function ListingsPage() {
  const params = useParams()
  const router = useRouter()
  const [alert, setAlert] = useState<any>(null)
  const [allListings, setAllListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>("relevance")
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priceRange: [0, 1000],
    distance: 20,
    conditions: [],
    locations: [],
  })
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableConditions, setAvailableConditions] = useState<string[]>([])

  useEffect(() => {
    async function fetchAlertAndListings() {
      try {
        setLoading(true)
        const alertId = params.id as string

        // Fetch the alert details
        const { data, error } = await supabase.from("watchlist").select("*").eq("id", alertId).single()

        if (error) {
          throw error
        }

        setAlert(data)

        // Generate mock listings based on the alert criteria and specific marketplace
        const mockListings = generateMockListings(data.keyword, data.max_price, data.marketplace, 20)
        setAllListings(mockListings)

        // Extract available filter options
        const locations = [...new Set(mockListings.map((listing) => listing.location))]
        const conditions = [...new Set(mockListings.map((listing) => listing.condition))]

        setAvailableLocations(locations)
        setAvailableConditions(conditions)

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
  }, [params.id])

  // Apply filters and sorting
  useEffect(() => {
    if (!allListings.length) return

    let result = [...allListings]

    // Apply price filter
    result = result.filter(
      (listing) => listing.price >= filterOptions.priceRange[0] && listing.price <= filterOptions.priceRange[1],
    )

    // Apply distance filter
    result = result.filter((listing) => listing.distance <= filterOptions.distance)

    // Apply condition filter if any are selected
    if (filterOptions.conditions.length > 0) {
      result = result.filter((listing) => filterOptions.conditions.includes(listing.condition))
    }

    // Apply location filter if any are selected
    if (filterOptions.locations.length > 0) {
      result = result.filter((listing) => filterOptions.locations.includes(listing.location))
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "distance":
        result.sort((a, b) => a.distance - b.distance)
        break
      case "relevance":
        // For relevance, we'll sort by a combination of recency and price
        result.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          const priceRatioA = a.price / (alert?.max_price || 1000)
          const priceRatioB = b.price / (alert?.max_price || 1000)

          // Lower price ratio is better (more undervalued)
          // More recent date is better
          // Combine these factors
          const scoreA = (1 - priceRatioA) * 0.7 + (dateA / Date.now()) * 0.3
          const scoreB = (1 - priceRatioB) * 0.7 + (dateB / Date.now()) * 0.3

          return scoreB - scoreA
        })
        break
    }

    setFilteredListings(result)
  }, [allListings, sortOption, filterOptions, alert])

  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get marketplace badge color
  const getMarketplaceBadgeColor = (marketplace: string): string => {
    switch (marketplace) {
      case "craigslist":
        return "bg-purple-900"
      case "facebook":
        return "bg-blue-800"
      case "offerup":
        return "bg-green-800"
      default:
        return "bg-gray-800"
    }
  }

  // Get marketplace display text
  const getMarketplaceDisplay = (marketplace: string): string => {
    switch (marketplace) {
      case "craigslist":
        return "CL"
      case "facebook":
        return "FB"
      case "offerup":
        return "OU"
      default:
        return marketplace.substring(0, 2).toUpperCase()
    }
  }

  // Get marketplace icon
  const getMarketplaceIcon = (marketplaceOption: string) => {
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
      default:
        return null
    }
  }

  // Toggle a condition in the filter
  const toggleCondition = (condition: string) => {
    setFilterOptions((prev) => {
      if (prev.conditions.includes(condition)) {
        return {
          ...prev,
          conditions: prev.conditions.filter((c) => c !== condition),
        }
      } else {
        return {
          ...prev,
          conditions: [...prev.conditions, condition],
        }
      }
    })
  }

  // Toggle a location in the filter
  const toggleLocation = (location: string) => {
    setFilterOptions((prev) => {
      if (prev.locations.includes(location)) {
        return {
          ...prev,
          locations: prev.locations.filter((l) => l !== location),
        }
      } else {
        return {
          ...prev,
          locations: [...prev.locations, location],
        }
      }
    })
  }

  // Reset all filters
  const resetFilters = () => {
    if (!allListings.length) return

    const prices = allListings.map((listing) => listing.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    setFilterOptions({
      priceRange: [minPrice, maxPrice],
      distance: 20,
      conditions: [],
      locations: [],
    })

    setSortOption("relevance")
  }

  // Handle listing click
  const handleListingClick = (url: string) => {
    // In a real app, this would open the listing in a new tab
    window.open(url, "_blank")
  }

  if (loading) {
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
            <Card key={i} className="overflow-hidden border-none shadow-md">
              <div className="flex">
                <div className="w-1/3">
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="w-2/3">
                  <div className="p-3">
                    <Skeleton className="h-5 w-4/5 mb-2" />
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </Card>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Failed to load search term details"}
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center">
          {getMarketplaceIcon(alert.marketplace)}
          <h1 className="text-xl font-bold truncate">{alert.keyword}</h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {alert.min_price ? (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {formatPrice(alert.min_price)} - {formatPrice(alert.max_price)}
            </span>
          ) : (
            <span className="bg-gray-100 px-2 py-1 rounded">Max price: {formatPrice(alert.max_price)}</span>
          )}
          <span className="bg-gray-100 px-2 py-1 rounded">
            {alert.zip} ({alert.radius || 1} mile radius)
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-white text-xs ${getMarketplaceBadgeColor(alert.marketplace)}`}>
          {alert.marketplace}
        </div>
      </div>

      {/* Sort and filter controls */}
      <div className="flex justify-between items-center mb-4">
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <div className="flex items-center">
              <ArrowUpDown className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Best Match</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <SlidersHorizontal className="mr-2 h-3 w-3" />
              <span className="text-xs">Filters</span>
              {(filterOptions.conditions.length > 0 || filterOptions.locations.length > 0) && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  {filterOptions.conditions.length + filterOptions.locations.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Listings</SheetTitle>
              <SheetDescription>Narrow down results to find exactly what you're looking for</SheetDescription>
            </SheetHeader>

            <div className="py-4 space-y-6">
              {/* Price Range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="text-xs text-gray-500">
                    {formatPrice(filterOptions.priceRange[0])} - {formatPrice(filterOptions.priceRange[1])}
                  </div>
                </div>
                <Slider
                  min={Math.min(...allListings.map((l) => l.price))}
                  max={Math.max(...allListings.map((l) => l.price))}
                  step={10}
                  value={filterOptions.priceRange}
                  onValueChange={(value) =>
                    setFilterOptions((prev) => ({ ...prev, priceRange: value as [number, number] }))
                  }
                  className="my-4"
                />
              </div>

              {/* Distance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Maximum Distance</Label>
                  <div className="text-xs text-gray-500">{filterOptions.distance} miles</div>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[filterOptions.distance]}
                  onValueChange={(value) => setFilterOptions((prev) => ({ ...prev, distance: value[0] }))}
                  className="my-4"
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Condition</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition}`}
                        checked={filterOptions.conditions.includes(condition)}
                        onCheckedChange={() => toggleCondition(condition)}
                      />
                      <label
                        htmlFor={`condition-${condition}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableLocations.map((location) => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location}`}
                        checked={filterOptions.locations.includes(location)}
                        onCheckedChange={() => toggleLocation(location)}
                      />
                      <label
                        htmlFor={`location-${location}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row justify-between sm:justify-between">
              <Button variant="outline" onClick={resetFilters}>
                Reset All
              </Button>
              <SheetClose asChild>
                <Button>Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No listings found matching your criteria.</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden border-none shadow-md">
              <div className="flex">
                <div className="w-1/3 relative cursor-pointer" onClick={() => handleListingClick(listing.url)}>
                  <Image
                    src={listing.image || "/placeholder.svg"}
                    alt={listing.title}
                    width={300}
                    height={200}
                    className="h-full object-cover"
                  />
                  {listing.isNew && (
                    <Badge className="absolute top-1 right-1 bg-green-500 text-white text-xs">New Listing</Badge>
                  )}
                </div>
                <div className="w-2/3 flex flex-col">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-base font-medium line-clamp-2">{listing.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 pb-0 text-sm">
                    <p className="font-bold text-lg">{formatPrice(listing.price)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.location}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.distance} mi</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.condition}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.date}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 mt-auto">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1"
                      variant="outline"
                      onClick={() => handleListingClick(listing.url)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View on {listing.source.charAt(0).toUpperCase() + listing.source.slice(1)}</span>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-gray-500">
        Showing {filteredListings.length} of {allListings.length} listings
      </div>
    </div>
  )
}
