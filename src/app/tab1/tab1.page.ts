import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonBadge, IonList, IonItem, IonLabel, 
  IonItemSliding, IonItemOptions, IonItemOption,
  IonFab, IonFabButton, IonIcon, IonButton,
  IonListHeader, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption,
    IonFab, IonFabButton, IonIcon, IonButton,
    IonListHeader
  ],
})
export class Tab1Page {
  constructor(private loadingCtrl: LoadingController) {
    addIcons({ callOutline });
  }

  async iniciarRuta() {
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando Ruta...',
      duration: 1500,
    });
    await loading.present();
  }

  emergencia() {
    alert('Llamando a Emergencias...');
  }

  completarParada(parada: any) {
    console.log('Parada completada:', parada);
  }
}
