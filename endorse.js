// from https://github.com/JasonEtco/readme-guestbook/blob/master/api/submit-form.ts
const { Octokit } = require("@octokit/rest");

// todo: use readme-box instead if it no-ops nicely
// const { ReadmeBox } = require('readme-box')


const REPO_DETAILS = {
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY_OWNER,
  per_page: 99,
};

const TECH = require('./data/tags.json');

const START_COMMENT = "<!--START_SECTION:ENDORSEMENTS-->";
const END_COMMENT = "<!--END_SECTION:ENDORSEMENTS-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);

// console.log({ REPO_DETAILS });

const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` });
(async function main() {
  const readme = await getReadme(octokit);
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0] // could be null
  const data = await getReactions();
  try {
    let listWithFences = generateStuffInsideFences(data, readme.content);
    if (listWithFences === oldFences) {
      console.log('NO CHANGE detected in the endorsements, skipping commit')
      return 
    }
    let newContents = readme.content.replace(listReg, listWithFences);
    await octokit.repos.createOrUpdateFileContents({
      ...REPO_DETAILS,
      content: Buffer.from(newContents).toString("base64"),
      path: "README.md",
      message: `✨ Endorsements ${new Date().toISOString()}`,
      sha: readme.sha,
      branch: "master",
    });
  } catch (err) {
    console.error(err);
  }
})();

/**
 *
 */
function generateStuffInsideFences(data) {
  //console.log("COUNT ENDORSEMENTS: ", data.length);
  const renderedList = data
    .map(
      (x) =>
        `[${
          generateBadge(
            x.title
              .replace(/<style[^>]*>.*<\/style>/gm, '')
              // Remove script tags and content
              .replace(/<script[^>]*>.*<\/script>/gm, '')
              // Remove all opening, closing and orphan HTML tags
              .replace(/<[^>]+>/gm, '')
              // Remove leading spaces and repeated CR/LF
              .replace(/([\r\n]+ +)+/gm, '')
            ,
            x.reactions.length
          )
        }](${x.url}) ${x.reactions
          .map(
            (reaction) => `![${reaction.user.login}](${reaction.user.avatar_url}&s=28)` // use github image api s=20 to size smaller
          )
          .join("")
        } [Endorse me!](${x.url})`
    )
    .join("\n\n");

  const listWithFences = `${START_COMMENT}
  ## ✨ SKILLS & ENDORSEMENTS
  
  I would like to add you to my professional network on the GITHUB.
  To endorse my skills click below & pick your reaction under the skill \`Endorse: ...\` issue or [Create new one!](https://github.com/ma-si/ma-si/issues/new?assignees=&labels=endorsement&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE).
  
  ${renderedList}
  
  [Endorse new skill!](https://github.com/ma-si/ma-si/issues/new?assignees=&labels=endorsement&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE)
  ${END_COMMENT}`;
  return listWithFences
}

function generateBadge(badgeTitle, badgeNumber, badgeStyle = 'for-the-badge') {
  let badgeColor = 'default';
  let badgeLogo = badgeTitle.replace(/[_ ]/g, '-');
  let badgeAlt = badgeTitle;
  let badgeLabel = badgeTitle.replace(/[ ]/g, '_');
  if(TECH[badgeTitle] != null){
    console.log(TECH[badgeTitle]);
    badgeNumber = TECH[badgeTitle].score + "_(" + badgeNumber + ")";
    badgeColor = TECH[badgeTitle].color;
    badgeLogo = TECH[badgeTitle].logo;
    badgeAlt = TECH[badgeTitle].label;
  }
  return '![' + badgeAlt + '](https://img.shields.io/badge/' + badgeLabel + '-' + badgeNumber + '-' + badgeColor + '?style=' + badgeStyle + '&logo='+ badgeLogo + ')'
}

// async function getReadme (octokit: Octokit) {
async function getReadme(octokit) {
  const res = await octokit.repos.getReadme(REPO_DETAILS);
  const encoded = res.data.content;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  return {
    content: decoded,
    sha: res.data.sha,
  };
}

async function getReactions() {
  let { data } = await octokit.issues.listForRepo(REPO_DETAILS);
  data = data
    .filter((x) => x.title.startsWith("Endorse: "))
    .map((x) => ({ ...x, title: x.title.slice(9) }));
  data = await Promise.all(
    data.map(async (x) => {
      const reaction = await octokit.reactions.listForIssue({
        ...REPO_DETAILS,
        issue_number: x.number,
      });
      return {
        title: x.title,
        url: x.html_url,
        number: x.number,
        reactions: reaction.data, // an array of USER
      };
    })
  );
  return data; // custom object
}
