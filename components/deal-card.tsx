"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/countdown-timer"
import { SwipeableCard } from "@/components/swipeable-card"
import { ExternalLink, Heart, Share2, Zap } from "lucide-react"
import Image from "next/image"

interface DealCardProps {
  id: string
  title: string
  price: number
  originalPrice?: number
  image: string
  location: string
  distance: number
  source: string
  condition: string
  isNew?: boolean
  isHot?: boolean
  isExclusive?: boolean
  endTime: Date
  onView: () => void
  onSave?: () => void
  onShare?: () => void
}

export function DealCard({
  id,
  title,
  price,
  originalPrice,
  image,
  location,
  distance,
  source,
  condition,
  isNew = false,
  isHot = false,
  isExclusive = false,
  endTime,
  onView,
  onSave,
  onShare,
}: DealCardProps) {
  const [saved, setSaved] = useState(false)

  // Format price with dollar sign and commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Calculate discount percentage
  const discountPercentage = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  const handleSave = () => {
    setSaved(!saved)
    if (onSave) onSave()
  }

  return (
    <SwipeableCard onSwipeRight={onView}>
      <Card className="discord-card overflow-hidden">
        <div className="relative">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <div className="deal-badge-new">
                <Zap className="h-3 w-3 mr-1" />
                New
              </div>
            )}
            {isHot && (
              <div className="deal-badge-hot">
                <Zap className="h-3 w-3 mr-1" />
                Hot Deal
              </div>
            )}
            {isExclusive && (
              <div className="deal-badge-exclusive">
                <Zap className="h-3 w-3 mr-1" />
                Exclusive
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <CountdownTimer endTime={endTime} />
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-base line-clamp-2 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {originalPrice && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                <span className="text-xs text-green-600 dark:text-green-400">-{discountPercentage}%</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{location}</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{distance} mi</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{condition}</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{source}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-between">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={handleSave}
              aria-label="Save deal"
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={onShare}
              aria-label="Share deal"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button size="sm" className="discord-button" onClick={onView}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            View Deal
          </Button>
        </CardFooter>
      </Card>
    </SwipeableCard>
  )
}
