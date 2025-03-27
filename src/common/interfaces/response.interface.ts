export interface ISuccessResponse<T> {
  message: string;
  statusCode: number;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface IErrorResponse {
  message: string;
  statusCode: number;
  errors: any;
}

export interface ResponseDTO {
  data: any;
  meta: {
    status: string;
    message: string;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}
