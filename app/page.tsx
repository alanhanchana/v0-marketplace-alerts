"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createWatchlistItem } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [radius, setRadius] = useState(1)
  const formRef = useRef<HTMLFormElement>(null)

  // Handle radius changes from either input
  const handleRadiusChange = (value: number) => {
    // Ensure value is between 0 and 100
    const validatedValue = Math.min(Math.max(0, value), 100)
    setRadius(validatedValue)
  }

  async function handleSubmit(formData: FormData) {
    // Prevent multiple submissions
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createWatchlistItem(formData)

      if (result.success && result.data) {
        // Show success toast with the keyword and zip
        toast({
          title: "🔔 Alert Created",
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
    <div className="py-8 max-w-md mx-auto">
      <Card className="border shadow-md rounded-xl overflow-hidden">
        <CardHeader className="text-center pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl md:text-3xl font-bold">Find Undervalued Deals</CardTitle>
          <CardDescription className="text-base mt-2">
            Get notified when great deals match your criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form ref={formRef} action={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2.5">
              <Label htmlFor="keyword" className="text-base font-medium">
                What are you looking for?
              </Label>
              <Input
                id="keyword"
                name="keyword"
                placeholder="e.g. iPhone, PlayStation, Furniture"
                className="h-14 text-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="maxPrice" className="text-base font-medium">
                Maximum Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  placeholder="500"
                  className="h-14 text-lg pl-8 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                  required
                  min="1"
                  step="1"
                  disabled={isSubmitting}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="zip" className="text-base font-medium">
                ZIP Code
              </Label>
              <Input
                id="zip"
                name="zip"
                placeholder="Enter your ZIP code"
                className="h-14 text-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                required
                pattern="[0-9]{5}"
                maxLength={5}
                minLength={5}
                inputMode="numeric"
                disabled={isSubmitting}
                title="Please enter a valid 5-digit ZIP code"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <Label htmlFor="radius" className="text-base font-medium">
                Search Radius
              </Label>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex-grow">
                  <div>
                    <input
                      type="range"
                      id="radius-slider"
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

                <div className="w-20 flex-shrink-0">
                  <Input
                    type="number"
                    id="radius"
                    name="radius"
                    min="0"
                    max="100"
                    value={radius}
                    onChange={(e) => handleRadiusChange(Number.parseInt(e.target.value || "0"))}
                    className="h-10 text-center"
                    disabled={isSubmitting}
                    aria-label="Radius in miles"
                  />
                </div>

                <div className="w-14 flex-shrink-0 text-sm">miles</div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-medium mt-8 transition-all"
              disabled={isSubmitting}
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
