let data = {
  date: '2018/02/12',
  extra: {
    pickUpData: {
      "location": "STOCKTON, CA, US"
    },
    contactData: [
      {
        usera: 'usera'
      },
      {
        userb: 'userb'
      }
    ]
  }
}

function buildNodes(data, node, key) {
  console.log('key', key)
  if (!node) {
    node = document.createElement('div')
    node.setAttribute('key', 'root')
  } else {
    node.setAttribute('key', key)
  }
  for (let key in data) {
    if (typeof data[key] === 'string') {
      let childNode = document.createElement('div')
      childNode.setAttribute('key', key)
      childNode.innerHTML = (`<span>${key}:</span><span>${data[key]}</span>`)
      node.appendChild(childNode)
    } else if (Array.isArray(data[key])) {
      let childNode = document.createElement('div')
      childNode.setAttribute('key', key)
      data[key].forEach(item => {
        node.appendChild(buildNodes(item, childNode, key))
      })
    } else {
      let childNode = document.createElement('div')
      childNode.setAttribute('key', key)
      node.appendChild(buildNodes(data[key], childNode, key))
    }
  }
  return node
}

buildNodes(data)