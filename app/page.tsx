"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Clock, Zap, ChevronDown } from "lucide-react"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [deals, setDeals] = useState<any[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [milesFilter, setMilesFilter] = useState(30)

  // Check if this is the first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedSnipr")
    if (!hasVisited) {
      setShowOnboarding(true)
      localStorage.setItem("hasVisitedSnipr", "true")
    }
  }, [])

  // Simulate loading deals
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock data for deals
      const mockDeals = [
        {
          id: "1",
          title: "iPhone 13 Pro - Mint Condition",
          price: 599,
          originalPrice: 999,
          discount: 40,
          location: "New York, NY",
          distance: 2.4,
          image: "/modern-smartphone.png",
          timePosted: "10 minutes ago",
          source: "facebook",
          isHot: true,
          category: "electronics",
        },
        {
          id: "2",
          title: "Herman Miller Aeron Chair",
          price: 450,
          originalPrice: 1200,
          discount: 62,
          location: "Chicago, IL",
          distance: 3.1,
          image: "/modern-living-room-coffee-table.png",
          timePosted: "32 minutes ago",
          source: "craigslist",
          isHot: true,
          category: "furniture",
        },
        {
          id: "3",
          title: "PlayStation 5 Disc Edition",
          price: 350,
          originalPrice: 500,
          discount: 30,
          location: "Los Angeles, CA",
          distance: 5.7,
          image: "/gaming-console-setup.png",
          timePosted: "1 hour ago",
          source: "offerup",
          isHot: false,
          category: "electronics",
        },
        {
          id: "4",
          title: "Trek Mountain Bike - Barely Used",
          price: 780,
          originalPrice: 1500,
          discount: 48,
          location: "Denver, CO",
          distance: 8.2,
          image: "/mountain-bike-trail.png",
          timePosted: "3 hours ago",
          source: "facebook",
          isHot: false,
          category: "sports",
        },
        {
          id: "5",
          title: "Vintage Coffee Table - Solid Wood",
          price: 120,
          originalPrice: 400,
          discount: 70,
          location: "Seattle, WA",
          distance: 4.5,
          image: "/marketplace-item.png",
          timePosted: "5 hours ago",
          source: "craigslist",
          isHot: false,
          category: "furniture",
        },
        {
          id: "6",
          title: "MacBook Pro M1 - Like New",
          price: 899,
          originalPrice: 1299,
          discount: 30,
          location: "Boston, MA",
          distance: 6.8,
          image: "/modern-smartphone.png",
          timePosted: "7 hours ago",
          source: "facebook",
          isHot: true,
          category: "electronics",
        },
      ]

      setDeals(mockDeals)
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Filter deals based on active category and distance
  const filteredDeals = deals.filter((deal) => {
    const categoryMatch = activeCategory === "all" || deal.category === activeCategory
    const distanceMatch = deal.distance <= milesFilter
    return categoryMatch && distanceMatch
  })

  // Available categories
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "electronics", label: "Electronics" },
    { value: "furniture", label: "Furniture" },
    { value: "clothing", label: "Clothing" },
    { value: "sports", label: "Sports" },
    { value: "vehicles", label: "Vehicles" },
    { value: "toys", label: "Toys & Games" },
  ]

  // Available distance options
  const distanceOptions = [5, 10, 15, 30, 50, 100]

  // Get current category label
  const getCurrentCategoryLabel = () => {
    const category = categories.find((c) => c.value === activeCategory)
    return category ? category.label : "All Categories"
  }

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <div className="py-6 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {getCurrentCategoryLabel()}
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={activeCategory === category.value ? "bg-secondary" : ""}
                >
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {milesFilter} mi
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {distanceOptions.map((distance) => (
                <DropdownMenuItem
                  key={distance}
                  onClick={() => setMilesFilter(distance)}
                  className={milesFilter === distance ? "bg-secondary" : ""}
                >
                  {distance} miles
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Finding the best deals for you...</p>
          </div>
        ) : filteredDeals.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Last updated 2 minutes ago</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredDeals.map((deal) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        <div className="relative aspect-square w-full">
                          <img
                            src={deal.image || "/placeholder.svg"}
                            alt={deal.title}
                            className="object-cover w-full h-full"
                          />
                          {deal.isHot && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-0.5 px-2 rounded-full flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              Hot
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-xs line-clamp-1">{deal.title}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-bold text-primary">${deal.price}</span>
                            <span className="text-xs text-muted-foreground">{deal.distance} mi</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center pt-4 pb-8">
              <Button variant="outline" size="sm" className="text-xs">
                Load More Deals
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-secondary/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No deals found for this filter</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory("all")
                  setMilesFilter(30)
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
