const express = require('express');
const app = express();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const PORT = 8080;


const generateRandomString = function() {
  const string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueID = '';
  for (let i = 0; i < 6; i++) {
    uniqueID += string.charAt(Math.floor(Math.random() * string.length));
  }
  return uniqueID;
};

const getUserByEmail = function(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return null;
};

app.use(express.urlencoded({ extended: true })); //populates req.body
app.use(morgan('dev')); //console logs the request coming on the terminal
app.set('view engine', 'ejs'); //set the view engine to ejs templates
app.use(cookieParser()); //populates req.cookies

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  Harry: {
    id: 'Harry',
    email: 'harry@mail.com',
    password: 'avada'
  },
  Hermione: {
    id: 'Hermione',
    email: 'hermione@mail.com',
    password: 'leviosa'
  }
};

//Homepage
app.get('/', (req, res) => {
  res.send('Welcome to the home page!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const userID = req.cookies['user_id'];
  const user = users[userID];
  const templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const userID = req.cookies['user_id'];
  const user = users[userID];
  const templateVars = {
    user: user
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const userID = req.cookies['user_id'];
  const user = users[userID];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: user
  };
  res.render('urls_show', templateVars);

});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.url;
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = req.body.longURL;

  res.redirect(`/urls/${uniqueID}`);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  res.redirect(longURL);
});

//deletes the current url
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Registering users
app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.get('/login', (req, res) => {
  res.render('urls_login');
});

//Register post endpoint
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide email and password.');
  }

  const user = getUserByEmail(email);
  if (user) {
    return res.status(400).send('That email is alredy in use. Please provide a different email.');
  }

  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };

  res.cookie('user_id', userID);
  res.redirect('/urls/new');
});


//Creating cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide email and password.');
  }
  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send('Email cannot be found.');
  }
  if (password !== user.password) {
    return res.status(403).send('Invalid Password.');
  }
  res.cookie('user_id', user.id);
  res.redirect('/urls/new');
});

//Clearing cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}!`);
});