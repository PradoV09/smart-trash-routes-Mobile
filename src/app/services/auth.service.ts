import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private api: ApiService, private router: Router) { }

  async login(username: string, password: string): Promise<any> {
    const body = new URLSearchParams();
    body.append('identifier', username);
    body.append('contraseña', btoa(password));

    const data = await this.api.fetch(environment.apiConfig.endpoints.auth.login, {
      method: 'POST',
      body: body,
    });

    if (data && data.data && data.data.access_token) {
      localStorage.setItem('access_token', data.data.access_token);
    } else if (data && data.access_token) {
      // Fallback in case the wrapper changes
      localStorage.setItem('access_token', data.access_token);
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
