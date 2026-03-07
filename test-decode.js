const url = new URL('http://localhost/api?photoRef=A%2BB');
console.log(url.searchParams.get('photoRef'));
