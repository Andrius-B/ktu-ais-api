"use strict"

const express           = require('express')
const bodyParser        = require('body-parser')
const http              = require('http')
const https             = require('https')
const fs                = require('fs')
const login             = require('./handlers/login')
const getGrades         = require('./handlers/getGrades')

// var sslOptions = {
//   key: fs.readFileSync('./cert/privkey.pem'),
//   cert: fs.readFileSync('./cert/fullchain.pem')
// }

const app = express()
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support url encoded bodies

app.get('/', (req, res) => {
  res.send('alive')
})

app.post('/api/login', (req, res) => {
  console.log('Request received @ /api/login')
  let user = req.body.user
  let pass = req.body.pass
  login.handler(user, pass).then(data => {
    if (data == 401 || data == 500) {
      res.sendStatus(data)
    }
    else {
      res.send(data)
    }
  })
})

app.post('/api/get_grades', (req, res) => {
  console.log('Request received @ /api/get_grades')
  let plano_metai = req.body.plano_metai
  let p_stud_id = req.body.p_stud_id
  let cookie = req.header('Cookie')
  getGrades.handler(plano_metai, p_stud_id, cookie).then((data) => {
    if(data == 401 || data == 500) {
      res.sendStatus(data)
    }
    else {
      console.log(data)
      getGrades.getGradesJson(data, cookie).then((data) => {
        res.send(data)
      })
    }
  })
})
http.createServer(app).listen(8080)
//https.createServer(sslOptions, app).listen(8081)
console.log('Server is running on port 8080')
