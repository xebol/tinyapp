//finds the user by email
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

//Checks if the input is a valid URL
const isValidHttpUrl = function(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

const generateRandomString = function() {
  const string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueID = '';
  for (let i = 0; i < 6; i++) {
    uniqueID += string.charAt(Math.floor(Math.random() * string.length));
  }
  return uniqueID;
};

//Adding URLS for the user
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

module.exports = {
  generateRandomString,
  getUserByEmail,
  isValidHttpUrl,
  urlsForUser
};