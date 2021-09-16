rule = exports

rule.xp_required = function(current_level) {
    let xp_to_next_level = current_level * 1000;
    for (let i = 1; i < current_level; i++) {
        xp_to_next_level += i * 1000;
    }
    return xp_to_next_level;
}