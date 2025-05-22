"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { createWatchlistItem } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Zap, Target, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

// Type for marketplace options
type MarketplaceOption = "craigslist" | "facebook" | "offerup"

// Category options
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

// Vehicle-specific form fields interface
interface VehicleFields {
  year?: string
  make?: string
  model?: string
  minMileage?: string
  maxMileage?: string
}

export default function TargetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [radius, setRadius] = useState(1)
  const [marketplace, setMarketplace] = useState<MarketplaceOption>("craigslist")
  const [category, setCategory] = useState<CategoryOption>("all")
  const [showVehicleFields, setShowVehicleFields] = useState(false)
  const [vehicleFields, setVehicleFields] = useState<VehicleFields>({
    year: "",
    make: "",
    model: "",
    minMileage: "",
    maxMileage: "",
  })

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

  // Show/hide vehicle fields when category changes
  useEffect(() => {
    setShowVehicleFields(category === "vehicles")
  }, [category])

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

  // Handle vehicle field changes
  const handleVehicleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setVehicleFields((prev) => ({
      ...prev,
      [name]: value,
    }))
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

    sliderRef.current.style.background = `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`
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
      setError(`You've hit the 5 term limit for ${marketplace}. Delete one to add more.`)
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
      formData.append("category", category)

      // Include vehicle fields when submitting
      if (category === "vehicles") {
        Object.entries(vehicleFields).forEach(([key, value]) => {
          if (value) {
            formData.append(key, value)
          }
        })
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
          title: "🎯 Target Acquired",
          description: `Now hunting for "${result.data.keyword}" deals near ${result.data.zip}`,
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
    <>
      {/* Onboarding moved to home page */}

      <div className="py-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          {/* Stacked cards effect */}
          <div className="absolute inset-0 discord-card stacked-card stacked-card-1 -z-10"></div>
          <div className="absolute inset-0 discord-card stacked-card stacked-card-2 -z-20"></div>

          <Card className="discord-card overflow-hidden relative z-0">
            <CardHeader className="space-y-1 p-4 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Set Your Target
                </CardTitle>
              </div>
              <CardDescription>Tell us what you're hunting for and we'll find it</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {error && (
                <Alert variant="destructive" className="mb-3 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {priceError && (
                <Alert className="mb-3 text-sm bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{priceError}</AlertDescription>
                </Alert>
              )}

              {searchTermCounts[marketplace] >= 5 && (
                <Alert className="mb-3 text-sm bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You've hit the 5 term limit for {marketplace}. Delete one to add more.
                  </AlertDescription>
                </Alert>
              )}

              <form ref={formRef} action={handleSubmit} className="space-y-3" noValidate>
                {/* Marketplace Toggle */}
                <div className="flex justify-center mb-1">
                  <div className="inline-flex items-center p-1 bg-secondary rounded-lg flex-wrap justify-center">
                    <button
                      type="button"
                      className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                        marketplace === "craigslist"
                          ? getMarketplaceColorClass("craigslist")
                          : "text-muted-foreground hover:text-foreground border-transparent"
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
                          ? getMarketplaceColorClass("facebook")
                          : "text-muted-foreground hover:text-foreground border-transparent"
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
                          ? getMarketplaceColorClass("offerup")
                          : "text-muted-foreground hover:text-foreground border-transparent"
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

                {/* Keyword field - now full width */}
                <div className="space-y-1">
                  <Label htmlFor="keyword" className="text-sm font-medium">
                    What are you hunting for?
                  </Label>
                  <Input
                    id="keyword"
                    name="keyword"
                    placeholder="e.g. iPhone 14, PS5, Herman Miller"
                    className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    required
                    disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                {/* Price inputs side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="minPrice" className="text-sm font-medium">
                      Min Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
                      Max Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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

                {/* Vehicle-specific form fields */}
                {showVehicleFields && (
                  <div className="space-y-3 p-3 bg-secondary/50 rounded-md border border-border">
                    <h3 className="font-medium text-sm">Vehicle Details</h3>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="year" className="text-xs font-medium">
                          Year
                        </Label>
                        <Input
                          id="year"
                          name="year"
                          type="text"
                          placeholder="e.g. 2018"
                          value={vehicleFields.year}
                          onChange={handleVehicleFieldChange}
                          className="h-8 text-sm"
                          disabled={isSubmitting || submitClicked}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="make" className="text-xs font-medium">
                          Make
                        </Label>
                        <Input
                          id="make"
                          name="make"
                          type="text"
                          placeholder="e.g. Toyota"
                          value={vehicleFields.make}
                          onChange={handleVehicleFieldChange}
                          className="h-8 text-sm"
                          disabled={isSubmitting || submitClicked}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="model" className="text-xs font-medium">
                          Model
                        </Label>
                        <Input
                          id="model"
                          name="model"
                          type="text"
                          placeholder="e.g. Camry"
                          value={vehicleFields.model}
                          onChange={handleVehicleFieldChange}
                          className="h-8 text-sm"
                          disabled={isSubmitting || submitClicked}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="minMileage" className="text-xs font-medium">
                          Min Mileage
                        </Label>
                        <Input
                          id="minMileage"
                          name="minMileage"
                          type="text"
                          placeholder="e.g. 0"
                          value={vehicleFields.minMileage}
                          onChange={handleVehicleFieldChange}
                          className="h-8 text-sm"
                          disabled={isSubmitting || submitClicked}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="maxMileage" className="text-xs font-medium">
                          Max Mileage
                        </Label>
                        <Input
                          id="maxMileage"
                          name="maxMileage"
                          type="text"
                          placeholder="e.g. 100,000"
                          value={vehicleFields.maxMileage}
                          onChange={handleVehicleFieldChange}
                          className="h-8 text-sm"
                          disabled={isSubmitting || submitClicked}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Radius and ZIP Code side by side */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between">
                      <Label htmlFor="radius" className="text-sm font-medium">
                        Search Radius <span className="text-xs text-muted-foreground">{radius} miles</span>
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
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            disabled={isSubmitting || searchTermCounts[marketplace] >= 5 || submitClicked}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground px-1 mt-1">
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
                    </div>
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

                <Button
                  ref={submitButtonRef}
                  type="submit"
                  className="w-full h-10 text-base font-medium mt-3 transition-all touch-manipulation discord-button animate-pulse-glow"
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
                    <span className="flex items-center">
                      <Zap className="mr-2 h-4 w-4" />
                      Start Hunting
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
