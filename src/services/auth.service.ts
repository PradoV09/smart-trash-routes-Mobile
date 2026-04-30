import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'access_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private apiService: ApiService) {
    this.checkToken();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  checkToken(): void {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
