# Motivation
The motivation to provide an web application has become a goal for the project, allowing remote researchers the access to top tier analysis on our platform instantly, for their samples. 

# Structure
The Android-Sandbox web server is a [model-view-controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) or MVC application. When the *controller* receives a request from a client, it returns and/or manipulates the *models* of the system, displaying the *view* to the user.

![Diagram describing the structure of a MVC application](https://i.imgur.com/r9m810M.png)

## View engine
The view engine serves the user interface, the "views", of the application. It builds HTML pages to send to the client, with the associated data passed by the controller. Example data handled by the view engine includes user login data, tables of analysis listings, analysis properties, errors, and other important data.

<!-- example view engine pass to controller, back to view engine -->

The view engine uses EJS, which uses `.ejs` files. These `.ejs` files are identical to `.html` files, with additional view engine tags. If you're familiar with PHP, these view engine tags also allow the server to inject information and display logic into the page before the page reaches the client.

Logic can be applied on blocks of HTML. Suppose the controller has specified a new object

```
res.locals.devices = [
	{name: "Panda"},
	{name: "Tiger"},
	{name: "Albatross"}
]
```
and is asking to display `devicelist.ejs`. In that file, we can write JavaScript in-line with the HTML, surrounded by `<%` and `%>`.

```
<h3>Device names</h3>
<ul>
	<% for(let i = 0; i < devices.length; i++){ %>
		<li><%= devices[i].name %></li>
	<% } %>
</ul>
```

 This example loops through the devices, and for each device, creates an `<li>` element with that devices name, resulting in

> ### Device Names
> * Panda
> * Tiger
> * Albatross

being sent back to the controller to be displayed to the user.

If you notice, the line

```
<%= devices[i].name %>
```

causes the *JavaScript expression* `devices[i].name` to be evaluated, which is then placed in the page that will be returned to the user. Take note that there is an `=` symbol in the string, letting the engine know to **print** the result of the expression. This could be any expression, like `5 + someNumber` or `"AbcD".toLowerCase()`.

## Controller (routes)
The controller handles the internal logic of the web application. When requests are made, they are received by the controller. For example, clicking on a button on the website would send a request to the controller to take an associated action. This functionality is divided up into different "route files", which each have their own "routes", that handle the functionality of the website at specific paths. For example, if you're accessing a function at `https://your.android.sandbox.address/admin/approve/5120236`, you're likely talking to the route file for `admin`, which has the route for `approve`, which can access the variable `5120236`. For example, in our file `routes/admin.js` we can have this route

```
router.get("/approve/:idNumber", function (req, res, next) {
	let id = req.params.idNumber;
	console.log(id);
	res.locals.importantResult = id + "abc";
	res.render("somepage");
});
```

which will look for all requests on `https://your.android.sandbox.address/admin/approve/x` where `x` is the variable accessible with `req.params.idNumber`.

You might be asking, where is the `/admin` in this code? Well, back in `app.js`, we define the parent file of this route as

```
const adminRouter = require("./routes/admin");
// ...
app.use("/admin", adminRouter);
```

so that all routes in the `routes/admin.js` file are prefixed by `/admin`.

Routes have two important variables, `req` for request and `res` for response. All information known about the users request is accessible in `req`, like URL parameters (`req.param`), form data (`req.body`), cookies (`req.cookies`), and more. All information sent back to the user is on `res`, including parameters to be passed to the view engine (`res.locals`), and calls to functions on `res` like `res.render("viewname")` or `res.end(someData)`.

In between getting `req` data and sending `res` data is up to the specific functionality of the route. If the route was made for listing analyses, the route would make a request to the model `Analysis` to find values on the database matching a query.

## Model management
All persistent data in the system is stored in models. These models act as representative objects of the data in the database. We define a model schema, which tells the database and the application which fields are present in a specific model. For example
```
const PersonSchema = new mongoose.Schema({
	socialInsuranceNumber: {type: String, unique: true, index: true },
	firstName: String,
	lastName: String
});

module.exports = mongoose.model("Person", PersonSchema);
```
creates a new model schema for a `Person`. Then, at any point, you can
```
// Create a new person
const person1 = new Person({
	socialInsuranceNumber: "121-730-142",
	firstName: "John",
	lastName: "Doe,
});

// Set some data, if you need to
person1.socialInsuranceNumber = "121-730-143";

// Save the person to the DB
person1.save();
```
to create a new person, and then later
```
// Find a person in the database
Person.findOne({socialInsuranceNumber: "121-730-143"}).exec(function(err, returnedPerson){
	// Change some data, if you need to
	returnedPerson.firstName = "Jane";
	
	// Save changes to the DB
	returnedPerson.save();
});
```
to find that person object, manipulate a property, then save the changes. The controller uses models and their functions to manipulate the state of the system while processing requests. The data structures used in the Android-Sandbox ecosystem can be found [here](./Models).
