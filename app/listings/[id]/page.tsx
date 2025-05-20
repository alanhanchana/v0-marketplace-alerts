"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ExternalLink, ArrowUpDown, SlidersHorizontal } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Mock listing data generator
const generateMockListings = (keyword: string, maxPrice: number, count = 15) => {
  const listings = []
  const basePrice = maxPrice * 0.7 // Most listings will be below max price
  const images = [
    "/modern-smartphone.png",
    "/gaming-console-setup.png",
    "/modern-living-room-coffee-table.png",
    "/mountain-bike-trail.png",
    "/marketplace-item.png",
  ]

  // Generate listings for each marketplace
  const marketplaces = ["craigslist", "facebook", "offerup"]

  for (let i = 0; i < count; i++) {
    // Generate a price that's mostly below max price but occasionally above
    const priceMultiplier = Math.random() * 1.3 // 0 to 1.3
    const price = Math.round(basePrice * priceMultiplier)

    // Generate a random date within the last 7 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 7))

    // Assign to a random marketplace
    const source = marketplaces[Math.floor(Math.random() * marketplaces.length)]

    listings.push({
      id: `listing-${i}`,
      title: `${keyword} ${["Pro", "Like New", "Barely Used", "Great Condition", "Must Sell", "Best Deal"][Math.floor(Math.random() * 6)]}`,
      price,
      image: images[Math.floor(Math.random() * images.length)],
      location: ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"][Math.floor(Math.random() * 5)],
      date: date.toLocaleDateString(),
      source,
      distance: Math.floor(Math.random() * 20) + 1, // 1-20 miles
      condition: ["New", "Like New", "Good", "Fair", "Poor"][Math.floor(Math.random() * 5)],
    })
  }

  return listings
}

type MarketplaceFilter = "all" | "craigslist" | "facebook" | "offerup"
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "distance" | "relevance"

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
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>("all")
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

        // Generate mock listings based on the alert criteria
        const mockListings = generateMockListings(data.keyword, data.max_price)
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

    // Apply marketplace filter
    if (marketplaceFilter !== "all") {
      result = result.filter((listing) => listing.source === marketplaceFilter)
    }

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
  }, [allListings, marketplaceFilter, sortOption, filterOptions, alert])

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
    setMarketplaceFilter("all")
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
        <h1 className="text-xl font-bold truncate">{alert.keyword}</h1>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="bg-gray-100 px-2 py-1 rounded">{formatPrice(alert.max_price)}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            📍{alert.zip} ({alert.radius || 1}-{(alert.radius || 1) === 1 ? "mile" : "miles"} radius)
          </span>
        </div>
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
                <div className="w-1/3 relative">
                  <Image
                    src={listing.image || "/placeholder.svg"}
                    alt={listing.title}
                    width={300}
                    height={200}
                    className="h-full object-cover"
                  />
                  <div
                    className={`absolute top-1 left-1 ${getMarketplaceBadgeColor(listing.source)} text-white text-xs px-1.5 py-0.5 rounded`}
                  >
                    {getMarketplaceDisplay(listing.source)}
                  </div>
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
                    <Button size="sm" className="w-full flex items-center justify-center gap-1" variant="outline">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View Listing</span>
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
