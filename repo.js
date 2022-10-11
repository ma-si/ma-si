const { Octokit } = require("@octokit/rest")
const REPO_DETAILS = {
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY_OWNER,
  per_page: 99,
}
const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` })

// async function getReadme (octokit: Octokit) {
var getReadme = async function getReadme() {
  const res = await octokit.repos.getReadme(REPO_DETAILS)
  const encoded = res.data.content
  const decoded = Buffer.from(encoded, "base64").toString("utf8")
  return {
    content: decoded,
    sha: res.data.sha,
  }
}

var putReadme = async function putReadme(content, message) {
  const res = await octokit.repos.getReadme(REPO_DETAILS)
  return octokit.repos.createOrUpdateFileContents({
    ...REPO_DETAILS,
    content: Buffer.from(content).toString("base64"),
    path: "README.md",
    message: message,
    sha: res.data.sha,
    branch: "master",
  })
}

var getReactions = async function getReactions() {
  let { data } = await octokit.issues.listForRepo({
    ...REPO_DETAILS,
    labels: 'endorsement'
  })
  // let { data } = await octokit.issues.listForRepo(REPO_DETAILS)
  // data = data
  //   .filter((x) => x.title.startsWith("Endorse: "))
  //   .map((x) => ({ ...x, title: x.title.slice(9) }))
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
  )
  data.sort((x, y) => (x.number > y.number ? 1 : -1));
  return data
}

var getRecommendations = async function getRecommendations() {
  let { data } = await octokit.issues.listForRepo({
      ...REPO_DETAILS,
      labels: 'recommendation'
  })
  data.sort((x, y) => (x.number > y.number ? 1 : -1));
  return data
}

var getEndorsements = async function getEndorsements() {
  let { data } = await octokit.issues.listForRepo(REPO_DETAILS)
  data = data
    .filter((x) => x.title.startsWith("Endorse: "))
    .map((x) => ({ ...x, title: x.title.slice(9) }))
  data = await Promise.all(
    data.map(async (x) => {
      return x;
    })
  )
  data.sort((x, y) => (x.number > y.number ? 1 : -1));
  return data
}

var listFollowersForRepositoryOwner = async function listFollowersForRepositoryOwner() {
  let { data } = await octokit.users.listFollowersForUser({username: process.env.GITHUB_REPOSITORY_OWNER})
  data.sort((x, y) => (x.number > y.number ? 1 : -1));
  return data
}

module.exports.getReadme = getReadme
module.exports.putReadme = putReadme
module.exports.getReactions = getReactions
module.exports.getRecommendations = getRecommendations
module.exports.getEndorsements = getEndorsements
module.exports.listFollowersForRepositoryOwner = listFollowersForRepositoryOwner
