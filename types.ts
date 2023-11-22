export type DropboxCredentials = {
  refreshToken: string;
  appKey: string;
  appSecret: string;
};

export type ServerOperationResult = {
  status: number;
  error?: string;
};
