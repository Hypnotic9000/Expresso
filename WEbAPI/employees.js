//Harsh Cheema
const express = require('express');
const sqlite3 = require('sqlite3');
const employeeRout = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Mount existing timesheetsRouter below at the '/:employeeId/timesheets' path.
const timesheetRout = require('./timesheets.js');
employeeRout.use('/:employeeId/timesheets', timesheetRout);

//      param employeeId
const sqlQuery = `SELECT * FROM Employee WHERE id = $id`;

//  employeeId parameters
employeeRout.param('employeeId', (req, res, next, id) =>
{
    db.get(sqlQuery, {$id: id}, (err, employee) =>
    {
      if (err) //error check
      {
        next(err);
      }
      else if (employee)
      {
        req.employee = employee;
        next();
      }
      else
      {
        res.sendStatus(404); //Not Found
      }
    });
});


//  ROUTE GET current employee
employeeRout.get('/', (req, res, next) =>
{
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1;', (err,rows) =>
    {
        res.status(200).send({employees: rows});
    })
});

//     Does employee have the same name, wage, position to verify that employee
const isEmployee = (req, res, next) =>
{
    const checkEmployee = req.body.employee;

    if (checkEmployee.name && checkEmployee.wage && checkEmployee.position)
    {
        next();
    }
    else
    {
        return res.status(400).send();
    };
};

//    ROUTE POST
employeeRout.post('/', isEmployee, (req, res, next) => {
    const CreateEmployee = req.body.employee;

    let response = {};
  db.serialize(() => {
    db.run('INSERT INTO Employee (name, wage, position, is_current_employee ) VALUES ($name, $wage, $position, $is_current_employee )', {
            $name: CreateEmployee.name,
            $wage: CreateEmployee.wage,
            $position: CreateEmployee.position,
            $is_current_employee: 1  //insert the emloyee w given characteristics
        },
        function (err)
        {
            if (err)
            {
              return console.log(err); //error check
            }
    db.get(`SELECT * FROM Employee WHERE id = $id`, { $id: this.lastID }, (err, row) => {
           if (err)
           {
             console.log(err);
             next(err);
           }
           else
           {
            response.employee = row;
            return res.status(201).send(response); // no content response otherwise
           }
     });
    }
   );
  });
});

//    ROUTE GET ID /:employeeId
employeeRout.get('/:employeeId', (req, res, next) =>
{
    const response =
    {
        employee: req.employee
    };
    res.status(200).send(response); // OK
});

//     ROUTE PUT ID /:employeeId
employeeRout.put('/:employeeId', isEmployee, (req, res, next) => {
    const UpdateEmployee = req.body.employee;
    let response = {};
  db.serialize(() => {
    db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id;", {
        $name: UpdateEmployee.name,
        $position: UpdateEmployee.position,
        $wage: UpdateEmployee.wage,
        $id: req.employee.id //put will help update any of these charactertiscs
    },
    function (err)
    {
        if (err)
        {
          console.error(err);
        }
   db.get(`SELECT * FROM Employee WHERE id = $id`, { $id: req.employee.id }, (err, row) => {
       if (err)
       {
        console.log(err);
        next(err);
       }
       else
       {
         response.employee = row;
         return res.status(200).send(response); //OK
       }
        });
    });
  });
});

//   ROUTE DELETE ID /:employeeId
employeeRout.delete('/:employeeId', (req, res, next) => {
    let response = {};
  db.serialize(() => { //orders the database commands chronologically
    db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $id;", {$id: req.employee.id}, function(err) {
        if (err)
         {
            console.log(err);
         }
    db.get("SELECT * FROM Employee WHERE id = $id", { $id: req.employee.id}, (err, row) => {
        if (err)
        {
            console.log(err);
            next(err);
        }
        else
        {
          response.employee = row;
          return res.status(200).send(response); //OK
        }
        })
    })
  });
});

module.exports = employeeRout; //make it exportable (used by others)
