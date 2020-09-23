const functions = require('firebase-functions');
const app = require('express')();
const firebase = require('firebase');
const admin = require('firebase-admin');

const config = {
  
    apiKey: "AIzaSyCrC4aE-tho8cBR1Pl9h7CmsVX_sWtwi0M",
    authDomain: "exfactor8866.firebaseapp.com",
    databaseURL: "https://exfactor8866.firebaseio.com",
    projectId: "exfactor8866",
    storageBucket: "exfactor8866.appspot.com",
    messagingSenderId: "8546715665",
    appId: "1:8546715665:web:7e2a8be46d7a9399f4c9b0",
    measurementId: "G-1Y9G9VM70Y"

};

admin.initializeApp();
firebase.initializeApp(config);
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
app.get('/screams', (req, res) => {
  db
  .collection('screams')
  .orderBy('createdAt', 'desc')
  .get()
  .then((data) => {
    let screams = [];
    data.forEach((doc) => {
      screams.push({
        screamId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt
      });
    });
    return res.json(screams);
  })
  .catch((err) => {
    console.error(err);
  })
});


const isEmpty = (string) => {
  if(string.trim() == ''){
    return true;
  }
  else{
    return false;
  }
}

const isEmail = (email) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regex)){
    return true;
  }
  else{
    return false;
  }
}

app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }
  let errors = {};
  if(isEmpty(newUser.email)){
    errors.email = 'Must not be empty';
  }
  else if(!isEmail(newUser.email)){
    errors.email = 'Must be valid Email';
  }

  if(isEmpty(newUser.password)){
    errors.password = 'Must not be empty';
  }
  if(newUser.password !== newUser.confirmPassword){
    errors.password = 'Password should be the same';
  }

  if(isEmpty(newUser.handle)){
    errors.handle = 'Must not be empty';
  }
  
  if(Object.keys(errors).length > 0){
    return res.status(400).json(errors);
  }
  
  let token, userId;
  db.doc(`users/${newUser.handle}`).get()
  .then((doc) => {
    if(doc.exists){
      return res.status(400).json({handle : `this handle is already taken`});
    }
    else{
      return firebase
      .auth()
      .createUserWithEmailAndPassword(newUser.email, newUser.password);
    }
  })
  .then((data) => {
    userId = data.user.uid;
    return data.user.getIdToken();
  })
  .then((idToken) => {
    token = idToken;
    const userCredentials = {
      handle: newUser.handle,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      userId
    };
    return db.doc(`/users/${newUser.handle}`).set(userCredentials); 
  })  
  .then(() => {
    return res.status(201).json({ token });
  })
  .catch((err) => {
    console.error(err);
    if(err.code === 'auth/email-already-in-use'){
      return res.status(400).json({email: `Email is already in use`});
    }
    else{
      return res.status(500).json({ error: err.code});  
    }
  })
});

app.post('/scream',(req, res) => {

  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };
  
  db
  .collection('screams')
  .add(newScream)
  .then((doc) => {
    
    return res.json({message: `document ${doc.id} created successfully`});
  })
  .catch((err) => {
    res.status(500).json({err: `something went wrong`});
    console.error(err);
  })
});

app.post('/login', (req, res) => {
  const user = {
    email : req.body.email,
    password : req.body.password
  }
  let errors ={};
  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0){
    return res.status(400).json(errors);
  }
  
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
  .then((data) => {
    return data.user.getIdToken();
  })
  .then((token) => {
    return res.json({token});
  })
  .catch((err) => {
    console.error(err);
    if(err.code == 'auth/wrong-password'){
      return res.status(403).json({general : 'Wrong Credentials, please try again'});
    }
    else{
      return res.status(500).json({error : err.code});    
    }
    
  })
});


exports.api = functions.https.onRequest(app);
