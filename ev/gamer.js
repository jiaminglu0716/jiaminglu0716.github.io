/**
 * Data Routes
 */
const GAMER = {
  types: {
    Game: new LinkGroupDict()
      .add(new LinkGroup()
        .setName('Sony')
        .setCNName('索尼')
        .add(new LinkItem('PSV', '/data/gamer/psv_all.json', 'PSV'))
        .add(new LinkItem('PSP', '/data/gamer/psp.json', 'PSP'))
        .add(new LinkItem('PS1', '/data/gamer/ps1.json', 'PS1'))
        .add(new LinkItem('PS2', '/data/gamer/ps2jp.json', 'PS2'))
        .add(new LinkItem('PS3', '/data/gamer/ps3.json', 'PS3')))
      .add(new LinkGroup()
        .setName('Nintendo')
        .setCNName('任天堂')
        .add(new LinkItem('3DS', '/data/gamer/3ds.json', '3DS'))
        .add(new LinkItem('NDS', '/data/gamer/nds.json', 'NDS'))
        .add(new LinkItem('GBA', '/data/gamer/gba.json', 'GBA'))
        .add(new LinkItem('WII', '/data/gamer/wii.json', 'WII'))
        .add(new LinkItem('NEW 3DS', '/data/gamer/3dsnew.json', '3DSNEW')))
      .add(new LinkGroup()
        .setName('Microsoft')
        .setCNName('任微软')
        .add(new LinkItem('XBOX', '/data/gamer/xbox.json', 'XBOX'))
        .add(new LinkItem('XBOX360', '/data/gamer/xbox360.json', 'XBOX360')))
      .add(new LinkGroup()
        .setName('Microsoft')
        .setCNName('任微软')
        .add(new LinkItem('XBOX', '/data/gamer/xbox.json', 'XBOX'))
        .add(new LinkItem('XBOX360', '/data/gamer/xbox360.json', 'XBOX360'))),
    Resource: new LinkGroupDict()
      .add(new LinkGroup()
        .setName('GameLib')
        .setCNName('游戏库')
        .add(new LinkItem('PSVTSV', '/data/resource/psvgames.tsv', 'PSVTSV'))
        .add(new LinkItem('PSPTSV', '/data/resource/pspgames.tsv', 'PSPTSV'))
        .add(new LinkItem('Nyaa', '/data/resource/nyaa_mikocon.json', 'NYAAMIKOCON'))),
    Galgame: new LinkGroupDict()
      .add(new LinkGroup()
        .setName('Galgame')
        .setCNName('Galgame')
        .add(new LinkItem('YMGAL', '/data/galgame/ymgal-cards.json', 'YMGAL'))),
  }
}

const MESSAGE = {
  kwl: new Number(0),
  type: new String('Game'),
  keyword: new String(),
  groups: new Array(),
  data: new Array(),
  results: new Array(),
  features: new Array('name', 'cn_name')
}

/**
 * Methods
 */
function search(keyword, data, defaultKeys=new Array()) {
  // extract kw
  class FilterItem {
    constructor(key, value) {
      this.key = key;
      this.value = value;
    }
  }

  let filters = new Array();
  let keywords = new Array();

  keyword.split(' ').forEach(key => {
    let idx = key.indexOf(':');
    key = key.toLowerCase();
    if (idx > -1) {
      filters.push(new FilterItem(
        key.slice(0,idx),
        key.slice(idx+1)
      ));
    } else {
      keywords.push(key);
    }
  });

  // console.log(keywords, filters);

  // ex data file
  function obj2str(item, keys, sign='/') {
    let strArr = new Array();
    keys.forEach(key => strArr.push(item[key]));
    return strArr.join(sign);
  }

  function match(str, mstr) {
    return str.indexOf(mstr) > -1;
  }

  function boolArrReduce(arr) {
    return arr.reduce((p, c) => p & c);
  }


  let results = new Array();

  for (let item of data) {
    let s = obj2str(item, defaultKeys).toLowerCase();
    let ks = keywords.map(key => match(s, key));
    let fs = filters.map(filter => match(item[filter.key].join('/'), filter.value));
    
    if (
      (fs.length > 0 && ks.length == 0 && boolArrReduce(fs)) ||
      (fs.length == 0 && ks.length > 0 && boolArrReduce(ks)) ||
      (fs.length > 0 && ks.length > 0 && boolArrReduce(fs) && boolArrReduce(ks))
    ) {
      results.push(item);
    }
  }
  
  return results;      
}

/**
 * Page Index
 */
class GamerPageApp {
  constructor() {
    new Vue({
      el: '#app',
      data: { gamer: GAMER, message: MESSAGE, text: 'Gamer' },
      async mounted() {
        await this.init();
      },
      methods: {
        async init() {
          // Init data
          await this.initData();
          // Set default, and u can ban it.
          await this.$set(this.message, 'results', search("伊苏", this.message.data, this.message.features));
        },
        async initData() {
          let groupDict = this.gamer.types[this.message.type];
          await this.$set(this.message, 'groups', groupDict.lib);
          let item = groupDict.query(Object.keys(groupDict.lib)[0]).list[0]
          await this.loadData(item.value, item.link)
        },
        getList(link) {
          return $.ajax(link);
        },
        updateGroupList() {
          this.clearGroupList();
          let groupDict = this.gamer.types[this.message.type];
          this.$set(this.message, 'groups', groupDict.lib);
          let keys = Object.keys(groupDict.lib);
          if (keys.length > 0) {
            let item = groupDict.query(keys[0]).list[0];
            this.loadData(item.value, item.link);
          }
        },
        changeType(event) {
          this.$set(this.message, 'type', event.target.value);
          this.updateGroupList();
        },
        loadDataEvent(event) {
          // event.target.value -> string
          let [ value, link ] = event.target.value.split('|');
          this.loadData(value, link);
        },
        clearData() {
          this.$set(this.message, 'data', new Array());
        },
        clearGroupList() {
          this.$set(this.message, 'groups', new Array());
        },
        clearResults() {
          this.$set(this.message, 'results', new Array());
        },
        async loadData(value, link) {
          // Clear result list
          this.clearResults();
          // Get data from api
          let message = await this.getList(link);
          // to dto list
          switch (this.message.type) {
            case 'Game':
              message = await new YL2000DataLoader(value, message.content).toSearchList(); break;
            case 'Resource':
              message = await this.loadResourceData(value, message); break;
            case 'Galgame':
              message = await new GalgameCardDataLoader(value, message).toSearchList(); break;
            default:
              message = await new YL2000DataLoader(value, message.content).toSearchList();

          }
          // Set data
          this.$set(this.message, 'data', message);
        },
        async loadResourceData(value, message) {
          
          // console.log('MSG1', value, message)
          if (value.indexOf('TSV') > -1) {
            message = await new TSVReader(message);
            message = message.values;
          }
          // console.log('MSG', value, message)
          // console.log('SL', new ResourceDataLoader(value, message).toSearchList())
          return new ResourceDataLoader(value, message).toSearchList();
        },
        searchFilter() {
          let keyword = this.message.keyword;
          
          // ban backward search
          if (keyword.length < this.kwl) {
            this.$set(this.message, 'kwl', keyword.length);
            return false;
          }
          // ban start step below 2
          if (keyword.length < 2) return false;
  
          return true;
        },
        searchData() {
          if (this.searchFilter())
            this.$set(this.message, 'results', 
              search(this.message.keyword, this.message.data, this.message.features));
        }
      }
    });
  }
}