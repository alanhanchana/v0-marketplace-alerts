"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
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
type MarketplaceOption = "all" | "craigslist" | "facebook" | "offerup"

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [radius, setRadius] = useState(1)
  const [marketplace, setMarketplace] = useState<MarketplaceOption>("all")
  const [maxPrice, setMaxPrice] = useState("")
  const [keyword, setKeyword] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [isFormValid, setIsFormValid] = useState(false)
  const [searchTermCount, setSearchTermCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const formRef = useRef<HTMLFormElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  // Check form validity whenever inputs change
  useEffect(() => {
    const isValid = keyword.trim() !== "" && maxPrice.trim() !== "" && zipCode.trim() !== "" && /^\d{5}$/.test(zipCode)
    setIsFormValid(isValid)
  }, [keyword, maxPrice, zipCode])

  // Get the count of existing search terms
  useEffect(() => {
    async function fetchSearchTermCount() {
      setIsLoading(true)
      try {
        const { count, error } = await supabase.from("watchlist").select("*", { count: "exact", head: true })

        if (error) {
          console.error("Error fetching search term count:", error)
          return
        }

        setSearchTermCount(count || 0)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchTermCount()
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

  // Handle max price input change
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberWithCommas(e.target.value)
    setMaxPrice(formattedValue)
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
      if (isSubmitting) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    form.addEventListener("submit", handleSubmitCapture, true)
    return () => {
      form.removeEventListener("submit", handleSubmitCapture, true)
    }
  }, [isSubmitting])

  // Handle radius changes from either input
  const handleRadiusChange = (value: number) => {
    // Ensure value is between 0 and 100
    const validatedValue = Math.min(Math.max(0, value), 100)
    setRadius(validatedValue)
  }

  async function handleSubmit(formData: FormData) {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring")
      return
    }

    // Check if we've reached the limit
    if (searchTermCount >= 5) {
      setError("You can only have 5 saved search terms. Please delete one to add more.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Add marketplace to form data
      formData.append("marketplace", marketplace)

      // Replace the formatted max price with the raw number
      formData.delete("maxPrice")
      const rawMaxPrice = maxPrice.replace(/,/g, "")
      formData.append("maxPrice", rawMaxPrice)

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
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-4 max-w-md mx-auto">
      <Card className="border shadow-md rounded-xl overflow-hidden">
        <CardHeader className="text-center py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-xl md:text-2xl font-bold">Find Undervalued Deals</CardTitle>
          <CardDescription className="text-sm mt-1">Get notified when great deals match your criteria</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-4 text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchTermCount >= 5 && (
            <Alert className="mb-4 text-sm bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum of 5 saved search terms. Please delete one to add more.
              </AlertDescription>
            </Alert>
          )}

          <form ref={formRef} action={handleSubmit} className="space-y-4" noValidate>
            {/* Marketplace Toggle */}
            <div className="flex justify-center mb-1">
              <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg flex-wrap justify-center">
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 ${
                    marketplace === "all" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMarketplace("all")}
                >
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                  All Markets
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 ${
                    marketplace === "craigslist"
                      ? "bg-white shadow-sm text-gray-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMarketplace("craigslist")}
                >
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
                  Craigslist
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 ${
                    marketplace === "facebook"
                      ? "bg-white shadow-sm text-gray-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMarketplace("facebook")}
                >
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
                  FB Marketplace
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 ${
                    marketplace === "offerup" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMarketplace("offerup")}
                >
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
                  OfferUp
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-sm font-medium">
                What are you looking for?
              </Label>
              <Input
                id="keyword"
                name="keyword"
                placeholder="e.g. iPhone, PlayStation, Furniture"
                className="h-11 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                required
                disabled={isSubmitting || searchTermCount >= 5}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Price and ZIP side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-sm font-medium">
                  Maximum Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">$</span>
                  <Input
                    id="maxPrice"
                    name="maxPrice"
                    type="text"
                    inputMode="numeric"
                    placeholder="500"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="h-11 text-base pl-8 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    required
                    disabled={isSubmitting || searchTermCount >= 5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip" className="text-sm font-medium">
                  ZIP Code
                </Label>
                <Input
                  id="zip"
                  name="zip"
                  placeholder="Enter ZIP"
                  className="h-11 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  minLength={5}
                  inputMode="numeric"
                  disabled={isSubmitting || searchTermCount >= 5}
                  title="Please enter a valid 5-digit ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="radius" className="text-sm font-medium">
                  Search Radius
                </Label>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {radius} {radius === 1 ? "mile" : "miles"}
                </span>
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
                      disabled={isSubmitting || searchTermCount >= 5}
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
                    type="number"
                    id="radius"
                    name="radius"
                    min="0"
                    max="100"
                    value={radius}
                    onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value || "0"))}
                    className="h-9 text-center text-sm"
                    disabled={isSubmitting || searchTermCount >= 5}
                    aria-label="Radius in miles"
                  />
                </div>

                <div className="w-10 flex-shrink-0 text-xs">miles</div>
              </div>
            </div>

            <Button
              ref={submitButtonRef}
              type="submit"
              className="w-full h-12 text-base font-medium mt-4 transition-all touch-manipulation"
              disabled={isSubmitting || !isFormValid || searchTermCount >= 5 || isLoading}
            >
              {isSubmitting ? (
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
              ) : searchTermCount >= 5 ? (
                "Maximum Limit Reached"
              ) : (
                "Start Watching"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
