function objNameStd(name) {
    return name.replaceAll(' ', '_').toLowerCase();
}

class PSVGameTSVReader {
    constructor(data) {
        this.columes = new Array();
        this.values = new Array();
        // transfer to line data
        let lines = data;
        if (typeof data == 'string')
            lines = data.split('\r\n');

        lines.forEach((line, idx) => {
            let temp = line.split('\t');

            if (idx == 0) {
                this.columes = temp;
                return;
            }

            let [ id, region, name, pkg, link, zrif, contID, 
                LMDate, oriname, size, sha256, version ] = temp;

            this.values.push({
                id, region, name, pkg, link, zrif, contID, 
                LMDate, oriname, size, sha256, version
            });
        });

        this.length = this.values.length;
    }
}

class TSVReader {
    constructor(data) {
        this.columes = new Array();
        this.titles = new Array();
        this.values = new Array();
        // transfer to line data
        let lines = data;
        if (typeof data == 'string')
            lines = data.split('\n');

        // console.log('TSVLEN', lines.length, typeof lines, lines)
        lines.forEach((line, idx) => {
            let temp = line.split('\t');

            if (idx == 0)
                this.columes = temp.map(val => objNameStd(val));

            let item = new Object();

            temp.forEach((val, idx) => {
                item[this.columes[idx]] = val;
            });

            idx == 0 ? this.titles = item : this.values.push(item);
        });

        this.length = this.values.length;
    }
}