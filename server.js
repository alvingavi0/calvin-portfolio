const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '454858553626-rfivpo10lb79anb7ft4mc4ig11h8ab5d.apps.googleusercontent.com';

// Restrict only this specific Google account email to login as admin
const ALLOWED_ADMIN_EMAIL = process.env.ALLOWED_ADMIN_EMAIL || 'wanyamacalvinotieno254@gmail.com';

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({secret:'portfolio-secret', resave:false, saveUninitialized:true}));

// serve static assets and pages
app.use(express.static(path.join(__dirname)));

// authentication middleware
function requireAuth(req,res,next) {
    if (req.session && req.session.authenticated) return next();
    res.status(401).send('Unauthorized');
}

// fresh admin auth check endpoint
app.get('/api/fresh-admin-status', (req,res)=>{
    res.json({authenticated: !!req.session.authenticated});
});

// session-protection middleware for fresh routes
function requireFreshAuth(req,res,next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.status(401).json({error:'Unauthorized'});
}

// new route for fresh Google login flow
app.post('/api/fresh-google-login', async (req,res) => {
    const {credential} = req.body;
    if (!credential) return res.status(400).json({error:'Missing credential'});
    try {
        const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!verify.ok) return res.status(401).json({error:'Invalid token'});

        const token = await verify.json();
        if (token.aud !== GOOGLE_CLIENT_ID) return res.status(401).json({error:'Audience mismatch'});
        const verified = token.email_verified === 'true' || token.email_verified === true;
        if (!verified) return res.status(401).json({error:'Email not verified'});
        if (!token.email || token.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
            return res.status(403).json({error:'Email not allowed'});
        }

        req.session.authenticated = true;
        res.sendStatus(200);
    } catch (err) {
        console.error('fresh-google-login', err);
        res.status(500).json({error:'Google login error'});
    }
});

app.get('/fresh-logout', (req,res)=>{
    req.session.destroy(()=>res.redirect('/fresh-index.html'));
});



// contact CRUD
app.get('/api/contact', (req,res)=>{
    const data = fs.readFileSync(path.join(__dirname,'contact.json'), 'utf8');
    res.type('application/json').send(data);
});
app.post('/api/contact', requireAuth, (req,res)=>{
    fs.writeFileSync(path.join(__dirname,'contact.json'), JSON.stringify(req.body,null,2));
    res.sendStatus(200);
});

// about page update
app.post('/api/about', requireAuth, (req,res)=>{
    fs.writeFileSync(path.join(__dirname,'about.html'), req.body);
    res.sendStatus(200);
});

// handle file uploads
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload/cv', requireAuth, upload.single('cv'), (req,res)=>{
    if (!req.file) return res.status(400).send('No file');
    // move to Files folder with fixed name
    fs.renameSync(req.file.path, path.join(__dirname,'Files','Calvin_CV.pdf'));
    res.sendStatus(200);
});

// projects upload: either a JSON or a ZIP containing folders
app.post('/api/upload/projects', requireAuth, upload.single('projects'), (req,res)=>{
    if (!req.file) return res.status(400).send('No file');
    const dest = path.join(__dirname,'projects.json');
    const mime = req.file.mimetype;
    if (mime === 'application/json' || req.file.originalname.endsWith('.json')) {
        fs.renameSync(req.file.path, dest);
        res.sendStatus(200);
        return;
    }
    // handle zip
    if (mime === 'application/zip' || req.file.originalname.endsWith('.zip')) {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(req.file.path);
        const extractDir = path.join(__dirname,'project_data');
        // clean previous
        if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive:true, force:true });
        fs.mkdirSync(extractDir);
        zip.extractAllTo(extractDir, true);
        // build JSON from folders
        const projects = [];
        fs.readdirSync(extractDir, { withFileTypes:true }).forEach(dirent => {
            if (dirent.isDirectory()) {
                projects.push({ name: dirent.name, type: '', description: '', repo: '', live: null, status: 'development' });
            }
        });
        fs.writeFileSync(dest, JSON.stringify(projects, null,2));
        fs.unlinkSync(req.file.path);
        res.sendStatus(200);
        return;
    }
    // unsupported
    fs.unlinkSync(req.file.path);
    res.status(400).send('Unsupported file type');
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));