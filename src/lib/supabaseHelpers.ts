import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper for querying tables that might not exist yet (pending migrations)
 * Silently returns empty array on 404 errors
 */
export async function queryOptionalTable<T>(
  tableName: string,
  selector: string,
  filters?: { column: string; value: string }[],
  order?: { column: string; asc: boolean }
): Promise<T[]> {
  try {
    let query = (supabase.from(tableName as any).select(selector) as any);

    if (filters) {
      for (const filter of filters) {
        query = query.eq(filter.column, filter.value);
      }
    }

    if (order) {
      query = query.order(order.column, { ascending: order.asc });
    }

    const { data, error } = await query;

    // Silently return empty array on 404 (table doesn't exist yet)
    if (error?.code === "404" || error?.message?.includes("404")) {
      return [];
    }

    if (error) {
      console.warn(`Error querying ${tableName}:`, error.message);
      return [];
    }

    return (data as T[]) || [];
  } catch (err) {
    // Silently return empty array on any error
    return [];
  }
}

/**
 * Wrapper for mutation operations on tables that might not exist yet
 * Silently returns without error on 404
 */
export async function mutateOptionalTable(
  tableName: string,
  operation: "insert" | "update" | "delete",
  data: any,
  filters?: { column: string; value: string }[]
): Promise<boolean> {
  try {
    let query: any;

    if (operation === "insert") {
      query = (supabase.from(tableName as any).insert(data) as any);
    } else if (operation === "delete") {
      query = (supabase.from(tableName as any).delete() as any);
      if (filters) {
        for (const filter of filters) {
          query = query.eq(filter.column, filter.value);
        }
      }
    } else if (operation === "update") {
      query = (supabase.from(tableName as any).update(data) as any);
      if (filters) {
        for (const filter of filters) {
          query = query.eq(filter.column, filter.value);
        }
      }
    }

    const { error } = await query;

    // Silently ignore 404 errors (table doesn't exist yet)
    if (error?.code === "404" || error?.message?.includes("404")) {
      return false; // Indicate operation was not performed
    }

    if (error) {
      console.warn(`Error in ${operation} on ${tableName}:`, error.message);
      return false;
    }

    return true; // Operation succeeded
  } catch (err) {
    // Silently return false on any error
    return false;
  }
}
