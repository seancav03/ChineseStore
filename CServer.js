const express = require('express');
const app = express();

const database = require('./CDatabase');

let port  = process.env.PORT || 3775;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({limit: '50mb', extended:false}));

//static directory prep
app.use('/static', express.static('Public'));


app.post('/authenticateAdmin', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    
    let r = database.authenticateAdmin(AdminU, AdminP);
    res.send(r);
});

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
        res.send(result)
    }).catch( result => {
        res.send(false);
    })
});

app.post('/addPoints', function(req, res) {
    let AdminU = req.body.AdminU;
    let AdminP = req.body.AdminP;
    let username = req.body.username;
    let numPoints = req.body.numPoints;
    let areGolden = req.body.areGolden;
    
    let promise = database.addPoints(AdminU, AdminP, username, numPoints, areGolden);
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
    
    let promise = database.setPoints(AdminU, AdminP, username, numPoints, areGolden);
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