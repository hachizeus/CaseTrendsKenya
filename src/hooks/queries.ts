import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ===== PRODUCTS =====
export const useProducts = (
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    ...options,
  });
};

export const useProductsPaginated = (
  page: number = 1,
  pageSize: number = 20,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["products", "paginated", page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await supabase
        .from("products")
        .select("*, product_images(*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      return { data: data || [], total: count || 0, page, pageSize };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

export const useProduct = (
  id: string | null | undefined,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

export const useProductsByCategory = (
  category: string | null,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["products", "category", category],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("category", category!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!category,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

// ===== CATEGORIES =====
export const useCategories = (
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// ===== REVIEWS =====
export const useProductReviews = (
  productId: string | null,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false });

      if (!reviewData || reviewData.length === 0) return [];

      const userIds = [...new Set(reviewData.map((r: any) => r.user_id))];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries(
        (profileData || []).map((p: any) => [p.user_id, p.display_name])
      );

      return reviewData.map((r: any) => ({
        ...r,
        display_name: profileMap[r.user_id] || "Anonymous",
      }));
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

// ===== SPECIFICATIONS =====
export const useProductSpecifications = (
  productId: string | null,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["product_specifications", productId],
    queryFn: async () => {
      try {
        const { data } = await (supabase
          .from("product_specifications" as any)
          .select("*")
          .eq("product_id", productId!) as any);
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

// ===== FAVORITES =====
export const useUserFavorites = (
  userId: string | null,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", userId!);
      return data?.map((f: any) => f.product_id) || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};
