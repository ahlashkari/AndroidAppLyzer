const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const busboy = require('connect-busboy');
const logger = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');

// Load config
const config = require('./config');

// Mongo session store
const MongoStore = require('connect-mongo')(session);

// Load middleware
const middleware = require('./middleware');

// Mongoose models
const User = require('./models/User');
const Analysis = require('./models/Analysis');

// Express routes
const indexRouter = require('./routes/index');
const analyseRouter = require('./routes/analyse');
const authRouter = require('./routes/auth');
const searchRouter = require('./routes/search');
const uploadRouter = require('./routes/upload');
const adminRouter = require('./routes/admin');
const debugRouter = require('./routes/debug');
const bannedRouter = require('./routes/banned');
const fileRouter = require('./routes/file');

const app = express();

// connect to DB
require('./db')().then(() => {
	// Create initial user if necessary
	return User.estimatedDocumentCount();
}).then((count) => {
	if (count == 0) {
		console.log('Adding initial user...');
		User.register(new User({
			username: config.initialUser,
			email: config.initialUserEmail
		}), config.initialPassword, function (err, user) {
			if (err) {
				throw Error('Initial registration failed: ' + err.toString());
			}
			console.log('Promoting...');
			user.tags.push('administrator');
			user.save();
			console.log(`Initial user ${config.initialUser} (${config.initialUserEmail}) with the default password has been added successfully. Please change the password soon.`);
		});
	}
});

// configure passport
app.use(session({
	secret: config.sessionSecret,
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 2 * 60 * 60 * 1000
	},
	rolling: true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());
require('./passport');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(busboy());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// EJS helpers
app.locals.gBadge = function(value, collapsable, trueText, trueIcon, trueBadgeFormat, falseText, falseIcon, falseBadgeFormat){ //TODO: move somewhere better
	return ("<span class='badge badge-"
		+ (value?trueBadgeFormat:falseBadgeFormat)
		+ "'><i class='fas fa-"
		+ (value?trueIcon:falseIcon)
		+ "'></i> "
		+ (collapsable?"<span class='hidden'>":"")
		+ (value?trueText:falseText)
		+ (collapsable?"</span>":"")
		+ "</span>")
		.replace(/'/g, '"');
}

const escapeHtml = (unsafe) => { //Thanks https://stackoverflow.com/a/6234804/3894173
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

app.locals.gBannedBadge = function(value, collapsable){
	return app.locals.gBadge(value, collapsable, "Banned", "exclamation-circle", "danger", "Good", "check-circle", "success");
}

app.locals.gPermBadge = function(value, collapsable){
	return app.locals.gBadge(value, collapsable, "Admin", "user-shield", "info", "User", "user", "secondary");
}

app.locals.formatCSVObjects = function(obj){
	let retStr = "";
	for(let i = 0; i < obj[0].length; i++){
		retStr += "<tr><td>" + escapeHtml(obj[0][i].trim()) + "</td><td>" + escapeHtml(obj[1][i]) + "</td></tr>";
	}
	return retStr;
}

app.use(middleware.injectUserData);

// regular routes
app.use('/auth', authRouter);
app.use('/banned', bannedRouter);
app.use('/file', fileRouter); //TODO: authentication!!!

// authed routes
app.use('/', middleware.onlyLoggedIn, indexRouter);
app.use('/search', middleware.onlyLoggedIn, searchRouter);
app.use('/upload', middleware.onlyLoggedIn, uploadRouter);
app.use('/analyse', middleware.onlyLoggedIn, analyseRouter);

// admin routes
app.use('/admin', middleware.onlyAdministrator, adminRouter);
app.use('/debug', middleware.onlyAdministrator, debugRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	//console.error(err);
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;