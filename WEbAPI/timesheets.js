const express = require('express');
const sqlite3 = require('sqlite3');  // Integrate SQL and JavaScript
const timesheetRout = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Check if hours, rate and date are correct then time sheet is validated
const isTimesheet = (req, res, next) =>
{
    const timesheetToValidate = req.body.timesheet;

    if (timesheetToValidate.hours && timesheetToValidate.rate && timesheetToValidate.date)
    {
        next();
    }
    else
    {
        return res.status(400).send(); // Bad request
    };
};

//  check if timesheet has the right id in the database
const isTimesheetID = (req, res, next) =>
{
    db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: req.params.timesheetId }, (err, row) =>
    {
        if (err)
        {
            next(err);
        }
        else if ( !row )
        {
            return res.status(404).send(); //Not Found
        }
        else
        {
            next();
        }
    });
};

//   ROUTE GET
timesheetRout.get('/', (req, res, next) =>
{
    let response = {};
    db.all("SELECT * FROM Timesheet WHERE employee_id = $employee_id", { $employee_id: req.employee.id }, (err, rows) =>
    {
        response.timesheets = rows;
        res.status(200).send(response);
    })
});

//  ROUTE POST
timesheetRout.post('/', isTimesheet, (req, res, next) => {
    const timesheetToCreate = req.body.timesheet;
    let response = {};

  db.serialize(() => // Will make sure the database commands are in chrono order
  {
    db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)", //insert rows to timesheet
    {
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employee_id: req.employee.id
     },
     function(err)
     {
            if (err)
            {
                console.log(err)
            }
    db.get("SELECT * FROM Timesheet WHERE id = $id", // from timesheet find the id
      { $id: this.lastID }, (err, row) =>
      {
        if (err)
        {
          console.log(err);
        }
        else
        {
          response.timesheet = row;
          res.status(201).send(response);
        }
      });
    })
  })
});



// ROUTE PUT /api/employees/:employeeId/timesheets/:timesheetId
timesheetRout.put('/:timesheetId', isTimesheetID, isTimesheet, (req, res, next) => {
    const timesheetID = req.params.timesheetId;
    const timesheetToUpdate = req.body.timesheet;
    let response = {};
db.serialize(() => {
    db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id;", {
        $hours: timesheetToUpdate.hours,
        $rate: timesheetToUpdate.rate,
        $date: timesheetToUpdate.date,
        $id: timesheetID
    },
    function (err)
    {
        if (err)
        {
          console.log(err);
        }
   db.get(`SELECT * FROM Timesheet WHERE id = $id`, { $id: timesheetID }, (err, row) => {
      if (err)
      {
        console.log(err);
        next(err);
      }
      else
      {
        response.timesheet = row;
        return res.status(200).send(response);
      }
        });
    });
});
});

// ROUTE DELETE /api/employees/:employeeId/timesheets/:timesheetId
timesheetRout.delete('/:timesheetId', isTimesheetID, (req, res, next) => {
    db.run("DELETE FROM Timesheet WHERE id = $id", { $id: req.params.timesheetId }, function(err) {
        if (err)
        {
            console.log(err);
        }
        else
        {
            return res.status(204).send();
        }
    })
});

module.exports = timesheetRout;  //make it exportable (used by others)
