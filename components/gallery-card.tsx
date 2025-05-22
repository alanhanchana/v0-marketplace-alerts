"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Zap } from "lucide-react"
import { motion } from "framer-motion"

interface GalleryCardProps {
  deal: {
    id: string
    title: string
    price: number
    distance: number
    image: string
    isHot?: boolean
  }
}

export function GalleryCard({ deal }: GalleryCardProps) {
  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="relative aspect-square w-full">
              <img src={deal.image || "/placeholder.svg"} alt={deal.title} className="object-cover w-full h-full" />
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
                <span className="text-sm font-bold text-primary">{formatPrice(deal.price)}</span>
                <span className="text-xs text-muted-foreground">{deal.distance} mi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
