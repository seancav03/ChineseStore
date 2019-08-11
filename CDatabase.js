const Sequelize = require('sequelize')
const sequelize = new Sequelize('null', 'null', 'null', {
    dialect: 'sqlite',
    storage: 'ChineseStoreDatabase.sqlite'
})
//hashing passwords module
const bcrypt = require('bcrypt');

//Admin Username and Password
const AU = 'hxiong@headroyce.org';
const AP = '$2b$12$uGfvd5Jpka9NGswuwAeB8uiXTA/xGQfx39AXkHUn2Da0tceGhowEa';

const saltRounds = 12;

//define students table
const Students = sequelize.define('Students', {
    Username: Sequelize.STRING,     //student email
    Name: Sequelize.STRING,         //student real full name
    Password: Sequelize.STRING,     //student password
    Class: Sequelize.STRING,        //class level of the student
    Awesomes: Sequelize.INTEGER,    //number of awesome points (the more common of the two currencies)
    Goldens: Sequelize.INTEGER      //number of golden points (the more rare of the two currencies)
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

//authenticate teacher - NO LONGER USED. READY TO BE DELETED
// exports.authenticateAdmin = function(AdminU, AdminP){
//     let promise = new Promise(function(resolve, reject){
//         bcrypt.compare(password, AP, function(err, res) {
//             if(res && AdminU == AU) {
//                 resolve(true);
//             } else {
//                 resolve(false);
//             } 
//         });
//     });
//     return promise;
// };

//adds student to the database (resolves: 0 - error, 1 - username taken, 2 - success)
exports.newStudent = function(email, name, password, classLevel, numGol, numAwe){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: email,
            }
        }).then(result => {
            if(result.count > 0){
                resolve(1);
            } else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    Students.create({
                        Username: email,
                        Name: name,
                        Password: hash,
                        Class: classLevel,
                        Awesomes: numAwe,
                        Goldens: numGol
                    }).then(success => {
                        resolve(2);
                    }).catch(error => {
                        resolve(0);
                    })
                })
            }
        }).catch(nope => {
            resolve(0);
        })
    });
    return promise;
};

//change student data: (resolves: 0 - wrong admin password, 1 - username taken, 2 - success) --- (Note: email and username are the same thing)
exports.updateStudentData = function(curUsername, nEmail, nName, nPassword, nClass, AdminP, passwordChanged){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res){
                //correct admin password used
                Students.findAndCountAll({
                    where: {
                        Username: nEmail
                    }
                }).then(result => {
                    if(result.count > 0 && curUsername != nEmail){
                        //nope. username already taken
                        resolve(1)
                    } else {
                        //username is not already taken: good
                        if(passwordChanged){
                            //password has been changed and needs to be hashed
                            bcrypt.hash(nPassword, saltRounds, function(err, hash){
                                Students.update(
                                    {
                                        Username: nEmail,
                                        Name: nName,
                                        Password: hash,
                                        Class: nClass
                                    },
                                    {
                                        where: {
                                            Username: curUsername
                                        }
                                    }
                                ).then(yeah => {
                                    resolve(2);
                                });
                            });
                        } else {
                            //password has not been changed and the hash should be left as is. ignore nPassword field because it is irrelevent
                            Students.update(
                                {
                                    Username: nEmail,
                                    Name: nName,
                                    Class: nClass
                                },
                                {
                                    where: {
                                        Username: curUsername
                                    }
                                }
                            ).then(yup => {
                                resolve(2);
                            });
                        }
                    }
                })
                
            } else {
                resolve(0);
            }
        });
    });
    return promise;
}

//remove student
exports.removeStudent = function(AdminU, AdminP, studentName){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU) {
                Students.destroy({
                    where: {
                        Username: studentName
                    }
                }).then(after => {
                    if(AdminU == AU){
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    
                })
            } else {
                resolve(false)
            } 
        });
    });
    return promise;
};

//student login. returns promise which will resolve to answer (resolves: 0 - failed, 1 - student success, 2 - admin success)
exports.login = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username
            }
        }).then(result => {
            let num = result.count;
            if(num > 0){
                bcrypt.compare(password, result.rows[0].Password, function(err, res) {
                    if(res) {
                        resolve(1);
                    } else {
                        resolve(0);
                    } 
                });
            } else {
                bcrypt.compare(password, AP, function(err, res) {
                    if(res) {
                        resolve(2);
                    } else {
                        resolve(0);
                    } 
                });
            }
        })
    })
    return promise;
};

//addPoints
exports.addPoints = function(AdminU, AdminP, username, numPoints, areGolden){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU) {
                Students.findAll({
                    where: {
                        Username: username
                    }
                }).then(result => {
                    if(result.length < 1) { resolve(false); }
                    if(areGolden){
                        let newVal = parseInt(result[0].Goldens) + parseInt(numPoints);
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
                        let newVal = parseInt(result[0].Awesomes) + parseInt(numPoints);
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
    });
    return promise;
};

//internal add points
function internalAddPoints(username, numPoints, areGolden){
    let promise = new Promise(function(resolve, reject){
        Students.findAll({
            where: {
                Username: username
            }
        }).then(result => {
            if(result.length < 1) { resolve(false); }
            if(areGolden){
                let newVal = parseInt(result[0].Goldens) + parseInt(numPoints);
                Students.update(
                    {
                        Goldens: newVal
                    },
                    { where: {
                        Username: username } 
                    }
                ).then(after => {
                    resolve(true);
                }).catch(failed => {
                    resolve(false);
                })
            } else {
                let newVal = parseInt(result[0].Awesomes) + parseInt(numPoints);
                Students.update(
                    {
                        Awesomes: newVal
                    },
                    { where: {
                        Username: username } 
                    }
                ).then(after => {
                    resolve(true);
                }).catch(failed => {
                    resolve(false);
                })
            }
        }).catch(nope => {
            resolve(false);
        })
    });
    return promise;
}

//set points to a given value
exports.setPoints = function(AdminU, AdminP, username, numPoints, areGolden){

    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
                if(areGolden){
                    let newVal = parseInt(numPoints);
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
    });
    return promise;
};


//adds item to store
exports.addItem = function(AdminU, AdminP, Item, costAwesomes, costGoldens){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
                Store.create({
                    Reward: Item,
                    AwesomeCost: costAwesomes,
                    GoldenCost: costGoldens
                })
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
    return promise;
};

//removes item from store by name
exports.removeItem = function(AdminU, AdminP, Item){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
                Store.destroy({
                    where: {
                        Reward: Item
                    }
                }).then(after => {
                    resolve(true);
                })
            } else {
                resolve(false);
            }
        });
    });
    return promise;
};

//how student buys and item
exports.buyItem = function(username, password, Item){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username
            }
        }).then(result2 => {
            bcrypt.compare(password, result2.rows[0].Password, function(err, res) {
                if(res){
                    let num = result2.count;
                    if(num > 0){
                        let awes = result2.rows[0].Awesomes;
                        let golds = result2.rows[0].Goldens;
                        Store.findAndCountAll({
                            where: {
                                Reward: Item
                            }
                        }).then(({ rows }) => {
                            if(result2.count > 0 && rows[0].AwesomeCost <= awes && rows[0].GoldenCost <= golds){
                                //take away awesome and golden points
                                let promise = internalAddPoints(username, rows[0].AwesomeCost*(-1), false);
                                let promise2 = internalAddPoints(username, rows[0].GoldenCost*(-1), true);
                                //add to table to mark transaction if both promises resolve to true. (points were taken)
                                promise.then(firstOne => {
                                    promise2.then(secondOne => {
                                        Buys.create({
                                            Student: username,
                                            Redeemed: false,
                                            Item: Item
                                        }).then(success => {
                                            resolve(true);
                                        }).catch(nah => {
                                            resolve(false);
                                        })
                                    }).catch(nope => {
                                        resolve(false);
                                    })
                                }).catch(neg => {
                                    resolve(false);
                                })
                            } else {
                                resolve(false);
                            }
                        });
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            });
            
        })
    })
    return promise;
};

//allows teacher to mark item as redeemed
exports.redeemItem = function(AdminU, AdminP, saleID){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
                Buys.update(
                    {
                        Redeemed: true
                    },
                    { where: {
                        id: saleID } 
                    }
                ).then(after => {
                    resolve(true);
                })
            } else {
                resolve(false);
            }
        });
    });
    return promise;
};

//gets all students with of a class. NOTE: Students must be sure to enter class name CORRECTLY (CAPS, SPACES, ETC.: ALL UNIFORM)
exports.getStudentsByClass = function(AdminU, AdminP, whichClass){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
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
                        arr[2] = "Nice Try Chris!";
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
        });
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
            console.log("------------Getting Student data 1")
            if(result.count < 1){
                resolve([]);
            } else {
                bcrypt.compare(password, result.rows[0].Password, function(err, res) {
                    if(res){
                        let arr = [];
                        arr[0] = result.rows[0].Username;
                        arr[1] = result.rows[0].Name;
                        arr[2] = result.rows[0].Password;
                        arr[3] = result.rows[0].Class;
                        arr[4] = result.rows[0].Awesomes;
                        arr[5] = result.rows[0].Goldens;
                        resolve(arr);
                    } else {
                        bcrypt.compare(password, AP, function(err, res) {
                            if(res){
                                let arr = [];
                                arr[0] = result.rows[0].Username;
                                arr[1] = result.rows[0].Name;
                                arr[2] = result.rows[0].Password;
                                arr[3] = result.rows[0].Class;
                                arr[4] = result.rows[0].Awesomes;
                                arr[5] = result.rows[0].Goldens;
                                console.log("------------Getting Student data 2 - authenticated")
                                resolve(arr);
                            } else {
                                resolve([]);
                            }
                        });
                    }
                });
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
        Students.findAndCountAll({
            where: {
                Username: username
            }
        }).then(result => {
            bcrypt.compare(password, result.rows[0].Password, function(err, res) {
                if(res){
                    if(result.count > 0){
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
                } else {
                    resolve([]);
                }
            });
            
        })
    })
    return promise;
};

//gets all items Redeemed by a single student
exports.getMyRedeemed = function(username, password){
    let promise = new Promise(function(resolve, reject){
        Students.findAndCountAll({
            where: {
                Username: username
            }
        }).then(result => {
            bcrypt.compare(password, result.rows[0].Password, function(err, res) {
                if(res){
                    if(result.count > 0){
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
                } else {
                    resolve([]);
                }
            });
            
        })
    })
    return promise;
};

//get all student buys. gives saleID as well so item can be redeemed
exports.getBuysAdmin = function(AdminU, AdminP){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
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
        });
    })
    return promise;
};

//get all student redeemed items
exports.getRedeemedAdmin = function(AdminU, AdminP){
    let promise = new Promise(function(resolve, reject){
        bcrypt.compare(AdminP, AP, function(err, res) {
            if(res && AdminU == AU){
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
        });
    })
    return promise;
};
