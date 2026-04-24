
// Add to existing Database interface
export interface Database {
  // ... existing types ...
  public: {
    Tables: {
      // ... existing tables ...
      videos: {
        Row: {
          id: string
          youtube_url: string
          title: string | null
          thumbnail_url: string | null
          visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          youtube_url: string
          title?: string | null
          thumbnail_url?: string | null
          visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          youtube_url?: string
          title?: string | null
          thumbnail_url?: string | null
          visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}