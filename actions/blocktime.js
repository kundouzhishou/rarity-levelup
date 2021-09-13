const ethers = require('ethers')
const { provider } = require('../config/wallet')

var lastBlockTime = 0;
var lastLocalTime = 0;

const getBlockTime = async() => {
    if(lastBlockTime == 0) {
        let block = await provider.getBlock()
        lastBlockTime = block.timestamp
        lastLocalTime = Date.now() / 1000;
        console.log(`init block time, lastBlockTime = ${lastBlockTime}, lastLocalTime = ${lastLocalTime}`);
    }

    return Math.round(lastBlockTime + Date.now() / 1000 - lastLocalTime);
}

module.exports = getBlockTime;