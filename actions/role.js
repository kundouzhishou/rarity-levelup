require('dotenv').config()
const ethers = require('ethers')
const contracts = require('../config/contracts')
const getBlockTime = require('./blocktime');

const rarityContractAddress = contracts.rarity
const rarityAbi = require('../abis/rarity.json')

const { provider, nonceManager } = require('../config/wallet')
const { log, error } = require('./utils')

const rarityContract = new ethers.Contract(rarityContractAddress, rarityAbi, provider)
const writeRarityContract = rarityContract.connect(nonceManager);

let jsoning = require('jsoning')
const db_role = new jsoning(`./db/role.json`);

class Role {
    constructor(id) {
        this.id = id;
        this.adventurers_log = 0;
    }

    async initialize() {
        let existed = await db_role.has(this.id.toString());
        if(existed){
            let data = await db_role.get(this.id.toString());
            this.adventurers_log = data["adventurers_log"];
        }
    }

    async tryAdventure() {
        let now = await getBlockTime();

        if(this.adventurers_log > now) {
            log('adventure', this.id, `Not yet time to adventure. now:${now}, next time:${this.adventurers_log}, left:${this.adventurers_log - now}`);
            return;
        }

        try {
            let log_data = await rarityContract.adventurers_log(this.id);
            let log_time = ethers.BigNumber.from(log_data).toNumber();

            if(log_time > now) {
                this.adventurers_log = log_time;
                await this._save_to_db();
                log('adventure', this.id, `update adventure time, next time:${this.adventurers_log}, left:${this.adventurers_log - now}`);
                return;
            }

            let response = await writeRarityContract.adventure(this.id);
            // dont to wait for confirmation
            await response.wait();

            log('adventure', this.id, `Adventure successfull!`); 
        
            //clear and get new time at next time
            this.adventurers_log = 0;
            await this._save_to_db();
        }catch(e) {
            error('adventure', this.id, `Could not send the tx: ${err}`)
        }
    }

    async _save_to_db() {
        // console.log("save to db ...");
        let data = {};
        data["adventurers_log"] = this.adventurers_log;
        
        await db_role.set(this.id.toString(), data);
    }
}

module.exports = Role;
/*
async() => {
    let now = await getBlockTime();
    console.log(now);
}
*/