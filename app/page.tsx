import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function Home() {
  return (
    <div className="py-8 max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold">Find Undervalued Deals</CardTitle>
          <CardDescription className="text-base">Get notified when great deals match your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-base">
                What are you looking for?
              </Label>
              <Input id="keyword" placeholder="e.g. iPhone, PlayStation, Furniture" className="h-14 text-lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="text-base">
                Maximum Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input id="maxPrice" type="number" placeholder="500" className="h-14 text-lg pl-8" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip" className="text-base">
                ZIP Code
              </Label>
              <Input id="zip" placeholder="Enter your ZIP code" className="h-14 text-lg" />
            </div>

            <Button asChild className="w-full h-14 text-lg font-medium mt-6">
              <Link href="/alerts">Start Watching</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
