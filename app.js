const express = require('express')
const {
    exec
} = require('child_process')
const fs = require('fs')
const app = express()
const port = 3000

const httpdocs = __dirname + '/httpdocs/'
const bashDir = __dirname + '/bash'
const ejsDir = __dirname + '/views'

// logging var
const start = Date.now()
var reqnum = 0
var max_reqnum = 0
var max_dt = 0

//utils
function prettyDate(dt) {
    var seconds = (dt) / 1000
    var d = Math.floor(seconds / (3600 * 24))
    var h = Math.floor(seconds % (3600 * 24) / 3600)
    var m = Math.floor(seconds % 3600 / 60)
    var s = Math.floor(seconds % 60)
    var ret = (d > 0 ? d + "d" : "") + (h > 0 ? h + "h" : "") + (m > 0 ? m + "m" : "") + (s > 0 ? s + "s" : "")
    ret = (ret == "" ? "0s" : ret)
    return ret
}


//log request
app.use((req, res, next) => {
    req.date = Date.now()
    req.reqnum = reqnum
    reqnum++
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //var ip = "192.69.128.250"
    max_reqnum = Math.max(req.reqnum.toString().length, max_reqnum)
    max_dt = Math.max(prettyDate(req.date - start).length, max_dt)
    fs.appendFile(httpdocs+"app.txt",`req ${req.reqnum.toString().padEnd(max_reqnum+2)}${prettyDate(req.date-start).padEnd(max_dt+2)}${req.url}\n`,function(err) {})
    res.on('finish', async () => {
        var finishTime = Date.now()
        exec(`whois ${ip} | grep City | cut -d ":" -f 2 | tr -d '[:space:]'`, (err, stdout, stderr) => {
            if (err) {
                req.city = "City Not Found"
            }
            req.city = stdout
            fs.appendFile(httpdocs+"app.txt",`ret ${req.reqnum.toString().padEnd(max_reqnum+2)}${prettyDate(finishTime-req.date).padEnd(max_dt+2)}${ip}:${req.city} ${req.hasError ? 'Not Found' : '\n'}`,function(err) {})
        })
    })
    next()
})

//Static Files
app.use(express.static(httpdocs))

//set view engine
app.set('view engine', 'ejs');
app.set('views', ejsDir);

//API functions
app.all('/api/:id', (req, res) => {
    exec(`${bashDir}/${req.params.id}.sh`, (err, stdout, stderr) => {
        if (err) {
            console.log(err)
        } else {
            res.send(stdout)
            res.end()
        }
    })
})


//Read directory Files
app.get('*', (req, res) => {
    fs.readdir(httpdocs + req.url, function (err, files) {
        var fileData = []
        if (err) {
            req.hasError = true
            res.end()
        } else {
            files.forEach(file => {
                fileData.push({
                    fileName: file,
                    filePath: `${req.url}${file}`,
                    fileType: fs.lstatSync(`${httpdocs}${req.url}${file}`).isDirectory() ? 'dir' : 'file'
                })
            })
            res.render('viewDirectory', {
                data: fileData
            })
        }
    })
})

//Start up app
exec('hostname -I', (err, stdout, stderr) => {
    if (err) {
        console.error(err)
    } else {
        app.listen(port, () => {
            console.log(`app listening at http://${stdout.trim()}:${port}`)
        })
    }
})