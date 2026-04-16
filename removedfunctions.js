function autocleanseTick(e, n, o) {
    if(!fe.autocleanse) return
    e = this.entity
    let cleanse = I.player.skills.skills.get(47)
    let buffIdsToCleanse = [
        101, // df
        50, // relent
        91, //ago
        88, //charge
        119, //blind
        121 // rel
    ]
    if(e.faction !== I.player.faction || $r(e.pos, I.player.pos) > 30 || I.player.class !== 3 || (cleanse && cleanse.cd.end > I.time) || e.id === I.playerId || e.party === 0) return
    for(let buff of Array.from(this.buffs)){
        //console.log(buff[0],e.name, cleanse.cd.end > I.time)
        if(buffIdsToCleanse.includes(buff[0]) || buff[0] === 69 && e.class === 2) {
            console.log(`Cleansing ${buff[0]} off of ${e.name}, ${e.id}`)
            let timeout = Math.floor(Math.random() * 800)
            //cleanse.cd.end += timeout / 60  
            setTimeout(this.sendCleanse,timeout,e)
            break
        }
    }
}

function nameplateST_VT(t, e, n) {
    let caster = e[0],
    skillId = e[1],
    castStart = e[2]
    target = e[3],
    casttimefinish = e[4],
    isSkill = e[5]

    caster = I.getEntityById(caster)
    let targets = Array.from(targettedPlayers,([id, casters]) => {
        return {id,casters}
    })
    let targetableSkillIds = new Set([54, 51])
    let currentTime = Date.now()
    let expiringCasts = Array.from(targettedPlayers,([id,casterArray]) => ({id,casterArray})).filter(target => target.casterArray.some(casterObject => currentTime > casterObject.expiryTime))

    if((skillId === 1 && e.length === 2) || (isSkill === 0 && targetableSkillIds.has(skillId))) {
        let isTargeting = targets.map(i => {
            let foundCast = i.casters.find(t => t.playerId === e[0])
            let indexOf = i.casters.indexOf(foundCast)
            if(indexOf === -1) return
            i.casters.splice(indexOf,1)
            //console.log(`removed cast by ${e[0]}, canceled: ${isSkill !== 0}`)
        })
    }

    if(fe.targetEnabled && isSkill && castStart > 100 && targetableSkillIds.has(skillId)) { //iceblockthing
        //if(caster.party === 0) return
        let targ = I.getEntityById(target)
        if(!targettedPlayers.get(target))targettedPlayers.set(target,[])
        let player = targettedPlayers.get(target)
        let playerObject = {playerId: e[0], expiryTime: currentTime + 4250}
        player.push(playerObject)
        //console.log(player[0],targettedPlayers)
        //console.log(`added ${skillId} by ${e[0]}`)
    }

    for(let target of expiringCasts) {
        let foundCast = target.casterArray.find(i => currentTime > i.expiryTime)
        let index = target.casterArray.indexOf(foundCast)
        if(index === -1) return
        target.casterArray.splice(index,1)
        //console.log(`removed cast by ${foundCast.playerId}, expired`)
    }
}