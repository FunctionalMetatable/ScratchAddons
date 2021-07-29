export default async function ({ addon, global, console, msg }) {
    while (true) {
        let link = await addon.tab.waitForElement("a[href*='/users/']", { markAsSeen: true })
        let user = link.href.replace(/(.*)\/users\/((?:[a-z]|[A-Z]|[0-9]|-|_)+)\//g, '$2')
        
        const hovercard = document.createElement('div')
        hovercard.className = 'sa-hovercard'
        
        link.addEventListener("mouseover", (e) => {
            let hovercard = e.target.querySelector(".sa-hovercard")

            if (!hovercard.getAttribute('data-loaded')) {
                hovercard.innerHTML = ''
                hovercard.setAttribute('data-loaded', true)

                const left = document.createElement('div')
                left.className = 'sa-hovercard-left'

                const pfp = document.createElement('img')
                pfp.className = 'sa-hovercard-pfp'
                left.appendChild(pfp)

                const username = document.createElement('span')
                username.className = 'sa-hovercard-username'
                username.innerText = user
                left.appendChild(username)

                fetch(`https://api.scratch.mit.edu/users/${user}`).then(res => res.json()).then(res => {
                    pfp.src = res.profile.images['90x90']
                    hovercard.appendChild(left)
                })
            }
        })

        hovercard.innerText = 'Loading'
        link.appendChild(hovercard)
    }
}
