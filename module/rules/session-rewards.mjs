/** Calculate the session's rewards and division remainders from plain data. */
export function calculateSessionRewards(session) {
  const pcNum = Number(session.pcnum);

  const gamel =
    Number(session.mission.gamel) +
    Number(session.middle.gamel);
  const keepGamel = gamel % pcNum;
  const getGamel = Math.floor((gamel - keepGamel) / pcNum);

  let getExp =
    Number(session.mission.exp) +
    Number(session.middle.exp);

  const abyss = Number(session.middle.abyss);
  const keepAbyss = abyss % pcNum;
  const getAbyss = Math.floor((abyss - keepAbyss) / pcNum);
  const getTresure = Number(session.middle.tresure);

  const getSword = Number(session.middle.sword);

  let getHonor = Number(session.mission.honor);
  return { getGamel, keepGamel, getExp, getAbyss, keepAbyss, getTresure, getSword, getHonor };
}

/** Add the rolled sword-shard reward to the existing honor total. */
export function addSwordShardHonor(honor, swordTotal) {
  return honor + Number(swordTotal);
}
