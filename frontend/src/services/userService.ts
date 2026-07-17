import { api } from "@/lib/axios";

export interface UserSearchResult {
  id: string;
  username: string;
}

export const userService = {
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    const response = await api.get<UserSearchResult[]>("/users/search", {
      params: { q: query, limit },
    });
    return response.data;
  },
};
