import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bgPrimary text-foreground">
      <h1 className="text-5xl font-bold mb-4">ChatSphere</h1>
      <p className="text-xl text-muted-foreground mb-8">Real-Time Conversations. Built for Speed.</p>
      <div className="space-x-4">
        <Button asChild><Link to="/register">Get Started</Link></Button>
        <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
      </div>
    </div>
  )
}
