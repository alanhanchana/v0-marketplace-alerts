import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

// Placeholder images for different categories
const categoryImages: Record<string, string> = {
  iphone: "/modern-smartphone.png",
  phone: "/modern-smartphone.png",
  smartphone: "/modern-smartphone.png",
  playstation: "/gaming-console-setup.png",
  xbox: "/gaming-console-setup.png",
  nintendo: "/gaming-console-setup.png",
  gaming: "/gaming-console-setup.png",
  furniture: "/modern-living-room-coffee-table.png",
  table: "/modern-living-room-coffee-table.png",
  chair: "/modern-living-room-coffee-table.png",
  bike: "/mountain-bike-trail.png",
  bicycle: "/mountain-bike-trail.png",
}

// Function to get an image based on keyword
function getImageForKeyword(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase()

  for (const [key, value] of Object.entries(categoryImages)) {
    if (lowerKeyword.includes(key)) {
      return value
    }
  }

  // Default image if no match
  return "/marketplace-item.png"
}

// Mock data as fallback
const mockAlerts = [
  {
    id: 1,
    keyword: "iPhone 13 Pro - Great Condition",
    max_price: 499,
    zip: "10001",
    image: "/modern-smartphone.png",
  },
  {
    id: 2,
    keyword: "PlayStation 5 Disc Edition",
    max_price: 350,
    zip: "10002",
    image: "/gaming-console-setup.png",
  },
  {
    id: 3,
    keyword: "Vintage Coffee Table",
    max_price: 75,
    zip: "10003",
    image: "/modern-living-room-coffee-table.png",
  },
  {
    id: 4,
    keyword: "Mountain Bike - Trek",
    max_price: 280,
    zip: "10004",
    image: "/mountain-bike-trail.png",
  },
]

export const revalidate = 0 // Revalidate this page on every request

export default async function AlertsPage() {
  // Fetch watchlist items from Supabase
  const { data: watchlistItems, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: false })

  // Use watchlist items if available, otherwise use mock data
  const alerts =
    watchlistItems && watchlistItems.length > 0
      ? watchlistItems.map((item) => ({
          ...item,
          image: getImageForKeyword(item.keyword),
        }))
      : mockAlerts

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Your Alerts</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error loading alerts. Please try again later.
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No alerts yet. Add some on the home page!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="overflow-hidden border-none shadow-md">
              <div className="flex">
                <div className="w-1/3 relative">
                  <Image
                    src={alert.image || "/placeholder.svg"}
                    alt={alert.keyword}
                    width={300}
                    height={200}
                    className="h-full object-cover"
                  />
                </div>
                <div className="w-2/3 flex flex-col">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-base font-medium line-clamp-2">{alert.keyword}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 pb-0 text-sm">
                    <p className="font-bold text-lg">${alert.max_price}</p>
                    <p className="text-gray-500">ZIP: {alert.zip}</p>
                  </CardContent>
                  <CardFooter className="p-3 mt-auto">
                    <Button size="sm" className="w-full">
                      View Deal
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
