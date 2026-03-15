import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = false;

  constructor() {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.darkMode = savedTheme === 'dark';
      this.applyTheme();
    } else {
      // Usar el tema del sistema si no hay guardado
      this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }

  private applyTheme() {
    const theme = this.darkMode ? 'dark' : 'light';

    // Enable Ionic built-in dark palette (Ionic 7 uses a palette class)
    document.body.classList.toggle('dark', this.darkMode);
    document.body.classList.toggle('ion-palette-dark', this.darkMode);

    // Some components check for the class on the <html> element or <ion-app>
    document.documentElement.classList.toggle('dark', this.darkMode);
    document.documentElement.classList.toggle('ion-palette-dark', this.darkMode);
    document.documentElement.setAttribute('data-theme', theme);

    const ionApp = document.querySelector('ion-app');
    if (ionApp) {
      ionApp.classList.toggle('dark', this.darkMode);
      ionApp.classList.toggle('ion-palette-dark', this.darkMode);
    }

    // Ensure background/text colors actually switch even if the CSS palette isn't applied
    const root = document.documentElement;
    if (this.darkMode) {
      root.style.setProperty('--ion-background-color', '#121212');
      root.style.setProperty('--ion-text-color', '#ffffff');
    } else {
      root.style.setProperty('--ion-background-color', '#ffffff');
      root.style.setProperty('--ion-text-color', '#000000');
    }
  }
}