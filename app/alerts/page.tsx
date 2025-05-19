import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Mock data for the alerts
const mockAlerts = [
  {
    id: 1,
    title: "iPhone 13 Pro - Great Condition",
    price: 499,
    location: "Brooklyn, NY",
    image: "/modern-smartphone.png",
  },
  {
    id: 2,
    title: "PlayStation 5 Disc Edition",
    price: 350,
    location: "Queens, NY",
    image: "/gaming-console-setup.png",
  },
  {
    id: 3,
    title: "Vintage Coffee Table",
    price: 75,
    location: "Manhattan, NY",
    image: "/modern-living-room-coffee-table.png",
  },
  {
    id: 4,
    title: "Mountain Bike - Trek",
    price: 280,
    location: "Bronx, NY",
    image: "/mountain-bike-trail.png",
  },
]

export default function AlertsPage() {
  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Your Alerts</h1>

      <div className="space-y-4">
        {mockAlerts.map((alert) => (
          <Card key={alert.id} className="overflow-hidden border-none shadow-md">
            <div className="flex">
              <div className="w-1/3 relative">
                <Image
                  src={alert.image || "/placeholder.svg"}
                  alt={alert.title}
                  width={300}
                  height={200}
                  className="h-full object-cover"
                />
              </div>
              <div className="w-2/3 flex flex-col">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-base font-medium line-clamp-2">{alert.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1 pb-0 text-sm">
                  <p className="font-bold text-lg">${alert.price}</p>
                  <p className="text-gray-500">{alert.location}</p>
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
    </div>
  )
}
