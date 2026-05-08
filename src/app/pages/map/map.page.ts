import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { arrowBackOutline, locateOutline, moonOutline, sunnyOutline } from 'ionicons/icons';

// Fix iconos Leaflet en webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MapPage implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private userMarker?: L.Marker;
  private darkLayer!: L.TileLayer;
  private lightLayer!: L.TileLayer;
  isDark = false;
  coordsInfo = '';

  // Buenaventura
  private readonly CENTER: L.LatLngExpression = [3.8772, -77.0282];

  constructor(private router: Router) {
    addIcons({ arrowBackOutline, locateOutline, moonOutline, sunnyOutline });
    this.isDark = document.body.classList.contains('dark-theme');
  }

  ngAfterViewInit() {
  setTimeout(() => this.initMap(), 500);
}

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  private initMap() {
    this.map = L.map('map', {
      center: this.CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    // Capas
    this.lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Leaflet | © OpenStreetMap',
      maxZoom: 19
    });

    this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'Leaflet | © OpenStreetMap © CARTO',
      maxZoom: 19
    });

    // Aplicar capa según tema
    if (this.isDark) {
      this.darkLayer.addTo(this.map);
    } else {
      this.lightLayer.addTo(this.map);
    }

    // Zoom controls personalizados
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Click para agregar marcadores
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const marker = L.marker([lat, lng]).addTo(this.map);
      marker.bindPopup(
        `<div style="font-family: sans-serif; font-size: 13px;">
          <b>📍 Marcador</b><br>
          Lat: ${lat.toFixed(5)}<br>
          Lng: ${lng.toFixed(5)}
        </div>`
      ).openPopup();
      this.coordsInfo = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });
  }

  goToMyLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng: L.LatLngExpression = [latitude, longitude];

        if (this.userMarker) {
          this.userMarker.setLatLng(latlng);
        } else {
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="
              width: 20px; height: 20px;
              background: #0A4174;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(10,65,116,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          this.userMarker = L.marker(latlng, { icon: userIcon }).addTo(this.map);
          this.userMarker.bindPopup('<b>📍 Tu ubicación</b>').openPopup();
        }

        this.map.flyTo(latlng, 15, { animate: true, duration: 1.2 });
        this.coordsInfo = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true }
    );
  }

  toggleMapTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      this.map.removeLayer(this.lightLayer);
      this.darkLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.darkLayer);
      this.lightLayer.addTo(this.map);
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}