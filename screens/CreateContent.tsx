import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { ContentItem, Screen } from '../types';
import Notification from '../components/Notification';

interface CreateContentProps {
  navigate: (screen: Screen) => void;
}

const CreateContent: React.FC<CreateContentProps> = ({ navigate }) => {
    const { addContentItem, devSettings, currentUser } = useCredits();
    const { createContentItem } = useSupabaseContent(currentUser?.id || null);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [offerText, setOfferText] = useState('');
    const [tags, setTags] = useState('');
    const [blurLevel, setBlurLevel] = useState(5);
    const [useExternalLink, setUseExternalLink] = useState(false);
    const [externalLink, setExternalLink] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    
    const [notification, setNotification] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser) {
        return <div>You must be logged in to create content.</div>;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const remainingSlots = devSettings.maxImagesPerCard - imageFiles.length;
            const newFiles = files.slice(0, remainingSlots);
            const newImageUrls = newFiles.map((file: File) => URL.createObjectURL(file));
            setImageFiles(prev => [...prev, ...newFiles]);
            setUploadedImages(prev => [...prev, ...newImageUrls]);
        }
    };
    
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const remainingSlots = devSettings.maxVideosPerCard - videoFiles.length;
            const newFiles = files.slice(0, remainingSlots);
            setVideoFiles(prev => [...prev, ...newFiles]);
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isFormValid = title && price && parseInt(price) > 0 && 
                            (useExternalLink ? externalLink : (imageFiles.length > 0 || videoFiles.length > 0));

        if (!isFormValid) {
            alert('Please fill all required fields and add content.');
            return;
        }

        setIsLoading(true);

        try {
            const parsedTags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            
            const result = await createContentItem(
                title,
                parseInt(price, 10),
                blurLevel,
                parsedTags,
                imageFiles,
                videoFiles
            );

            if (result.success) {
                setNotification('Content created successfully!');
                setTimeout(() => {
                    setNotification(null);
                    navigate('my-creations');
                }, 2000);
            } else {
                setNotification(result.error || 'Failed to create content');
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error('Error creating content:', error);
            setNotification('Failed to create content. Please try again.');
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };
    
    const canUploadImages = imageFiles.length < devSettings.maxImagesPerCard;
    const canUploadVideos = videoFiles.length < devSettings.maxVideosPerCard;

    return (
        <div className="max-w-2xl mx-auto">
            {notification && <Notification message={notification} type="success" />}
            <h1 className="text-3xl font-bold text-white mb-6">Create New Content</h1>
            <div className="bg-neutral-800 rounded-lg shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-neutral-300">Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md py-2 px-3 text-white" placeholder="e.g., Mystic Forest" required />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-neutral-300">Price (in credits)</label>
                        <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md py-2 px-3 text-white" placeholder="e.g., 200" required min="1" />
                    </div>
                    <div>
                        <label htmlFor="offerText" className="block text-sm font-medium text-neutral-300">Offer Text (Optional)</label>
                        <input type="text" id="offerText" value={offerText} onChange={(e) => setOfferText(e.target.value)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md py-2 px-3 text-white" placeholder="e.g., Limited time offer!" />
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-neutral-300">Tags (comma-separated)</label>
                        <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md py-2 px-3 text-white" placeholder="e.g., #art, #scifi, #tutorial" />
                    </div>

                    {/* Blur Level */}
                    <div>
                        <label htmlFor="blurLevel" className="block text-sm font-medium text-neutral-300">Blur Level: {blurLevel}</label>
                        <input type="range" id="blurLevel" min="0" max="10" value={blurLevel} onChange={e => setBlurLevel(Number(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    {/* External Link Toggle */}
                    <div className="flex items-center justify-between">
                         <label htmlFor="useExternalLink" className="text-sm font-medium text-neutral-300">Sell External Link</label>
                        <label className="inline-flex relative items-center cursor-pointer">
                            <input type="checkbox" id="useExternalLink" checked={useExternalLink} onChange={() => setUseExternalLink(!useExternalLink)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                        </label>
                    </div>

                    {/* Content Uploads */}
                    {useExternalLink ? (
                         <div>
                            <label htmlFor="externalLink" className="block text-sm font-medium text-neutral-300">External URL</label>
                            <input type="url" id="externalLink" value={externalLink} onChange={e => setExternalLink(e.target.value)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md py-2 px-3 text-white" placeholder="https://example.com" required />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-neutral-300">Upload Media</label>
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {uploadedImages.map((url, index) => <img key={index} src={url} className="h-24 w-full object-cover rounded"/>)}
                                </div>
                            )}
                            <div className="mt-2 flex gap-4">
                               <label className={`flex-1 text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${canUploadImages ? 'bg-brand-secondary hover:bg-brand-secondary/90 cursor-pointer' : 'bg-neutral-600 cursor-not-allowed'}`}>
                                   <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={!canUploadImages} />
                                   Add Images ({imageFiles.length}/{devSettings.maxImagesPerCard})
                               </label>
                               <label className={`flex-1 text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${canUploadVideos ? 'bg-brand-light/80 hover:bg-brand-light/70 cursor-pointer' : 'bg-neutral-600 cursor-not-allowed'}`}>
                                   <input type="file" multiple accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={!canUploadVideos} />
                                   Add Videos ({videoFiles.length}/{devSettings.maxVideosPerCard})
                               </label>
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-2">
                         <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50">
                            {isLoading ? 'Creating...' : 'Create Content Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateContent;