const express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../controllers/connection');
const executeAndReturn = connection.executeAndReturn;
require('dotenv').config();

router.get('/', (_req, res, next) => {
  res.render('admin-login');//admin login page name
});

router.post('/', async (req, res) => {
    let emailAddress = req.body.email;
    let password = req.body.password;
    
    let query = `SELECT * FROM ngo.admin WHERE email = "${emailAddress}" AND password = "${password}" `;
    let adminInfo = await executeAndReturn(query);
    if(adminInfo.length > 0) {
      req.session.isAdminLoggedIn = true;
      req.session.adminEmail = emailAddress;
      req.session.adminName = "admin"
      console.log("authenticated");
      res.redirect('/dashboard-admin');
      // var token = jwt.sign({ emailAddress }, process.env.secret, {
      //   expiresIn: 86400 // expires in 24 hours
      // });
      // res.
      // status(200)
      // send({ auth: true, token: token });  
      // next();
    } else {
      res.redirect('/admin-login');
    }
  });

module.exports = router;
