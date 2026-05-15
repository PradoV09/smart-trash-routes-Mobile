import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonCheckbox, 
  IonTextarea, IonButton, IonListHeader, ToastController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox,
    IonTextarea, IonButton, IonListHeader
  ],
})
export class Tab2Page {
  constructor(private toastCtrl: ToastController) {}

  async completarParada() {
    const toast = await this.toastCtrl.create({
      message: '✅ Parada completada',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  reportarProblema() {
    alert('Reportando problema...');
  }
}
