var generateUserImages = function generateUserImages(reactions) {
  return reactions.map((reaction) => generateUserImageLink(reaction.user)).join('')
}

var generateUserImageLink = function generateUserImageLink(user) {
  return `<a href="${user.html_url}"><img alt="${user.login}" src="${user.avatar_url}&s=28" width="28" height="28"></a>`
}

var generateUserImageMdLink = function generateUserImageLink(user) {
  return `[<img alt="${user.login}" src="${user.avatar_url}&s=28" width="28" height="28">](${user.html_url})`
}

module.exports.generateUserImages = generateUserImages
module.exports.generateUserImageLink = generateUserImageLink
