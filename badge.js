var generateBadge = function generateBadge(label = '', message = '', color = 'default', logo = '', style = 'for-the-badge') {
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

module.exports.generateBadge = generateBadge
