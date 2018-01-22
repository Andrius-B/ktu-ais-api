"use strict"

const cheerio                 = require('cheerio')
const cheerioTableparser      = require('cheerio-tableparser')
const request                 = require('request')
const iconv                   = require('iconv-lite')

/*
  CountdownLatch used to send out requests in a forEach loop
  and then await all of them before returning
*/
//Creates a CountdownLatch object to keep track of
var CountdownLatch = function (limit){
  this.limit = limit;
  this.count = 0;
  this.waitBlock = function (){};
}

CountdownLatch.prototype.async = function (fn){
  var _this = this; // pass the CountdownLatch refrence to the child function
  fn(function (){
    _this.count = _this.count + 1; // the child funtion callback increments the internal counter
    if(_this.limit <= _this.count){
      return _this.waitBlock(); // if enough of the child functions incremented the internal counter,
                                // execute the waitBlock, which by default is do-nothing, but may be replaced
    }
  })
}

CountdownLatch.prototype.await = function(callback){
  this.waitBlock = callback; // replaces the internal callback for when all function finish execution
                             // i.e. the internal counter reaches the limit
}

function handler(plano_metai, p_stud_id, authCookie) {
  let url = `https://uais.cr.ktu.lt/ktuis/STUD_SS2.planas_busenos?plano_metai=${plano_metai}&p_stud_id=${p_stud_id}`
  return new Promise((res, rej) => {
    request(url, {headers: {Cookie: authCookie}, encoding: null}, (error, response, body) => {
      if (!error) {
        var $ = cheerio.load(iconv.decode(body, 'windows-1257'))
        var ary = []
        if($(".table.table-hover > tbody > tr").length != 0) {
          // each is cheerio's function so => doesn't work
          $(".table.table-hover > tbody > tr").each(function(i, element) {
            let a = $(this)
            let json = {
                          semester : "",
                          semester_number: "",
                          module_code: "",
                          module_name: "",
                          credits: "",
                          language: "",
                          misc: "",
                          p1: "",
                          p2: ""
                        }
            json.semester = a.parent().parent().children().first().children().first().text().split("(")[0].trim()
            json.semester_number = a.parent().parent().children().first().children().first().text().split("(")[1].split(')')[0].trim()
            json.module_code = a.children().first().text()
            json.module_name = a.children().eq(1).text() // bad encoding
            json.credits = a.children().eq(3).text()
            json.language = a.children().eq(4).text()
            json.misc = a.children().eq(5).text()
            let infivert_regex = /[\(|\,|\)|\']/g // infivert is a function that returns grades, need to get p1 and p2 to call it

            let duck = a.children().eq(5).children().first().attr('onclick')
            if (duck != undefined) {
              let infivert = duck.toString().split(infivert_regex)
              json.p1 = infivert[1] // p1 is the students semester_id
              json.p2 = infivert[3]
            }
            ary.push(json)
          })
          res(JSON.stringify(ary));
        }
        else res(401)
      }
      else res(500)
    })
  })
}

function getGradesJson(dataString, authCookie) {
  let data = JSON.parse(dataString)
  let url = 'https://uais.cr.ktu.lt/ktuis/STUD_SS2.infivert'
  var barrier = new CountdownLatch(data.length);
  return new Promise((res, rej) =>{
    let resp = []

    barrier.await(function(){
      console.log('done all');
      res(resp)
    })

    barrier.async(function (done){
        data.forEach((element, i) => {
        if(!element.p2 || !element.p1){ done() }
        let body = `p2=${element.p2}&p1=${element.p1}`
        let options = {
                        method: 'POST',
                        url: url,
                        headers:
                          { cookie: authCookie },
                        encoding: null,
                        form: {
                          p1: element.p1,
                          p2: element.p2
                        }
                      }
        request(options, (error, response, body) => {
          if(!error) {
            var $ = cheerio.load(iconv.decode(body, 'windows-1257'))
            cheerioTableparser($)
            var b = $('.d_grd2[style="border-collapse:collapse; empty-cells:hide;"]').parsetable(true, true, true)
            var c = $('.d_grd2[style="border-collapse:collapse; table-layout:fixed; width:450px;"]').parsetable(true, true, true)
            for(var j = 4; j <= b.length - 5; j++) {
              let week
              let grade = { name: element.module_name,
                            id: element.module_code,
                            semester: element.semester,
                            module_code: element.module_code,
                            module_name: element.module_name,
                            semester_number: element.semester_number,
                            credits: element.credit,
                            language: element.language,
                            profestor: $('blockquote').children().last().text(),
                            typeId: "",
                            type: "",
                            week: "",
                            weight: "",
                            mark: [] }
              if(b[j][1] != '') {
                grade.week = b[j][0]
                grade.typeId = b[j][1]
                for(let k = 2; k < b[j].length; k++) {
                  grade.mark.push(b[j][k])
                }
                for(let l = 0; l < c[0].length; l++) {
                  if(grade.typeId == c[0][l]) {
                    grade.type = c[1][l]
                    grade.weight = c[4][l].slice(0, -1)/100
                  }
                }
                resp.push(grade)
              }
            }
            done()
          }
          else res(500)
        })
      })
    })

  })
}

module.exports = { handler, getGradesJson }
