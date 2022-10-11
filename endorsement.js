const repo = require("./repo.js");
const TAGS = require('./data/tags.json');
const CATEGORIES = require('./data/categories.json');

const START_COMMENT = "<!--START_SECTION:ENDORSEMENTS-->";
const END_COMMENT = "<!--END_SECTION:ENDORSEMENTS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);

var endorseUsers = [];

(async function main() {
  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0]// could be null
  const reactions = await repo.getReactions()
  try {
    let listWithFences = generateStuffInsideFences(reactions)
    if (listWithFences === oldFences) {
      console.log('✨ ENDORSEMENTS: NO CHANGE')
      return
    }
    let newContents = readme.content.replace(listReg, listWithFences)
    await repo.putReadme(newContents, '✨ Update endorsements')
  } catch (err) {
    console.error(err)
  }
})()

function generateUserImages(reactions) {
  let returnString = ''
  if(reactions.length > 0) {
    // returnString += ' endorsed by '
  }
  returnString += reactions.map((reaction) => generateUserImageLink(reaction.user)).join('')
  return returnString
}

/** Create hall of fame */
function generateEndorseHallOfFame(issues) {
  return issues.map(
    (issue) => issue.reactions.map(
      function (reaction) {
        let avatar = ''
        if(!endorseUsers.includes(reaction.user.login)) {
          endorseUsers.push(reaction.user.login)
          avatar = generateUserImageLink(reaction.user)
        }
        return avatar
      }
    ).join('')
  ).join('')
}

function generateUserImageLink(user) {
  return `[<img alt="${user.login}" src="${user.avatar_url}&s=28" width="28" height="28">](${user.html_url})`
}

function generateStuffInsideFences(data) {
  let endorseHallOfFameString = generateEndorseHallOfFame(data)

  data.map(function (x) {
    let key = x.title.replace(/[ ]/g, '_').toLowerCase()
    if(TAGS[key]) {
      TAGS[key]['endorsementCount'] = x.reactions.length
      TAGS[key]['endorsementImages'] = generateUserImages(x.reactions)
    } else {
      /** Endorsed not labeled and categorised yet */
      TAGS[key] = {
        issue: x.number,
        score: '',
        label: x.title,
        endorsementCount: x.reactions.length,
        description: '',
        color:'',
        logo: key,
        logoColor: '',
        endorsementImages: generateUserImages(x.reactions),
        issueUrl: x.url,
        promote: false
      }
      CATEGORIES['Other Endorsed']['tags'].push(key)
    }
  })

  let renderedList = '|    |    |\n|:---|---:|\n'
  // renderedList += data.map(function (x) {
  //   return `| [${generateBadge(x.title, x.reactions.length, )}](${x.url}) ${generateUserImages(x.reactions)} | [Endorse me!](${x.url}) |`
  // }).join("\n")

  Object.keys(CATEGORIES).forEach(function(key, index) {
    if(CATEGORIES[key].tags.length > 0) {
      renderedList += '| **' + CATEGORIES[key].label + '** |    |\n'
    }
    renderedList += CATEGORIES[key].tags.map(
        function(tag) {
          if(TAGS[tag.toLowerCase()]) {
            if(TAGS[tag.toLowerCase()].promote === true) {
              /** Show only promoted, skip minor tools and skills */
              return `| [${generateBadge(TAGS[tag.toLowerCase()].label, TAGS[tag.toLowerCase()].score + ' (' + TAGS[tag.toLowerCase()].endorsementCount + ')', TAGS[tag.toLowerCase()].color, TAGS[tag.toLowerCase()].logo)}](${TAGS[tag.toLowerCase()].issueUrl}) ${TAGS[tag.toLowerCase()].endorsementImages} | [Endorse me!](${TAGS[tag.toLowerCase()].issueUrl}) |\n`
            }
          } else {
            if(key !== 'Other') {
              CATEGORIES['Other']['tags'].push(tag)
            } else {
              return `| [${generateBadge(tag, '(0)')}](https://github.com/ma-si/ma-si/issues/new?assignees=ma-si&labels=endorsement&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE) | [Endorse me!](https://github.com/ma-si/ma-si/issues/new?assignees=ma-si&labels=endorsement&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE) |\n`
            }
          }
        }
    ).join('')
  })

  let categoriesString = ''
  Object.keys(CATEGORIES).forEach(function(key, index) {
    if(CATEGORIES[key].tags.length > 0) {
      categoriesString += '#### ' + CATEGORIES[key].label + '\n\n'
      categoriesString += CATEGORIES[key].tags.map(
        function(tag) {
          if(TAGS[tag.toLowerCase()]) {
            return '[![' + TAGS[tag.toLowerCase()].label + '](https://img.shields.io/badge/-' + tag.toLowerCase() + '-' + TAGS[tag.toLowerCase()].color + '?style=flat-square&logo=' + TAGS[tag.toLowerCase()].logo + '&logoColor=' + TAGS[tag.toLowerCase()].logoColor +')](' + TAGS[tag.toLowerCase()].issueUrl + ')'
          } else {
            if(key !== 'Other' && !CATEGORIES['Other']['tags'].includes(tag)) {
              CATEGORIES['Other']['tags'].push(tag)
            } else {
              return '`' + tag + '` '
            }
          }
        }
      ).join(' ')
      categoriesString += '\n'
    }
  })

  const listWithFences = `${START_COMMENT}
## ✨ SKILLS

${categoriesString}

## ✨ ENDORSEMENTS

${renderedList}

[Endorse new skill!](https://github.com/ma-si/ma-si/issues/new?assignees=&labels=endorsement&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE)

They have already endorsed my skills:

${endorseHallOfFameString}

${END_COMMENT}`
  return listWithFences
}

function generateBadge(label = '', message = '', color = 'default', logo = '', style = 'for-the-badge') {
  label = label.replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/([\r\n]+ +)+/gm, '')
  let altText = label
  label = label.replace(/[ ]/g, '_').toLowerCase()
  message = message.replace(/[ ]/g, '_')
  logo = logo.replace(/[_ ]/g, '-')
  return '![' + altText + '](https://img.shields.io/badge/' + label + '-' + message + '-' + color + '?style=' + style + '&logo='+ logo + ')'
}
