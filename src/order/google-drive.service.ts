import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleDriveService {
  private drive;

  constructor(private configService: ConfigService) {
    const keyFilePath =
      this.configService.get<string>('GOOGLE_DRIVE_KEY_FILE') ||
      './neat-shoecare-470811-6dfe3e0fc994.json';

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    this.drive = google.drive({ version: 'v3', auth });
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

      // Use provided folderId or default shared folder
      const targetFolderId = folderId || defaultFolderId;

      const fileMetadata = {
        name: fileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      console.log(`Uploading file: ${fileName} to folder: ${targetFolderId}`);

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,webViewLink,parents',
      });

      console.log(`File uploaded successfully. ID: ${response.data.id}`);

      // Set file permissions for public viewing
      try {
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        console.log(`Permissions set for file: ${response.data.id}`);
      } catch (permError) {
        console.warn('Failed to set public permissions:', permError.message);
        // Continue even if permission setting fails
      }

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw new InternalServerErrorException(
        'Failed to upload file to Google Drive',
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log(`Deleting file: ${fileId}`);
      await this.drive.files.delete({
        fileId: fileId,
      });
      console.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      console.error('Google Drive delete error:', error.message);
      // Don't throw error for delete operations to avoid breaking the flow
    }
  }

  async deleteFileByName(fileName: string): Promise<void> {
    try {
      const defaultFolderId = this.configService.get<string>(
        'GOOGLE_DRIVE_FOLDER_ID',
      );

      // Search for files with the given name pattern
      let searchQuery = `name contains '${fileName}' and trashed=false`;

      if (defaultFolderId) {
        searchQuery += ` and parents in '${defaultFolderId}'`;
      }

      console.log(`Searching for files with query: ${searchQuery}`);

      const searchParams: any = {
        q: searchQuery,
        fields: 'files(id, name, parents)',
      };

      const searchResponse = await this.drive.files.list(searchParams);

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        console.log(
          `Found ${searchResponse.data.files.length} files to delete`,
        );

        for (const file of searchResponse.data.files) {
          if (file.id) {
            await this.deleteFile(file.id);
          }
        }
      } else {
        console.log(`No files found matching: ${fileName}`);
      }
    } catch (error) {
      console.error('Google Drive delete by name error:', error.message);
      // Don't throw error to avoid breaking the flow
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
      console.error('Google Drive get file error:', error.message);
      throw new InternalServerErrorException(
        'Failed to get file from Google Drive',
      );
    }
  }
}
