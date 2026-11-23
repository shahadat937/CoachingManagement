# Web (Angular + NgRx)

```bash
npx @angular/cli@18 new coaching-web --standalone --routing --style=scss --skip-git
cd coaching-web
ng add @ngrx/store@18 --no-interactive && ng add @ngrx/effects@18 --no-interactive && ng add @ngrx/store-devtools@18 --no-interactive
cp -r ../overlay/src/app/* src/app/        # attendance feature, app.config, app.routes
cp ../overlay/src/styles.scss src/styles.scss
cp ../overlay/proxy.conf.json .
ng serve --proxy-config proxy.conf.json
```
Feature layout (repeat per module): `features/<module>/{data, store, pages, <module>.routes.ts}`.

Authentication is registered globally in `core/auth/store`. The login form dispatches an NgRx login action; effects call `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout` with browser credentials. The access-token session is held in NgRx and session storage, while the refresh token remains an HttpOnly cookie and is never placed in NgRx state or browser storage. The interceptor dispatches one shared refresh flow for protected `401` responses and retries the original request once.

The overlay now includes the full post-login coaching shell: dashboard, responsive navigation, role-aware routes, and workspace pages for students, academics, attendance, exams, finance, devices and team access. The default Angular starter has a 4 KB component-style error budget; for this dashboard set `anyComponentStyle.maximumError` to at least `12kB` in `angular.json`.
