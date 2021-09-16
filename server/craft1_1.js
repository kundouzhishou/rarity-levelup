const dungeon_health = 10;
const dungeon_damage = 2;
const dungeon_to_hit = 3;
const dungeon_armor_class = 2;

class craft1_1 {
    health_by_class(_class) {
        if (_class == 1) {
            health = 12;
        } else if (_class == 2) {
            health = 6;
        } else if (_class == 3) {
            health = 8;
        } else if (_class == 4) {
            health = 8;
        } else if (_class == 5) {
            health = 10;
        } else if (_class == 6) {
            health = 8;
        } else if (_class == 7) {
            health = 10;
        } else if (_class == 8) {
            health = 8;
        } else if (_class == 9) {
            health = 6;
        } else if (_class == 10) {
            health = 4;
        } else if (_class == 11) {
            health = 4;
        }
        return health;
    } 

    health_by_class_and_level(_class, _level, _const) {
        let _mod = modifier_for_attribute(_const);
        let _base_health = health_by_class(_class) + _mod;
        if (_base_health <= 0) {
            _base_health = 1;
        }
        health = _base_health * _level;
        return health;
    }

    base_attack_bonus_by_class(_class) {
        if (_class == 1) {
            attack = 4;
        } else if (_class == 2) {
            attack = 3;
        } else if (_class == 3) {
            attack = 3;
        } else if (_class == 4) {
            attack = 3;
        } else if (_class == 5) {
            attack = 4;
        } else if (_class == 6) {
            attack = 3;
        } else if (_class == 7) {
            attack = 4;
        } else if (_class == 8) {
            attack = 4;
        } else if (_class == 9) {
            attack = 3;
        } else if (_class == 10) {
            attack = 2;
        } else if (_class == 11) {
            attack = 2;
        }
        return attack;
    }

    base_attack_bonus_by_class_and_level(_class, _level) {
        return _level * base_attack_bonus_by_class(_class) / 4;
    }

    modifier_for_attribute(_attribute) {
        if (_attribute == 9) {
            return -1;
        }
        return (_attribute - 10) / 2;
    }

    attack_bonus(_class, _str, _level) {
        return  Math.floor(base_attack_bonus_by_class_and_level(_class, _level)) + modifier_for_attribute(_str);
    }

    to_hit_ac(_attack_bonus) {
        return (_attack_bonus > dungeon_armor_class);
    }

    damage(_str) {
        _mod = modifier_for_attribute(_str);
        if (_mod <= 1) {
            return 1;
        } else {
            return _mod;
        }
    }

    armor_class(_dex) {
        return modifier_for_attribute(_dex);
    }

    scout(_summoner) {
        /*let _level = rm.level(_summoner);
        let _class = rm.class(_summoner);
        (uint32 _str, uint32 _dex, uint32 _const,,,) = _attr.ability_scores(_summoner);
        int _health = int(health_by_class_and_level(_class, _level, _const));
        int _dungeon_health = dungeon_health;
        int _damage = int(damage(_str));
        int _attack_bonus = attack_bonus(_class, _str, _level);
        bool _to_hit_ac = to_hit_ac(_attack_bonus);
        bool _hit_ac = armor_class(_dex) < dungeon_to_hit;
        if (_to_hit_ac) {
            for (reward = 10; reward >= 0; reward--) {
                _dungeon_health -= _damage;
                if (_dungeon_health <= 0) {break;}
                if (_hit_ac) {_health -= dungeon_damage;}
                if (_health <= 0) {return 0;}
            }
        }*/

        return reward;
    }

    adventure(_summoner) {
        /*
        require(block.timestamp > adventurers_log[_summoner]);
        adventurers_log[_summoner] = block.timestamp + DAY;
        reward = scout(_summoner);
        _mint(_summoner, reward);
        return reward;
        */
    }
}

module.exports = craft1_1