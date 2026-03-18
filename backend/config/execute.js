const db = require('./db');
db.query(`SELECT * FROM users`, (err, row) => {
    if (err) {
        console.log(err);
    }
    console.log(row);
});