const SftpClient = require('sftp-promises');

class CrawlerNode {

    constructor(siteId, serverNames) {
        this.siteId = siteId;
        this.serverNames = serverNames;
        this.sftpClient = new SftpClient(getSftpConfig(serverNames.fileServerName));
        this.dbUrl = `mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`;
        this.rmqUrl = `amqp://${serverNames.rabbitServerName}`;
        this.queue = `urlOf${this.siteId}`;
        this.folder = `upload/${this.siteId}`;
    }

}

function getSftpConfig(fileServerName) {
    var host = 'localhost';
    var port = '22';
    var username = 'mrssam';
    var password = 'mrssam';

    var urlTokens =  fileServerName.split('@');
    if (urlTokens.length > 1) {
        var userTokens = urlTokens[0].split(':');
        username = userTokens[0];
        if (userTokens.length > 1)
            password = userTokens[1];
    }
    var hostTokens = urlTokens[urlTokens.length - 1].split(':');
    host = hostTokens[0];
    if (hostTokens.length > 1)
        port = hostTokens[1];

    return {
        host: host,
        port: port,
        username: username,
        password: password
    };
}


module.exports.CrawlerNode = CrawlerNode;