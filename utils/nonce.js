require('dotenv').config()
const { provider } = require('../config/wallet');

var baseNonce = -1;
const getNonce = async () => {
    if(baseNonce == -1) {
        baseNonce = await provider.getTransactionCount(process.env.PUBLIC_KEY, "pending");
    }
    baseNonce ++;
    return baseNonce;
}

module.exports = getNonce;