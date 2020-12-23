const functions = require('firebase-functions');

const app = require('express')();
const FBAuth = require('./util/fbAuth');
const { getAllScream , postOneScream} = require('./handlers/screams');
const { signup, login, uploadImage , addUserDetails} = require('./handlers/users');



app.get('/screams', getAllScream);

app.post('/scream',FBAuth, postOneScream);

app.post('/signup', signup);

app.post('/login', login);

app.post('/user/image',FBAuth, uploadImage);

app.post('/user',FBAuth, addUserDetails);



exports.api = functions.https.onRequest(app);
