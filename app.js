require('dotenv').config();
const express = require('express');
const {
    exec
} = require('child_process');
const fs = require('fs');
const app = express();


//create session var
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fileStoreOptions = {
    ttl: process.env.sessionLife,
    reapInterval: process.env.clearSessions,
    path: process.env.sessionDB + "/sessions"
};
const sessionVar = session({
    name: process.env.sessionName,
    store: new FileStore(fileStoreOptions),
    secret: process.env.sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: {
        sameSite: true,
    }
});

//routes
const authRoutes = require('./routes/auth')(process.env.userDB);
const logRoutes = require('./routes/log')(process.env.LogIPDB, process.env.logfile, process.env.userDB);


const port = process.env.port;
const httpdocs = __dirname + '/httpdocs/';
const bashDir = __dirname + '/bash';
const ejsDir = __dirname + '/views';

//set view engine
app.set('view engine', 'ejs');
app.set('views', ejsDir);


app.use(sessionVar);
app.use(logRoutes);
app.use(express.static(httpdocs));
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/b/tag/:id', (req, res, next) => {
    // see if file exits fs.statSync()
    if (true) {
        next();
    } else {
        res.render('btemplate', {
            blogtitle: 'BLOGtitle'
        });
    }
});

app.get('/b/home', (req, res) => {
    res.render('bhome', {
        blogtitle: 'BLOGtitle'
    });
});

app.get('/b/edit', (req, res) => {
    res.render('bedit', {
        blogtitle: 'Editing'
    });
});

//API functions
app.all('/api/:id', (req, res) => {
    exec(`${bashDir}/${req.params.id}.sh`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        } else {
            res.send(stdout);
            res.end(); //this is probably redundant
        }
    });
});

//Check if its directory Files or doesn't exist
app.get('*', (req, res, next) => {
    fs.readdir(httpdocs + req.url, function (err, files) {
        var fileData = [];
        if (err) {
            req.hasError = true;
            res.render('error', {
                message: req.url
            });
        } else {
            files.forEach(file => {
                fileData.push({
                    fileName: file,
                    filePath: `${req.url}${file}`,
                    fileType: fs.lstatSync(`${httpdocs}${req.url}${file}`)
                        .isDirectory() ? 'dir' : 'file'
                });
            });
            res.render('viewDirectory', {
                data: fileData
            });
            //do we need next() here?
        }
    });
});

//Start up app
exec('hostname -I', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
    } else {
        app.listen(port, () => {
            console.log(`app listening at http://${stdout.trim()}:${port}`);
        });
    }
});