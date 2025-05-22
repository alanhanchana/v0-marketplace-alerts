"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface KeywordFilterProps {
  onFilter: (filters: {
    keywords: string[]
    priceRange: [number, number]
    condition: string[]
    distance: number
  }) => void
}

export function KeywordFilter({ onFilter }: KeywordFilterProps) {
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [condition, setCondition] = useState<string[]>([])
  const [distance, setDistance] = useState(50)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const handleAddKeyword = () => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      const newKeywords = [...keywords, keyword.trim()]
      setKeywords(newKeywords)
      setKeyword("")
      onFilter({ keywords: newKeywords, priceRange, condition, distance })
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter((k) => k !== keywordToRemove)
    setKeywords(newKeywords)
    onFilter({ keywords: newKeywords, priceRange, condition, distance })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const toggleCondition = (value: string) => {
    let newCondition
    if (condition.includes(value)) {
      newCondition = condition.filter((c) => c !== value)
    } else {
      newCondition = [...condition, value]
    }
    setCondition(newCondition)
    onFilter({ keywords, priceRange, condition: newCondition, distance })
  }

  const conditions = ["New", "Like New", "Good", "Fair", "Poor"]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter by keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAddKeyword} disabled={!keyword.trim()} className="discord-button">
          Add
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Newest First</DropdownMenuItem>
              <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
              <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
              <DropdownMenuItem>Distance</DropdownMenuItem>
              <DropdownMenuItem>Best Match</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <Badge key={k} variant="secondary" className="gap-1 px-2 py-1">
              {k}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => handleRemoveKeyword(k)}>
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {k}</span>
              </Button>
            </Badge>
          ))}
          {keywords.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setKeywords([])
                onFilter({ keywords: [], priceRange, condition, distance })
              }}
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span>Advanced Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <Badge
                  key={c}
                  variant={condition.includes(c) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCondition(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
