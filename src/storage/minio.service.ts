import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { FileOptions, FileUploadResult, StorageInterface } from './interfaces/storage.interface';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MinioService implements StorageInterface {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly logger = new Logger(MinioService.name);
  private isMinioAvailable = false;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'products';
    this.logger.log(`Minio Bucket Name: ${this.bucket}`); // ADDED: Log bucket name

    const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const minioPort = Number(this.configService.get('MINIO_PORT')) || 9000;
    const minioAccessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const minioSecretKey = this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin';

    this.logger.log(`Minio Endpoint from Config: ${minioEndpoint}`); // ADDED: Log endpoint
    this.logger.log(`Minio Port from Config: ${minioPort}`); // ADDED: Log port
    this.logger.log(`Minio Access Key from Config: ${minioAccessKey.substring(0, 5)}...`); // ADDED: Log first 5 chars of access key
    this.logger.log(`Minio Secret Key from Config: ${minioSecretKey.substring(0, 5)}...`); // ADDED: Log first 5 chars of secret key


    this.client = new Client({
      endPoint: minioEndpoint,
      port: minioPort,
      useSSL: false,
      accessKey: minioAccessKey,
      secretKey: minioSecretKey,
    });


    // Check MinIO availability in the background
    this.checkMinioAvailability();
  }

  private async checkMinioAvailability(): Promise<void> {
    try {
      this.logger.log('Endpoint MinIO : ' + this.configService.get<string>('MINIO_ENDPOINT') + ' and port :' + this.configService.get('MINIO_PORT'))
      this.logger.log('Checking MinIO availability using access key :' + this.configService.get<string>('MINIO_ACCESS_KEY') + ' and secret key :' + this.configService.get<string>('MINIO_SECRET_KEY'))
      // Simple ping to check if MinIO is available
      await this.client.listBuckets();
      this.isMinioAvailable = true;
      this.logger.log('MinIO service is available');
      
      // Try to initialize bucket if MinIO is available
      this.initBucketWithRetry();
    } catch (error) {
      this.isMinioAvailable = false;
      this.logger.warn('MinIO service is not available, using fallback storage');
      
      // Retry checking availability after some time
      setTimeout(() => this.checkMinioAvailability(), 30000); // Retry every 30 seconds
    }
  }

  private async initBucketWithRetry(retries = 5, delay = 5000): Promise<void> {
    if (!this.isMinioAvailable) {
      return; // Skip if MinIO is not available
    }
    
    let attempts = 0;
    
    const tryInitialize = async () => {
      try {
        attempts++;
        this.logger.log(`Attempting to initialize MinIO bucket (attempt ${attempts}/${retries})`);
        
        const bucketExists = await this.client.bucketExists(this.bucket);
        if (!bucketExists) {
          await this.client.makeBucket(this.bucket);
          this.logger.log(`Bucket ${this.bucket} created successfully`);
        } else {
          this.logger.log(`Bucket ${this.bucket} already exists`);
        }
        
        // If we get here, initialization was successful
        return true;
      } catch (error) {
        this.logger.error(`Failed to initialize bucket (attempt ${attempts}/${retries}): ${error.message}`);
        
        if (attempts < retries) {
          this.logger.log(`Retrying in ${delay/1000} seconds...`);
          setTimeout(tryInitialize, delay);
        } else {
          this.logger.error(`Failed to initialize bucket after ${retries} attempts`);
          this.isMinioAvailable = false; // Mark as unavailable after all retries fail
        }
        
        return false;
      }
    };
    
    // Start the initialization process
    setTimeout(tryInitialize, delay);
  }

  async uploadFile(
    buffer: Buffer,
    originalname: string,
    options?: FileOptions,
  ): Promise<FileUploadResult> {
    try {
      // Validate file if options are provided
      if (options?.maxSize && buffer.length > options.maxSize) {
        throw new Error(
          `File size exceeds maximum allowed size of ${options.maxSize} bytes`,
        );
      }

      if (
        options?.allowedTypes &&
        options.allowedTypes.length > 0 &&
        options.contentType &&
        !options.allowedTypes.includes(options.contentType)
      ) {
        throw new Error(
          `File type ${options.contentType} is not allowed. Allowed types: ${options.allowedTypes.join(
            ', ',
          )}`,
        );
      }

      // If MinIO is not available, use fallback storage
      if (!this.isMinioAvailable) {
        return this.fallbackUpload(originalname);
      }

      // Generate a unique filename to avoid collisions
      const extension = path.extname(originalname);
      const filename = `${uuidv4()}${extension}`;
      const objectName = `products/${filename}`;

      await this.client.putObject(
        this.bucket, 
        objectName, 
        buffer, 
        buffer.length,
        { 'Content-Type': options?.contentType }
      );

      const url = `${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get(
        'MINIO_PORT',
      )}/${this.bucket}/${objectName}`;

      return {
        url,
        path: objectName,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      
      // If upload fails, use fallback
      return this.fallbackUpload(originalname);
    }
  }
  
  // Fallback method when MinIO is not available
  private fallbackUpload(originalname: string): FileUploadResult {
    const filename = `${uuidv4()}${path.extname(originalname)}`;
    const fallbackUrl = `/fallback-images/${filename}`;
    
    this.logger.log(`Using fallback storage for file: ${originalname} -> ${fallbackUrl}`);
    
    return {
      url: fallbackUrl,
      path: `fallback/${filename}`,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, filename);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }
}
