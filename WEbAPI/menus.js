const express = require('express');
const sqlite3 = require('sqlite3');
const menuRout = express.Router(); // Integrate SQL and JavaScript
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// params menuID
menuRout.param('menuId', (req, res, next, id) =>
{
    db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: id}, (err, menu) =>
    {
      if (err)
      {
        next(err);
      }
      else if (menu)
      {
        req.menu = menu;
        next();
      }
      else
      {
        res.sendStatus(404);
      }
    });
});

// create params for menuitemid
menuRout.param('menuItemID', (req, res, next, id) =>
{
    db.get(`SELECT * FROM MenuItem WHERE id = $id`, {$id: id}, (err, menuItem) =>
    {
      if (err)
      {
        next(err);
      }
      else if (menuItem)
      {
        req.menuItem = menuItem;
        next();
      }
      else
      {
        res.sendStatus(404);
      }
    });
});

//  ROUTE GET menu
menuRout.get('/', (req, res, next) =>
{
    let response = {};
    db.all('SELECT * FROM Menu', (err,rows) =>
    {
        response.menus = rows;
        if (err)
        {
            console.log(err);
        }
        res.status(200).send(response);
    })
});

// checking the menu title
const isValidMenu = (req, res, next) =>
{
    const ValidateMenu = req.body.menu;
    if (ValidateMenu.title)
    {
        next();
    }
    else
    {
        return res.status(400).send();
    };
};

//  ROUTE POST
menuRout.post('/', isValidMenu, (req, res, next) =>
{
    let response = {};
    const menuToCreate = req.body.menu;
    db.run("INSERT INTO Menu (title) VALUES ($title)",
    {
        $title: menuToCreate.title
     },
     function(err)
     {

            if (err)
            {
                console.log(err);
            }
            db.get("SELECT * FROM Menu WHERE id = $id",
            { $id: this.lastID }, (err, row) =>
            {
                if (err)
                {
                    console.log(err);
                }
                else
                {
                    response.menu = row;
                    res.status(201).send(response);
                }
           });
    })
});

// ROUTE GET ID from menu
menuRout.get('/:menuId', (req, res, next) => {
    const response = {
        menu: req.menu
    };
    res.status(200).send(response);
});

//   ROUTE PUT ID /:menuId
menuRout.put('/:menuId', isValidMenu, (req, res, next) => {
    const menuToUpdate = req.body.menu;
    let response = {};

    db.run("UPDATE Menu SET title = $title WHERE id = $id;", {
        $title: menuToUpdate.title,
        $id: req.menu.id
    }, function (err) {
        if (err) {
            console.error(err);
        }
        db.get(`SELECT * FROM Menu WHERE id = $id`, { $id: req.menu.id }, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                response.menu = row;
                return res.status(200).send(response);
            }
        });
    });
});

// See if given menu items have similar or related items
const menuItemsChecker = (req, res, next) => {

    db.get("SELECT * FROM MenuItem WHERE menu_id = $id", {
        $id: req.menu.id
    }, (err, row) => {
        if (err)
        {
           console.log(err);
           next(err);
        }
        else if (row)
        {
            return res.status(400).send();  //reposne status
        }
        else
        {
            next();
        }
    });
};

// Check to see if the menu item has a name, description, price , etc.
const isMenuItem = (req, res, next) =>
{
    const ValidateItem = req.body.menuItem;

    if (ValidateItem.name && ValidateItem.description && ValidateItem.price && ValidateItem.inventory) {
        next();
    }
    else
    {
        return res.status(400).send(); // invalid item
    };
};

//        ROUTE DELETE menuid
menuRout.delete('/:menuId', menuItemsChecker, (req, res, next) =>
{
    db.run("DELETE FROM Menu WHERE id = $id", { $id: req.menu.id }, function(err)
    {
        if (err)
        {
            console.log(err);
        } else
        {
            return res.status(204).send(); //no content
        }
    })
});

//   ROUTE GET /:menuId/menu-items/
menuRout.get('/:menuId/menu-items/', (req, res, next) =>
{

    let response = {};
    const sqlQuery = "SELECT * FROM MenuItem WHERE menu_id = $id";

    db.all(sqlQuery,
      {
        $id: req.menu.id
    }, (err, rows) =>
    {
        response.menuItems = rows;
        if (err)
        {
            console.log(err);
            next(err);
        }
        else if (rows)
        {
            return res.status(200).send(response);
        }
    });
});



//   ROUTE POST /:menuId/menu-items/
menuRout.post('/:menuId/menu-items/', isMenuItem, (req, res, next) =>
{
    let response = {};
    const menuItemToCreate = req.body.menuItem;
  db.serialize(() => {
    db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)", {
        $name: menuItemToCreate.name,
        $description: menuItemToCreate.description,
        $inventory: menuItemToCreate.inventory,
        $price: menuItemToCreate.price,
        $menu_id: req.menu.id
     },
     function(err)
     {
        if (err)
        {
          console.log(err)
        }
    db.get("SELECT * FROM MenuItem WHERE id = $id",
      { $id: this.lastID }, (err, row) =>
      {
          if (err)
          {
            console.log(err);
          }
          else
          {
              response.menuItem = row;
              res.status(201).send(response);
          }
      })
  });
});
});

//   ROUTE PUT ID /:menuId/menu-items/:menuItemId
menuRout.put('/:menuId/menu-items/:menuItemID', isMenuItem, (req, res, next) => {
    const menuItemToUpdate = req.body.menuItem;
    let response = {};

  db.serialize (() => {
    db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id;", {
        $id: req.menuItem.id,
        $name: menuItemToUpdate.name,
        $description: menuItemToUpdate.description,
        $price: menuItemToUpdate.price,
        $inventory: menuItemToUpdate.inventory,
        $menu_id: req.menu.id

    },
    function (err)
    {
        if (err)
        {
            console.error(err);
        }
    db.get(`SELECT * FROM MenuItem WHERE id = $id`, { $id: req.menuItem.id }, (err, row) =>
    {
        if (err)
         {
            console.log(err);
            next(err);
         }
        else
        {
            response.menuItem = row;
            return res.status(200).send(response);
        }
      });
    });
  });
});

// ROUTE DELETE /:menuId/menu-items/:menuItemId
menuRout.delete('/:menuId/menu-items/:menuItemID', (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $id", { $id: req.menuItem.id }, function(err) {
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

module.exports = menuRout; //make it exportable (used by others)
