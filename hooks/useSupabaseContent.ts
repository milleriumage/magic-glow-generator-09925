import { useState, useEffect } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { ContentItem } from '../types';

export const useSupabaseContent = (userId: string | null) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load content items from Supabase
  const loadContentItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          *,
          media (
            id,
            media_type,
            storage_path,
            display_order
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedItems: ContentItem[] = data.map((item: any) => ({
          id: item.id,
          creatorId: item.creator_id,
          title: item.title,
          price: item.price,
          imageUrl: item.media && item.media.length > 0 
            ? `${supabase.storage.from('content-media').getPublicUrl(item.media[0].storage_path).data.publicUrl}`
            : `https://picsum.photos/seed/${item.id}/600/800`,
          blurLevel: item.blur_level,
          tags: item.tags || [],
          userReactions: {},
          mediaCount: {
            images: item.media?.filter((m: any) => m.media_type === 'image').length || 0,
            videos: item.media?.filter((m: any) => m.media_type === 'video').length || 0,
          },
          likedBy: [],
          sharedBy: [],
          createdAt: item.created_at,
        }));
        setContentItems(mappedItems);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new content item
  const createContentItem = async (
    title: string,
    price: number,
    blurLevel: number,
    tags: string[],
    imageFiles: File[],
    videoFiles: File[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // 1. Create content item
      const { data: contentData, error: contentError } = await supabase
        .from('content_items')
        .insert({
          creator_id: userId,
          title,
          price,
          blur_level: blurLevel,
          tags,
          is_hidden: false,
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // 2. Upload images to storage
      const uploadPromises: Promise<any>[] = [];
      
      imageFiles.forEach((file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${contentData.id}/${Date.now()}_${index}.${fileExt}`;
        
        uploadPromises.push(
          supabase.storage
            .from('content-media')
            .upload(fileName, file)
            .then(({ data: uploadData, error: uploadError }) => {
              if (uploadError) throw uploadError;
              
              // Create media record
              return supabase.from('media').insert({
                content_item_id: contentData.id,
                media_type: 'image',
                storage_path: fileName,
                display_order: index,
              });
            })
        );
      });

      // 3. Upload videos to storage
      videoFiles.forEach((file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${contentData.id}/${Date.now()}_video_${index}.${fileExt}`;
        
        uploadPromises.push(
          supabase.storage
            .from('content-media')
            .upload(fileName, file)
            .then(({ data: uploadData, error: uploadError }) => {
              if (uploadError) throw uploadError;
              
              // Create media record
              return supabase.from('media').insert({
                content_item_id: contentData.id,
                media_type: 'video',
                storage_path: fileName,
                display_order: imageFiles.length + index,
              });
            })
        );
      });

      await Promise.all(uploadPromises);
      await loadContentItems(); // Reload content

      return { success: true };
    } catch (error: any) {
      console.error('Error creating content:', error);
      return { success: false, error: error.message };
    }
  };

  // Load user's own content
  const loadUserContent = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          *,
          media (
            id,
            media_type,
            storage_path,
            display_order
          )
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedItems: ContentItem[] = data.map((item: any) => ({
          id: item.id,
          creatorId: item.creator_id,
          title: item.title,
          price: item.price,
          imageUrl: item.media && item.media.length > 0 
            ? `${supabase.storage.from('content-media').getPublicUrl(item.media[0].storage_path).data.publicUrl}`
            : `https://picsum.photos/seed/${item.id}/600/800`,
          blurLevel: item.blur_level,
          tags: item.tags || [],
          userReactions: {},
          mediaCount: {
            images: item.media?.filter((m: any) => m.media_type === 'image').length || 0,
            videos: item.media?.filter((m: any) => m.media_type === 'video').length || 0,
          },
          likedBy: [],
          sharedBy: [],
          createdAt: item.created_at,
          isHidden: item.is_hidden,
        }));
        return mappedItems;
      }
      return [];
    } catch (error) {
      console.error('Error loading user content:', error);
      return [];
    }
  };

  useEffect(() => {
    loadContentItems();
  }, []);

  return {
    contentItems,
    loading,
    createContentItem,
    loadContentItems,
    loadUserContent,
  };
};
