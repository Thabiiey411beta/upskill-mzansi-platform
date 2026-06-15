import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure environment variables are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Some features may not work.'
  )
}

// Create the Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Helper function to upload CV to Supabase Storage
export async function uploadCv(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    const filePath = `cvs/${fileName}`

    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath)

    return {
      success: true,
      path: data.path,
      url: publicUrlData.publicUrl,
    }
  } catch (error) {
    console.error('Error uploading CV:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// Helper function to save user profile
export async function saveProfile(userId: string, profile: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error saving profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Save failed',
    }
  }
}

export default supabase
