let fetch = require('node-fetch')
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'covid19';

let sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

let fetch_and_insert_data = () => {
  return new Promise((resolve, reject) => {
    fetch('https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv')
    .then(res => res.text())
    .then((body) => {
      let states_arr = body.split('\n')
      , states_table = {}
      , date = new Date()
      , iso = date.toISOString()
      , y = iso.substring(0,4)
      , m = iso.substring(5,7)
      , d = iso.substring(8,10)
      , date_int = y+''+m+''+d

      for (state in states_arr) {
        let state_partition = states_arr[state].split(',')
        let insert_obj = {
          name : state_partition[0],
          range : state_partition[1],
          cases_reported : state_partition[2],
          community_transmission : state_partition[3],
          url : state_partition[4],
          date : date_int
        }
        if (insert_obj.name !== '' && insert_obj.name !== 'Name') states_table[insert_obj.name] = insert_obj
      }

      let insert_arr = []
      for (x in states_table) { insert_arr.push(states_table[x]) }

      // Use connect method to connect to the server
      MongoClient.connect(url, function(err, client) {
        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const collection = db.collection('states');

        collection.insertMany(insert_arr, function(err, result) {
          console.log("Inserted documents into the collection");
        });
        resolve()
        client.close();
      });
    });
  })
}

let main = async () => {
  await fetch_and_insert_data() // get data, store in db
  await sleep(((1000 * 60)*60)*24) // sleep 24 hrs
}
