const express = require('express');
const app = express();

const database = require('./CDatabase');

let port  = process.env.PORT || 3775;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({limit: '50mb', extended:false}));

//Start cookie storage Settup
const session = require('express-session');
const redis = require('redis');
const redisClient = redis.createClient();
const redisStore = require('connect-redis')(session);

redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});

app.use(session({
    secret: 'random3 se2cret-use4d forXall 6so8rts 0f stu5ff',
    store: new redisStore({ host: 'localhost', port: 2828, client: redisClient}),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false , maxAge: 1000*60*10, rolling: true},
    //for herpku, set to process.env.WHATEVER_IS_NEEDED below
    store: new redisStore({ host: process.env || 'localhost', port: 6379, client: redisClient })
}));
//Finish cookie storage settup

//make object for cookie
app.use(function (req, res, next) {
    if (req.session.user == null) {
      req.session.user = {Username: null, Password: null};
    }
    next();
})

//get cookie credientials
app.post('/cookieAuthenticate', function(req, res) {
    if(req.session.user) {
        let promise = database.login(req.session.user.Username, req.session.user.Password);
        promise.then(result => {
            if(result == 1){
                res.send( JSON.stringify({LoggedIn: true, Username: req.session.user.Username, Password: req.session.user.Password, isAdmin: false}) )
            } else if(result == 2) {
                res.send( JSON.stringify({LoggedIn: true, Username: req.session.user.Username, Password: req.session.user.Password, isAdmin: true}) )
            } else {
                //redirect to login
                res.send( JSON.stringify({LoggedIn: false, Username: null, Password: null, isAdmin: false}));
            }
        }).catch( result => {
            //redirect to login
            res.send( JSON.stringify({LoggedIn: false, Username: null, Password: null, isAdmin: false}));
        })
    } else {
        //redirect to login
        res.send( JSON.stringify({LoggedIn: false, Username: null, Password: null, isAdmin: false}));
    }
});

//log users in instantly if possible
app.post('/checkCookie', function(req, res) {
    console.log("HERE - redirectHome");
    if(req.session.user) {
        let promise = database.login(req.session.user.Username, req.session.user.Password);
        promise.then(result => {
            if(result == 1){
                console.log("student found")
                //attempt to redirect
                res.send(JSON.stringify({Redirect: true, isAdmin: false}));
            } else if (result == 2){
                console.log("teacher found")
                //attempt to redirect
                res.send(JSON.stringify({Redirect: true, isAdmin: true}));
            } else {
                console.log("none found")
                res.send(JSON.stringify({Redirect: false, isAdmin: false}));
            }
        }).catch( result => {
            res.send(JSON.stringify({Redirect: false, isAdmin: false}));
        })
    } else {
        res.send(JSON.stringify({Redirect: false, isAdmin: false}));
    }
});

//static directory prep
app.use('/store', express.static('Public/awesomenessStoreHTML'));


app.post('/newStudent', function(req, res) {
    let email = req.body.email;
    let name = req.body.name;
    let password = req.body.password;
    let classLevel = req.body.className;
    
    let r = database.newStudent(email, name, password, classLevel);
    res.send(r);
});

app.post('/removeStudent', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let studentName = req.body.studentName;
    
    let r = database.removeStudent(AdminU, AdminP, studentName);
    res.send(r);
});

app.post('/login', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    
    let promise = database.login(username, password);
    promise.then(result => {
        if(result != 0){
            //SET COOKIE to remember credentials
            console.log("Setting Cookie")
            req.session.user.Username = username;
            req.session.user.Password = password;
            console.log("Cookie: " + req.session.user.Username)
        }
        console.log("Done")
        if(result == 1){
            res.send(JSON.stringify({data: true, admin: false}))
        } else if (result == 2){
            res.send(JSON.stringify({data: true, admin: true}))
        } else {
            res.send(JSON.stringify({data: false, admin: false}))
        }
    }).catch( result => {
        res.send(JSON.stringify({data: false, admin: false}))
    })
});

app.post('/addPoints', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let username = req.body.username;
    let numPoints = req.body.numPoints;
    let areGolden = req.body.areGolden;

    let areGoldenBool = (areGolden == "true")
    
    let promise = database.addPoints(AdminU, AdminP, username, numPoints, areGoldenBool);
    promise.then(result => {
        res.send(result)
    }).catch( result => {
        res.send(false);
    })
});

app.post('/setPoints', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let username = req.body.username;
    let numPoints = req.body.numPoints;
    let areGolden = req.body.areGolden;

    let areGoldenBool = (areGolden == "true")
    
    let promise = database.setPoints(AdminU, AdminP, username, numPoints, areGoldenBool);
    promise.then(result => {
        res.send(result)
    }).catch( result => {
        res.send(false);
    })
});

app.post('/addItem', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let Item = req.body.Item;
    let costAwesomes = req.body.CostAwesomes;
    let costGoldens = req.body.CostGoldens;
    
    let result = database.addItem(AdminU, AdminP, Item, costAwesomes, costGoldens);
    res.send(result);
});

app.post('/removeItem', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let Item = req.body.Item;
    
    let result = database.removeItem(AdminU, AdminP, Item);
    res.send(result);
});

app.post('/buyItem', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let Item = req.body.Item;
    
    let promise = database.buyItem(username, password, Item);
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send(false);
    })
});

app.post('/redeemItem', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let saleID = req.body.saleID;
    
    let result = database.redeemItem(AdminU, AdminP, saleID);
    res.send(JSON.stringify({ data: result}));
});

app.post('/getStudentsByClass', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let whichClass = req.body.Class;
    
    let promise = database.getStudentsByClass(AdminU, AdminP, whichClass);
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getStudent', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    
    let promise = database.getStudent(username, password);
    promise.then(result => {
        res.send(result)
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getStore', function(req, res) {
    let promise = database.getStore();
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getMyBuys', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    
    let promise = database.getMyBuys(username, password);
    promise.then(result => {
        
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getMyRedeemed', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    
    let promise = database.getMyRedeemed(username, password);
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getBuysAdmin', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    
    let promise = database.getBuysAdmin(AdminU, AdminP);
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

app.post('/getRedeemedAdmin', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    
    let promise = database.getRedeemedAdmin(AdminU, AdminP);
    promise.then(result => {
        res.send(JSON.stringify({ data: result}))
    }).catch( result => {
        res.send([]);
    })
});

//Server Listening (3775 swapped with "port" for cloud)
//O(1)
app.listen(port, () => console.log('App listening on port 3775!'));