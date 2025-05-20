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

// Type for marketplace options
type MarketplaceOption = "all" | "craigslist" | "facebook" | "offerup"

interface EditAlertDialogProps {
  alert: {
    id: string
    keyword: string
    max_price: number
    zip: string
    radius: number
    marketplace?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onAlertUpdated?: (updatedAlert: any) => void
}

export function EditAlertDialog({ alert, open, onOpenChange, onAlertUpdated }: EditAlertDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(alert.radius || 1)
  const [marketplace, setMarketplace] = useState<MarketplaceOption>((alert.marketplace as MarketplaceOption) || "all")
  const [formValues, setFormValues] = useState({
    keyword: alert.keyword,
    maxPrice: alert.max_price.toLocaleString("en-US"),
    zip: alert.zip,
  })
  const sliderRef = useRef<HTMLInputElement>(null)

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
    setFormValues({
      ...formValues,
      maxPrice: formattedValue,
    })
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Create FormData manually
      const formData = new FormData()
      formData.append("id", alert.id)
      formData.append("keyword", formValues.keyword)

      // Remove commas from price before submitting
      const rawMaxPrice = formValues.maxPrice.replace(/,/g, "")
      formData.append("maxPrice", rawMaxPrice)

      formData.append("zip", formValues.zip)
      formData.append("radius", radius.toString())
      formData.append("marketplace", marketplace)

      // Show optimistic toast immediately
      toast({
        title: "Saving Changes...",
        description: "Updating your search term settings",
        duration: 2000,
      })

      // Actually update in the database
      const result = await updateWatchlistItem(formData)

      if (result.success && result.data) {
        // Manually update the UI with the updated alert
        if (onAlertUpdated) {
          const updatedAlert = {
            ...result.data,
            image: alert.image, // Keep the image
          }
          onAlertUpdated(updatedAlert)
        }

        // Close the dialog after successful update
        onOpenChange(false)

        toast({
          title: "Search Term Updated",
          description: "Your search term has been updated successfully",
          duration: 3000,
        })
      } else {
        setError(result.error || "Failed to update search term")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-50">
        <DialogHeader>
          <DialogTitle>Edit Search Term</DialogTitle>
          <DialogDescription>Update your search term settings. Click save when you're done.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={alert.id} />

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
                  marketplace === "facebook" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
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
            <Label htmlFor="edit-keyword">What are you looking for?</Label>
            <Input
              id="edit-keyword"
              name="keyword"
              value={formValues.keyword}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Price and ZIP side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-maxPrice">Maximum Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="edit-maxPrice"
                  name="maxPrice"
                  type="text"
                  inputMode="numeric"
                  value={formValues.maxPrice}
                  onChange={handleMaxPriceChange}
                  className="pl-8"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-zip">ZIP Code</Label>
              <Input
                id="edit-zip"
                name="zip"
                value={formValues.zip}
                onChange={handleInputChange}
                required
                pattern="[0-9]{5}"
                maxLength={5}
                minLength={5}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="edit-radius">Search Radius</Label>
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
                    id="edit-radius-slider"
                    min="0"
                    max="100"
                    value={radius}
                    onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${radius}%, #e5e7eb ${radius}%, #e5e7eb 100%)`,
                    }}
                    disabled={isSubmitting}
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
                  id="edit-radius"
                  name="radius"
                  min="0"
                  max="100"
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value || "0"))}
                  className="h-9 text-center text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div className="w-10 flex-shrink-0 text-xs">miles</div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
