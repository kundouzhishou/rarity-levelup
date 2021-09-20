require('dotenv').config()
const ethers = require('ethers')
const contracts = require('../config/contracts')
const getBlockTime = require('./blocktime');

const rarityContractAddress = contracts.rarity
const attributesContractAddress = contracts.attributes
const goldContractAddress = contracts.gold;
const craft1_1ContractAddress = contracts.craftingAdventure1_1;
const rarContractAddress = contracts.rar_token;

const rarityAbi = require('../abis/rarity.json')
const attributesAbi = require('../abis/rarity_attributes.json')
const goldAbi = require('../abis/rarity_gold.json')
const craft1_1Abi = require('../abis/rarity_crafting_1-1.json')
const rarAbi = require('../abis/rar_token.json');


const { provider, nonceManager } = require('../config/wallet')
const { log, error } = require('./utils')

const rarityContract = new ethers.Contract(rarityContractAddress, rarityAbi, provider)
const writeRarityContract = rarityContract.connect(nonceManager);
const attributesContract = new ethers.Contract(attributesContractAddress, attributesAbi, provider)
const writeAttributesContract = attributesContract.connect(nonceManager);
const goldContract = new ethers.Contract(goldContractAddress, goldAbi, provider)
const writeGoldContract = goldContract.connect(nonceManager);
const craft1_1Contract = new ethers.Contract(craft1_1ContractAddress, craft1_1Abi, provider)
const writeCraft1_1Contract = craft1_1Contract.connect(nonceManager);
const rarContract = new ethers.Contract(rarContractAddress, rarAbi,provider);
const writeRarContract = rarContract.connect(nonceManager);

const { checkClass, baseAttributes } = require('./classes')

let jsoning = require('jsoning')
const db_role = new jsoning(`./db/role.json`);
const rule = require('./rule')

class Role {
    constructor(id) {
        this.id = id;
        this.adventurers_log = 0;
        this.craft1_1_log = 0;
    }

    async initialize() {
        let existed = await db_role.has(this.id.toString());
        if(existed){
            let data = await db_role.get(this.id.toString());
            this.adventurers_log = data["adventurers_log"];
            this.craft1_1_log = data.hasOwnProperty("craft1_1_log") ? data["craft1_1_log"] : 0;
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
            await response.wait();

            log('adventure', this.id, `Adventure successfull!`); 
        
            //clear and get new time at next time
            this.adventurers_log = 0;
            await this._save_to_db();
        }catch(e) {
            error('adventure', this.id, `Could not send the tx: ${e}`)
        }
    }

    async tryLevelUp() {
        let currentLevel = await rarityContract.level(this.id);
        let xpRequired = rule.xp_required(currentLevel);
        let currentXp = await rarityContract.xp(this.id);
        currentXp = ethers.utils.formatUnits(currentXp, 18);
        if(currentXp >= xpRequired) {
            try {
                let response = await writeRarityContract.level_up(this.id)
                await response.wait()
                log('levelUp', this.id, `Level up succesfull, cur_level=${currentLevel},cur_xp=${currentXp},need_xp=${xpRequired}`)  
            }catch(err) {
                error('levelUp', this.id, err);
            }
        }else {
            // log('levelUp', this.id, `Did not need to level up, , cur_level=${currentLevel},cur_xp=${currentXp},need_xp=${xpRequired}`)
        }
    }

    async trySpendBaseAttributes() {
        let summonerClass = await checkClass(this.id)
        let level = await rarityContract.level(this.id);
        let abilityPoints = baseAttributes[summonerClass]
        let characterCreated = await attributesContract.character_created(this.id)
        if(characterCreated) {
            log('point_buy',this.id,`already spent base points`);
            return;
        }

        if(level.gt(1)) {
            log('point_buy',this.id,`Not level 1, current level: ${currentLevel}, try to buy ...`);
            // return;
        }

        try {
            let response = await writeAttributesContract.point_buy(
                this.id,
                abilityPoints.strength,
                abilityPoints.dexterity,
                abilityPoints.constitution,
                abilityPoints.intelligence,
                abilityPoints.wisdom,
                abilityPoints.charisma,
            )
            await response.wait()
            log('point_buy', this.id, `Attribute Point Buy successfull!`)
        } catch (err) {
            error('point_buy', this.id, `Could not send the tx: ${err}`)
        }
    }

    async tryCraftAdventure() {
        let now = await getBlockTime();

        if(this.craft1_1_log > now) {
            log('craft1_1', this.id, `Not yet time to craft1_1 adventure. now:${now}, next time:${this.craft1_1_log}, left:${this.craft1_1_log - now}`);
            return;
        }

        try {
            let log_data = await craft1_1Contract.adventurers_log(this.id);
            let log_time = ethers.BigNumber.from(log_data).toNumber();

            if(log_time > now) {
                this.craft1_1_log = log_time;
                await this._save_to_db();
                log('craft1_1', this.id, `update craft1_1 adventure time, next time:${this.craft1_1_log}, left:${this.craft1_1_log - now}`);
                return;
            }

            let rewards = await craft1_1Contract.scout(this.id);
            if(!rewards.gt(ethers.BigNumber.from(0))) {
                log('craft1_1', this.id, `scout failed with 0 reward`);
                return;
            }

            let response = await writeCraft1_1Contract.adventure(this.id);
            await response.wait();

            log('craft1_1', this.id, `Adventure successfull!, got ${rewards} rewards`); 
        
            //clear and get new time at next time
            this.craft1_1_log = 0;
            await this._save_to_db();
        }catch(e) {
            error('craft1_1', this.id, `Could not send the tx: ${e}`)
        }
    }

    async tryClaimGold() {
        try {
            let amount = await goldContract.claimable(this.id);
            if(amount.gt(0)) {
                let response = await writeGoldContract.claim(this.id);
                await response.wait();
                log('gold',this.id, `Gold claimed ${ethers.utils.formatUnits(amount, 18)} successfully`)
            }
        }catch(err) {
            error('gold', this.id, err);
        }
    }

    async tryClaimRar() {
        try {
            let amount = await writeRarContract.claimable(this.id);
            if(amount && amount.gt(0)) {
                let response = await writeRarContract.claim(this.id);
                await response.wait();
                log('rar',this.id, `RAR claimed ${ethers.utils.formatUnits(amount, 18)} successfully`);
            }else {
                log('rar', this.id, `No RAR to claim or already claimed`);
            }
        }catch(err) {
            error('rar',this.id, err);
        }
    }

    async calculateGasPrice() {
        let gasPriceData = await provider.getGasPrice();
        let gasPrice = ethers.BigNumber.from(gasPriceData.toString()).toNumber() / (10**9);
        return Math.floor(gasPrice);
    }

    async _save_to_db() {
        // console.log("save to db ...");
        let data = {};
        data["adventurers_log"] = this.adventurers_log;
        data["craft1_1_log"] = this.craft1_1_log;
        
        await db_role.set(this.id.toString(), data);
    }
}

module.exports = Role;