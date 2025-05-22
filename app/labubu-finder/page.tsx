"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Sparkles, Ghost, ArrowRight, Heart, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LabubuFinderPage() {
  const { toast } = useToast()
  const [character, setCharacter] = useState("")
  const [rarity, setRarity] = useState("common")
  const [maxPrice, setMaxPrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "🧸 Labubu Alert Set!",
        description: `We'll notify you when we find a ${character} Labubu!`,
        duration: 3000,
      })
      setIsSubmitting(false)
    }, 1500)
  }

  // Get rarity badge style
  const getRarityBadgeStyle = (rarityOption: string): string => {
    switch (rarityOption) {
      case "common":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
      case "rare":
        return "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/50"
      case "legendary":
        return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
    }
  }

  // Get rarity icon
  const getRarityIcon = (rarityOption: string) => {
    switch (rarityOption) {
      case "common":
        return <Ghost className="h-3.5 w-3.5 mr-1" />
      case "rare":
        return <Sparkles className="h-3.5 w-3.5 mr-1" />
      case "legendary":
        return <Star className="h-3.5 w-3.5 mr-1" />
      default:
        return <Ghost className="h-3.5 w-3.5 mr-1" />
    }
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-heading mb-3">Find Your Dream Labubu</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Our Labubu-hunting AI scans the internet 24/7 to find your favorite collectible characters.
        </p>
      </motion.div>

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
                <Ghost className="h-5 w-5 mr-2 text-pink-500" />
                Labubu Hunter
              </CardTitle>
              <div className="deal-badge-exclusive">
                <Sparkles className="h-3 w-3 mr-1" />
                Collector Edition
              </div>
            </div>
            <CardDescription>Tell us which Labubu you're hunting for</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {error && (
              <Alert variant="destructive" className="mb-3 text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Rarity Toggle */}
              <div className="flex justify-center mb-1">
                <div className="inline-flex items-center p-1 bg-secondary rounded-lg flex-wrap justify-center">
                  <button
                    type="button"
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                      rarity === "common"
                        ? getRarityBadgeStyle("common")
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    }`}
                    onClick={() => setRarity("common")}
                  >
                    {getRarityIcon("common")}
                    Common
                  </button>
                  <button
                    type="button"
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                      rarity === "rare"
                        ? getRarityBadgeStyle("rare")
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    }`}
                    onClick={() => setRarity("rare")}
                  >
                    {getRarityIcon("rare")}
                    Rare
                  </button>
                  <button
                    type="button"
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors m-0.5 border ${
                      rarity === "legendary"
                        ? getRarityBadgeStyle("legendary")
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    }`}
                    onClick={() => setRarity("legendary")}
                  >
                    {getRarityIcon("legendary")}
                    Legendary
                  </button>
                </div>
              </div>

              {/* Character input */}
              <div className="space-y-1">
                <Label htmlFor="character" className="text-sm font-medium">
                  Which Labubu are you looking for?
                </Label>
                <Input
                  id="character"
                  name="character"
                  placeholder="e.g. Dimoo, Skullpanda, Molly"
                  className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                  required
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                />
              </div>

              {/* Max price input */}
              <div className="space-y-1">
                <Label htmlFor="maxPrice" className="text-sm font-medium">
                  Maximum Price
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="maxPrice"
                    name="maxPrice"
                    type="text"
                    inputMode="numeric"
                    placeholder="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9 text-sm pl-6 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    required
                  />
                </div>
              </div>

              {/* Color options */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Color Variants</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-pink-400 cursor-pointer ring-2 ring-offset-2 ring-pink-400"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-400 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-400 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-green-400 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-400 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-red-400 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 cursor-pointer"></div>
                </div>
              </div>

              {/* Special features */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Special Features</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="glow" className="rounded text-pink-500 focus:ring-pink-500" />
                    <label htmlFor="glow" className="text-sm">
                      Glow in the Dark
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="limited" className="rounded text-pink-500 focus:ring-pink-500" />
                    <label htmlFor="limited" className="text-sm">
                      Limited Edition
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="signed" className="rounded text-pink-500 focus:ring-pink-500" />
                    <label htmlFor="signed" className="text-sm">
                      Artist Signed
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="boxed" className="rounded text-pink-500 focus:ring-pink-500" />
                    <label htmlFor="boxed" className="text-sm">
                      Original Box
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-base font-medium mt-3 transition-all touch-manipulation bg-pink-500 hover:bg-pink-600 text-white"
                disabled={isSubmitting || !character || !maxPrice}
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
                  <span className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    Find My Labubu
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 text-center"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mr-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
              </div>
              <span className="text-sm">Authentic Verification</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mr-2">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
              <span className="text-sm">Collector Network</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Join thousands of Labubu collectors finding their dream figures before anyone else!
          </p>
        </div>
      </motion.div>
    </div>
  )
}
