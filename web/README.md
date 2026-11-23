# Web (Angular + NgRx)

```bash
npx @angular/cli@18 new coaching-web --standalone --routing --style=scss --skip-git
cd coaching-web
ng add @ngrx/store@18 --no-interactive && ng add @ngrx/effects@18 --no-interactive && ng add @ngrx/store-devtools@18 --no-interactive
cp -r ../overlay/src/app/* src/app/        # attendance feature, app.config, app.routes
cp ../overlay/proxy.conf.json .
ng serve --proxy-config proxy.conf.json
```
Feature layout (repeat per module): `features/<module>/{data, store, pages, <module>.routes.ts}`.
