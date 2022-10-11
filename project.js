const repo = require("./repo.js")
const PROJECTS = require('./data/projects.json')

const START_COMMENT = "<!--START_SECTION:PROJECTS-->"
const END_COMMENT = "<!--END_SECTION:PROJECTS-->"
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
const HEADER = '💼 PROJECTS';

(async function main() {
  const readme = await repo.getReadme()
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0] // could be null
  const data = await getData()
  try {
    let listWithFences = generateStuffInsideFences(data, readme.content)
    if (listWithFences === oldFences) {
      console.log(HEADER + ': NO CHANGE')
      return 
    }
    let newContents = readme.content.replace(listReg, listWithFences)
    await repo.putReadme(newContents, '💼 Update projects')
  } catch (err) {
    console.error(err)
  }
})()

function generateStuffInsideFences(data) {
  const renderedList = data.map((x) =>
    '### ' + x.name + ' | ' + x.client + '\n\n' +
    x.roles.map((role) => '_' + role + '_').join(" | ") +
    ' (' + x.startDate + '-' + x.endDate + ')\n\n' +
    ''.concat( (x.description === undefined || x.description === '') ? '' : x.description + '\n\n') +
    x.responsibilities.map((responsibility) => '- ' + responsibility).join("\n") + '\n\n' +
    ''.concat( (x.tags === undefined || x.tags.length === 0) ? '' : x.tags.map((tag) => '`' + tag + '`').join(" ") + '\n\n') +
    ''.concat( (x.gallery === undefined) ? '' : x.gallery.map((img) => '![' + img.description + '](' + img.url + ')\n' + img.description + '').join("\n\n") + '\n\n')
  ).join("\n\n")

  const listWithFences = `${START_COMMENT}
## ${HEADER}

${renderedList}
${END_COMMENT}`

  return listWithFences
}

async function getData() {
  return PROJECTS
}
