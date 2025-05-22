"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Zap, DollarSign, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New iPhone 13 deal found",
      description: "iPhone 13 Pro - Mint Condition for $599",
      time: "10 minutes ago",
      type: "deal",
      read: false,
    },
    {
      id: 2,
      title: "Price drop alert",
      description: "PlayStation 5 price dropped to $350",
      time: "2 hours ago",
      type: "price",
      read: false,
    },
    {
      id: 3,
      title: "New deals in your area",
      description: "5 new deals found near your location",
      time: "Yesterday",
      type: "alert",
      read: true,
    },
    {
      id: 4,
      title: "Weekly deal summary",
      description: "Check out this week's best deals",
      time: "3 days ago",
      type: "summary",
      read: true,
    },
  ])

  const getIcon = (type: string) => {
    switch (type) {
      case "deal":
        return <Zap className="h-5 w-5 text-primary" />
      case "price":
        return <DollarSign className="h-5 w-5 text-green-500" />
      case "alert":
        return <Bell className="h-5 w-5 text-amber-500" />
      case "summary":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5"
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated on the latest deals and alerts</p>
      </motion.div>

      <div className="mb-6 flex items-center justify-between">
        <Label htmlFor="notifications-toggle" className="text-sm font-medium">
          Enable notifications
        </Label>
        <Switch id="notifications-toggle" defaultChecked />
      </div>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className={`overflow-hidden ${notification.read ? "opacity-70" : ""}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${notification.read ? "" : "font-semibold"}`}>{notification.title}</h3>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            We'll notify you when we find new deals or when prices drop on items you're watching.
          </p>
        </div>
      )}
    </div>
  )
}
