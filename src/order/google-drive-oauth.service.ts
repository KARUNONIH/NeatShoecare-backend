import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GoogleDriveOAuthService {
  private drive;
  private logger = new Logger(GoogleDriveOAuthService.name);

  constructor(private configService: ConfigService) {
    // OAuth2 Client Configuration
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    // Set refresh token
    const refreshToken = this.configService.get<string>(
      'GOOGLE_DRIVE_REFRESH_TOKEN',
    );
    if (refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
    }

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    folderId?: string,
  ): Promise<{ fileId: string; webViewLink: string }> {
    try {
      const defaultFolderId = this.configService.get<string>(
        'GOOGLE_DRIVE_FOLDER_ID',
      );

      const targetFolderId = folderId || defaultFolderId;

      const fileMetadata = {
        name: fileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      this.logger.log(
        `Uploading file: ${fileName} to folder: ${targetFolderId}`,
      );

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,webViewLink,parents',
      });

      this.logger.log(`File uploaded successfully. ID: ${response.data.id}`);

      // Set file permissions for public viewing
      try {
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        this.logger.log(`Permissions set for file: ${response.data.id}`);
      } catch (permError) {
        this.logger.warn(
          'Failed to set public permissions:',
          permError.message,
        );
      }

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error('Google Drive upload error:', error);
      throw new Error(
        `Failed to upload file to Google Drive: ${error.message}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file: ${fileId}`);
      await this.drive.files.delete({
        fileId: fileId,
      });
      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error('Google Drive delete error:', error.message);
    }
  }

  async deleteFileByName(fileName: string): Promise<void> {
    try {
      const defaultFolderId = this.configService.get<string>(
        'GOOGLE_DRIVE_FOLDER_ID',
      );

      let searchQuery = `name contains '${fileName}' and trashed=false`;

      if (defaultFolderId) {
        searchQuery += ` and parents in '${defaultFolderId}'`;
      }

      this.logger.log(`Searching for files with query: ${searchQuery}`);

      const searchResponse = await this.drive.files.list({
        q: searchQuery,
        fields: 'files(id, name, parents)',
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        this.logger.log(
          `Found ${searchResponse.data.files.length} files to delete`,
        );

        for (const file of searchResponse.data.files) {
          if (file.id) {
            await this.deleteFile(file.id);
          }
        }
      } else {
        this.logger.log(`No files found matching: ${fileName}`);
      }
    } catch (error) {
      this.logger.error('Google Drive delete by name error:', error.message);
    }
  }

  async getFileLink(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink',
      });
      return response.data.webViewLink;
    } catch (error) {
      this.logger.error('Google Drive get file error:', error.message);
      throw new Error('Failed to get file from Google Drive');
    }
  }

  async getDirectImageUrl(fileId: string): Promise<string> {
    try {
      this.logger.log(`Getting direct CDN URL for file ${fileId}`);

      // Method 1: Try the thumbnail URL approach (this works for getting lh3 CDN URLs!)
      try {
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        const thumbnailResponse = await axios.get(thumbnailUrl, {
          maxRedirects: 10,
          validateStatus: function (status) {
            return status < 500;
          },
          timeout: 10000,
        });

        if (
          thumbnailResponse.request &&
          thumbnailResponse.request.res &&
          thumbnailResponse.request.res.responseUrl
        ) {
          const finalUrl = thumbnailResponse.request.res.responseUrl;

          if (finalUrl.includes('lh3.googleusercontent.com')) {
            // Clean up the URL - remove size parameters for full resolution
            let cleanUrl = finalUrl;

            // Remove size parameter to get full resolution
            cleanUrl = cleanUrl.replace(/=w\d+$/, ''); // Remove =w1000 at the end
            cleanUrl = cleanUrl.replace(/&sz=w\d+/, ''); // Remove &sz=w1000
            cleanUrl = cleanUrl.replace(/\?sz=w\d+/, ''); // Remove ?sz=w1000

            this.logger.log(`✅ Found lh3 CDN URL via thumbnail: ${cleanUrl}`);
            return cleanUrl;
          }
        }
      } catch (thumbnailError) {
        this.logger.warn(`Thumbnail method failed: ${thumbnailError.message}`);
      }

      // Method 2: Try different thumbnail sizes if first one fails
      const thumbnailSizes = ['w2000', 'w1600', 'w1200', 'w800'];

      for (const size of thumbnailSizes) {
        try {
          const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
          const thumbnailResponse = await axios.get(thumbnailUrl, {
            maxRedirects: 10,
            validateStatus: function (status) {
              return status < 500;
            },
            timeout: 8000,
          });

          if (
            thumbnailResponse.request &&
            thumbnailResponse.request.res &&
            thumbnailResponse.request.res.responseUrl
          ) {
            const finalUrl = thumbnailResponse.request.res.responseUrl;

            if (finalUrl.includes('lh3.googleusercontent.com')) {
              // Clean up the URL - remove size parameters for full resolution
              let cleanUrl = finalUrl;
              cleanUrl = cleanUrl.replace(/=w\d+$/, '');
              cleanUrl = cleanUrl.replace(/&sz=w\d+/, '');
              cleanUrl = cleanUrl.replace(/\?sz=w\d+/, '');

              this.logger.log(
                `✅ Found lh3 CDN URL with size ${size}: ${cleanUrl}`,
              );
              return cleanUrl;
            }
          }
        } catch (sizeError) {
          this.logger.warn(
            `Thumbnail size ${size} failed: ${sizeError.message}`,
          );
          continue;
        }
      }

      // Method 3: Try the export URL approach as fallback
      const exportUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

      try {
        const response = await axios.get(exportUrl, {
          maxRedirects: 10,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            Referer: 'https://drive.google.com/',
          },
          validateStatus: function (status) {
            return status < 500;
          },
          timeout: 10000,
        });

        if (
          response.request &&
          response.request.res &&
          response.request.res.responseUrl
        ) {
          const finalUrl = response.request.res.responseUrl;

          if (
            finalUrl.includes('lh3.googleusercontent.com') ||
            finalUrl.includes('googleusercontent.com/fife/')
          ) {
            this.logger.log(`✅ Found lh3 CDN URL via export: ${finalUrl}`);
            return finalUrl;
          }
        }
      } catch (exportError) {
        this.logger.warn(`Export URL method failed: ${exportError.message}`);
      }

      // Fallback method: Try to get webContentLink from Google Drive API
      try {
        const fileResponse = await this.drive.files.get({
          fileId: fileId,
          fields: 'webContentLink,webViewLink,id',
        });

        if (fileResponse.data.webContentLink) {
          const webContentLink = fileResponse.data.webContentLink;
          this.logger.log(
            `Using webContentLink as fallback: ${webContentLink}`,
          );
          return webContentLink;
        }
      } catch (apiError) {
        this.logger.warn(
          `Google Drive API fallback failed: ${apiError.message}`,
        );
      }

      // Final fallback: Use usercontent URL
      const userContentUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
      this.logger.warn(
        `Could not get lh3 CDN URL, using usercontent as fallback: ${userContentUrl}`,
      );
      return userContentUrl;
    } catch (error) {
      this.logger.error('Failed to get direct CDN URL:', error.message);
      // Ultimate fallback to basic export URL
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // Generate OAuth URL for getting refresh token
  generateAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    return authUrl;
  }

  // Exchange authorization code for refresh token
  async getRefreshToken(code: string): Promise<{ refresh_token: string }> {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error(
        'No refresh token received. Make sure access_type is set to offline.',
      );
    }

    return { refresh_token: tokens.refresh_token };
  }
}
