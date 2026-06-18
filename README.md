MODIFICADO EN VSCODE 
mod en git

# PitTacos — Inventario y Capacitaciones

PWA para gestionar inventario por conteo de turno, recepciones de proveedor, surtido automático, reportes y capacitaciones. Diseñada para **3 sucursales independientes** con 2 turnos diarios.

## Requisitos

- [Node.js](https://nodejs.org/) 20+ (incluye npm)

## Instalación

```bash
cd "PitTacos Inventory"
npm install
```

## Desarrollo

```bash
npm run dev
```

- Frontend PWA: http://localhost:5173
- API: http://localhost:3001

## Producción

```bash
npm run build
npm start
```

Sirve la app en http://localhost:3001 (frontend + API).

## Usuarios de prueba

Todos usan PIN **1234**:

| Usuario | Rol | Sucursal |
|---------|-----|----------|
| Administrador | admin | Todas |
| Encargado Centro / Norte / Sur | encargado | Su sucursal |
| Trabajador Centro / Norte / Sur | trabajador | Solo capacitaciones |

## Flujo operativo

### Encargados (fin de turno — matutino y vespertino)

1. **Conteo** → Registran lo que **queda** (ej. "1 costal de cebolla", "2 rejas de limón")
2. **Recepción** → Registran cuando llega mercancía del proveedor
3. **Surtido** → Ven la lista automática de qué hay que comprar

### Admin

- Selecciona sucursal y ve dashboard, reportes y comparativa entre las 3 sucursales
- Crea/edita capacitaciones

### Trabajadores

- Solo ven y completan capacitaciones

## Instalar como app (PWA)

1. Abre la app en Chrome/Edge en el celular
2. Menú → "Agregar a pantalla de inicio" / "Instalar app"

## Estructura

```
├── client/     React + Vite + PWA + Tailwind
├── server/     Express + SQLite
└── package.json
```

## Base de datos

SQLite en `server/data/pittacos.db`. Se crea automáticamente con datos de prueba al iniciar el servidor.

Para resetear: borra `server/data/pittacos.db` y reinicia.
