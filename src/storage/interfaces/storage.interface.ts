export interface StorageInterface {
  uploadFile(buffer: Buffer, originalname: string, options?: FileOptions): Promise<FileUploadResult>;
  deleteFile(filename: string): Promise<void>;
}

export interface FileOptions {
  maxSize?: number;
  allowedTypes?: string[];
  contentType?: string;
}

export interface FileUploadResult {
  url: string;
  path: string;
}
