import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/services/auth"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function Register() {
  const navigate = useNavigate()
  const { register: registerAction, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    clearError()
    try {
      // The auth service requires Omit<RegisterFormData, "confirmPassword">
      const { confirmPassword, ...registerData } = data;
      await registerAction(registerData)
      toast.success("Account created successfully!")
      navigate("/login")
    } catch (err: any) {
      toast.error("Registration failed", err.response?.data?.detail || "Could not create account")
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bgPrimary px-4 py-12">
      <Card className="w-full max-w-md bg-surface border-border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your details to get started with ChatSphere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                {...register("username")}
                placeholder="johndoe"
                className={errors.username ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="m@example.com"
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                {...register("password")}
                type="password"
                className={errors.password ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                {...register("confirmPassword")}
                type="password"
                className={errors.confirmPassword ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
