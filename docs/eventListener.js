// ================================================== [50]
//     Definition

'use strict'

// ================================================== [50]
//     Drop Listener

document.addEventListener('DOMContentLoaded', drop, { passive: false })
function drop(event) {
    const dropArea = canvas
    
    // ドロップ要素にドラッグ中の要素が重なった時
    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault()
        // dropArea.classList.add('dragover')
        // e.dataTransfer.dropEffect = 'copy'
    })

    // ドロップ要素にドロップされた時
    dropArea.addEventListener('drop', function (e) {
        e.preventDefault()
        // dropArea.classList.remove('dragover')
        // e.dataTransfer.files に複数のファイルのリストが入っている
        // organize files
        for (const file of e.dataTransfer.files) {
            // if File_Type is not image
            if (!file || file.type.indexOf('image/') < 0) continue
            // File sise filter
            // if (1000*1000 < file.size) continue
            outputImage(file)
        }
    })
    
    // 画像の出力
    function outputImage(blob) {
        // File/BlobオブジェクトにアクセスできるURLを生成
        const blobURL = URL.createObjectURL(blob)
        const image = new Image()
        image.src = blobURL
        
        // 画像読み込み完了後
        image.addEventListener('load', function () {
            // File/BlobオブジェクトにアクセスできるURLを開放
            // URL.revokeObjectURL(blobURL)
            imageObject.image = image
            imageObject.width  = image.width
            imageObject.height = image.height
            fit()
        })
    }
}

// ================================================== [50]
//     END
// ================================================== [50]