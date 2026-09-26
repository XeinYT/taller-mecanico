// Función opcional: envía un recordatorio por correo desde la cuenta de Gmail del taller.
// No se activa sola: necesita las variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD
// configuradas en Netlify (Site configuration -> Environment variables). Ver README.md.
//
// Mientras no la conectes desde la app, no afecta en nada: el botón "Abrir en Gmail"
// de los recordatorios sigue funcionando igual que siempre (arma el correo, tú lo envías).

import nodemailer from 'nodemailer';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  let datos;
  try {
    datos = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Cuerpo de la solicitud inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { destinatario, asunto, mensaje } = datos;
  if (!destinatario || !mensaje) {
    return new Response(JSON.stringify({ ok: false, error: 'Falta destinatario o mensaje' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: 'Faltan las variables de entorno GMAIL_USER / GMAIL_APP_PASSWORD' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: destinatario,
      subject: asunto || 'Recordatorio de servicio',
      text: mensaje
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo enviar el correo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
