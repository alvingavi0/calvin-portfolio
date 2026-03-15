# Calvin Portfolio

This repository contains a static portfolio site with an optional Node.js admin backend for managing content locally.

## Features

- Responsive, modern UI with light/dark themes and animations
- Hero section with left-aligned text and profile image
- Dynamic project listing (driven by `projects.json`)
- Skills, contact info, CV download/preview
- Hidden admin interface for editing contact info, about page, uploading CV, and updating projects

## Setup

1. **Install dependencies**
   ```bash
   cd "C:\Users\wanya.DESKTOP-SAM4S9C\Desktop\PROJECTS\CALVIN PROFILE"
   npm install
   ```

2. **Add your CV**
   Place your PDF in `Files/Calvin_CV.pdf` (or upload via admin panel).

3. **Start the server**
   ```bash
   npm start
   ```
   The site will be available at `http://localhost:3000`.

4. **Admin credentials**
   On first access the site will prompt you to create a password. That password is stored in a file (`admin_password.txt`) in the project root and is required for all subsequent logins. There is no username; you authenticate simply by entering the password.

   You can also reveal the admin link by typing the word `admin` on any page or pressing `Ctrl+Shift+A`, which will show a hidden link to `/admin.html`.

5. **Access the admin panel**
   Navigate to `http://localhost:3000/admin.html` (or use the keyboard shortcut) and either set a new password or log in with the one you created.

   Once authenticated you can:
   - Edit contact details (writes `contact.json`)
   - Upload a new CV (replaces `Files/Calvin_CV.pdf`)
   - Upload a new `projects.json` file or ZIP of project folders
   - Edit the entire `about.html` markup
---

## Deployment (full stack)

To put the entire app online, including the admin backend, deploy to any Node‑capable host such as Heroku, Vercel, Render, DigitalOcean App Platform, etc. The repository is already self‑contained; follow these general steps:

1. **Push code to a Git remote** (GitHub, GitLab, etc.).
2. **Create an app on your chosen platform** (e.g. `heroku create my-portfolio`).
3. Ensure a `package.json` with a `start` script is present (already done).
4. Set any necessary environment variables:
    - `PORT` may be provided by the host automatically.
    - For production you might set `NODE_ENV=production`.
5. Deploy the repository (e.g. `git push heroku main`, or connect the GitHub repo in the dashboard).
6. After the build completes, open the app’s URL. The public site will load.
7. Trigger the admin modal (type `admin` or click the hidden link) and set your password – this will create `admin_password.txt` on the server filesystem.

### Example: Heroku

```bash
# from project root
heroku login
heroku create calvin-portfolio
git push heroku main
heroku config:set NODE_ENV=production
heroku open
```

### Example: Vercel

Because your app is a simple Express server, you can deploy it on Vercel using a single configuration file. Create a `vercel.json` (included in this repo) with:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

Then:

```bash
npm install -g vercel   # if you don't already have the CLI
vercel login            # authenticate with your Vercel account
cd "C:\Users\wanya.DESKTOP-SAM4S9C\Desktop\PROJECTS\CALVIN PROFILE"
vercel                 # follow the prompts to import the project and deploy
# on subsequent deploys, simply run:
vercel --prod
```

Once deployed you will receive a `.vercel.app` URL. Add your custom domain via the Vercel dashboard and follow the DNS instructions; HTTPS is provided automatically.

> **Important:** the file‑based password storage is suitable for small personal projects only. If you deploy publicly, consider replacing it with a proper database and hashed credentials, and serve over HTTPS.

For static‑only hosting, follow a different set of instructions earlier in this README.
## Content Workflow

- **Projects**: maintain `projects.json` manually or through admin uploads. The frontend auto-renders the list.
- **Contact info**: stored in `contact.json`; frontend pages fetch it on load.
- **About page**: full HTML is editable via admin.

## Notes

- This setup is intended for **local development**. If deploying publicly, you should secure authentication, sanitize inputs, and consider a proper CMS or headless backend.
- You can expand the admin panel with file-system browsing, image uploads, category tagging, etc.

Have fun customizing your portfolio!"}