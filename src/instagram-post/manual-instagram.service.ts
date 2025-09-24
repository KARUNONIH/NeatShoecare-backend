import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InstagramPostPreparation {
  id: string;
  caption: string;
  imageUrl: string;
  imageDirectUrl: string;
  instructions: string[];
  copyableCaption: string;
  estimatedHashtags: string[];
}

@Injectable()
export class ManualInstagramService {
  private readonly logger = new Logger(ManualInstagramService.name);

  constructor(private configService: ConfigService) {}

  async prepareManualPost(
    imageUrl: string,
    caption: string,
  ): Promise<InstagramPostPreparation> {
    this.logger.log('📝 Preparing manual Instagram post...');

    // Generate unique ID for tracking
    const preparationId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Enhance caption with hashtags and formatting
    const enhancedCaption = this.enhanceCaption(caption);
    
    // Generate hashtags based on content
    const hashtags = this.generateHashtags(caption);

    // Create direct download link for image
    const directImageUrl = this.createDirectImageUrl(imageUrl);

    // Generate step-by-step instructions
    const instructions = [
      '1. 📱 Open Instagram app on your phone',
      '2. 📸 Tap the + button to create new post',
      '3. 🖼️ Select photo from camera roll or download from link below',
      '4. ✨ Apply filters if desired',
      '5. 📝 Copy the caption below and paste it',
      '6. 🏷️ Add location tag if relevant',
      '7. 👥 Tag people if needed',
      '8. 📤 Share your post!',
      '9. 🔗 Copy the post URL and update in system'
    ];

    const preparation: InstagramPostPreparation = {
      id: preparationId,
      caption: enhancedCaption,
      imageUrl,
      imageDirectUrl: directImageUrl,
      instructions,
      copyableCaption: enhancedCaption,
      estimatedHashtags: hashtags,
    };

    this.logger.log(`✅ Manual post preparation ready: ${preparationId}`);
    return preparation;
  }

  private enhanceCaption(originalCaption: string): string {
    // Add line breaks for better readability
    let enhanced = originalCaption;

    // Add shoe care related hashtags if not present
    const defaultHashtags = [
      '#shoecare',
      '#shoecleaning',
      '#sneakercare',
      '#neatshoecare',
      '#shoelover'
    ];

    // Check if caption already has hashtags
    if (!enhanced.includes('#')) {
      enhanced += '\n\n' + defaultHashtags.slice(0, 3).join(' ');
    }

    return enhanced;
  }

  private generateHashtags(caption: string): string[] {
    const hashtags: string[] = [];
    
    // Shoe-related hashtags
    if (caption.toLowerCase().includes('sneaker')) {
      hashtags.push('#sneaker', '#sneakerhead', '#sneakercleaning');
    }
    
    if (caption.toLowerCase().includes('leather')) {
      hashtags.push('#leathercare', '#leathershoes');
    }

    if (caption.toLowerCase().includes('clean')) {
      hashtags.push('#shoecleaning', '#deepclean');
    }

    // Add default hashtags
    hashtags.push(
      '#shoecare',
      '#neatshoecare',
      '#shoelover',
      '#beforeafter'
    );

    return [...new Set(hashtags)]; // Remove duplicates
  }

  private createDirectImageUrl(googleDriveUrl: string): string {
    // Convert Google Drive URL to direct download link
    if (googleDriveUrl.includes('lh3.googleusercontent.com')) {
      return googleDriveUrl; // Already direct
    }

    if (googleDriveUrl.includes('drive.google.com')) {
      const fileId = this.extractGoogleDriveFileId(googleDriveUrl);
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    return googleDriveUrl;
  }

  private extractGoogleDriveFileId(url: string): string {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  async trackManualPost(
    preparationId: string,
    instagramPostUrl: string,
  ): Promise<{ success: boolean; postId?: string }> {
    this.logger.log(`📍 Tracking manual post: ${preparationId}`);

    // Extract Instagram post ID from URL
    const postId = this.extractInstagramPostId(instagramPostUrl);
    
    if (!postId) {
      this.logger.error('Could not extract post ID from URL');
      return { success: false };
    }

    this.logger.log(`✅ Manual post tracked successfully: ${postId}`);
    return { success: true, postId };
  }

  private extractInstagramPostId(url: string): string | null {
    // Pattern for Instagram post URLs
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
