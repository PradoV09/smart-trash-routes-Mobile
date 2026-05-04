import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  carOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class LoginPage {
  username = '';
  password = '';
  loading = false;
  showPassword = false;
  isDark = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, carOutline, moonOutline, sunnyOutline });
    // Restaurar tema guardado
    this.isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  async handleLogin() {
    if (!this.username || !this.password) {
      this.presentToast('Ingresa usuario y contraseña', 'warning');
      return;
    }

    this.loading = true;
    try {
      await this.auth.login(this.username, this.password);
      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (error: any) {
      this.presentToast(error.message || 'Error al iniciar sesión', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}