"use strict"

const request         = require('request')
const iconv           = require('iconv-lite')
const cheerio         = require('cheerio')
const getStudcookie   = require('./getStudcookie')

function handler(username, password) {
  username = username.replace("\'", "'\\\''")
  password = password.replace("\'", "'\\\''")
  return getStudcookie(username, password).then(cookie => {
    return afterLogin(cookie)
  })
  
}

function afterLogin(cookie) {
  return new Promise((res, rej) => {
    let json = {
      cookie: cookie,
      student_name: "",
      student_id: "",
      student_semesters: []
    }
    let options = {
      url: 'https://uais.cr.ktu.lt/ktuis/vs.ind_planas',
      headers: { Cookie: `STUDCOOKIE=${cookie};` },
      encoding: null
    }
    request(options, (error, response, body) => {
      if(!error) {
        let $ = cheerio.load(iconv.decode(body, 'windows-1257'))
        if($('#ais_lang_link_lt').length != 0) {
          let nameString = $("#ais_lang_link_lt").parent().text().split('\n')[0]
          json.student_id = nameString.split(' ')[0].trim()
          let nameStringSplit = nameString.split(' ')
          for (let i = 1; i < nameStringSplit.length; i++) 
            json.student_name += nameStringSplit[i] + ' '
          json.student_name = json.student_name.trim()
          $(".ind-lst.unstyled > li > a").each(function(i, element) {
            let item = $(this)
            let semester = {
              year: "",
              id: ""
            }
            let a = item.attr('href').toString()
            let yearRegex = '(plano_metai=).*(?=&)'
            semester.year = a.match(yearRegex)[0].split('=')[1]
            let id_regex = '(p_stud_id).*(?=)'
            semester.id = a.match(id_regex)[0].split('=')[1]
            json.student_semesters.push(semester)
          })
            res(json)
        }
        else res(401)
      }
      else res(500)
    })
  })
}

module.exports = { handler }
