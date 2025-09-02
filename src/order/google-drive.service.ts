import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleDriveService {
  private drive;

  constructor(private configService: ConfigService) {
    const credentials = {
      type: this.configService.get<string>('GOOGLE_DRIVE_TYPE'),
      project_id: this.configService.get<string>('GOOGLE_DRIVE_PROJECT_ID'),
      private_key_id: this.configService.get<string>(
        'GOOGLE_DRIVE_PRIVATE_KEY_ID',
      ),
      private_key: this.configService
        .get<string>('GOOGLE_DRIVE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'),
      client_email: this.configService.get<string>('GOOGLE_DRIVE_CLIENT_EMAIL'),
      client_id: this.configService.get<string>('GOOGLE_DRIVE_CLIENT_ID'),
      auth_uri: this.configService.get<string>('GOOGLE_DRIVE_AUTH_URI'),
      token_uri: this.configService.get<string>('GOOGLE_DRIVE_TOKEN_URI'),
      auth_provider_x509_cert_url: this.configService.get<string>(
        'GOOGLE_DRIVE_AUTH_PROVIDER_X509_CERT_URL',
      ),
      client_x509_cert_url: this.configService.get<string>(
        'GOOGLE_DRIVE_CLIENT_X509_CERT_URL',
      ),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
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
      const fileMetadata = {
        name: fileName,
        parents: folderId
          ? [folderId]
          : defaultFolderId
            ? [defaultFolderId]
            : undefined,
      };

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,webViewLink',
      });

      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

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
      await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error('Google Drive delete error:', error);
    }
  }

  async deleteFileByName(fileName: string): Promise<void> {
    try {
      const defaultFolderId = this.configService.get<string>(
        'GOOGLE_DRIVE_FOLDER_ID',
      );

      const searchQuery = `name='${fileName}' and trashed=false`;
      const searchParams: any = {
        q: searchQuery,
        fields: 'files(id, name)',
      };

      if (defaultFolderId) {
        searchParams.q += ` and parents in '${defaultFolderId}'`;
      }

      const searchResponse = await this.drive.files.list(searchParams);

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        for (const file of searchResponse.data.files) {
          await this.drive.files.delete({
            fileId: file.id,
          });
        }
      }
    } catch (error) {
      console.error('Google Drive delete by name error:', error);
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
      console.error('Google Drive get file error:', error);
      throw new InternalServerErrorException(
        'Failed to get file from Google Drive',
      );
    }
  }
}
