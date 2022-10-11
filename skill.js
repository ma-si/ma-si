const repo = require("./repo.js");
const image = require("./image.js");
const TAGS = require('./data/tags.json');
const CATEGORIES = require('./data/categories.json');

const START_COMMENT = "<!--START_SECTION:SKILLS-->";
const END_COMMENT = "<!--END_SECTION:SKILLS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
const HEADER = '✨ SKILLS';

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
${categoriesString}
${END_COMMENT}`
  return listWithFences
}
