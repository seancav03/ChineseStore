# Chinese Class Store
## This is an online store for Head-Royce School's gamified learning Chinese classes.

This server is current running live using Heroku and is in use. This is the source code.

## Setup

#### 1
Clone the repository to your local machine. To do this, open the terminal on your machine, navigate to the directory where you want the project to go, and run `git clone ____` whre `____` is the remote url found in github when you click the green **code** button in the top right when on the project page.

#### 2
Run `npm install` to install all dependencies for the project.

#### 3
Open a second terminal instance and run `redis-server` to start the redis server which stores cookies. If you are trying to improve this code base, managing cookies manually and removing this requirement is probably smart from a security perspective.

#### 4
In your original terminal, run `node CServer.js` to start the server. Your app is now running locally on the port `3775`. Open your favorite browser and go to [http://localhost:3775/store/login.htm](http://localhost:3775/store/login.htm) to get to the login page. Login as Admin or as a student here. To create a new student account, press "Create New Account" at the bottom of the login page.

#### 5
Explore!
