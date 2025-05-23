"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { updateWatchlistItem } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

// Type for marketplace options
type MarketplaceOption = "craigslist" | "facebook" | "offerup"

interface EditAlertDialogProps {
  alert: {
    id: string
    keyword: string
    min_price?: number
    max_price: number
    zip: string
    radius: number
    marketplace?: string
    category?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onAlertUpdated?: (updatedAlert: any) => void
}

export function EditAlertDialog({ alert, open, onOpenChange, onAlertUpdated }: EditAlertDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(alert.radius || 1)
  const [marketplace, setMarketplace] = useState<MarketplaceOption>(
    (alert.marketplace as MarketplaceOption) || "craigslist",
  )
  const [category, setCategory] = useState(alert.category || "all")
  const [formValues, setFormValues] = useState({
    keyword: alert.keyword,
    minPrice: (alert.min_price || 0).toLocaleString("en-US"),
    maxPrice: alert.max_price.toLocaleString("en-US"),
    zip: alert.zip,
  })
  const sliderRef = useRef<HTMLInputElement>(null)
  const [minPriceValue, setMinPriceValue] = useState(alert.min_price || 0)
  const [maxPriceValue, setMaxPriceValue] = useState(alert.max_price)
  const [priceError, setPriceError] = useState<string | null>(null)

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

  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = formatNumberWithCommas(value)
    setFormValues({
      ...formValues,
      [name]: formattedValue,
    })

    // Parse the actual numeric value
    const numericValue = Number.parseInt(value.replace(/,/g, "")) || 0
    setMaxPriceValue(numericValue)

    // Validate min/max price relationship
    validatePrices(minPriceValue, numericValue)
  }

  // Add minPrice handling function
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberWithCommas(e.target.value)
    setFormValues({
      ...formValues,
      minPrice: formattedValue,
    })

    // Parse the actual numeric value
    const numericValue = Number.parseInt(e.target.value.replace(/,/g, "")) || 0
    setMinPriceValue(numericValue)

    // Validate min/max price relationship
    validatePrices(numericValue, maxPriceValue)
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

  // Handle radius changes from either input
  const handleRadiusChange = (value: number) => {
    // Ensure value is between 0 and 100
    const validatedValue = Math.min(Math.max(0, value), 100)
    setRadius(validatedValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues({
      ...formValues,
      [name]: value,
    })
  }

  // Get marketplace icon
  const getMarketplaceIcon = (marketplaceOption: MarketplaceOption) => {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) return

    // Validate min/max price relationship
    if (priceError) {
      setError(priceError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create FormData manually
      const formData = new FormData()
      formData.append("id", alert.id)
      formData.append("keyword", formValues.keyword)

      // Add user ID if available
      if (user) {
        formData.append("user_id", user.id)
      }

      // Remove commas from prices before submitting
      if (formValues.minPrice) {
        const rawMinPrice = formValues.minPrice.replace(/,/g, "")
        formData.append("minPrice", rawMinPrice)
      }

      const rawMaxPrice = formValues.maxPrice.replace(/,/g, "")
      formData.append("maxPrice", rawMaxPrice)

      formData.append("zip", formValues.zip)
      formData.append("radius", radius.toString())
      formData.append("marketplace", marketplace)
      formData.append("category", category)

      // Show optimistic toast immediately
      toast({
        title: "Saving Changes...",
        description: "Updating your search term settings",
        duration: 2000,
      })

      // Actually update in the database
      const result = await updateWatchlistItem(formData)

      if (result.success && result.data) {
        // Close the dialog
        onOpenChange(false)

        // Call the callback if provided
        if (onAlertUpdated) {
          onAlertUpdated(result.data)
        }

        // Show success toast
        toast({
          title: "Changes Saved",
          description: "Your search term has been updated",
          duration: 3000,
        })
      } else {
        setError(result.error || "Failed to update search term")
        setIsSubmitting(false)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while updating the alert.")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl border-border/50 bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle>Edit Alert</DialogTitle>
          <DialogDescription>Make changes to your alert here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="keyword" className="text-right">
                Keyword
              </Label>
              <Input
                type="text"
                id="keyword"
                name="keyword"
                value={formValues.keyword}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minPrice" className="text-right">
                Min Price
              </Label>
              <Input
                type="text"
                id="minPrice"
                name="minPrice"
                value={formValues.minPrice}
                onChange={handleMinPriceChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxPrice" className="text-right">
                Max Price
              </Label>
              <Input
                type="text"
                id="maxPrice"
                name="maxPrice"
                value={formValues.maxPrice}
                onChange={handlePriceChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="zip" className="text-right">
                Zip Code
              </Label>
              <Input
                type="text"
                id="zip"
                name="zip"
                value={formValues.zip}
                onChange={handleInputChange}
                className="col-span-3"
                required
                pattern="[0-9]{5}"
                maxLength={5}
                minLength={5}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="radius" className="text-right">
                Radius
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="range"
                  id="radius"
                  min="1"
                  max="100"
                  value={radius}
                  ref={sliderRef}
                  className="h-2 w-full appearance-none rounded-lg bg-gray-300 accent-blue-500"
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                />
                <Input
                  type="number"
                  id="radius-value"
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="w-16 ml-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Marketplace</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors border ${
                    marketplace === "craigslist" ? getMarketplaceColorClass("craigslist") : "border-transparent"
                  }`}
                  onClick={() => setMarketplace("craigslist")}
                >
                  {getMarketplaceIcon("craigslist")}
                  Craigslist
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors border ${
                    marketplace === "facebook" ? getMarketplaceColorClass("facebook") : "border-transparent"
                  }`}
                  onClick={() => setMarketplace("facebook")}
                >
                  {getMarketplaceIcon("facebook")}
                  FB Marketplace
                </button>
                <button
                  type="button"
                  className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors border ${
                    marketplace === "offerup" ? getMarketplaceColorClass("offerup") : "border-transparent"
                  }`}
                  onClick={() => setMarketplace("offerup")}
                >
                  {getMarketplaceIcon("offerup")}
                  OfferUp
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3 h-9 px-3 py-2 text-sm rounded-md border border-input bg-background"
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="discord-button">
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
