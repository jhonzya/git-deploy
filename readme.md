# git-deploy

automatiza el proceso de deploy en múltiples repositorios

#### Requisitos
- nodejs
- yarn o npm

#### Instalación
- clonar
- `yarn`

#### Configuración
- copiar .env.example a .env
    - NAME: nombre de la aplicación
    - PORT: puerto a usar por el servidor
    - GITHUB_SECRET: gitHub Key (64 random chars)
    - SLACK_HOOK: hook a utilizar para notificaciones
- copiar config.js.example a config.js
    - configurar los repositorios necesarios

#### Uso
- `yarn start`, o equivalentes


#### deployfile
    - los repositorios deben tener un archivo `.deployfile` o `.deployfile.{branch}`