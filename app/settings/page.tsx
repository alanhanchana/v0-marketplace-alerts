import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/user-avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { Target } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">FlipSniper</h1>
        </div>
        <ModeToggle />
      </div>

      <div className="flex items-center gap-4 mb-8 p-4 bg-secondary/30 rounded-xl">
        <UserAvatar />
        <div>
          <h2 className="font-medium">Demo User</h2>
          <p className="text-sm text-muted-foreground">demo@example.com</p>
        </div>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value="Demo User" readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value="demo@example.com" readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    className="w-full p-2 border rounded-md bg-gray-50"
                    value="This is a demo account for testing purposes."
                    readOnly
                  ></textarea>
                </div>
                <Button disabled>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value="••••••••" readOnly className="bg-gray-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value="" readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" value="" readOnly className="bg-gray-50" />
                  </div>
                </div>
                <Button disabled>Change Password</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive email notifications for new deals</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Browser Notifications</h3>
                  <p className="text-sm text-gray-500">Receive browser notifications for new deals</p>
                </div>
                <Switch checked={false} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Receive text messages for new deals</p>
                </div>
                <Switch checked={false} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily Digest</h3>
                  <p className="text-sm text-gray-500">Receive a daily summary of new deals</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <Button disabled>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button variant="outline" className="border-2 border-primary">
                    Light
                  </Button>
                  <Button variant="outline" disabled>
                    Dark
                  </Button>
                  <Button variant="outline" disabled>
                    System
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="flex gap-4">
                  <Button variant="outline" disabled>
                    Small
                  </Button>
                  <Button variant="outline" className="border-2 border-primary">
                    Medium
                  </Button>
                  <Button variant="outline" disabled>
                    Large
                  </Button>
                </div>
              </div>
              <Button disabled>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Sync</h3>
                  <p className="text-sm text-gray-500">Sync data across devices</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Analytics</h3>
                  <p className="text-sm text-gray-500">Allow anonymous usage data collection</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" value="demo-api-key-12345" readOnly className="bg-gray-50" />
              </div>
              <div className="pt-4 border-t">
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
