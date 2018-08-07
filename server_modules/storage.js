const MongoClient = require('mongodb').MongoClient,
    url = 'mongodb://localhost:27017/crTheater';
var collection
var database;

module.exports = {
    connect: () => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, (err, db) => {
                if (err) {
                    reject(err);
                }
                database = db;
                collection = database.collection('trackLights')
                resolve(true);
            })
        })
    },
    connected: () => {
        if (database) return true;
    },
    getPresets: (ref) => {
        let collection = database.collection('trackLights');
        return new Promise((resolve, reject) => {
            collection.find({
                "group": ref
            }).toArray((error, items) => {
                if (error) {
                    reject(error);
                }
                if (items) {
                    resolve(items);
                }
            })
        })
    },
    setPresets: (msg, cb) => {
        let collection = database.collection('trackLights');
        collection.updateOne({
            element: msg.element
        }, {
            $set: {
                values: msg.values,
                name: msg.name
            }
        }, (error, results) => {
            if (error) {
                cb(error)
            } else {
                cb(results.result)
            }
        })
    },
    recallPreset: (msg, cb) => {
        let collection = database.collection('trackLights')
        return new Promise((resolve, reject) => {
            collection.find({
                "element": msg
            }).toArray((error, items) => {
                if (error) {
                    reject(error);
                }
                if (items) {
                    resolve(items);
                }
            })
        })
    },
    trackLightLevels: (lights, cb) => {
        // console.log('storage module: trackLightLevels');
        // console.log(lights);
        
        let collection = database.collection('trackLights')
        collection.updateOne({
            element: 'currentValues'
        },
        {
            $set: {
                power: lights.power,
                values: lights.currentLevels
            }
        }, (error, results) => {
            if (error) {
                console.log(error)
                cb('error')
            } else {
                cb(results.result)
            }
        })
    } 
};
