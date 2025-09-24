import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MetaPostResponse {
  id: string;
  permalink?: string;
}

export interface MetaPostData {
  image_url: string;
  caption: string;
  access_token: string;
}

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly pageId: string;
  private readonly mode: string;

  constructor(private configService: ConfigService) {
    this.accessToken =
      this.configService.get<string>('META_ACCESS_TOKEN') || '';
    this.pageId = this.configService.get<string>('META_PAGE_ID') || '';
    this.mode = this.configService.get<string>('INSTAGRAM_MODE') || 'production';

    this.logger.log('Meta API Service initialized');
    this.logger.log(`Mode: ${this.mode}`);
    this.logger.log(`Page ID: ${this.pageId}`);
    this.logger.log(`Access Token configured: ${this.accessToken ? 'Yes' : 'No'}`);

    if (this.mode === 'simulation') {
      this.logger.warn('⚠️  SIMULATION MODE: Instagram posts will be simulated, not actually posted');
    } else if (!this.accessToken || !this.pageId) {
      this.logger.error(
        'Meta API credentials not configured properly. Please check META_ACCESS_TOKEN and META_PAGE_ID in environment variables.',
      );
    }

    // Validate access token format only in production mode
    if (this.mode === 'production' && this.accessToken && !this.accessToken.startsWith('IGAAU')) {
      this.logger.warn(
        'Access token format may be incorrect. Instagram Graph API access tokens typically start with "IGAAU".',
      );
    }

    this.logger.log('Meta API Service initialized');
    this.logger.log(`Page ID: ${this.pageId}`);
    this.logger.log(
      `Access Token configured: ${this.accessToken ? 'Yes' : 'No'}`,
    );
  }

  async validateCredentials(): Promise<boolean> {
    if (this.mode === 'simulation') {
      this.logger.log('🎭 Simulation mode: Credentials validation bypassed');
      return true;
    }

    try {
      this.logger.log('Validating Meta API credentials...');

      // Test basic access to the page
      const response = await axios.get(`${this.baseUrl}/${this.pageId}`, {
        params: {
          fields: 'id,name,instagram_business_account',
          access_token: this.accessToken,
        },
      });

      this.logger.log('Credentials validation successful');
      this.logger.log(`Page Name: ${response.data.name}`);

      if (response.data.instagram_business_account) {
        this.logger.log(
          `Instagram Business Account: ${response.data.instagram_business_account.id}`,
        );
      } else {
        this.logger.warn('No Instagram Business Account linked to this page');
      }

      return true;
    } catch (error) {
      this.logger.error('Credentials validation failed:', {
        status: error.response?.status,
        error: error.response?.data?.error,
      });

      if (error.response?.data?.error?.code === 190) {
        this.logger.error(
          'Invalid access token. Please generate a new Instagram Graph API access token.',
        );
      }

      return false;
    }
  }

  private async simulateInstagramPost(
    imageUrl: string,
    caption: string,
  ): Promise<MetaPostResponse> {
    this.logger.log('🎭 SIMULATION MODE: Creating fake Instagram post...');
    this.logger.log(`📸 Image URL: ${imageUrl}`);
    this.logger.log(`📝 Caption: ${caption}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate fake but realistic response
    const fakePostId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fakePermalink = `https://www.instagram.com/p/${Math.random().toString(36).substring(7)}/`;

    const result = {
      id: fakePostId,
      permalink: fakePermalink,
    };

    this.logger.log('✅ Simulated Instagram post created successfully');
    this.logger.log(`📍 Fake Post ID: ${result.id}`);
    this.logger.log(`🔗 Fake Permalink: ${result.permalink}`);

    return result;
  }

  async createInstagramPost(
    imageUrl: string,
    caption: string,
  ): Promise<MetaPostResponse> {
    // Simulation mode - return fake response
    if (this.mode === 'simulation') {
      return this.simulateInstagramPost(imageUrl, caption);
    }

    try {
      // Validate credentials first
      const isValid = await this.validateCredentials();
      if (!isValid) {
        throw new Error(
          'Meta API credentials are invalid. Please check your access token and page ID.',
        );
      }

      this.logger.log('Creating Instagram post via Meta API...');
      this.logger.log(`Image URL: ${imageUrl}`);
      this.logger.log(`Caption: ${caption}`);

      // Validate inputs
      if (!imageUrl || !caption) {
        throw new Error('Image URL and caption are required');
      }

      // Step 1: Create media object
      this.logger.log('Step 1: Creating media object...');
      const mediaResponse = await axios.post(
        `${this.baseUrl}/${this.pageId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: this.accessToken,
        },
      );

      this.logger.log(
        'Media response:',
        JSON.stringify(mediaResponse.data, null, 2),
      );

      if (!mediaResponse.data || !mediaResponse.data.id) {
        throw new Error('Failed to create media: No ID returned from Meta API');
      }

      const creationId = mediaResponse.data.id;
      this.logger.log(`Media created with ID: ${creationId}`);

      // Step 2: Publish the media
      this.logger.log('Step 2: Publishing media...');
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.pageId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken,
        },
      );

      this.logger.log(
        'Publish response:',
        JSON.stringify(publishResponse.data, null, 2),
      );

      if (!publishResponse.data || !publishResponse.data.id) {
        throw new Error(
          'Failed to publish media: No ID returned from Meta API',
        );
      }

      const postId = publishResponse.data.id;
      this.logger.log(`Instagram post published with ID: ${postId}`);

      // Step 3: Get post permalink (optional)
      let permalink: string | undefined;
      try {
        this.logger.log('Step 3: Getting post permalink...');
        const postDetailsResponse = await axios.get(
          `${this.baseUrl}/${postId}`,
          {
            params: {
              fields: 'permalink',
              access_token: this.accessToken,
            },
          },
        );

        this.logger.log(
          'Post details response:',
          JSON.stringify(postDetailsResponse.data, null, 2),
        );
        permalink = postDetailsResponse.data.permalink;
      } catch (error) {
        this.logger.warn('Failed to get post permalink:', error.message);
      }

      const result = {
        id: postId,
        permalink,
      };

      this.logger.log('Final result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      this.logger.error('Meta API error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      // Check for specific Meta API errors
      if (error.response?.data?.error) {
        const metaError = error.response.data.error;

        if (metaError.code === 190) {
          throw new Error(
            'Invalid Instagram access token. Please generate a new Instagram Graph API access token with proper permissions.',
          );
        }

        throw new Error(
          `Meta API Error: ${metaError.message} (Code: ${metaError.code}, Type: ${metaError.type})`,
        );
      }

      throw new Error(`Failed to create Instagram post: ${error.message}`);
    }
  }

  async deleteInstagramPost(postId: string): Promise<boolean> {
    // Simulation mode
    if (this.mode === 'simulation') {
      this.logger.log(`🎭 SIMULATION MODE: Simulating deletion of post: ${postId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      if (postId.startsWith('sim_')) {
        this.logger.log(`✅ Simulated post ${postId} deleted successfully`);
        return true;
      } else {
        this.logger.warn(`⚠️  Post ${postId} is not a simulated post, but deletion simulated anyway`);
        return true;
      }
    }

    try {
      this.logger.log(`Attempting to delete Instagram post: ${postId}`);

      const response = await axios.delete(`${this.baseUrl}/${postId}`, {
        params: {
          access_token: this.accessToken,
        },
      });

      this.logger.log(`Instagram post deleted successfully: ${postId}`);
      return response.data.success || true;
    } catch (error) {
      this.logger.error(
        'Failed to delete Instagram post:',
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to delete Instagram post: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getInstagramPostDetails(postId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp',
          access_token: this.accessToken,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get Instagram post details:',
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to get post details: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Test connection to Meta API
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.pageId}`, {
        params: {
          fields: 'name,id',
          access_token: this.accessToken,
        },
      });

      this.logger.log(`Connected to Meta API. Page: ${response.data.name}`);
      return true;
    } catch (error) {
      this.logger.error(
        'Meta API connection test failed:',
        error.response?.data || error.message,
      );
      return false;
    }
  }
}
