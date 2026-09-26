# Taller Mecánico — proyecto para Netlify

## Qué hay en esta carpeta
- **`index.html`** — la aplicación completa: login, registro de vehículos y servicios, recordatorios, exportar a PDF/Excel.
- **`netlify.toml`** — configuración para que Netlify publique el sitio y reconozca la función de correo.
- **`netlify/functions/enviar-correo.mjs`** — función opcional para enviar los recordatorios por Gmail de forma automática (necesita configuración, ver más abajo).
- **`package.json`** — declara `nodemailer`, la única dependencia que usa esa función.

## Subir el sitio a Netlify

**Opción rápida — arrastrar y soltar:**
1. Entra a [app.netlify.com](https://app.netlify.com) → "Add new site" → "Deploy manually".
2. Arrastra esta carpeta completa a la zona de subida.
3. En segundos tienes una URL como `tu-taller.netlify.app` con la app ya funcionando: login, registro, recordatorios, todo igual que antes.

**Opción con GitHub — mejor si vas a seguir pidiéndome cambios más adelante:**
1. Sube esta carpeta a un repositorio nuevo en GitHub.
2. En Netlify → "Add new site" → "Import an existing project" → conecta el repositorio.
3. Netlify lee el `netlify.toml` automáticamente, no hay que tocar configuración.

Apenas la subas, todo lo que ya tenías (login, registro de servicios, recordatorios, exportar PDF/Excel, respaldo JSON) funciona igual que en tu computador, porque los datos se siguen guardando con `localStorage` en el navegador. Eso sí: cada dispositivo/navegador que entre a esa URL va a tener su propia lista de datos, no comparten información entre sí todavía — para eso está la sección de Supabase más abajo.

## Activar el envío automático de correos (opcional)
La función `enviar-correo.mjs` no envía nada por sí sola hasta que definas estas variables en Netlify (Site configuration → Environment variables):
- `GMAIL_USER` → el correo del taller
- `GMAIL_APP_PASSWORD` → contraseña de aplicación generada en myaccount.google.com/apppasswords (requiere verificación en 2 pasos activada en esa cuenta de Gmail)

Sin configurar esto no pasa nada malo: el botón "Abrir en Gmail" de los recordatorios sigue funcionando exactamente igual que ahora (arma el correo con los datos del cliente y lo deja listo para que tú lo envíes con un clic). Cuando quieras que se envíe solo, avísame y conectamos ese botón a esta función.

## Pasar de localStorage a una base de datos real (Supabase)
Esto es lo que permite que los datos se vean iguales desde cualquier dispositivo, en vez de quedar guardados solo en el navegador donde los cargaste. Cuando quieras dar ese paso:

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta este script completo:

```sql
create extension if not exists pgcrypto;

create table servicios (
  id uuid primary key default gen_random_uuid(),
  modelo text not null,
  patente text not null,
  kilometraje numeric,
  dueno text not null,
  telefono text,
  correo text,
  fecha date not null,
  costo numeric,
  servicio text not null,
  observaciones text,
  creado_en timestamptz default now()
);
create index idx_servicios_patente on servicios (lower(patente));
create index idx_servicios_dueno on servicios (lower(dueno));

create table recordatorios (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid references servicios(id) on delete set null,
  patente text not null,
  modelo text,
  dueno text,
  telefono text,
  correo text,
  fecha_objetivo date not null,
  nota text,
  atendido boolean default false,
  notificado boolean default false,
  creado_en timestamptz default now()
);

alter table servicios enable row level security;
alter table recordatorios enable row level security;

create policy "Solo autenticados - servicios"
  on servicios for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Solo autenticados - recordatorios"
  on recordatorios for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

3. Guarda el **Project URL** y la **anon public key** (Project Settings → API).

Con esos dos datos reemplazamos las funciones que hoy leen y escriben en `localStorage` por llamadas a Supabase, y de paso cambiamos el login fijo (usuario `9999`) por Supabase Auth de verdad — ese login actual vive escrito en el propio `index.html`, así que sirve como filtro básico, no como seguridad real.

Avísame cuando tengas el proyecto de Supabase creado y seguimos con esa parte paso a paso — es más seguro ir probando cada pieza contra tu proyecto real que dejar código sin probar.
