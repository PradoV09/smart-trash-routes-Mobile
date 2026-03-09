# 📱 Smart Trash Routes Mobile

Aplicación móvil para gestionar y visualizar las rutas de camiones de basura en Buenaventura 🌍

Desarrollada con **Ionic + Angular Standalone (Frontend)** y **FastAPI (Backend)** bajo un enfoque **DevOps (CI/CD, Integración y Despliegues Continuos)**.

---

## 🧠 Contexto del Problema

En Buenaventura no existe claridad sobre los horarios ni recorridos de los camiones de basura. Esto provoca que muchas personas saquen las bolsas en cualquier momento, generando:

- 🗑️ Acumulación de residuos
- 😷 Malos olores
- 🚯 Desorden en las calles

---

## 🎯 Objetivo

Desarrollar una aplicación móvil que permita:

- 📍 Visualizar rutas de camiones de basura en mapa
- 🚛 Ver ubicación de los camiones
- ⏰ Consultar horarios de recolección
- 📢 Recibir notificaciones o avisos de recolección

---

## 🛠️ Tecnologías

| Área          | Herramientas               |
| ------------- | -------------------------- |
| Mobile App    | Ionic + Angular Standalone |
| Lenguaje      | TypeScript                 |
| Runtime móvil | Capacitor                  |
| Mapas         | Leaflet / Google Maps      |
| Backend API   | FastAPI                    |
| Base de Datos | PostgreSQL + PostGIS       |
| DevOps        | GitHub Actions             |

---

## 🚀 Instalación y Ejecución

### 🔧 1. Clonar el repositorio

```bash
git clone https://github.com/PradoV09/smart-trash-routes-mobile.git
cd smart-trash-routes-mobile
```

### 📦 2. Instalar dependencias

```bash
npm install
```

### ▶️ 3. Ejecutar en desarrollo

```bash
npx @ionic/cli serve
```

La app se ejecutará en: http://localhost:8100

### 🏗️ 4. Compilar el proyecto

```bash
ionic build
```

### 📱 5. Ejecutar en Android

Sincronizar con Capacitor:

```bash
npx cap sync
```

Abrir Android Studio:

```bash
npx cap open android
```

Para desarrollo con Live Reload:

```bash
ionic cap run android -l --external
```

---

## 📅 Metodología de Trabajo

Aplicamos **Scrum** con **sprints de 2 semanas**, usando GitHub Projects para la gestión.

### 🧩 Entregables por Sprint

1. 🧱 Estructura inicial + acuerdos del equipo
2. 🧠 Diseño del sistema + backlog
3. ⚙️ Base de Ionic + CI configurado
4. 🚚 CRUD de camiones y empleados
5. 🗺️ Mapa y rutas (Leaflet)
6. 🛰️ Simulación en tiempo real
7. ✅ Pruebas y despliegue final

---

## 👥 Equipo de Desarrollo

| Nombre                                | Rol                | GitHub                                                       |
| ------------------------------------- | ------------------ | ------------------------------------------------------------ |
| **Jonatan Stewar Cuero Moreno**       | Frontend Developer       | [@JonatanCueroMoreno](https://github.com/JonatanCueroMoreno) |
| **Christian Iván Asprilla Jaramillo** | Frontend Developer | [@Ci-Jeey](https://github.com/Ci-Jeey)                       |
| **Hinojosa Dev**                      | Frontend Developer | [@Devlop1327](https://github.com/Devlop1327)                 |
| **Heiner Jair Godoy Zamora**          | Backend Developer          | [@heiner-godoy](https://github.com/heiner-godoy)             |
| **Jose Luis Prado Valencia**          | Backend Developer          | [@PradoV09](https://github.com/PradoV09)                     |

---

## 🧑‍💻 Requisitos Previos

- **Node.js >= 18**
- **npm >= 9**
- **Android Studio**
- **Capacitor**
- Dispositivo Android o emulador

---

## 🧪 CI/CD

Cada push al repositorio principal activa **GitHub Actions**, que ejecuta:

1. ✅ Lint + Tests
2. 🏗️ Build del proyecto
3. 🚀 Deploy automático en entorno staging

---

## 📄 Licencia

**MIT License** – Proyecto académico de la **Universidad del Valle**. Uso libre con fines educativos.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

**Desarrollado con 💚 por el equipo de Smart Trash Routes - Universidad del Valle**
