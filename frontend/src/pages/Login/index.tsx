import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/services/auth"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, User, Lock } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      await login(data)
      toast.success("Welcome back!")
      navigate("/dashboard")
    } catch (err: any) {
      toast.error("Login failed", err.response?.data?.detail || "Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex bg-bgPrimary">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-mesh-gradient items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center max-w-md px-12 animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-3 text-center">
            Welcome back to <span className="gradient-text">ChatSphere</span>
          </h2>
          <p className="text-muted-foreground text-center leading-relaxed">
            Sign in to pick up your conversations right where you left off.
            Real-time messaging, group chats, and more.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ChatSphere</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("username")}
                  type="text"
                  placeholder="Enter your username"
                  className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link to="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base glow-sm" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
