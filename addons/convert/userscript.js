export default async function ({ addon, global, console, msg }) {
    let username = await addon.auth.fetchUsername()
    async function createDropdown() {
        if (document.getElementById('sa-convert-btn')) return
        let button = document.createElement('div')
        button.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable')
        button.id = 'sa-convert-btn'
        let active = false
        button.addEventListener('click', e => {
            if (!e.target.closest('#sa-convert-btn')) return;

            table.style.display = table.style.display == 'block' ? 'none' : 'block'
            if (active) {
                button.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable')
                
                active = false
            } else {
                button.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable', 'menu-bar_active')
                active = true
            }
        })
        document.addEventListener('click', e => {
            if (e.target.closest('#sa-convert-btn')) return
            if (active) {
                button.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable')
                table.style.display = 'none'
                active = false
            }
        })

        let buttonInner = document.createElement('span')
        buttonInner.innerText = msg('button')
        button.appendChild(buttonInner)

        let dropdown = document.createElement('div')
        dropdown.className = addon.tab.scratchClass('menu-bar_menu-bar-menu')
        
        let table = document.createElement('ul')
        table.className = addon.tab.scratchClass('menu_menu', 'menu_right')
        table.style.display = 'none'

        function createDropdownItem(name, click) {
            let item = document.createElement('li')
            item.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable', 'menu_menu-section')

            let itemInner = document.createElement('span')
            itemInner.innerText = name
            item.appendChild(itemInner)

            item.addEventListener('click', () => window.open(click(addon.tab.redux.state.preview.projectInfo.id, username, addon.tab.redux.state.preview.projectInfo.title)))

            return item
        }

        table.appendChild(createDropdownItem('HTMLifier', (projectId, username, title) => `https://sheeptester.github.io/htmlifier/?title=${title}&id=${projectId}`))
        table.appendChild(createDropdownItem("LeapordJS (JavaScript)", (projectId) => `https://leapordjs.vercel.app/api/${projectId}/codesandbox`))
        table.appendChild(createDropdownItem("TurboWarp Packager", (projectId) => `https://packager.turbowarp.org/?id=${projectId}`))

        dropdown.appendChild(table)
        button.appendChild(dropdown)

        let menu = document.querySelector('[class*=menu-bar_file-group]')

        menu.appendChild(button)
    }

    if (addon.tab.editorMode == 'editor') {
        createDropdown()
    }

    addon.tab.addEventListener('urlChange', e => addon.tab.editorMode == 'editor' ? createDropdown() : "")
}
