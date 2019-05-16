'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const validUrl = require('valid-url');
const shortid = require('shortid');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// MongoDB
// Database Name
const dbName = 'short-url';
let dataBase;
let linksCollection;

// Use connect method to connect to the server
const tempURI =
  'mongodb+srv://wendersonpdas:neversaynever@short-url-a0hh8.mongodb.net/short-url';

MongoClient.connect(tempURI || process.env.MONGOLAB_URI, (err, client) => {
  console.log('Connected successfully to server');

  dataBase = client.db(dbName);
  linksCollection = dataBase.collection('links');

  // client.close();
});

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// New Shortcut
app.post('/api/shorturl/new/:url?', (req, res) => {
  const { url } = req.body;
  const originDomain = `${req.protocol}://${req.headers.host}/`;

  if (validUrl.isUri(url)) {
    const shortCode = shortid.generate();
    // Alphanumeric only
    shortid.characters(
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@'
    );

    // Create and register newUrl
    const newUrl = { url: url, short: shortCode };
    linksCollection.insert([newUrl]);

    res.json({
      original_url: url,
      short_url: `${originDomain}api/shorturl/${shortCode}`
    });
  } else {
    res.status(400).json({
      error: 'invalid URL'
    });
  }
});

// Redirects to the original url
app.get('/api/shorturl/:short', (req, res) => {
  const { short } = req.params;

  linksCollection.findOne({ short: short }, { url: 1, _id: 0 }, (err, doc) => {
    if (doc != null) {
      res.redirect(doc.url);
    } else {
      res.status(404).json({ error: 'Shortlink not found in the database.' });
    }
  });
});

app.listen(port, () => {
  console.log('Node.js listening ...');
});
