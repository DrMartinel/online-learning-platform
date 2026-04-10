export interface SignUpDTO {
  email: string;
  password?: string;
  fullName: string;
}

export interface SignInDTO {
  email: string;
  password?: string;
}

export interface AuthResultDTO {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
  expiresAt?: number;
}
