var state;


module.exports = {
    prop1: (msg) => {
       return new Promise ((resolve, reject) => {
           if (!msg) {
               reject('error: no message');
            } else {
                state = msg + ' promise';
                resolve(state);
            }
       });
    }
};
