var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'p3plcpnl0650.prod.phx3.secureserver.net',
  user     : 'ANEXD_ADMIN@p3plcpnl0650.prod.phx3.secureserver.net',
  password : 'gn9-MVn-6Bq-q6b',
  database : 'ANEXD'
});

connection.connect();

connection.end();