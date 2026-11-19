# CreateQR

Generador web **100% standalone** de códigos QR para URLs con gama de estilos visuales personalizables y exportación directa en PNG y SVG, sin servidores ni dependencias externas en tiempo de ejecución.

## Características

- **Standalone y sin compilación**: solo HTML, CSS y JavaScript puro con `vendor/qrcode.js` incluido localmente (funciona abriendo `index.html` directamente o desde GitHub Pages).
- **Gama de estilos predefinidos**:
  - **Clásico**: módulos cuadrados nítidos en alto contraste.
  - **Moderno**: módulos y esquinas redondeadas con degradado índigo.
  - **Puntos**: módulos circulares minimalistas.
  - **Cyber Neón**: fondo oscuro con degradado cian-violeta.
  - **Elegante**: trazos orgánicos en tonos cálidos.
  - **Diamante**: módulos en forma de rombo esmeralda.
- **Personalización fina**: forma de módulos (`square`, `rounded`, `dots`, `classy`, `diamond`), forma de ojos/esquinas (`square`, `rounded`, `circle`), colores sólidos o en degradado, color de fondo y nivel de corrección de error (`L`, `M`, `Q`, `H`).
- **Exportación**: descarga en **PNG (1024×1024)**, **SVG vectorial** o copia directa al portapapeles.

## Uso 
```
<https://ncarrillo93.github.io/CreateQR/>
