const repo = require("./repo.js");
const image = require("./image.js");

const START_COMMENT = "<!--START_SECTION:RECOMMENDATIONS-->";
const END_COMMENT = "<!--END_SECTION:RECOMMENDATIONS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
const HEADER = '⭐ RECOMMENDATIONS';

(async function main() {
  let recommendations = await repo.getRecommendations()

  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0]// could be null
  try {
    let listWithFences = generateStuffInsideFences(recommendations)
    if (listWithFences === oldFences) {
      console.log(HEADER + ': NO CHANGE')
      return
    }
    let newContents = readme.content.replace(listReg, listWithFences)
    await repo.putReadme(newContents, HEADER + ': UPDATE')
  } catch (err) {
    console.error(err)
  }
})()

function generateStuffInsideFences(data) {
  let recommendationString = data.map(function (recommendation) {
    let returnString = ''
    returnString += '> ' + recommendation.body + '\n'
    returnString += '> ' + '\n'
    returnString += '> ' + image.generateUserImageLink(recommendation.user) + ' ' + recommendation.user.login + '\n'
    return returnString
  }).join('\n')

  return `${START_COMMENT}
${recommendationString}
${END_COMMENT}`
}
