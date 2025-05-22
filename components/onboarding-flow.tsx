"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Zap, Bell, ArrowRight, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const router = useRouter()

  const steps = [
    {
      title: "Welcome to Snipr",
      description: "The AI-powered deal hunter that finds marketplace steals before anyone else.",
      content: (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Snipr uses AI to scan thousands of marketplace listings 24/7 and alerts you the moment underpriced deals
            appear.
          </p>
        </div>
      ),
    },
    {
      title: "How Snipr Works",
      description: "Three simple steps to never miss a deal again",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Set Your Target</h3>
              <p className="text-sm text-muted-foreground">
                Tell us exactly what you're looking for and your price range.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">AI Hunts 24/7</h3>
              <p className="text-sm text-muted-foreground">
                Our AI scans thousands of listings across marketplaces in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Get Instant Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications the moment a matching deal is found.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create Your Account",
      description: "Set up your profile to start hunting deals",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll send deal alerts to this email. You can also enable browser notifications.
          </p>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description: "Ready to find incredible deals",
      content: (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-muted-foreground">
            Your account is ready. Let's start hunting for deals that others will miss!
          </p>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md discord-card overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xl font-bold">{steps[step].title}</CardTitle>
              <CardDescription>{steps[step].description}</CardDescription>
            </CardHeader>
            <CardContent>{steps[step].content}</CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              {step > 0 && step < steps.length - 1 ? (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  Maybe Later
                </Button>
              )}
              <Button onClick={handleNext} className="discord-button">
                {step < steps.length - 1 ? (
                  <>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </CardFooter>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}
