import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private api: ApiService, private router: Router) {}

  async login(username: string, password: string): Promise<any> {
    // El servidor espera "identifier" y "contraseña" (no "username"/"password")
    const body = new URLSearchParams();
    body.append('identifier', username);
    body.append('contraseña', password);

    const data = await this.api.fetch('/auth/login', {
      method: 'POST',
      body: body,
    });

    const token = data?.data?.access_token || data?.access_token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      throw new Error('No se recibió token de autenticación');
    }

    return data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
}