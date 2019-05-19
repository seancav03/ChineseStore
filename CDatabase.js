const Sequelize = require('sequelize')
const sequelize = new Sequelize('null', 'null', 'null', {
    dialect: 'sqlite',
    storage: 'ChineseStoreDatabase.sqlite'
})

//Admin Username and Password
const AU = 'Hugo123';
const AP = 'Xiong123';

//define students table
const Students = sequelize.define('Students', {
    Username: Sequelize.STRING,
    Name: Sequelize.STRING,
    Password: Sequelize.STRING,
    Class: Sequelize.STRING,
    Awesomes: Sequelize.INTEGER,
    Goldens: Sequelize.INTEGER
})
Students.sync();

//define store table
const Store = sequelize.define('Store', {
    Reward: Sequelize.STRING,
    AwesomeCost: Sequelize.INTEGER,
    GoldenCost: Sequelize.INTEGER
})
Store.sync();

//define table to store bought and redeemed items. id column is created by sequelize and autoincrements
const Buys = sequelize.define('Buys', {
    Student: Sequelize.STRING,
    Redeemed: Sequelize.BOOLEAN,
    Item: Sequelize.STRING
})
Buys.sync();

//stores all functions
var exports = module.exports = {};

//authenticate teacher
exports.authenticateAdmin = function(AdminU, AdminP){
    if(AdminU ==  AU && AdminP == AP){
        return true;
    } else {
        return false;
    }
};

//adds student to the database
exports.newStudent = function(email, name, password, classLevel){
    Students.create({
        Username: email,
        Name: name,
        Password: password,
        Class: classLevel,
        Awesomes: 0,
        Goldens: 0
    })
    return true;
};

//remove student
exports.removeStudent = function(AdminU, AdminP, studentName){
    if(AdminU == AU && AdminP == AP){
        Students.destroy({
            where: {
                Username: studentName
            }
        })
        return true;
    } else {
        return false;
    }
};

//student login. returns promise which will resolve to answer
exports.login = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username,
                Password: password
            }
        }).then(result => {
            let num = result.count;
            if(num > 0){
                console.log("TRUE");
                resolve(true);
            } else {
                console.log("FALSE");
                resolve(false);
            }
        })
    })
    return promise;
};

//addPoints
exports.addPoints = function(AdminU, AdminP, username, numPoints, areGolden){
    let promise = new Promise(function(resolve, reject){
        if(AdminU == AU && AdminP == AP){
            Students.findAll({
                where: {
                    Username: username
                }
            }).then(result => {
                if(areGolden){
                    let newVal = result[0].Goldens + numPoints;
                    Students.update(
                        {
                            Goldens: newVal
                        },
                        { where: {
                            Username: username } 
                        }
                    );
                    resolve(true);
                } else {
                    let newVal = result[0].Awesomes + numPoints;
                    Students.update(
                        {
                            Awesomes: newVal
                        },
                        { where: {
                            Username: username } 
                        }
                    );
                    resolve(true);
                }
            });
        } else {
            resolve(false);
        }
    });
    return promise;
};

//set points to a given value
exports.setPoints = function(AdminU, AdminP, username, numPoints, areGolden){

    let promise = new Promise(function(resolve, reject){
        if(AdminU == AU && AdminP == AP){
            if(areGolden){
                let newVal = numPoints;
                Students.update(
                    {
                        Goldens: newVal
                    },
                    { where: {
                        Username: username } 
                    }
                );
                resolve(true);
            } else {
                let newVal = numPoints;
                Students.update(
                    {
                        Awesomes: newVal
                    },
                    { where: {
                        Username: username } 
                    }
                );
                resolve(true);
            }
        } else {
            resolve(false);
        }
    });
    return promise;
};


//adds item to store
exports.addItem = function(AdminU, AdminP, Item, costAwesomes, costGoldens){
    if(AdminU ==  AU && AdminP == AP){
        Store.create({
            Reward: Item,
            AwesomeCost: costAwesomes,
            GoldenCost: costGoldens
        })
        return true;
    } else {
        return false;
    }
};

//removes item from store by name
exports.removeItem = function(AdminU, AdminP, Item){
    if(AdminU ==  AU && AdminP == AP){
        Store.destroy({
            where: {
                Reward: Item
            }
        })
        return true;
    } else {
        return false;
    }
};

//how student buys and item
exports.buyItem = function(username, password, Item){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username,
                Password: password
            }
        }).then(result2 => {
            let num = result2.count;
            if(num > 0){
                console.log("+++ Student Found");
                let awes = result2.rows[0].Awesomes;
                console.log("+++ Awes: " + awes);
                let golds = result2.rows[0].Goldens;
                console.log("+++ Golds: " + golds);
                Store.findAndCountAll({
                    where: {
                        Reward: Item
                    }
                }).then(result => {
                    console.log("+++ Checking Item");
                    console.log(result.rows[0].AwesomeCost +", " + awes + ", " + result.rows[0].GoldenCost + ", " + golds);
                    if(result2.count > 0 && result.rows[0].AwesomeCost <= awes && result.rows[0].GoldenCost <= golds){
                        console.log("+++ Item Found");
                        //take away awesome and golden points
                        exports.addPoints(AU, AP, username, result.rows[0].AwesomeCost*(-1), false);
                        exports.addPoints(AU, AP, username, result.rows[0].GoldenCost*(-1), true);
                        //add to table to mark transaction
                        Buys.create({
                            Student: username,
                            Redeemed: false,
                            Item: Item
                        });
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } else {
                resolve(false);
            }
        })
    })
    return promise;
};

//allows teacher to mark item as redeemed
exports.redeemItem = function(AdminU, AdminP, saleID){
    if(AdminU ==  AU && AdminP == AP){
        Buys.update(
            {
                Redeemed: true
            },
            { where: {
                id: saleID } 
            }
        );
        return true;
    } else {
        return false;
    }
};

//gets all students with of a class. NOTE: Students must be sure to enter class name CORRECTLY (CAPS, SPACES, ETC.: ALL UNIFORM)
exports.getStudentsByClass = function(AdminU, AdminP, whichClass){
    let promise = new Promise(function(resolve, reject){
        if(AdminU ==  AU && AdminP == AP){
            Students.findAndCountAll({
                where: {
                    Class: whichClass
                }
            }).then(result => {
                let num = result.count;
                let resultArr = [];
                for(let i = 0; i < num; i++){
                    let arr = [];
                    arr[0] = result.rows[i].Username;
                    arr[1] = result.rows[i].Name;
                    arr[2] = result.rows[i].Password;
                    arr[3] = result.rows[i].Class;
                    arr[4] = result.rows[i].Awesomes;
                    arr[5] = result.rows[i].Goldens;
                    resultArr.push(arr);
                }
                resolve(resultArr);
            })
        } else {
            resolve([])
        }
    })
    return promise;
};

//get single students information. Either that students username or adminU/P will work
exports.getStudent = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username
            }
        }).then(result => {
            if(result.count < 1){
                resolve([]);
            } else {
                if(result.rows[0].Password == password || password == AP){
                    let arr = [];
                    arr[0] = result.rows[i].Username;
                    arr[1] = result.rows[i].Name;
                    arr[2] = result.rows[i].Password;
                    arr[3] = result.rows[i].Class;
                    arr[4] = result.rows[i].Awesomes;
                    arr[5] = result.rows[i].Goldens;
                    resolve(arr);
                } else {
                    resolve([]);
                }
            }
        })
    })
    return promise;
};

//get every item and costs. No parameters required
exports.getStore = function(){
    let promise = new Promise(function(resolve, reject){
        Store.findAndCountAll({

        }).then(result => {
            let num = result.count;
            let resultArr = [];
            for(let i = 0; i < num; i++){
                let arr = [];
                arr[0] = result.rows[i].Reward;
                arr[1] = result.rows[i].AwesomeCost;
                arr[2] = result.rows[i].GoldenCost;
                resultArr.push(arr);
            }
            resolve(resultArr);
        })
    })
    return promise;
};

//gets all items Bought but not Redeemed by a single student
exports.getMyBuys = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.count({
            where: {
                Username: username,
                Password: password
            }
        }).then(result => {
            if(result > 0){
                Buys.findAndCountAll({
                    where: {
                        Student: username,
                        Redeemed: false
                    }
                }).then(result2 => {
                    let num = result2.count;
                    let resultArr = [];
                    for(let i = 0; i < num; i++){
                        let arr = [];
                        arr[0] = result2.rows[i].Student;
                        arr[1] = result2.rows[i].Item;
                        resultArr.push(arr);
                    }
                    resolve(resultArr);
                })
            } else {
                resolve([]);
            }
        })
    })
    return promise;
};

//gets all items Redeemed by a single student
exports.getMyRedeemed = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.count({
            where: {
                Username: username,
                Password: password
            }
        }).then(result => {
            if(result > 0){
                Buys.findAndCountAll({
                    where: {
                        Student: username,
                        Redeemed: true
                    }
                }).then(result2 => {
                    let num = result2.count;
                    let resultArr = [];
                    for(let i = 0; i < num; i++){
                        let arr = [];
                        arr[0] = result2.rows[i].Student;
                        arr[1] = result2.rows[i].Item;
                        resultArr.push(arr);
                    }
                    resolve(resultArr);
                })
            } else {
                resolve([]);
            }
        })
    })
    return promise;
};

//get all student buys. gives saleID as well so item can be redeemed
exports.getBuysAdmin = function(AdminU, AdminP){
    let promise = new Promise(function(resolve, reject){
        if(AdminU ==  AU && AdminP == AP){
            Buys.findAndCountAll({
                where: {
                    Redeemed: false
                }
            }).then(result => {
                let num = result.count;
                let resultArr = [];
                for(let i = 0; i < num; i++){
                    let arr = [];
                    arr[0] = result.rows[i].Student;
                    arr[1] = result.rows[i].Item;
                    arr[2] = result.rows[i].id;
                    resultArr.push(arr);
                }
                resolve(resultArr);
            })
        } else {
            resolve([]);
        }
    })
    return promise;
};

//get all student redeemed items
exports.getRedeemedAdmin = function(AdminU, AdminP){
    let promise = new Promise(function(resolve, reject){
        if(AdminU ==  AU && AdminP == AP){
            Buys.findAndCountAll({
                where: {
                    Redeemed: true
                }
            }).then(result => {
                let num = result.count;
                let resultArr = [];
                for(let i = 0; i < num; i++){
                    let arr = [];
                    arr[0] = result.rows[i].Student;
                    arr[1] = result.rows[i].Item;
                    resultArr.push(arr);
                }
                resolve(resultArr);
            })
        } else {
            resolve([]);
        }
    })
    return promise;
};
