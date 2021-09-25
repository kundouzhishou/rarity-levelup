pragma solidity 0.8.7;

interface IRarity {
    function adventure(uint _summoner) external;
    function level_up(uint _summoner) external;
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

interface IRarity_attributes{
    function point_buy(uint _summoner, uint32 _str, uint32 _dex, uint32 _const, uint32 _int, uint32 _wis, uint32 _cha) external;
}

interface IRarity_crafting{
     function adventure(uint _summoner) external returns (uint reward);
}

interface IRarity_gold{
     function claim(uint summoner) external;
}

contract RarityPlayer {
    IRarity rarity = IRarity(0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb);
    IRarity_attributes rarity_attributes = IRarity_attributes(0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1);
    IRarity_crafting rarity_craft1_1 = IRarity_crafting(0x2A0F1cB17680161cF255348dDFDeE94ea8Ca196A);
    IRarity_gold rarity_gold = IRarity_gold(0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2);

    function adventureALL(uint256[] calldata _ids) external {
        uint len = _ids.length;
        for (uint i = 0; i < len; i++) {
            rarity.adventure(_ids[i]);
        }
    }

    function levelUpALL(uint256[] calldata _ids) external {
        uint len = _ids.length;
        for (uint i = 0; i < len; i++) {
            rarity.level_up(_ids[i]);
        }
    }    
    
    function pointBuyALL(uint256[] calldata _ids, uint32 _str, uint32 _dex, uint32 _const, uint32 _int, uint32 _wis, uint32 _cha) external{
        uint len = _ids.length;
        for (uint i = 0; i < len; i++) {
            if (rarity.ownerOf(_ids[i]) == msg.sender){
                rarity_attributes.point_buy(_ids[i], _str, _dex, _const, _int, _wis, _cha);
            }
        }
    }
    
    function adventureCraftingALL(uint256[] calldata _ids) external {
        uint len = _ids.length;
        for (uint i = 0; i < len; i++) {
            rarity_craft1_1.adventure(_ids[i]);
        }
    }
    
    function claimGoldALL(uint256[] calldata _ids) external {
        uint len = _ids.length;
        for (uint i = 0; i < len; i++) {
            rarity_gold.claim(_ids[i]);
        }
    }
}