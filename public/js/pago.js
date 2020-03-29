function cookiePrincipal() {
    let cookies = document.cookie.split(';');
    let i = 0;
    while (i < cookies.length && !cookies[i].startsWith('express:sess='))
        i++;
    if (i < cookies.length)
        return JSON.parse(atob(cookies[i].split('=')[1]));
    else
        return null;
}

window.addEventListener('load', function (evento) {
    let cookie = cookiePrincipal();
    document.getElementById('inputNombre').value = cookie.nombre;
    document.getElementById('inputApellido').value = cookie.apellido;
    document.getElementById('inputDireccion').value = cookie.direccion;
    document.getElementById('inputCiudad').value = cookie.ciudad;
    document.getElementById('inputProvincia').value = cookie.provincia;
    document.getElementById('inputPais').value = cookie.pais;
    document.getElementById('inputEmail').value = cookie.email;
    document.getElementById('inputTelefono').value = cookie.telefono;
    if (cookie.numeroTarjeta)
        document.getElementById('inputNumeroTarjeta').value = cookie.numeroTarjeta;
    if (cookie.expiracionTarjeta)
        document.getElementById('inputExpiracion').value = cookie.expiracionTarjeta;
    if (cookie.codigoTarjeta)
        document.getElementById('inputCodigo').value = cookie.codigoTarjeta;
});