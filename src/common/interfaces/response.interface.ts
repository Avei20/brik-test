export interface ISuccessResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

export interface IErrorResponse {
  message: string;
  statusCode: number;
  errors: any;
}
