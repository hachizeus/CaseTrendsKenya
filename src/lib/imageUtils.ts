// Utility function to delete images from both storage and database
export const deleteImage = async (
  imageId: string,
  imageUrl: string,
  tableName: string,
  bucketName: string
): Promise<void> => {
  try {
    // Remove from storage
    const urlParts = imageUrl.split(`/${bucketName}/`);
    if (urlParts.length === 2) {
      await supabase.storage.from(bucketName).remove([urlParts[1]]);
    }

    // Remove from database
    const { error } = await supabase.from(tableName).delete().eq("id", imageId);
    if (error) throw error;

    toast.success("Image deleted successfully");
  } catch (error) {
    console.error("Error deleting image:", error);
    toast.error("Failed to delete image");
  }
};