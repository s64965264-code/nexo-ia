# Nexo IA

Nexo IA es un espacio de estudio en español con tutoría por chat, preguntas sobre imágenes y práctica por voz. Incluye modos de tutoría, práctica, plan de estudio, tarjetas y resúmenes.

## Ejecutar en Replit

Este proyecto usa un workspace pnpm con una interfaz web y una API:

- `artifacts/nexo-ia`: interfaz de estudio.
- `artifacts/api-server`: API que gestiona las solicitudes al tutor.
- `lib/api-spec`, `lib/api-client-react` y `lib/api-zod`: contrato y clientes compartidos.

Importa el repositorio en Replit, configura Clerk para autenticación y añade `OPENAI_API_KEY` en Replit Secrets. No guardes claves en el código ni en archivos versionados. Inicia los workflows `artifacts/nexo-ia: web` y `artifacts/api-server: API Server`.

## Privacidad y costes

El acceso a las funciones de IA requiere iniciar sesión. El historial de texto se guarda en el almacenamiento local del navegador por cuenta y no se sincroniza entre dispositivos. Las preguntas, imágenes o audio que envíes se procesan mediante OpenAI para generar respuestas.

El uso de OpenAI puede generar cargos y está sujeto a los precios, límites y disponibilidad del proveedor; Nexo IA no ofrece uso gratuito o ilimitado. Revisa las respuestas antes de usarlas: el tutor puede equivocarse.