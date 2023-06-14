// ================ Separator ================ //

'use strict'

window.addEventListener('load', function() {
    const horizontal_Containers = document.getElementsByClassName('horizontal-container')
    const   vertical_Containers = document.getElementsByClassName(  'vertical-container')
    const horizontal_ChildrenList = []
    const   vertical_ChildrenList = []
    const staticList = function(arg_list) {
        const list = []
        for (const node of arg_list)
            list.push(node)
        return list
    }
    for (const container of horizontal_Containers)
        horizontal_ChildrenList.push( staticList(container.children) )
    for (const container of vertical_Containers)
        vertical_ChildrenList.push( staticList(container.children) )

    // ======== Add Separator ======== //
    let prev, next, direction = undefined
    for (const children of horizontal_ChildrenList)
        for (let i = 0; i < children.length - 1; i++) {
            const separator = document.createElement('div')
            children[i].after(separator)
            separator.classList = 'separator vertical-separator'
            separator.addEventListener('mousedown', function(event) {
                prev = children[ i ]
                next = children[i+1]
                direction = 'horizontal'
            })
        }
    for (const children of vertical_ChildrenList)
        for (let i = 0; i < children.length - 1; i++) {
            const separator = document.createElement('div')
            children[i].after(separator)
            separator.classList = 'separator horizontal-separator'
            separator.addEventListener('mousedown', function(event) {
                prev = children[ i ]
                next = children[i+1]
                direction = 'vertical'
            })
        }

    // ======== Set style flex-grow ======== //
    for (const childrenList of [horizontal_ChildrenList, vertical_ChildrenList])
    for (const children of childrenList)
    for (const child of children)
        child.style.flex = '1 0 0'

    for (const children of horizontal_ChildrenList) {
        const array = []
        for (const child of children)
            array.push(child.clientWidth)
        for (let i = 0; i < children.length; i++)
            children[i].style.flex = array[i] + ' 0 0'
    }
    for (const children of vertical_ChildrenList) {
        const array = []
        for (const child of children)
            array.push(child.clientHeight)
        for (let i = 0; i < children.length; i++)
            children[i].style.flex = array[i] + ' 0 0'
    }

    // ======== Add Event Listener ======== //
    document.body.addEventListener('mouseup'   , function(event) { direction = undefined })
    document.body.addEventListener('mouseleave', function(event) { direction = undefined })
    document.body.addEventListener('mousemove' , function(event) {
        if (direction === 'horizontal' && event.buttons === 1) {
            const dx = event.movementX
            const width1 = prev.clientWidth + dx
            const width2 = next.clientWidth - dx
            prev.style.flexGrow = width1
            next.style.flexGrow = width2
        }
        if (direction === 'vertical' && event.buttons === 1) {
            const dy = event.movementY
            const height1 = prev.clientHeight + dy
            const height2 = next.clientHeight - dy
            prev.style.flexGrow = height1
            next.style.flexGrow = height2
        }
    })

    // ======== Container Resize Observer ======== //
    for (let i = 0; i < horizontal_Containers.length; i++)
        new ResizeObserver(function(mutations) {
            const array = []
            for (const child of horizontal_ChildrenList[i])
                array.push(child.clientWidth)
            for (let j = 0; j < array.length; j++)
                horizontal_ChildrenList[i][j].style.flexGrow = array[j]
        }).observe(horizontal_Containers[i], { attributes: true })
    for (let i = 0; i < vertical_Containers.length; i++)
        new ResizeObserver(function(mutations) {
            const array = []
            for (const child of vertical_ChildrenList[i])
                array.push(child.clientHeight)
            for (let j = 0; j < array.length; j++)
                vertical_ChildrenList[i][j].style.flexGrow = array[j]
        }).observe(vertical_Containers[i], { attributes: true })
})