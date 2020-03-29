const fs = require('fs');
const express = require('express');
const cookieSession = require('cookie-session');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

var config = JSON.parse(fs.readFileSync('config.json'));

var db = new sqlite3.Database(config.BD, err => {
    if (err) {
        console.log(err.message);
        process.exit();
    }
});

db.run(
    'CREATE TABLE IF NOT EXISTS cuenta (id_cuenta INTEGER PRIMARY KEY AUTOINCREMENT, '
    + 'email VARCHAR(255) UNIQUE, nombre VARCHAR(255), apellido VARCHAR(255), '
    + 'direccion VARCHAR(255), ciudad VARCHAR(255), provincia VARCHAR(255), pais VARCHAR(255), '
    + 'telefono VARCHAR(255), clave VARCHAR(255))'
);

var app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieSession({
    httpOnly: false,
    keys: [config.SECRETO],
    maxAge: 86400000 // 24 horas
}));

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/login', function (req, res) {
    if (req.session.id_cuenta) {
        res.status(400);
        res.send("400 - Ya se encuentra logueado.");
    }
    else
        res.render('login');
});

app.post('/login', function (req, res) {
    if (req.body.email && req.body.clave) {
        let hash = crypto.createHash('sha256');
        hash.update(req.body.clave, 'utf-8');
        let parametros = [req.body.email, hash.digest('base64')];
        let consulta = 'SELECT * FROM cuenta WHERE email = ? AND clave = ?';
        db.get(consulta, parametros, (err, fila) => {
            if (fila) {
                req.session.id_cuenta = fila.id_cuenta;
                req.session.nombre = fila.nombre;
                req.session.apellido = fila.apellido;
                req.session.email = fila.email;
                req.session.direccion = fila.direccion;
                req.session.ciudad = fila.ciudad;
                req.session.provincia = fila.provincia;
                req.session.pais = fila.pais;
                req.session.telefono = fila.telefono;
                let query = req.originalUrl.split('?', 2)[1];
                res.redirect('/pago?' + query);
            }
            else
                res.render('login', {error: 'La cuenta no existe o la contraseña es incorrecta, picarón.'});
        });
    }
    else
        res.render('login', {error: 'No completaste algo, picarón. Tené más cuidado la próxima.'});
});

app.get('/registro', function (req, res) {
    if (req.session.id_cuenta) {
        res.status(400);
        res.send("400 - Ya se encuentra logueado.");
    }
    else
        res.render('registro');
});

app.post('/registro', function (req, res) {
    if (req.body.nombre && req.body.apellido && req.body.direccion && req.body.ciudad
            && req.body.provincia && req.body.pais && req.body.email && req.body.telefono
            && req.body.clave && req.body.validar_clave)
        if (req.body.clave == req.body.validar_clave) {
            let hash = crypto.createHash('sha256');
            hash.update(req.body.clave, 'utf-8');
            let parametros = [
                req.body.email,
                req.body.nombre,
                req.body.apellido,
                req.body.direccion,
                req.body.ciudad,
                req.body.provincia,
                req.body.pais,
                req.body.telefono,
                hash.digest('base64')
            ];
            let consulta = 'INSERT INTO cuenta(email, nombre, apellido, direccion, ciudad, provincia, pais, telefono, clave) '
                + 'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.run(consulta, parametros, err => {
                if (err)
                    res.render('registro', {error: 'Algo falló y probablemente se debe a que ya existe una cuenta con ese mail. Tené más cuidado la próxima.'});
                else {
                    let query = req.originalUrl.split('?', 2)[1];
                    res.redirect('/login?' + query);
                }
            });
        }
        else
            res.render('registro', {error: 'Le pifiaste a la validación de la clave. Tené más cuidado la próxima.'});
    else
        res.render('registro', {error: 'No completaste algo, picarón. Tené más cuidado la próxima.'});
});

app.get('/pago', function (req, res) {
    if (req.session.id_cuenta) {
        let parametros = {
            transaccion: req.query.transaccion,
            total_a_pagar: req.query.total_a_pagar,
            redireccion: req.query.redireccion
        }
        res.render('pago', parametros);
    }
    else {
        let query = req.originalUrl.split('?', 2)[1];
        res.redirect('/login?' + query);
    }
});

app.post('/pago', function (req, res) {
    if (req.body.nombre && req.body.apellido && req.body.direccion && req.body.ciudad
            && req.body.provincia && req.body.pais && req.body.email && req.body.telefono
            && req.body.numero_tarjeta && req.body.expiracion && req.body.codigo){
        req.session.numeroTarjeta = req.body.numero_tarjeta;
        req.session.expiracionTarjeta = req.body.expiracion;
        req.session.codigoTarjeta = req.body.codigo;
        let parametros = {
            transaccion: req.query.transaccion,
            total_a_pagar: req.query.total_a_pagar,
            redireccion: req.query.redireccion
        }
        res.render('transaccion_exitosa', parametros);
    }
});

app.listen(config.PUERTO, config.IP, function () {
    console.log(`http://${config.IP}:${config.PUERTO}`);
});