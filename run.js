const summonerIds = require('./actions/summoners')
const Role = require("./actions/role");

const run = async() => {
    while(true) {
        console.log('start run ...');
        
        for (let i = summonerIds.length - 1; i >= 0; i--) {
            let id = summonerIds[i];
            let role = new Role(id);
            await role.initialize();
            await role.tryAdventure();
            // await role.trySpendBaseAttributes();
            await role.tryLevelUp();
            await role.tryCraftAdventure();
            await role.tryClaimGold();
            await role.tryClaimRar();
        }

        await new Promise(resolve => setTimeout(resolve, 10*60*1000));
    }
}

run();
