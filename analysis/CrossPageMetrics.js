var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var Simhash = require('./simhash').Simhash;
var similarity = require('./simhash').similarity;

class CrossPageMetrics {
    constructor(fetchID, mongoServer, csvPath) {
        this.fetchID = ObjectID(fetchID);
        this.db_url = `mongodb://${mongoServer}:27017/mrssam`;
        this.cpm = new CrossPageMatrix();
        this.cocitations = undefined;
        this.couplings = undefined;
        this.csvPath = csvPath;
        this.pageSimHash = [];
        this.simhash = new Simhash();
    }

    start() {
        mong_client.connect(this.db_url, (err, db) => {
            if (err) {
                throw new Error(err);
            } else {
                this.db = db;
                console.log("CrossPageMetrics is running!");
                this.fetchEntries();
            }
        });
    }

    fetchEntries() {
        this.db.collection('TestedPage', (err, pageColl) => {
            var cursor = pageColl.find({ fetch_id: this.fetchID }).each((err, page) => {
                if (page) {
                    this.pageSimHash.push(this.simhash.of(page.body, { kshingles: 2, maxFeatures: 32 }));
                    console.log("ADD ENTRY: " + page.url);
                    this.cpm.addEntry(page._id, page.url);
                } else {
                    console.log("ENTRIES ARE FETCHED !!!!!!")
                    this.fetchReferences();
                }
            });
        });
    }


    fetchReferences() {
        this.cpm.initMatrix();
        this.db.collection('TestedPage', (err, pageColl) => {
            var cursor = pageColl.find({ fetch_id: this.fetchID }).each((err, page) => {
                if (page) {
                    page.hrefs.forEach(href => {
                        try {
                            this.cpm.addRef(page.url, href);
                            console.log(`ADD : ${page.url} -> ${href}`);
                        } catch (err) {
                            //don't care, href outside of the domain
                            //console.log(err);
                        }
                    });
                } else {
                    console.log("no more ref to fetch");
                    this.db.close();
                    this.computeMetrics();
                }
            });
        });
    }


    computeMetrics() {
        this.cocitations = new Matrix2D(this.cpm.size());
        this.couplings = new Matrix2D(this.cpm.size());
        this.similarity = new Matrix2D(this.cpm.size());


        for (var i = 0; i < this.cpm.size(); i++) {
            for (var j = 0; j < this.cpm.size(); j++) {
                if (this.cocitations.get(i, i) == 0) {
                    this.cocitations.set(i, i, this.cpm.getCoCitation(this.cpm.entries[i], this.cpm.entries[i]));
                }
                if (this.cocitations.get(j, j) == 0) {
                    this.cocitations.set(j, j, this.cpm.getCoCitation(this.cpm.entries[j], this.cpm.entries[j]));
                }
                if (this.cocitations.get(i, j) == 0) {
                    this.cocitations.set(i, j, this.cpm.getCoCitation(this.cpm.entries[i], this.cpm.entries[j]));
                }

                if (this.couplings.get(i, i) == 0) {
                    this.couplings.set(i, i, this.cpm.getCoupling(this.cpm.entries[i], this.cpm.entries[i]));
                }
                if (this.couplings.get(j, j) == 0) {
                    this.couplings.set(j, j, this.cpm.getCoupling(this.cpm.entries[j], this.cpm.entries[j]));
                }
                if (this.couplings.get(i, j) == 0) {
                    this.couplings.set(i, j, this.cpm.getCoupling(this.cpm.entries[i], this.cpm.entries[j]));
                }

                var cii = this.cocitations.get(i, i);
                var cjj = this.cocitations.get(j, j);
                var cij = this.cocitations.get(i, j);
                var bii = this.couplings.get(i, i);
                var bjj = this.couplings.get(j, j);
                var bij = this.couplings.get(i, j);

                var simg = (cij / Math.sqrt(cii * cjj)) + (bij / Math.sqrt(bii * bjj));
                if (isNaN(simg)) {
                    simg = 0;
                }

                var sims = similarity(this.pageSimHash[i], this.pageSimHash[j])
                this.similarity.set(i, j, simg + sims);
                //this.similarity.set(i, j, sims);

            }
        }
        console.log("metrics are computed");
        if (this.csvPath) {
            this.saveMetricsInCSV(this.csvPath);
            this.saveOIDInCSV(this.csvPath);
            this.saveReferencesInCSV(this.csvPath);
        }
    }

    saveMetricsInCSV(filePath) {
        var csv = this.similarity.matrix.map(row => {
            return row.join(',')
        }).join('\r\n');
        var csvFile = filePath + "_data.csv";
        fs.writeFile(csvFile, csv);
    }

    saveOIDInCSV(filePath) {
        var ids = this.cpm.ids.join(',') + '\r\n';
        var csvFile = filePath + "_ids.csv";
        fs.writeFile(csvFile, ids);
    }

    saveReferencesInCSV(filePath) {
        var csvFile = filePath + "_ref.csv";
        this.cpm.refMatrix.saveCSV(csvFile);
    }
}


class CrossPageMatrix {
    constructor() {
        this.entries = [];
        this.ids = [];
    }

    size() {
        return this.entries.length;
    }

    addEntry(id, url) {
        if (this.entries.indexOf(url) === -1) {
            this.entries.push(url);
            this.ids.push(id);
        }
    }

    initMatrix() {
        this.refMatrix = new Matrix2D(this.entries.length);
    }

    addRef(fromURL, toURL) {
        if (this.refMatrix === undefined) {
            throw new Error('You should call initMatrix() before addRef()')
        } else {
            var fromID = this.entries.indexOf(fromURL);
            var toID = this.entries.indexOf(toURL);
            if ((fromID !== -1) && (toID !== -1)) {
                this.refMatrix.set(fromID, toID, 1);
            } else {
                throw new Error('One of the two URL has not been added to the entries');
            }
        }
    }

    getCoCitation(urlI, urlJ) {
        if (this.refMatrix === undefined) {
            throw new Error('No Matrix, No Ref, no Co-Citation !')
        } else {
            var iID = this.entries.indexOf(urlI);
            var jID = this.entries.indexOf(urlJ);
            if ((iID !== -1) && (jID !== -1)) {
                var iRow = this.refMatrix.row(iID);
                var jRow = this.refMatrix.row(jID);
                var cocitation = 0
                for (var i = 0; i < iRow.length; i++) {
                    cocitation = cocitation + iRow[i] * jRow[i];
                }
                return cocitation;
            } else {
                throw new Error('One of the two URL has not been added to the entries');
            }
        }
    }

    getCoupling(urlI, urlJ) {
        if (this.refMatrix === undefined) {
            throw new Error('No Matrix, No Ref, no Co-Citation !')
        } else {
            var iID = this.entries.indexOf(urlI);
            var jID = this.entries.indexOf(urlJ);
            if ((iID !== -1) && (jID !== -1)) {
                var iCol = this.refMatrix.column(iID);
                var jCol = this.refMatrix.column(jID);
                var coupling = 0
                for (var i = 0; i < iCol.length; i++) {
                    coupling = coupling + iCol[i] * jCol[i];
                }
                return coupling;
            } else {
                throw new Error('One of the two URL has not been added to the entries');
            }
        }
    }
}

class Matrix2D {
    constructor(size) {
        this.size = size;
        this.matrix = [];
        for (var i = 0; i < size; i++) {
            var row = [];
            for (var j = 0; j < size; j++) {
                row.push(0);
            }
            this.matrix.push(row);
        }
    }

    set(x, y, val) {
        this.matrix[x][y] = val;
    }

    get(x, y) {
        return this.matrix[x][y];
    }

    row(x) {
        return this.matrix[x];
    }

    column(y) {
        var result = [];
        for (var i = 0; i < this.size; i++) {
            result.push(this.matrix[i][y]);
        }
        return result;
    }

    saveCSV(filePath) {
        var csv = this.matrix.map(row => {
            return row.join(',');
        }).join('\r\n');
        fs.writeFile(filePath, csv);

    }
}


module.exports.CrossPageMetrics = CrossPageMetrics;
