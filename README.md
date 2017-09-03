# KTU AIS API
This is an api to get KTU student grades (with possibility to get even more). It works by scraping hmtl using all popular cheeriojs/cheerio framework.

# Features
- Get STUDCOOKIE which is used everywhere around ktu ais
- Get student grades from requested year

# Run it
- nodejs >= v6.11
- `npm install`
- `npm start`

# Test it
To test if app is running send GET request to '/'. It should return 200 and 'alive'

# API
- `/api/login` - takes `user` and `pass` properties as 'content-type': 'application/x-www-form-urlencoded' and returns 'application/json' 
```json
{
  "cookie": "", //  STUDCOOKIE. It is required for every request in ais
  "student_name": "", // Student's full name
  "student_id": "", // Student academical code (vidko)
  // Student id varies between years, and to get grades for that year you need year=>id pair
  "student_semesters": [ 
    {
      "year": "",
      "id": ""
    }
  ]
}
```

- `/api/get_grades` - takes `plano_metai`, `p_stud_id` and `Cookie`(header) as 'content-type': 'application/x-www-form-urlencoded' and returns 'application/json'. 
   
   `plano_metai` takes `year` and `p_stud_id` takes `id` from login response `student_semesters` object.
   
   `Cookie` is `cookie` from login response

```json
[
  {
    "name": "", // Module name
    "id": "", // Module id
    "semester": "", // Semester (fall/spring)
    "module_code": "", // Module id (deprecated)
    "module_name": "", // Module name (deprecated)
    "semester_number": "", // Semester number (which semester from the begging)
    "language": "", // Language id
    "profestor": "", // Module coordinating professor
    "typeId": "", // Grate type id
    "type": "", // Grade type name
    "week": "", // Week student got the grade
    "weight": 0, // Grade's influence to the final grade
    "mark": [ "" ] // Marks, returns more than one if student didn't pass the first time
  }
]
```