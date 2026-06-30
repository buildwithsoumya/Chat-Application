import { api } from "@/lib/axios";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  async login(data: LoginFormData): Promise<{ token: string; user: User }> {
    // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", data.email); // FastAPI expects 'username' field for email
    formData.append("password", data.password);

    const response = await api.post<LoginResponse>("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    const token = response.data.access_token;
    
    // Fetch the user data using the token
    const userResponse = await api.get<User>("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return {
      token,
      user: userResponse.data
    };
  },

  async register(data: Omit<RegisterFormData, "confirmPassword">): Promise<User> {
    const response = await api.post<User>("/auth/register", data);
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
  },
};
