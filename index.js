const express = require('express')
const app = express()
app.use(express.json()) // <==== parse request body as JSON
const port = 8000;
const http  = require('http');
const sqlite3 = require('sqlite3');
const path = require('path');
const { v4 : uuidv4 } = require("uuid");

//----------------------------------------------------------
//---------- Serve Files for the website -------------------
["/", "/index.html"].forEach(function (entryPoint) {
    app.get(entryPoint, (req, res) => {
        res.sendFile(path.join(__dirname + '/index.html'));
    });
});

app.get('^/:js(*.js)', (req, res) => {
    res.sendFile(path.join(__dirname + '/' + req.params.js));
});

app.get('^/:css(*.css)', (req, res) => {
    res.sendFile(path.join(__dirname + '/' + req.params.css));
});

//---------- API GET / POST requests -----------------------

app.get('/createTables', (req, res) => {
    createDbTable((message) => {
        res.json({ "status": message });
    });
});

app.get('/date', (req, res) => {
    isKeyValid(req.query.key, (result) => {
        if (result) {
            res.json({ "date": new Date().toLocaleDateString("de-de") });
            addToUsageTable("date", req.query.key);
        } else {
            res.status(401).send({ error: 'Invalid API Key' });
        }
    });
});

app.get('/time', (req, res) => {
    isKeyValid(req.query.key, (result) => {
        if (result) {
            res.json({ "time": new Date().toLocaleTimeString("de-de") });
            addToUsageTable("time", req.query.key);
        } else {
            res.status(401).send({ error: 'Invalid API Key' });
        }
    });
});

app.get('/getAllKeys', (req, res) => {
    readFromDb(function (keyDetails) {
        res.json({ "keys": keyDetails });
    });
});

app.post('/getApiKey', (req, res) => {
    getApiKey(req.body.email, function (keyDetails) {
        res.json({ "apiKey": keyDetails });
    });
});

app.post('/getMyUsage', (req, res) => {
    readUsageFromDb(req.body.email, function (usage) {
        res.json({ "usage": usage });
    });
});

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`WebAPI server listening at port ${port}`);
});

//----------------------------------------------------------

function getApiKey(email, callback) {
    email = decodeURI(email);
    doesEmailExist(email, (status) => {
        if (status) {
            callback("Email already exists! Please provide another email address.");
        } else {
            var apiKey = uuidv4();
            addToApiKeyTable(email, apiKey);
            callback(apiKey);
        }
    });
}

function createDbTable(callback) {
    let db = new sqlite3.Database('./db/keys.db', (err) => {
        if (err) {
            callback(err.message);
        }
        console.log('Connected to the keys database.');
    });

    db.run('DROP TABLE apikey', function (err) {
        if (err) {
            callback(err.message);
            db.close();
        } else {
            db.run('CREATE TABLE apikey(email text, key text)');
            db.run('DROP TABLE usage', function (err) {
                if (err) {
                    callback(err.message);
                    db.close();
                } else {
                    db.run('CREATE TABLE usage(endpoint text, key text)');
                    callback("Successfully recreated");
                    db.close();
                }
            });
        }
    });
}

function addToApiKeyTable(email, key) {
    let db = new sqlite3.Database('./db/keys.db');
    db.run(`INSERT INTO apikey(email, key) VALUES(?,?)`, [email, key], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // close the database connection
    db.close();
}

function addToUsageTable(endpoint, key) {
    let db = new sqlite3.Database('./db/keys.db');
    db.run(`INSERT INTO usage(endpoint, key) VALUES(?,?)`, [endpoint, key], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // close the database connection
    db.close();
}

function readFromDb(callback) {
    let db = new sqlite3.Database('./db/keys.db');
    let sql = `SELECT * FROM apikey ORDER BY email`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
        });

        callback(rows);
    });
    // close the database connection
    db.close();
}

function readUsageFromDb(email, callback) {
    let db = new sqlite3.Database('./db/keys.db');
    let sql = `SELECT key FROM apikey WHERE email = ?`;
    let apiKey;

    db.get(sql, [email], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            apiKey = row.key;
            if (apiKey) {
                let usageSql = `SELECT * FROM usage WHERE key = ?`;
                const db2 = new sqlite3.Database('./db/keys.db');
                db2.all(usageSql, [apiKey], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    rows.forEach((row) => {
                        console.log(row);
                    });

                    callback(rows);
                });
                db2.close();
            } else {
                callback([]);
            }
        } else {
            callback([]);
        }
    });

    // close the database connection
    db.close();
}

function isKeyValid(key, callback) {
    let db = new sqlite3.Database('./db/keys.db');
    let sql = `SELECT * FROM apikey WHERE key = ?`;

    // first row only
    db.get(sql, [key], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            callback(true);
        } else {
            callback(false);
        }
    });
    // close the database connection
    db.close();
}

function doesEmailExist(email, callback) {
    let db = new sqlite3.Database('./db/keys.db');
    let sql = `SELECT * FROM apikey WHERE email = ?`;

    // first row only
    db.get(sql, [email], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            callback(true);
        } else {
            callback(false);
        }
    });
    // close the database connection
    db.close();
}