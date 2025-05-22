"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  endTime: Date
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onComplete, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsComplete(true)
        if (onComplete) onComplete()
        return { hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onComplete])

  const formatTime = (value: number) => {
    return value.toString().padStart(2, "0")
  }

  if (isComplete) {
    return (
      <div className={`countdown-timer text-destructive ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        <span>Expired</span>
      </div>
    )
  }

  return (
    <div className={`countdown-timer ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      <span>
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    </div>
  )
}
