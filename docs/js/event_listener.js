// ================ Event Listener ================ //

'use strict'

window.addEventListener('load', function() {
    canvas.addEventListener('dragover', function(event) {
        event.preventDefault()
    })

    canvas.addEventListener('drop', function(event) {
        event.preventDefault()
        for (const file of event.dataTransfer.files) {
            if (!file || file.type.indexOf('image/') < 0)
                continue
            const image = new Image()
            image.src = URL.createObjectURL(file)
            image.addEventListener('load', () => paint(image))
        }
    })
})