var request = require("request");

var data = {
   quarters: {},
   classes: { quarters: {} },
};
var oldData = {
   quarters: {},
   classes: {},
};

// TESTING ONLY!!!!!!
data.classes = require("../temp").data1;
oldData.classes = require("../temp").data2;

var publicMethods = {
   getQuarters,
   getClasses,
   getSeats,
   getAllSeats,
};

// METHODS ---------------------------

function getQuarters(callback) {
   callback = callback || function () {};
   var url = "https://www2.bellevuecollege.edu/classes/All/?format=json";

   request(url, { json: true }, (err, res, body) => {
      if (err) {
         console.log("ERROR: GET " + url + "\n" + err);
         return callback(err);
      }
      oldData.quarters = data.quarters;

      body.NavigationQuarters.map((quarter) => {
         var slug = new String(quarter.FriendlyName).replace(/ /g, "");
         data.quarters[slug] = quarter;
      });

      console.log("got quarters\n" + JSON.stringify(data.quarters));
      callback(null, data.quarters);
   });
}

function getClasses(callback) {
   callback = callback || function () {};

   console.log("getting classes");

   oldData.classes = data.classes;

   var quarters = {};

   // get quarter slugs
   Object.keys(data.quarters).map((quarter) => {
      quarters[quarter] = {};
   });

   // get subjects per quarter. using function instead of for loops to be synchronous
   var loopQuarterCounter = 0;
   var loopQuarters = function (quarterSlugs) {
      var quarterSlug = quarterSlugs[loopQuarterCounter];
      var url =
         "https://www2.bellevuecollege.edu/classes/" +
         quarterSlug +
         "/?format=json";
      request(url, { json: true }, (err, res, body) => {
         if (err) {
            console.log("ERROR: GET " + url + "\n" + err);
         }

         var subjects = body.ViewingSubjects;
         for (subject of subjects) {
            quarters[quarterSlug][subject.Slug] = subject;
         }
         var subjectSlugs = Object.keys(quarters[quarterSlug]);

         var loopSubjectCounter = 0;
         var loopSubjects = function (quarterSlug, subjectSlugs) {
            var subjectSlug = subjectSlugs[loopSubjectCounter];

            getSubject(quarterSlug, subjectSlug, (err, courses) => {
               if (err) {
                  console.log("ERROR: GET " + url + "\n" + err);
               }

               quarters[quarterSlug][subjectSlug].Courses = courses;

               // Save data!
               data.classes.quarters[quarterSlug] = quarters[quarterSlug];

               loopSubjectCounter++;
               if (loopSubjectCounter < subjectSlugs.length) {
                  loopSubjects(quarterSlug, subjectSlugs);
               } else {
                  loopQuarterCounter++;
                  if (loopQuarterCounter < quarterSlugs.length) {
                     loopQuarters(quarterSlugs);
                  } else {
                     //console.log(JSON.stringify(data.classes));

                     // not necessary, but make sure everything's save before call back
                     data.classes.quarters = quarters;
                     callback(null, data.classes);
                  }
               }
            });
         };
         loopSubjects(quarterSlug, subjectSlugs);
      });
   };
   loopQuarters(Object.keys(quarters));
}

function getSubject(quarterSlug, subjectSlug, callback) {
   callback = callback || function () {};

   var url =
      "https://www2.bellevuecollege.edu/classes/" +
      quarterSlug +
      "/" +
      subjectSlug +
      "?format=json";
   request(url, { "content-type": "text/plain" }, (err, res, body) => {
      if (err) {
         console.log("ERROR: GET " + url + "\n" + err);
         return callback(err);
      }
      // remove duplicate "ID" key >:(
      // potential cause?: https://github.com/BellevueCollege/ClassSchedule/blob/83805ce9dea840c8a2e85cc8cd7a30d54125d436/ClassSchedule.Web/Models/SectionWithSeats.cs#L17
      var raw = body.toString().replace(/"ID":null,/g, "");
      var json = JSON.parse(raw);
      var rawSubject = json.Courses;

      // process data
      var courses = {};
      for (rawCourse of rawSubject) {
         var course = {};

         course.CourseID = rawCourse.Sections[0].CourseID;
         course.CourseTitle = rawCourse.Sections[0].CourseTitle;

         course.Sections = {};
         for (section of rawCourse.Sections) {
            course.Sections[section.ID.ItemNumber] = section;
         }

         // add to list of courses
         courses[course.CourseID] = course;
      }

      console.log("\ngot " + quarterSlug + " " + subjectSlug + "\n");
      callback(null, courses);
   });
}

function getSeats(ItemNumber, quarterID, callback) {
   callback = callback || function () {};

   var url = "https://www2.bellevuecollege.edu/classes/Api/GetSeats";
   var classID = { classID: ItemNumber + quarterID };
   request.post({ url: url, json: classID }, function (err, response, body) {
      if (err) {
         console.log(err);
         return callback(err);
      }
      var seats = parseInt(body.split("|")[0]);
      console.log(
         "Seats for " + ItemNumber + " of " + quarterID + ": " + seats
      );
      callback(null, seats);
   });
}

function getAllSeats(callback) {
   var queue = [];

   for (quarter in data.classes.quarters) {
      var quarterObject = data.classes.quarters[quarter];
      for (subject in quarterObject) {
         var subjectObject = quarterObject[subject];
         for (courses in subjectObject.Courses) {
            var sectionObject = subjectObject.Courses[courses].Sections;
            for (section in sectionObject) {
               var indivSectionObject = sectionObject[section];

               // synchronous
               queue.push([
                  indivSectionObject.ID.ItemNumber,
                  indivSectionObject.ID.YearQuarter,
               ]);

               // asynchronous
               // updateSeats(section.ID.ItemNumber, section.ID.YearQuarter);
            }
         }
      }
   }

   var loopSeatsCounter = 0;
   var loopSeats = function (classes) {
      getSeats(
         classes[loopSeatsCounter][0],
         classes[loopSeatsCounter][1],
         function () {
            loopSeatsCounter++;
            if (loopSeatsCounter < classes.length) {
               loopSeats(classes);
            } else {
               callback();
            }
         }
      );
   };
   loopSeats(queue);
}

// get data without updating
module.exports.data = data;
module.exports.oldData = oldData;

// update then get data
module.exports.methods = publicMethods;