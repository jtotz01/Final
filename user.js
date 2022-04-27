const http = require('http');
var mongo=require('mongodb');
const express=require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var MongoClient=mongo.MongoClient;
var url = "mongodb+srv://sam:1234@users.a4ldu.mongodb.net/recipies?retryWrites=true&w=majority";
var thisUser;
mongoose.connect(url, { useNewUrlParser: true});
const db = mongoose.connection;

//Connects to the databse
db.once('open', _=>{
	console.log("Successfully connected to Mongo")
})

db.on('error', err => {
	console.error('connection error: ' + err)
})

//Initializes the body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));
app.set('view enigne', 'ejs');


//Home/Welcome page
app.get('/', function(req, res){
	console.log('called /')
	res.sendFile(__dirname + '/index.html');
})


//SIGNUP FOR NEW USERS
app.get('/signUp', function(req, res){
	res.sendFile(__dirname + '/signUp.html');
})

//SIGN UP ADD TO DATABASE
app.post('/newUser', (req, res) => {
	console.log(req.body);
	if(req.body.password == ''){
		res.redirect('/signUp?taken=true');
		return;
	}
	const User = require('./userSchema.js');
	var userIn = new User ({
		username: req.body.username,
		password: req.body.password, 
		saved: []
	})
	userIn.save(function (error, document) {
		if (error) console.log(error);
		if(document == undefined){
			res.redirect('/signUp?taken=true') 
		} else {
			res.cookie("user", req.body.username);
			res.redirect('/recipes');
		}
	})
})

//LOGIN FOR EXISTING USER
app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
})

//Checks the make sure correct username and password used
app.post('/loginCheck', (req, res) => {
	console.log(req.body.username);
	const User = require('./userSchema.js')
	const ryu = User.findOne({ username: req.body.username})
	.then (userIn => {
		if(userIn == null){
			console.log("login failed")
			res.redirect('/login?taken=true')
		}else if(req.body.password == userIn.password){
			res.cookie("user", req.body.username);
			console.log("Logged In Successfully");
			res.redirect('/recipes');
		} else {
			console.log("login failed")
			res.redirect('/login?taken=true')
		}
	})
})

//Insert a Recipe into a users database
app.get('/insert', (req, res) => {
	
	//NEED TO GET THE RECIPE INFORMATION HERE
	const User = require('./userSchema.js')
	const userIn = User.findOne({name: "Sam"}).
	then (user => {
		console.log(user.username);
	})
})


app.get('/saveTemp', (req, res) => {
	res.render("saveTemp.ejs", {username: thisUser});
})

app.get('/recipes', (req, res) => {
	res.sendFile(__dirname + '/recipeForm.html');
})

app.put('/saveRecipe', (req, res) => {
	
	const tempObj = {
		recipeName: req.body.name,
		description: req.body.description,
		imageUrl: req.body.imageUrl,
		recipeUrl: req.body.recipeUrl,
	}

	
	const User = require('./userSchema.js')
	var mycookie = req.headers.cookie;
	var cookieArray = mycookie.split('=');
	console.log(cookieArray[1]);
	const myUser = User.findOne({ username: cookieArray[1]})
	.then (myUser => {
		if(myUser == null){
			console.log("user not found");
			res.redirect("/");
		} else {
			myUser.saved.push(tempObj);
			myUser.save();
			console.log("added recipe");
			res.redirect("/saved");
		}
	})
})

app.put('/removeRecipe', (req, res) => {
	const User = require('./userSchema.js')
	var mycookie = req.headers.cookie;
	var cookieArray = mycookie.split('=');
	const myUser = User.findOne({ username: cookieArray[1]})
	.then (myUser => {
		if(myUser == null){
			console.log("user not found");
			res.redirect("/");
		} else {
			var savedNew = [];
			for(i = 0; i < myUser.saved.length; i++){
				if(myUser.saved[i].recipeUrl != req.body.recipeUrl){
					savedNew.push(myUser.saved[i]);
				}
			}
			myUser.saved = savedNew;
			myUser.save();
			console.log("removed One");
		}
	})
})

app.get('/saved', (req, res) => {
	const User = require('./userSchema.js')
	var mycookie = req.headers.cookie;
	var cookieArray = mycookie.split('=');
	const userIn = User.findOne({ username: cookieArray[1]})
	.then (userIn => {
		if(userIn == null){
			console.log("login failed")
			res.redirect('/')
		} else {
			const resultsIn = userIn.saved;
			console.log("Found Recipies");
			res.render('saved.ejs', {username: cookieArray[1], results: resultsIn});
		}
	})
})

app.listen(process.env.PORT || 3000, function() {
	console.log("Listening on port 3000");
})