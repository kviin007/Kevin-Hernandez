# Guía para publicar YuliedPlay en Google Play Store usando TWA (Trusted Web Activity)

Esta guía te ayudará a empaquetar tu PWA (Progressive Web App) en una aplicación Android nativa utilizando Bubblewrap y distribuirla en Google Play Store.

## Paso 1: Requisitos previos

Antes de comenzar, asegúrate de tener instalados los siguientes componentes:
1. **Node.js** (v14 o superior)
2. **Java Development Kit (JDK)** (versión 11 o superior).
3. **Android Studio** y las herramientas de línea de comandos de Android.

## Paso 2: Configurar Digital Asset Links

Para que la aplicación TWA no muestre la barra de direcciones de Chrome, debes verificar la propiedad de tu dominio.

1. Debes crear un archivo JSON y subirlo a la ruta de tu aplicación hosteada en internet:
   `https://[tu-dominio.com]/.well-known/assetlinks.json`

2. El contenido de `assetlinks.json` debe verse así:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yuliedplay.nails",
    "sha256_cert_fingerprints": [
      "[TU_SHA_256_AQUI_CON_PUNTOS]"
    ]
  }
}]
```
*Para obtener el SHA-256 de producción, puedes consultarlo desde Google Play Console más adelante.*

## Paso 3: Usar Bubblewrap para generar el proyecto Android

Bubblewrap es una CLI de Google que facilita la creación de aplicaciones TWA a partir de web manifest.

1. Instala Bubblewrap de forma global:
```bash
npm i -g @GoogleChromeLabs/bubblewrap
```

2. Inicializa el proyecto ejecutando el comando en una terminal dentro de un directorio vacío (fuera del código de la PWA):
```bash
bubblewrap init --manifest https://[tu-dominio.com]/manifest.webmanifest
```

Bubblewrap te pedirá algunos datos configurables. Asegúrate de configurar lo siguiente:
- **Web App URL:** `https://[tu-dominio.com]/`
- **Application Name:** YuliedPlay - Salón de Uñas
- **Short Name:** YuliedPlay
- **Application ID (Package Name):** `com.yuliedplay.nails`
- **Theme Color:** `#e91e8c`
- **Background Color:** `#ffffff`
- **Display Mode:** `standalone`
- **Orientation:** `portrait`

## Paso 4: Construir y firmar el APK/AAB

1. **Firmar la App**: Bubblewrap te pedirá las credenciales para un almacén de claves (Keystore KeyStore). Mantenlo seguro y no pierdas la contraseña.
2. Contruye la aplicación compilando el proyecto de la TWA a un Android App Bundle (.aab), que es el formato ideal y obligatorio para subir de hoy en día a la Play Store.
   
Ejecuta:
```bash
bubblewrap build
```

Esto generará el archivo **`app-release-bundle.aab`** en tu directorio.

Al construir te pedira las claves que hayas configurado en el `bubblewrap init`.

*(Nota: Bubblewrap puede preguntar si deseas usar el modo pantalla completa para la aplicación web; confírmale que sí para la inmersión.)*

## Paso 5: Generar y Subir a Google Play Console

1. Crea una cuenta de Google Play Developer si no tienes una (https://play.google.com/apps/publish/). Cuesta un pago único de 25 USD.
2. En Google Play Console, haz clic en "Crear Aplicación".
   - Nombre: YuliedPlay
   - Idioma predeterminado: Español (América Latina)
   - Tipo de aplicación: App
   - Categoría ("Estilos de vida", "Belleza")
3. Entra en Play Store Console a `Pruebas internas` o `Pruebas Cerradas (Alpha)`
4. Selecciona la opción para subir un release y sube el archivo `app-release-bundle.aab` generado.
5. Play App Signing: Google sugerirá o exigirá que uses la firma de aplicaciones de Google Play (Play App Signing). Habilítalo.
6. Copia la huella dactilar `SHA-256` provista por *Play App Signing* en tu consola dentro de `Configuración -> Integridad de Apps` > `Certificado de la clave de firma de la app`. 
7. Pegue es huella SHA-256 dentro de tu archivo `assetlinks.json` en tu servidor web, esto enlazará y validará que la PWA es dueña de ese dominio en especifico.  
8. Rellena toda la ficha de la tienda de la aplicación (Descripción, Screenshots, Categorías, Datos de contacto).
9. Finalmente envía tu app a revisión pasando por Closed Testing / Producción. ¡Y listo!
