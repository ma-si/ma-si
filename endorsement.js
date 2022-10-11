const repo = require("./repo.js");
const image = require("./image.js");
const TAGS = require('./data/tags.json');
const CATEGORIES = require('./data/categories.json');

const START_COMMENT = "<!--START_SECTION:ENDORSEMENTS-->";
const END_COMMENT = "<!--END_SECTION:ENDORSEMENTS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
const HEADER = '✨ ENDORSEMENTS';

(async function main() {
  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0]// could be null
  const reactions = await repo.getReactions()
  try {
    let listWithFences = generateStuffInsideFences(reactions)
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
  data.map(function (x) {
    let key = x.title.replace(/[ ]/g, '_').toLowerCase()
    if(TAGS[key]) {
      TAGS[key]['endorsementCount'] = x.reactions.length
      TAGS[key]['endorsementImages'] = image.generateUserImages(x.reactions)
    } else {
      /** Endorsed not labeled and categorised yet */
      TAGS[key] = {
        issue: x.number,
        score: '',
        label: x.title,
        endorsementCount: x.reactions.length,
        description: '',
        color:'ffffff',
        logo: key,
        logoColor: 'black',
        endorsementImages: image.generateUserImages(x.reactions),
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

  const listWithFences = `${START_COMMENT}
${renderedList}
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
