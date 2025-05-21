"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { createWatchlistItem } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"

// Type for marketplace options
type MarketplaceOption = "craigslist" | "facebook" | "offerup"

// Add the category type and options at the top of the file, after the MarketplaceOption type

type CategoryOption =
  | "all"
  | "electronics"
  | "furniture"
  | "clothing"
  | "vehicles"
  | "toys"
  | "sports"
  | "collectibles"
  | "tools"
  | "jewelry"
  | "books"

// First, add vehicle-specific types and state variables after the CategoryOption type

// Add these types after the CategoryOption type definition
type VehicleType = "all" | "car" | "truck" | "suv" | "motorcycle" | "rv" | "boat" | "other"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [radius, setRadius] = useState(1)
  const [marketplace, setMarketplace] = useState<MarketplaceOption>("craigslist")

  // Add a new state for the selected category after the marketplace state
  const [category, setCategory] = useState<CategoryOption>("all")

  // Add these state variables after the existing state variables
  const [vehicleType, setVehicleType] = useState<VehicleType>("all")
  const [minYear, setMinYear] = useState("")
  const [maxYear, setMaxYear] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [maxMileage, setMaxMileage] = useState("")

  const [maxPrice, setMaxPrice] = useState("")
  const [keyword, setKeyword] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [isFormValid, setIsFormValid] = useState(false)
  const [searchTermCounts, setSearchTermCounts] = useState<Record<MarketplaceOption, number>>({
    craigslist: 0,
    facebook: 0,
    offerup: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const formRef = useRef<HTMLFormElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  // Add minimum price state
  const [minPrice, setMinPrice] = useState("")
  const [minPriceValue, setMinPriceValue] = useState(0)
  const [maxPriceValue, setMaxPriceValue] = useState(0)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [submitClicked, setSubmitClicked] = useState(false)

  // Set marketplace from URL parameter if available
  useEffect(() => {
    const marketplaceParam = searchParams.get("marketplace") as MarketplaceOption
    if (marketplaceParam && ["craigslist", "facebook", "offerup"].includes(marketplaceParam)) {
      setMarketplace(marketplaceParam)
    }
  }, [searchParams])

  // Check form validity whenever inputs change
  useEffect(() => {
    const isValid =
      keyword.trim() !== "" && maxPrice.trim() !== "" && zipCode.trim() !== "" && /^\d{5}$/.test(zipCode) && !priceError
    setIsFormValid(isValid)
  }, [keyword, maxPrice, zipCode, priceError])

  // Get the count of existing search terms per marketplace
  useEffect(() => {
    async function fetchSearchTermCounts() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("watchlist").select("marketplace")

        if (error) {
          console.error("Error fetching search term counts:", error)
          return
        }

        // Count terms by marketplace
        const counts: Record<MarketplaceOption, number> = {
          craigslist: 0,
          facebook: 0,
          offerup: 0,
        }

        data.forEach((item) => {
          const market = item.marketplace as MarketplaceOption
          if (market && counts[market] !== undefined) {
            counts[market]++
          }
        })

        setSearchTermCounts(counts)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchTermCounts()
  }, [])

  // Format number with commas
  const formatNumberWithCommas = (value: string) => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, "")

    // Format with commas
    if (digitsOnly) {
      return new Intl.NumberFormat("en-US").format(Number.parseInt(digitsOnly))
    }
    return ""
  }

  // Add minimum price formatting function
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberWithCommas(e.target.value)
    setMinPrice(formattedValue)

    // Parse the actual numeric value
    const numericValue = Number.parseInt(e.target.value.replace(/,/g, "")) || 0
    setMinPriceValue(numericValue)

    // Validate min/max price relationship
    validatePrices(numericValue, maxPriceValue)
  }

  // Handle max price input change
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberWithCommas(e.target.value)
    setMaxPrice(formattedValue)

    // Parse the actual numeric value
    const numericValue = Number.parseInt(e.target.value.replace(/,/g, "")) || 0
    setMaxPriceValue(numericValue)

    // Validate min/max price relationship
    validatePrices(minPriceValue, numericValue)
  }

  // Validate that min price doesn't exceed max price
  const validatePrices = (min: number, max: number) => {
    if (min > 0 && max > 0 && min > max) {
      setPriceError("Minimum price cannot exceed maximum price")
    } else {
      setPriceError(null)
    }
  }

  // Update slider background on mount and when radius changes
  useEffect(() => {
    updateSliderBackground()
  }, [radius])

  // Function to update the slider background
  const updateSliderBackground = () => {
    if (!sliderRef.current) return

    const min = Number.parseInt(sliderRef.current.min) || 0
    const max = Number.parseInt(sliderRef.current.max) || 100
    const value = radius
    const percentage = ((value - min) / (max - min)) * 100

    sliderRef.current.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
  }

  // Prevent accidental double submissions
  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const handleSubmitCapture = (e: Event) => {
      if (isSubmitting || submitClicked) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    form.addEventListener("submit", handleSubmitCapture, true)
    return () => {
      form.removeEventListener("submit", handleSubmitCapture, true)
    }
  }, [isSubmitting, submitClicked])

  // Handle radius changes from either input
  const handleRadiusChange = (value: number) => {
    // Ensure value is between 0 and 100
    const validatedValue = Math.min(Math.max(0, value), 100)
    setRadius(validatedValue)
  }

  // Handle radius input change with max validation
  const handleRadiusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // If the input is empty, allow it (will be treated as 0)
    if (value === "") {
      setRadius(0)
      return
    }

    // Parse the value as a number
    const numValue = Number.parseInt(value, 10)

    // Check if it's a valid number and within range
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setRadius(numValue)
    }
  }

  async function handleSubmit(formData: FormData) {
    // Prevent multiple submissions
    if (isSubmitting || submitClicked) {
      console.log("Submission already in progress, ignoring")
      return
    }

    // Set submit clicked to true to prevent multiple clicks
    setSubmitClicked(true)

    // Check if we've reached the limit for this marketplace
    if (searchTermCounts[marketplace] >= 5) {
      setError(`You can only have 5 saved search terms for ${marketplace}. Please delete one to add more.`)
      setSubmitClicked(false)
      return
    }

    // Validate min/max price relationship
    if (priceError) {
      setError(priceError)
      setSubmitClicked(false)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Add marketplace to form data
      formData.append("marketplace", marketplace)

      // Add the category to the form data in the handleSubmit function, inside the try block
      // Add this after the marketplace is appended to formData
      formData.append("category", category)

      // Add vehicle-specific properties if category is vehicles
      if (category === "vehicles") {
        formData.append("vehicleType", vehicleType)
        if (minYear) formData.append("minYear", minYear)
        if (maxYear) formData.append("maxYear", maxYear)
        if (make) formData.append("make", make)
        if (model) formData.append("model", model)
        if (maxMileage) formData.append("maxMileage", maxMileage)
      }

      // Replace the formatted max price with the raw number
      formData.delete("maxPrice")
      const rawMaxPrice = maxPrice.replace(/,/g, "")
      formData.append("maxPrice", rawMaxPrice)

      // Add minimum price to form data
      if (minPrice) {
        formData.delete("minPrice")
        const rawMinPrice = minPrice.replace(/,/g, "")
        formData.append("minPrice", rawMinPrice)
      }

      const result = await createWatchlistItem(formData)

      if (result.success && result.data) {
        // Show success toast with the keyword and zip
        toast({
          title: "🔔 Search Term Added",
          description: `Now watching deals for "${result.data.keyword}" near ${result.data.zip}`,
          duration: 3000,
        })

        // Immediately redirect to alerts page
        router.push("/alerts")
      } else {
        setError(result.error || "Something went wrong")
        setIsSubmitting(false)
        setSubmitClicked(false)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
      setSubmitClicked(false)
    }
  }

  // Get marketplace color class
  const getMarketplaceColorClass = (marketplaceOption: MarketplaceOption): string => {
    switch (marketplaceOption) {
      case "craigslist":
        return "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
      case "facebook":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
      case "offerup":
        return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
    }
  }

  // Get marketplace icon
  const getMarketplaceIcon = (marketplaceOption: MarketplaceOption) => {
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

  return (
    <div className="py-4 max-w-md mx-auto">
      <Card className="border shadow-md rounded-xl overflow-hidden">
        <CardHeader className="text-center py-2 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-xl md:text-2xl font-bold">Find Undervalued Deals</CardTitle>
          <CardDescription className="text-sm mt-1">Get notified when great deals match your criteria</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          {error && (
            <Alert variant="destructive" className="mb-3 text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {priceError && (
            <Alert className="mb-3 text-sm bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{priceError}</AlertDescription>
            </Alert>
          )}

          {searchTermCounts[marketplace] >= 5 && (
            <Alert className="mb-3 text-sm bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum of 5 saved search terms for {marketplace}. Please delete one to add more.
              </AlertDescription>
            </Alert>
          )}

          <form ref={formRef} action={handleSubmit} className="space-y-3" noValidate>
            {/* Marketplace Toggle */}
            <div className="flex justify-center mb-1">
              <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg flex-wrap justify-center">
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                    marketplace === "craigslist"
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : "text-gray-500 hover:text-gray-700 border-transparent"
                  }`}
                  onClick={() => setMarketplace("craigslist")}
                >
                  {getMarketplaceIcon("craigslist")}
                  Craigslist
                  <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.craigslist}/5)</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                    marketplace === "facebook"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "text-gray-500 hover:text-gray-700 border-transparent"
                  }`}
                  onClick={() => setMarketplace("facebook")}
                >
                  {getMarketplaceIcon("facebook")}
                  FB Marketplace
                  <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.facebook}/5)</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                    marketplace === "offerup"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "text-gray-500 hover:text-gray-700 border-transparent"
                  }`}
                  onClick={() => setMarketplace("offerup")}
                >
                  {getMarketplaceIcon("offerup")}
                  OfferUp
                  <span className="ml-1 text-[10px] opacity-75">({searchTermCounts.offerup}/5)</span>
                </button>
              </div>
            </div>
            {/* Category selector */}
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryOption)}
                className="w-full h-9 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing & Accessories</option>
                <option value="vehicles">Vehicles</option>
                <option value="toys">Toys & Games</option>
                <option value="sports">Sporting Goods</option>
                <option value="collectibles">Collectibles</option>
                <option value="tools">Tools & Home Improvement</option>
                <option value="jewelry">Jewelry & Watches</option>
                <option value="books">Books & Media</option>
              </select>
            </div>
            {/* Add this code after the category selector div and before the keyword/zip grid: */}
            {category === "vehicles" && (
              <div className="space-y-3 border-l-2 border-blue-200 pl-3 mt-2 mb-2">
                <div className="space-y-1">
                  <Label htmlFor="vehicleType" className="text-sm font-medium">
                    Vehicle Type
                  </Label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full h-9 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                  >
                    <option value="all">All Types</option>
                    <option value="car">Car</option>
                    <option value="truck">Truck</option>
                    <option value="suv">SUV</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="rv">RV/Camper</option>
                    <option value="boat">Boat</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="minYear" className="text-sm font-medium">
                      Min Year
                    </Label>
                    <Input
                      id="minYear"
                      name="minYear"
                      type="text"
                      inputMode="numeric"
                      placeholder="2010"
                      value={minYear}
                      onChange={(e) => setMinYear(e.target.value)}
                      className="h-9 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxYear" className="text-sm font-medium">
                      Max Year
                    </Label>
                    <Input
                      id="maxYear"
                      name="maxYear"
                      type="text"
                      inputMode="numeric"
                      placeholder="2023"
                      value={maxYear}
                      onChange={(e) => setMaxYear(e.target.value)}
                      className="h-9 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="make" className="text-sm font-medium">
                      Make
                    </Label>
                    <Input
                      id="make"
                      name="make"
                      type="text"
                      placeholder="Toyota, Honda..."
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="h-9 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="model" className="text-sm font-medium">
                      Model
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      type="text"
                      placeholder="Camry, Civic..."
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="h-9 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="maxMileage" className="text-sm font-medium">
                    Max Mileage
                  </Label>
                  <div className="relative">
                    <Input
                      id="maxMileage"
                      name="maxMileage"
                      type="text"
                      inputMode="numeric"
                      placeholder="100,000"
                      value={maxMileage}
                      onChange={(e) =>
                        setMaxMileage(e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))
                      }
                      className="h-9 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">miles</span>
                  </div>
                </div>
              </div>
            )}
            {/* Keyword and ZIP side by side */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 space-y-1">
                <Label htmlFor="keyword" className="text-sm font-medium">
                  What are you looking for?
                </Label>
                <Input
                  id="keyword"
                  name="keyword"
                  placeholder="e.g. iPhone, PlayStation, Furniture"
                  className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                  required
                  disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label htmlFor="zip" className="text-sm font-medium">
                  ZIP Code
                </Label>
                <Input
                  id="zip"
                  name="zip"
                  placeholder="ZIP"
                  className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  minLength={5}
                  inputMode="numeric"
                  disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                  title="Please enter a valid 5-digit ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
            {/* Price inputs side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="minPrice" className="text-sm font-medium">
                  Minimum Price
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="minPrice"
                    name="minPrice"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="h-9 text-sm pl-6 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxPrice" className="text-sm font-medium">
                  Maximum Price
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="maxPrice"
                    name="maxPrice"
                    type="text"
                    inputMode="numeric"
                    placeholder="500"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="h-9 text-sm pl-6 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    required
                    disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div>
                <Label htmlFor="radius" className="text-sm font-medium">
                  Search Radius
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-grow">
                  <div>
                    <input
                      ref={sliderRef}
                      type="range"
                      id="radius-slider"
                      min="0"
                      max="100"
                      value={radius}
                      onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${radius}%, #e5e7eb ${radius}%, #e5e7eb 100%)`,
                      }}
                      disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    />
                    <div className="flex justify-between text-xs text-gray-500 px-1 mt-1">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                <div className="w-16 flex-shrink-0">
                  <Input
                    type="text"
                    id="radius"
                    name="radius"
                    value={radius}
                    onChange={handleRadiusInputChange}
                    className="h-8 text-center text-sm"
                    disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    aria-label="Radius in miles"
                  />
                </div>

                <div className="w-10 flex-shrink-0 text-xs">miles</div>
              </div>
            </div>
            <Button
              ref={submitButtonRef}
              type="submit"
              className="w-full h-10 text-base font-medium mt-3 transition-all touch-manipulation"
              disabled={
                isSubmitting || !isFormValid || searchTermCounts[marketplace] >= 5 || isLoading || submitClicked
              }
            >
              {isSubmitting || submitClicked ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : isLoading ? (
                "Loading..."
              ) : searchTermCounts[marketplace] >= 5 ? (
                "Maximum Limit Reached"
              ) : (
                "Save Search Term"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
