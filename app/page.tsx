"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWatchlistItem } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createWatchlistItem(formData)

      if (result.success) {
        router.push("/alerts")
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold">Find Undervalued Deals</CardTitle>
          <CardDescription className="text-base">Get notified when great deals match your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-base">
                What are you looking for?
              </Label>
              <Input
                id="keyword"
                name="keyword"
                placeholder="e.g. iPhone, PlayStation, Furniture"
                className="h-14 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="text-base">
                Maximum Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  placeholder="500"
                  className="h-14 text-lg pl-8"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip" className="text-base">
                ZIP Code
              </Label>
              <Input
                id="zip"
                name="zip"
                placeholder="Enter your ZIP code"
                className="h-14 text-lg"
                required
                pattern="[0-9]{5}"
                title="Please enter a valid 5-digit ZIP code"
              />
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-medium mt-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Start Watching"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
