const express = require('express');
const app = express();
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const PORT = 8080;

app.use(express.urlencoded({ extended: true })); //populates req.body
app.use(morgan('dev')); //console logs the request coming on the terminal
app.set('view engine', 'ejs'); //set the view engine to ejs templates
app.use(cookieParser()); //populates req.cookies

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
const urlsForUser = function(userId) {
  const result = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === userId) {
      result[key] = {
        longURL: urlDatabase[key].longURL,
        userID: userId
      };
    }
  }
  return result;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  'abc123': {
    id: 'abc123',
    email: 'a@a.com',
    password: '$2a$10$6Z24AtPDa.4PPGIr5boFhePdHJ/rIyFGAlRv0uAqpqn2pjup4rh92' //1234
  },
  'def435': {
    id: 'def435',
    email: 'b@b.com',
    password: '$2a$10$6Z24AtPDa.4PPGIr5boFhePdHJ/rIyFGAlRv0uAqpqn2pjup4rh92' //1234
  }
};

//Homepage
app.get('/', (req, res) => {
  res.send('<p>Welcome to the home page!</p>');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const userID = req.cookies['user_id'];
  const user = users[userID];
  const userURLs = urlsForUser(userID);

  const templateVars = {
    urls: userURLs,
    user: user
  };

  if (!user) {
    return res.status(401).send('<p>Make sure you are logged in</p>');
  }

  res.render("urls_index", templateVars);
});

//If user is not logged in. Redirects to login page
app.get('/urls/new', (req, res) => {
  const userID = req.cookies['user_id'];

  if (!userID) {
    return res.redirect('/login');
  }

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
    longURL: urlDatabase[req.params.id].longURL,
    user: user
  };
  if (!user) {
    return res.status(400).send('Make sure you are logged in');
  }
  res.render('urls_show', templateVars);

});

app.post('/urls/:id', (req, res) => {
  const url = urlDatabase[req.params.id];
  const userID = req.cookies['user_id'];

  //check if the ID is in the database
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('<p>The ID does not exist.</p>');
  }
  //check if user is logged in
  if (!userID) {
    return res.status(400).send('<p>Please login to continue.</p>');
  }
  //check if userID matches the URL
  if (userID !== url.userID) {
    return res.status(400).send('<p>URL provided does not match</p>');
  }
  urlDatabase[req.params.id].longURL = req.body.url;
  res.redirect('/urls');
});

//Checks if the user is logged in before adding a url into the database
app.post('/urls', (req, res) => {
  const userID = req.cookies['user_id'];

  if (!userID) {
    return res.status(400).send('<p>Please login to continue.</p>');
  }
  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${uniqueID}`);
});

//handles short URL that does not exist in the database
app.get('/u/:id', (req, res) => {
  const userID = req.cookies['user_id'];
  const url = urlDatabase[req.params.id];

  //checks if the user is logged in
  if (!userID) {
    return res.status(401).send('<p>Make sure you are logged in</p>');
  }

  //checks if the user owns the url
  if (userID !== url.userID) {
    return res.status(401).send('<p>Error</p>');
  }
  res.redirect(url.longURL);
});

//deletes the current url
app.post('/urls/:id/delete', (req, res) => {
  const url = urlDatabase[req.params.id];
  const userID = req.cookies['user_id'];

  //check if the ID is in the database
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('<p>The ID does not exist.</p>');
  }
  //check if user is logged in
  if (!userID) {
    return res.status(400).send('<p>Please login to continue.</p>');
  }
  //check if userID matches the URL
  if (userID !== url.userID) {
    return res.status(400).send('<p>URL provided does not match</p>');
  }
  //deletes
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Registering users
app.get('/register', (req, res) => {
  const user = req.cookies['user_id'];
  if (user) {
    res.redirect('/urls');
  }
  res.render('urls_register');
});

app.get('/login', (req, res) => {
  const user = req.cookies['user_id'];
  if (user) {
    res.redirect('/urls');
  }
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
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: hash
  };

  res.cookie('user_id', userID);
  res.redirect('/urls');
});


//Creating cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('<p>Please provide email and password</p>');
  }
  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send('<p>No user with that email found</p>');
  }
  
  const result = bcrypt.compareSync(password, user.password);
  if (!result) {
    return res.status(403).send('<p>Invalid Password</p>');
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

//Clearing cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}!`);
});