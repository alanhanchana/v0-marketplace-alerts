"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, ExternalLink, Heart, Zap, DollarSign } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

interface DealProps {
  deal: {
    id: string
    title: string
    price: number
    originalPrice: number
    discount: number
    location: string
    distance: number
    image: string
    timePosted: string
    source: string
    isHot: boolean
    category: string
  }
}

export function DealCard({ deal }: DealProps) {
  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
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
      default:
        return null
    }
  }

  // Get source color class
  const getSourceColorClass = (source: string) => {
    switch (source) {
      case "craigslist":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "facebook":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "offerup":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="relative h-full"
    >
      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:shadow-md h-full">
        <CardContent className="p-0">
          <div className="flex">
            <div className="relative w-1/3 h-32">
              <Image
                src={deal.image || "/placeholder.svg"}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {deal.isHot && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-0.5 px-2 rounded-full flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Hot Deal
                </div>
              )}
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className={`text-xs ${getSourceColorClass(deal.source)}`}>
                  {getSourceIcon(deal.source)}
                  {deal.source === "facebook"
                    ? "FB Marketplace"
                    : deal.source.charAt(0).toUpperCase() + deal.source.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="w-2/3 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{deal.title}</h3>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-primary">{formatPrice(deal.price)}</span>
                    {deal.discount > 0 && (
                      <span className="text-xs line-through text-muted-foreground ml-2">
                        {formatPrice(deal.originalPrice)}
                      </span>
                    )}
                  </div>
                  {deal.discount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200 text-xs dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                    >
                      <DollarSign className="h-3 w-3 mr-0.5" />
                      {deal.discount}% off
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>
                    {deal.location} • {deal.distance} mi
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{deal.timePosted}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Heart className="h-4 w-4" />
                    <span className="sr-only">Save</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
