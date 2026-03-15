const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// password storage (use /tmp for Vercel serverless compatibility)
const PASS_FILE = '/tmp/admin_password.txt';

// simple in-memory user logic replaced by file-based password
function checkPassword(pwd) {
    if (fs.existsSync(PASS_FILE)) {
        const stored = fs.readFileSync(PASS_FILE,'utf8').trim();
        return pwd === stored;
    }
    return false;
}

function setPassword(pwd) {
    fs.writeFileSync(PASS_FILE,pwd);
}

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

app.post('/login', (req,res)=>{
    const {pwd} = req.body;
    if (checkPassword(pwd)) {
        req.session.authenticated = true;
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

// endpoint to check whether password exists
app.get('/api/password', (req,res)=>{
    res.json({exists: fs.existsSync(PASS_FILE)});
});

// endpoint to report authentication + password state
app.get('/api/status', (req,res)=>{
    res.json({
        authenticated: !!req.session.authenticated,
        exists: fs.existsSync(PASS_FILE)
    });
});

// set initial password (only allowed when none exists or authenticated)
app.post('/api/password', (req,res)=>{
    const {pwd} = req.body;
    if (!fs.existsSync(PASS_FILE) || req.session.authenticated) {
        setPassword(pwd);
        req.session.authenticated = true; // log in after setting
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

app.get('/logout', (req,res)=>{
    req.session.destroy(()=>res.redirect('/admin.html'));
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