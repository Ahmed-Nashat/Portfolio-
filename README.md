# Ahmed Nashaat — BACKEND_OS Portfolio

A responsive developer portfolio for Ahmed Nashaat, built around a backend-engineering visual system and real project work.

## Included projects

- [PROGRAM LMS](https://github.com/omar-abdelazim-dev/program)
- [Knzify](https://github.com/Ahmed-Nashat/knzify)
- [Secure User Management](https://github.com/Ahmed-Nashat/Secure_User_Management_SHA256)

## Stack

- React and Vite for the public website
- Node.js and Express for the contact API
- Nodemailer for SMTP contact delivery
- Rate limiting and server-side validation for the contact endpoint

## Run locally

Start the API:

```powershell
cd server
Copy-Item .env.example .env
npm run dev
```

Add SMTP credentials to `server/.env` before sending real contact emails.

In a second terminal, start the website:

```powershell
cd client
npm run dev
```

The website will be available at `http://localhost:5173`; the API runs at `http://localhost:4000`.
