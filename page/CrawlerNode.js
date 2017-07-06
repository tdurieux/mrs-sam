const SftpClient = require('sftp-promises');

class CrawlerNode {

    constructor(siteId, serverNames) {
        this.siteId = siteId;
        this.serverNames = serverNames;
        this.sftpClient = new SftpClient({
            var host = 'localhost';
            var port = '2222';
            var username = 'mrssam';
            var password = 'mrssam';
        });
        this.dbUrl = `mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`;
        this.rmqUrl = `amqp://${serverNames.rabbitServerName}`;
        this.queue = `urlOf${this.siteId}`;
        this.folder = `upload/${this.siteId}`;
    }

}

module.exports.CrawlerNode = CrawlerNode;
