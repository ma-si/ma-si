const repo = require("./repo.js");
const image = require("./image.js");

const START_COMMENT = "<!--START_SECTION:FAME-->";
const END_COMMENT = "<!--END_SECTION:FAME-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);

var fameUsers = [];

(async function main() {
  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0]// could be null

  try {
    let listWithFences = await generateStuffInsideFences()
    if (listWithFences === oldFences) {
      console.log('✨ FAME: NO CHANGE')
      return
    }
    let newContents = readme.content.replace(listReg, listWithFences)
    await repo.putReadme(newContents, '✨ FAME: UPDATE')
  } catch (err) {
    console.error(err)
  }
})()

/** Create hall of fame */
async function generateEndorseHallOfFame() {

  const reactions = await repo.getReactions()
  const endorsements = await repo.getEndorsements()
  const recommendations = await repo.getRecommendations()

  let hallOfFame = ''

  /* Add followers */
  hallOfFame = hallOfFame + await getUserFollowers()

  /* Add users from recommendations */
  hallOfFame = hallOfFame + '' + recommendations.map(
    function (recommendation) {
      let avatar = ''
      if(!fameUsers.includes(recommendation.user.login)) {
        fameUsers.push(recommendation.user.login)
        avatar = image.generateUserImageLink(recommendation.user)
      }
      return avatar
    }
  ).join('')

  /* Add users from endorsements */
  hallOfFame = hallOfFame + '' + endorsements.map(
    function (endorsement) {
      let endorsementResult = ''
      if(!fameUsers.includes(endorsement.user.login)) {
        fameUsers.push(endorsement.user.login)
          endorsementResult = image.generateUserImageLink(endorsement.user)
      }
      return endorsementResult
    }
  ).join('')

  /* Add users from endorsement reactions */
  hallOfFame = hallOfFame + '' + reactions.map(
    function (issue) {
      let issueResult= ''
      /* Add endorsement creator  */
      // if(!fameUsers.includes(issue.user.login)) {
      //   fameUsers.push(issue.user.login)
      //   issueResult = image.generateUserImageLink(issue.user)
      // }
      /* Add endorsement reaction creators */
      issueResult = issueResult + '' + issue.reactions.map(
        function (reaction) {
          let reactionResult = ''
          if(!fameUsers.includes(reaction.user.login)) {
            fameUsers.push(reaction.user.login)
            reactionResult = image.generateUserImageLink(reaction.user)
          }
          return reactionResult
        }
      ).join('')
      return issueResult
    }
  ).join('')

  return hallOfFame
}

async function generateStuffInsideFences() {
    let endorseHallOfFameString = await generateEndorseHallOfFame()
    return `${START_COMMENT}${endorseHallOfFameString}${END_COMMENT}`
}

async function getUserFollowers() {
    let followers = await repo.listFollowersForRepositoryOwner()

    return followers.map(
        function (follower) {
            let followerResult = ''
            if(!fameUsers.includes(follower.login)) {
                fameUsers.push(follower.login)
                followerResult = image.generateUserImageLink(follower)
            }
            return followerResult
        }
    ).join('')
}
