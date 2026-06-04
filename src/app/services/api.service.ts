import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private BASE_URL = environment.apiConfig.baseUrl;

  constructor(private router: Router) {}

  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('access_token');
    
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        this.router.navigate(['/login'], { replaceUrl: true });
        throw new Error('Sesión expirada');
      }

      if (response.status >= 500) {
        window.dispatchEvent(new CustomEvent('api:error', { detail: 'Error del servidor' }));
        throw new Error('Error del servidor');
      }

      if (response.status === 204) return null;

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }
}
