import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { MessageCircle, Zap, Shield, Users } from "lucide-react"

export default function Landing() {
  return (
    <div className="min-h-screen bg-mesh-gradient flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ChatSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="glow-sm">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl animate-slide-up">
          <div className="mb-6 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Real-time messaging powered by WebSockets
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Conversations that
            <br />
            <span className="gradient-text">never miss a beat</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
            A modern real-time chat platform built with FastAPI, React, and WebSockets.
            Connect instantly, message securely, and collaborate effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button asChild size="lg" className="glow-primary text-base h-12 px-8">
              <Link to="/register">Start Chatting Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 px-8 border-border/60">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl">
            <div className="glass rounded-2xl p-5 text-left animate-scale-in">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Lightning Fast</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Instant message delivery via WebSocket connections</p>
            </div>
            <div className="glass rounded-2xl p-5 text-left animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Secure Auth</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">JWT-based authentication with password hashing</p>
            </div>
            <div className="glass rounded-2xl p-5 text-left animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Group Chats</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Create direct and group conversations with ease</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground/60">
        Built with FastAPI, React & WebSockets
      </footer>
    </div>
  )
}
