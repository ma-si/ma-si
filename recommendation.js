const repo = require("./repo.js");
const RECOMMENDATIONS = require('./data/recommendations.json');

const START_COMMENT = "<!--START_SECTION:RECOMMENDATIONS-->";
const END_COMMENT = "<!--END_SECTION:RECOMMENDATIONS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
const HEADER = '⭐ RECOMMENDATIONS';

var recommendationUsers = [];

(async function main() {
  let recommendations = await repo.getRecommendations()

  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0]// could be null
  const data = [...recommendations, ...getData()]
  try {
    let listWithFences = generateStuffInsideFences(data)
    if (listWithFences === oldFences) {
      console.log(HEADER + ': NO CHANGE')
      return
    }
    let newContents = readme.content.replace(listReg, listWithFences)
    await repo.putReadme(newContents, '⭐ Update recommendations')
  } catch (err) {
    console.error(err)
  }
})()

function generateStuffInsideFences(data) {
  const recommendationHallOfFameString = '\n\n They have already gave me recommendation:\n\n' + generateRecommendationHallOfFame(data)
  let recommendationString = data.map(function (recommendation) {
    let returnString = ''
    returnString += '> ' + recommendation.body + '\n'
    returnString += '> ' + '\n'
    if(recommendation.user.id !== null) {
      returnString += '> ' + generateUserImageLink(recommendation.user) + ' ' + recommendation.user.login + '\n'
    } else {
      returnString += '> -- ' + recommendation.user.login + '\n'
    }
    return returnString
  }).join('\n')

  const listWithFences = `${START_COMMENT}
## ${HEADER}

${recommendationString}

[You can give me your own recommendation!](https://github.com/ma-si/ma-si/issues/new?assignees=ma-si&labels=recommendation&template=recommendation-template.md&title=Recommendation)

${recommendationHallOfFameString}
${END_COMMENT}`
  return listWithFences
}

/** Create hall of fame */
function generateRecommendationHallOfFame(issues) {
  let returnString = ''
  returnString += issues.map(function (issue) {
    let avatar = ''
    if(!recommendationUsers.includes(issue.user.login)) {
      recommendationUsers.push(issue.user.login)
      if(issue.id !== null) {
        avatar = generateUserImageLink(issue.user)
      }
    }
    return avatar
  }).join('')
  return returnString
}

function getData() {
  return RECOMMENDATIONS
}

function generateUserImageLink(user) {
  return `[<img alt="${user.login}" src="${user.avatar_url}&s=28" width="28" height="28">](${user.html_url})`
}
