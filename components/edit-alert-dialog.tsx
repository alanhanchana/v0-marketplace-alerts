"use client"

import type React from "react"

import { useState } from "react"
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
  const [marketplace, setMarketplace] = useState<"craigslist" | "facebook">(
    (alert.marketplace as "craigslist" | "facebook") || "craigslist",
  )
  const [formValues, setFormValues] = useState({
    keyword: alert.keyword,
    maxPrice: alert.max_price,
    zip: alert.zip,
  })

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
      formData.append("maxPrice", formValues.maxPrice.toString())
      formData.append("zip", formValues.zip)
      formData.append("radius", radius.toString())
      formData.append("marketplace", marketplace)

      // Show optimistic toast immediately
      toast({
        title: "Saving Changes...",
        description: "Updating your alert settings",
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
          title: "Alert Updated",
          description: "Your alert has been updated successfully",
          duration: 3000,
        })
      } else {
        setError(result.error || "Failed to update alert")
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
          <DialogTitle>Edit Alert</DialogTitle>
          <DialogDescription>Update your alert settings. Click save when you're done.</DialogDescription>
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
            <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  marketplace === "craigslist"
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setMarketplace("craigslist")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
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
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  marketplace === "facebook" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setMarketplace("facebook")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
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
                  type="number"
                  value={formValues.maxPrice}
                  onChange={handleInputChange}
                  className="pl-8"
                  required
                  min="1"
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
                    type="range"
                    id="edit-radius-slider"
                    min="0"
                    max="100"
                    value={radius}
                    onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
