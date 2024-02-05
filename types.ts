export type DropboxCredentials = {
  refreshToken: string;
  appKey: string;
  appSecret: string;
};

export type ServerOperationResult = {
  status: number;
  error?: string;
};

export type SimpleStringCache = {
  [key: string]: {
    time: number;
    value: string;
  };
};

export type SortingType = "design number" | "priority";
