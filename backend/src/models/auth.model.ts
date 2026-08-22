export interface RegisterRequestModel {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponseModel {
  id: string;
  email: string;
  username: string;
  emailVerified: false;
  message: string;
  createdAt: string;
}

export interface ResendVerificationRequestModel {
  email: string;
}

export interface VerifyEmailRequestModel {
  token: string;
}

export interface VerifyEmailResponseModel {
  id: string;
  email: string;
  emailVerified: true;
  verifiedAt: string;
  message: string;
}

export interface LoginRequestModel {
  email: string;
  password: string;
}

export interface LoginResponseModel {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    emailVerified: boolean;
  };
}

export interface RefreshRequestModel {
  refreshToken: string;
}

export interface RefreshResponseModel {
  accessToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequestModel {
  email: string;
}

export interface ResetPasswordRequestModel {
  token: string;
  newPassword: string;
}

// Attached to req by the requireAuth middleware once a bearer token is verified.
export interface AuthenticatedUserModel {
  id: string;
  username: string;
}
