"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowRight, DollarSign, Search, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function CarFlipperPage() {
  const { toast } = useToast()
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [excludedTerms, setExcludedTerms] = useState<string[]>([])
  const [excludedTerm, setExcludedTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sources, setSources] = useState({
    craigslist: true,
    facebook: true,
    offerup: false,
    auctions: false,
  })
  const [conditions, setConditions] = useState({
    clean: true,
    salvage: false,
    rebuilt: false,
  })

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "💰 Deal Scanner Active",
        description: `We'll alert you to undervalued ${make} ${model} listings under $${maxPrice}`,
        duration: 3000,
      })
      setIsSubmitting(false)
    }, 800)
  }

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
    const formattedValue = formatNumberWithCommas(e.target.value)
    setMaxPrice(formattedValue)
  }

  // Toggle source
  const toggleSource = (source: keyof typeof sources) => {
    setSources({
      ...sources,
      [source]: !sources[source],
    })
  }

  // Toggle condition
  const toggleCondition = (condition: keyof typeof conditions) => {
    setConditions({
      ...conditions,
      [condition]: !conditions[condition],
    })
  }

  // Add excluded term
  const addExcludedTerm = () => {
    if (excludedTerm && !excludedTerms.includes(excludedTerm)) {
      setExcludedTerms([...excludedTerms, excludedTerm])
      setExcludedTerm("")
    }
  }

  // Remove excluded term
  const removeExcludedTerm = (term: string) => {
    setExcludedTerms(excludedTerms.filter((t) => t !== term))
  }

  // Handle key press for excluded terms
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addExcludedTerm()
    }
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-heading mb-2">Car Flip Finder</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Scan listings 24/7 to catch undervalued vehicles before other flippers
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative"
      >
        <Card className="discord-card overflow-hidden relative z-0 border-primary/20">
          <CardHeader className="space-y-1 p-4 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Quick Flip Scanner
              </CardTitle>
              <div className="deal-badge-exclusive">
                <TrendingUp className="h-3 w-3 mr-1" />
                Fast Cash
              </div>
            </div>
            <CardDescription>Find underpriced vehicles to flip for profit</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Make and Model inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="make" className="text-sm font-medium">
                    Make
                  </Label>
                  <Input
                    id="make"
                    name="make"
                    placeholder="e.g. Honda"
                    className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Model
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g. Civic"
                    className="h-9 text-base transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
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
                    placeholder="5,000"
                    value={maxPrice}
                    onChange={handlePriceChange}
                    className="h-9 text-sm pl-6 transition-all focus-visible:ring-2 focus-visible:ring-offset-1"
                    required
                  />
                </div>
              </div>

              {/* Sources */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Where to Search</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant={sources.craigslist ? "default" : "outline"}
                    className={`cursor-pointer ${
                      sources.craigslist ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleSource("craigslist")}
                  >
                    Craigslist
                  </Badge>
                  <Badge
                    variant={sources.facebook ? "default" : "outline"}
                    className={`cursor-pointer ${
                      sources.facebook ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleSource("facebook")}
                  >
                    Facebook
                  </Badge>
                  <Badge
                    variant={sources.offerup ? "default" : "outline"}
                    className={`cursor-pointer ${
                      sources.offerup ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleSource("offerup")}
                  >
                    OfferUp
                  </Badge>
                  <Badge
                    variant={sources.auctions ? "default" : "outline"}
                    className={`cursor-pointer ${
                      sources.auctions ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleSource("auctions")}
                  >
                    Auctions
                  </Badge>
                </div>
              </div>

              {/* Title Condition */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Title Condition</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant={conditions.clean ? "default" : "outline"}
                    className={`cursor-pointer ${
                      conditions.clean ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleCondition("clean")}
                  >
                    Clean Title
                  </Badge>
                  <Badge
                    variant={conditions.salvage ? "default" : "outline"}
                    className={`cursor-pointer ${
                      conditions.salvage ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleCondition("salvage")}
                  >
                    Salvage
                  </Badge>
                  <Badge
                    variant={conditions.rebuilt ? "default" : "outline"}
                    className={`cursor-pointer ${
                      conditions.rebuilt ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleCondition("rebuilt")}
                  >
                    Rebuilt
                  </Badge>
                </div>
              </div>

              {/* Excluded Terms */}
              <div className="space-y-1">
                <Label htmlFor="excludedTerms" className="text-sm font-medium">
                  Exclude Listings With These Terms
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="excludedTerms"
                    placeholder="e.g. damaged, project"
                    value={excludedTerm}
                    onChange={(e) => setExcludedTerm(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={addExcludedTerm}
                    disabled={!excludedTerm}
                  >
                    Add
                  </Button>
                </div>
                {excludedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {excludedTerms.map((term) => (
                      <Badge key={term} variant="secondary" className="gap-1">
                        {term}
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-muted"
                          onClick={() => removeExcludedTerm(term)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {term}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-base font-medium mt-3 transition-all touch-manipulation discord-button"
                disabled={isSubmitting || !maxPrice}
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
                    Scanning...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Start Scanning For Deals
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
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-6 text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2">
              <Search className="h-3.5 w-3.5 text-green-500" />
            </div>
            <span className="text-sm">24/7 Scanning</span>
          </div>
          <div className="flex items-center">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            </div>
            <span className="text-sm">Instant Alerts</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
