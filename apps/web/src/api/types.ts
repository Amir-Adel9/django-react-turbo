export interface User {
  email: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  name: string;
  password: string;
  password_confirm: string;
}

export interface LoginResponse {
  user: User;
}

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
