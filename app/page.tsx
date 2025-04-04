"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Droplets, Trash2, Edit, Bluetooth } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"

interface Plant {
  id: string
  name: string
  type: string
  lastWatered: Date
  wateringFrequency: number // in days
  image: string
  moistureLevel: number // 0-100
  moistureThreshold: number // 0-100
  lastMoistureReading: Date
}

type NewPlantForm = Omit<Plant, "id" | "lastWatered" | "lastMoistureReading"> & { 
  wateringFrequency: number | "custom" 
}

export default function PlantReminder() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [newPlant, setNewPlant] = useState<NewPlantForm>({
    name: "",
    type: "",
    wateringFrequency: 7,
    image: "/placeholder.svg?height=100&width=100",
    moistureLevel: 50,
    moistureThreshold: 30,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null)
  const { toast } = useToast()

  // Load plants from localStorage on component mount
  useEffect(() => {
    const savedPlants = localStorage.getItem("plants")
    if (savedPlants) {
      const parsedPlants = JSON.parse(savedPlants)
      // Convert string dates back to Date objects
      const plantsWithDates = parsedPlants.map((plant: any) => ({
        ...plant,
        lastWatered: new Date(plant.lastWatered),
        lastMoistureReading: new Date(plant.lastMoistureReading),
      }))
      setPlants(plantsWithDates)
    }
  }, [])

  // Save plants to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("plants", JSON.stringify(plants))
  }, [plants])

  const addPlant = () => {
    if (!newPlant.name || !newPlant.type) {
      toast({
        title: "Missing information",
        description: "Please fill in all the fields",
        variant: "destructive",
      })
      return
    }

    if (newPlant.wateringFrequency === "custom") {
      toast({
        title: "Invalid watering frequency",
        description: "Please enter a valid number of days",
        variant: "destructive",
      })
      return
    }

    const plant: Plant = {
      id: Date.now().toString(),
      name: newPlant.name,
      type: newPlant.type,
      wateringFrequency: newPlant.wateringFrequency,
      image: newPlant.image,
      moistureLevel: newPlant.moistureLevel,
      moistureThreshold: newPlant.moistureThreshold,
      lastWatered: new Date(),
      lastMoistureReading: new Date(),
    }

    setPlants([...plants, plant])
    setNewPlant({
      name: "",
      type: "",
      wateringFrequency: 7,
      image: "/placeholder.svg?height=100&width=100",
      moistureLevel: 50,
      moistureThreshold: 30,
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Plant added",
      description: `${plant.name} has been added to your collection`,
    })
  }

  const updatePlant = () => {
    if (!editingPlant) return

    setPlants(plants.map((plant) => (plant.id === editingPlant.id ? editingPlant : plant)))
    setEditingPlant(null)

    toast({
      title: "Plant updated",
      description: `${editingPlant.name} has been updated`,
    })
  }

  const deletePlant = (id: string) => {
    const plantToDelete = plants.find((plant) => plant.id === id)
    setPlants(plants.filter((plant) => plant.id !== id))

    toast({
      title: "Plant removed",
      description: `${plantToDelete?.name} has been removed from your collection`,
    })
  }

  const waterPlant = (id: string) => {
    setPlants(plants.map((plant) => (plant.id === id ? { ...plant, lastWatered: new Date() } : plant)))

    const plantName = plants.find((plant) => plant.id === id)?.name

    toast({
      title: "Plant watered",
      description: `${plantName} has been watered`,
    })
  }

  const getDaysSinceLastWatered = (lastWatered: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastWatered.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const needsWatering = (plant: Plant) => {
    const daysSinceLastWatered = getDaysSinceLastWatered(plant.lastWatered)
    const moistureBelowThreshold = plant.moistureLevel < plant.moistureThreshold
    return daysSinceLastWatered >= plant.wateringFrequency && moistureBelowThreshold
  }

  const updateMoistureLevel = (id: string, level: number) => {
    setPlants(plants.map((plant) => 
      plant.id === id 
        ? { ...plant, moistureLevel: level, lastMoistureReading: new Date() }
        : plant
    ))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Plant Watering Reminder</h1>
        <p className="text-muted-foreground mb-6">Keep track of when to water your plants</p>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New Plant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new plant</DialogTitle>
              <DialogDescription>
                Enter the details of your plant to start tracking its watering schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Plant Name</Label>
                <Input
                  id="name"
                  value={newPlant.name}
                  onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                  placeholder="e.g., Monstera"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Plant Type</Label>
                <Input
                  id="type"
                  value={newPlant.type}
                  onChange={(e) => setNewPlant({ ...newPlant, type: e.target.value })}
                  placeholder="e.g., Houseplant"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Watering Frequency (days)</Label>
                <Select
                  value={newPlant.wateringFrequency.toString()}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setNewPlant({ ...newPlant, wateringFrequency: "custom" })
                    } else {
                      setNewPlant({ ...newPlant, wateringFrequency: parseInt(value) })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Daily</SelectItem>
                    <SelectItem value="2">Every 2 days</SelectItem>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="5">Every 5 days</SelectItem>
                    <SelectItem value="7">Weekly</SelectItem>
                    <SelectItem value="10">Every 10 days</SelectItem>
                    <SelectItem value="14">Bi-weekly</SelectItem>
                    <SelectItem value="30">Monthly</SelectItem>
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {newPlant.wateringFrequency === "custom" && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="Enter number of days"
                      onChange={(e) =>
                        setNewPlant({ ...newPlant, wateringFrequency: Number.parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addPlant}>Add Plant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit plant</DialogTitle>
              <DialogDescription>Update the details of your plant.</DialogDescription>
            </DialogHeader>
            {editingPlant && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Plant Name</Label>
                  <Input
                    id="edit-name"
                    value={editingPlant.name}
                    onChange={(e) => setEditingPlant({ ...editingPlant, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Plant Type</Label>
                  <Input
                    id="edit-type"
                    value={editingPlant.type}
                    onChange={(e) => setEditingPlant({ ...editingPlant, type: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-frequency">Watering Frequency (days)</Label>
                  <Select
                    value={editingPlant.wateringFrequency.toString()}
                    onValueChange={(value) => {
                      if (!editingPlant) return
                      if (value === "custom") {
                        setEditingPlant({ ...editingPlant, wateringFrequency: "custom" })
                      } else {
                        setEditingPlant({ ...editingPlant, wateringFrequency: parseInt(value) })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Daily</SelectItem>
                      <SelectItem value="2">Every 2 days</SelectItem>
                      <SelectItem value="3">Every 3 days</SelectItem>
                      <SelectItem value="5">Every 5 days</SelectItem>
                      <SelectItem value="7">Weekly</SelectItem>
                      <SelectItem value="10">Every 10 days</SelectItem>
                      <SelectItem value="14">Bi-weekly</SelectItem>
                      <SelectItem value="30">Monthly</SelectItem>
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingPlant && editingPlant.wateringFrequency === "custom" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Enter number of days"
                        onChange={(e) =>
                          setEditingPlant({ ...editingPlant, wateringFrequency: Number.parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPlant(null)}>
                Cancel
              </Button>
              <Button onClick={updatePlant}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No plants added yet</h2>
          <p className="text-muted-foreground mb-6">Add your first plant to start tracking when to water it</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => {
            const daysSinceWatered = getDaysSinceLastWatered(plant.lastWatered)
            const daysUntilNextWatering = Math.max(0, plant.wateringFrequency - daysSinceWatered)
            const needsWater = needsWatering(plant)

            return (
              <Card key={plant.id} className={needsWater ? "border-red-400" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plant.name}</CardTitle>
                      <CardDescription>{plant.type}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingPlant(plant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePlant(plant.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={plant.image || "/placeholder.svg"}
                      alt={plant.name}
                      className="rounded-md w-24 h-24 object-cover"
                    />
                    {needsWater && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                        <Droplets className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                    <div
                      className={`h-2.5 rounded-full ${
                        needsWater
                          ? "bg-red-500"
                          : daysUntilNextWatering <= Math.ceil(plant.wateringFrequency / 3)
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${100 - (daysUntilNextWatering / plant.wateringFrequency) * 100}%` }}
                    ></div>
                  </div>

                  <div className="text-center w-full">
                    {needsWater ? (
                      <p className="text-red-500 font-medium">Needs watering now!</p>
                    ) : (
                      <p className="text-muted-foreground">
                        Water in {daysUntilNextWatering} day{daysUntilNextWatering !== 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Last watered: {plant.lastWatered.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Soil Moisture: {plant.moistureLevel}%</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Simulate Bluetooth sensor reading
                          const simulatedReading = Math.floor(Math.random() * 100)
                          updateMoistureLevel(plant.id, simulatedReading)
                          toast({
                            title: "Moisture Reading Updated",
                            description: `New reading: ${simulatedReading}%`,
                          })
                        }}
                      >
                        <Bluetooth className="h-4 w-4 mr-2" />
                        Update Reading
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[plant.moistureLevel]}
                        onValueChange={([value]) => updateMoistureLevel(plant.id, value)}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <div className="w-24">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={plant.moistureThreshold}
                          onChange={(e) => {
                            const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            setPlants(plants.map((p) => 
                              p.id === plant.id ? { ...p, moistureThreshold: value } : p
                            ))
                          }}
                          className="text-center"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last reading: {plant.lastMoistureReading.toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={needsWater ? "default" : "outline"}
                    onClick={() => waterPlant(plant.id)}
                  >
                    <Droplets className="mr-2 h-4 w-4" />I watered this plant
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

