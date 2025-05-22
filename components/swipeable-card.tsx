"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, type PanInfo, useMotionValue, useTransform } from "framer-motion"

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  swipeThreshold?: number
}

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, swipeThreshold = 100 }: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 0.8, 1, 0.8, 0.5])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)

    if (info.offset.x > swipeThreshold && onSwipeRight) {
      onSwipeRight()
    } else if (info.offset.x < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft()
    }

    // Reset position
    x.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      className="swipeable-card touch-manipulation"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className={`relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}>{children}</div>
    </motion.div>
  )
}
