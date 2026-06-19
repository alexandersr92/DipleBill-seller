# Lógica y Arquitectura de DipleBill Facturación Standalone

Este proyecto es una versión simplificada y dedicada de **DipleBill** en Electron, diseñada única y exclusivamente para el proceso de facturación y consulta del historial de ventas del día por parte de los vendedores (cajeros).

---

## 1. Flujo de Autenticación en Dos Pasos

Para garantizar la seguridad del sistema y que los vendedores solo operen dentro de los locales autorizados, se implementa un flujo de acceso secuencial:

### Paso 1: Autenticación del Administrador/Propietario (Owner)

- **Interfaz**: Pantalla de inicio de sesión estándar (`LoginForm`).
- **Datos**: Correo electrónico y contraseña del propietario.
- **Acción**: Llama a `POST /v1/login` para obtener el token Bearer de Sanctum.
- **Resultado**: El dispositivo queda autorizado para interactuar con la API de la organización. El token se guarda en `localStorage` y en Redux. Si no hay token de Administrador, el sistema redirige automáticamente a `/login`.

### Paso 2: Autenticación del Vendedor (Seller Login)

- **Interfaz**: Pantalla de acceso de vendedor (`SellerLogin`). Esta pantalla solo se muestra una vez que la sesión de administrador está activa.
- **Datos**:
  1. **Tienda/Sucursal**: Una lista desplegable con las tiendas de la organización (obtenidas mediante `/v1/stores`).
  2. **Código de Vendedor**: Código asignado al vendedor (ej. `OWNER-...` o `VEND-01`).
  3. **PIN de Seguridad**: Código PIN numérico de acceso (ej. `1234`).
- **Acción**: Llama a `POST /v1/sellers/seller-login` enviando `store_id`, `code` y `pin` con las cabeceras de autorización del propietario.
- **Resultado**: El backend valida el PIN hasheado contra la base de datos y que el vendedor esté asignado a dicha sucursal. Si es válido, devuelve los datos del vendedor y la tienda asignada. La sesión del vendedor se inicializa.

---

## 2. Restricción y Protección de Rutas

El enrutamiento está fuertemente simplificado y blindado a nivel de código en `src/router/index.tsx` y `src/modules/auth/components/PrivateRoute.tsx`:

- **PrivateRoute**:
  - Verifica si la sesión de administrador está activa (token válido). Si no, redirige a `/login`.
  - Verifica si hay una sesión de vendedor activa (`userSlice.isSellerAuthenticated`). Si no, redirige a `/seller-login`.
- **Rutas Habilitadas**:
  - `/login` (Acceso Administrador)
  - `/seller-login` (Acceso Vendedor / PIN)
  - `/` y `/venta` (Nueva Factura / Ventas) - _Punto de entrada por defecto_
  - `/invoices` (Historial de Facturas del Día)
  - `/invoices/:id` (Visualización e Impresión de Facturas específicas)
- **Rutas Deshabilitadas/Eliminadas**:
  - Se eliminaron del compilador React todas las demás pantallas (inventarios, productos, compras, reportes, créditos, configuraciones, organización). Intentar acceder a cualquier otra ruta no definida redirige al punto de venta o muestra la pantalla 404.

---

## 3. Modificaciones en la Interfaz de Usuario (UI)

La barra lateral (`AppSidebar`) y el perfil de usuario (`NavUser`) se adaptaron para el rol del vendedor:

### Cabecera de la Barra Lateral (Header)

- Se **eliminó el selector interactivo de sucursales** (`StoresSwitcher`) para evitar que un vendedor cambie de tienda deliberadamente sin re-autenticar su PIN.
- En su lugar, se muestra una **tarjeta estática informativa** con el nombre y dirección de la sucursal seleccionada durante el inicio de sesión del vendedor.

### Cuerpo de la Barra Lateral (Sidebar Menu)

- Solo muestra el menú de **Facturación** con las opciones:
  - **Nueva Venta** (`/venta`)
  - **Facturas** (`/invoices`)

### Pie de la Barra Lateral (Footer / NavUser)

- Muestra el nombre del vendedor activo (`user.sellerName`) y su código en lugar del correo de administración.
- Ofrece las siguientes opciones en el menú desplegable:
  - **Cambiar Vendedor**: Cierra la sesión del vendedor actual (borra `seller_id`, `seller_name` y `seller_code` del almacenamiento local y Redux) y redirige a la pantalla del PIN para que ingrese otro cajero. Mantiene la sesión del administrador activa.
  - **Cerrar Sesión Admin**: Limpia por completo todas las sesiones (`localStorage.clear()`) y tokens de comunicación, regresando al formulario de acceso de correo/contraseña.

---

## 4. Persistencia de Sesión

Para evitar interrumpir el trabajo de caja si la aplicación de Electron se cierra o se reinicia accidentalmente:

- El token de administrador se almacena persistentemente en `localStorage`.
- Los datos de la sesión del vendedor (`seller_id`, `seller_name`, `seller_code`) y el ID de la tienda activa (`currentStoreId`) se almacenan de igual forma en `localStorage`.
- En el arranque (`useValidateToken`), si hay credenciales de vendedor en el almacenamiento, se restauran automáticamente al estado global de Redux, permitiendo al cajero volver directamente a la pantalla de ventas sin loguearse de nuevo.
