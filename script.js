const filters = {
    brightness: {
        value: 100,
        min: 0,
        max: 200,
        unit: "%"
    },
    contrast: {
        value: 100,
        min: 0,
        max: 200,
        unit: "%"
    },
    saturation: {
        value: 100,
        min: 0,
        max: 200,
        unit: "%"
    },
    hueRotation: {
        value: 0,
        min: 0,
        max: 360,
        unit: "deg"
    },
    blur: {
        value: 0,
        min: 0,
        max: 25,
        unit: "px"
    },
    grayscale: {
        value: 0,
        min: 0,
        max: 100,
        unit: "%"
    },
    sepia: {
        value: 0,
        min: 0,
        max: 100,
        unit: "%"
    },
    opacity: {
        value: 100,
        min: 0,
        max: 100,
        unit: "%"
    },
    invert: {
        value: 0,
        min: 0,
        max: 100,
        unit: "%"
    },
}

let createFilterElement = (name, unit, value, min, max) => {
    const div = document.createElement('div')
    div.classList.add('filters')

    const input = document.createElement('input')
    input.type = 'range'
    input.min = min
    input.max = max
    input.value = value
    input.id = name

    const p = document.createElement('p')
    p.textContent = name.charAt(0).toUpperCase() + name.slice(1)

    const valueSpan = document.createElement('span')
    valueSpan.id = `${name}-value`
    valueSpan.textContent = value + unit

    const header = document.createElement('div')
    header.classList.add('filter-header')
    header.append(p, valueSpan)

    div.append(header,input)
    
    input.addEventListener('input', () =>{
        filters[name].value = input.value
        valueSpan.textContent = input.value + unit
        applyFilters()
    })

    return div
}

const imageCanvas = document.querySelector('#image-canvas')
const imageInput = document.querySelector('#image-inp')
const canvasCTX = imageCanvas.getContext("2d")

const filterContainer = document.querySelector('.filter-options')

const reset = document.getElementById("reset-btn")
const download = document.getElementById("download-btn")

const bottom = document.querySelector('.bottom')
const dropOverlay = document.querySelector('.drop-overlay')

let file = null
let image = null
let originalImg = null

let activePreset = null

const crop = document.getElementById("crop-btn")
const applyCrop = document.getElementById("apply-crop-btn")
const cropBox = document.getElementById("crop-box")

let isCropping = false
let cropAction = null

let startX = 0
let startY = 0

let mouseX = 0
let mouseY = 0

const cropRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
}

function renderCropBox() {
    cropBox.style.left = cropRect.x + "px"
    cropBox.style.top = cropRect.y + "px"
    cropBox.style.width = cropRect.width + "px"
    cropBox.style.height = cropRect.height + "px"
}

function cancelCrop() {

    isCropping = false
    cropAction = null

    cropRect.x = 0
    cropRect.y = 0
    cropRect.width = 0
    cropRect.height = 0

    crop.textContent = "Crop"
    crop.style.backgroundColor = "var(--bg-active-color)"
    crop.style.color = "var(--text-active-color)"

    cropBox.style.display = "none"
    applyCrop.style.display = "none"

    imageCanvas.style.cursor = "default"
}

crop.addEventListener("click", () => {

    if (!image) return

    isCropping = !isCropping

    if (isCropping) {

        crop.textContent = "Cancel Crop"
        crop.style.backgroundColor = "var(--bg-danger-color)"
        crop.style.color = "#fff"

        imageCanvas.style.cursor = "crosshair"

    } else {
        cancelCrop()
    }
})

imageCanvas.addEventListener("mousedown", e => {
    if (!isCropping) return

    const rect = imageCanvas.getBoundingClientRect()
    const parent = bottom.getBoundingClientRect()

    startX = e.clientX - rect.left
    startY = e.clientY - rect.top

    cropRect.x = startX + rect.left - parent.left
    cropRect.y = startY + rect.top - parent.top

    cropRect.width = 0
    cropRect.height = 0

    cropAction = "draw"

    cropBox.style.display = "block"
    applyCrop.style.display = "none"

    renderCropBox()
})

cropBox.addEventListener("mousedown", e => {
    if (!isCropping) return

    mouseX = e.clientX
    mouseY = e.clientY

    if (e.target.classList.contains("handle")) {
        cropAction = e.target.classList[1]
    } else {
        cropAction = "move"
    }

    e.stopPropagation()
})

window.addEventListener("mousemove", e => {
    if (!cropAction) return

    const dx = e.clientX - mouseX
    const dy = e.clientY - mouseY

    if (cropAction === "draw") {

        const rect = imageCanvas.getBoundingClientRect()
        const parent = bottom.getBoundingClientRect()

        const x = Math.max( 0, Math.min(e.clientX - rect.left, rect.width) )
        const y = Math.max( 0, Math.min(e.clientY - rect.top, rect.height) )

        cropRect.x = Math.min(startX, x) + rect.left - parent.left
        cropRect.y = Math.min(startY, y) + rect.top - parent.top

        cropRect.width = Math.abs(x - startX)
        cropRect.height = Math.abs(y - startY)

        renderCropBox()
        return
    }

    if (cropAction === "move") {
        cropRect.x += dx
        cropRect.y += dy
    }

    if (cropAction === "se") {
        cropRect.width = Math.max(30, cropRect.width + dx)
        cropRect.height = Math.max(30, cropRect.height + dy)
    }

    if (cropAction === "sw") {
        cropRect.x += dx
        cropRect.width = Math.max(30, cropRect.width - dx)
        cropRect.height = Math.max(30, cropRect.height + dy)
    }

    if (cropAction === "ne") {
        cropRect.y += dy
        cropRect.width = Math.max(30, cropRect.width + dx)
        cropRect.height = Math.max(30, cropRect.height - dy)
    }

    if (cropAction === "nw") {
        cropRect.x += dx
        cropRect.y += dy
        cropRect.width = Math.max(30, cropRect.width - dx)
        cropRect.height = Math.max(30, cropRect.height - dy)
    }

    mouseX = e.clientX
    mouseY = e.clientY

    renderCropBox()
})

window.addEventListener("mouseup", () => {
    if (
        cropRect.width > 10 &&
        cropRect.height > 10
    ) {
        applyCrop.style.display = "inline-block"
    }

    cropAction = null
})

applyCrop.addEventListener("click", () => {
    if (!image) return

    const rect = imageCanvas.getBoundingClientRect()
    const parent = bottom.getBoundingClientRect()

    const scaleX = imageCanvas.width / rect.width
    const scaleY = imageCanvas.height / rect.height

    const sx = (cropRect.x - (rect.left - parent.left)) * scaleX
    const sy = (cropRect.y - (rect.top - parent.top)) * scaleY

    const sw = cropRect.width * scaleX
    const sh = cropRect.height * scaleY

    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")

    tempCanvas.width = sw
    tempCanvas.height = sh

    tempCtx.drawImage(imageCanvas,sx,sy,sw,sh,0,0,sw,sh)

    const newImg = new Image()

    newImg.onload = () => {
        image = newImg

        imageCanvas.width = sw
        imageCanvas.height = sh

        applyFilters()
        cancelCrop()
    }

    newImg.src = tempCanvas.toDataURL()
})

Object.keys(filters).forEach(key => {
    const f = filters[key]
    const filterElement = createFilterElement(key, f.unit, f.value, f.min, f.max)
    filterContainer.append(filterElement)
})

imageInput.addEventListener('change', (e) => {
    file = e.target.files[0]
    resetEditor()
    const imgPlaceholder = document.querySelector('.placeholder')
    imgPlaceholder.style.display = "none"
    imageCanvas.style.display = "block"
    const img = new Image()
    image = img
    originalImg = img
    img.src = URL.createObjectURL(file)
    img.onload = () => { 
        imageCanvas.width = img.width
        imageCanvas.height = img.height
        imageCanvas.style.width = ''
        imageCanvas.style.height = ''
        canvasCTX.drawImage(img,0,0)
    }
})

bottom.addEventListener('dragover', (e)=>{
    e.preventDefault()
    dropOverlay.classList.add('active')
})

bottom.addEventListener('dragleave', ()=>{
    dropOverlay.classList.remove('active')
})

bottom.addEventListener('drop', (e)=>{
    e.preventDefault()

    dropOverlay.classList.remove('active')

    file = e.dataTransfer.files[0]

    if(!file || !file.type.startsWith('image/')) return

    resetEditor()

    const imgPlaceholder = document.querySelector('.placeholder')
    imgPlaceholder.style.display = "none"

    imageCanvas.style.display = "block"

    const img = new Image()
    image = img
    originalImg = img

    img.src = URL.createObjectURL(file)

    img.onload = ()=>{
        imageCanvas.width = img.width
        imageCanvas.height = img.height
        imageCanvas.style.width = ''
        imageCanvas.style.height = ''
        canvasCTX.drawImage(img,0,0)
    }
})

function applyFilters(){
    if (!image) return

    canvasCTX.clearRect(0,0,imageCanvas.width,imageCanvas.height)

    canvasCTX.filter = `
    brightness(${filters.brightness.value}${filters.brightness.unit})
    contrast(${filters.contrast.value}${filters.contrast.unit})
    saturate(${filters.saturation.value}${filters.saturation.unit})
    hue-rotate(${filters.hueRotation.value}${filters.hueRotation.unit})
    blur(${filters.blur.value}${filters.blur.unit})
    grayscale(${filters.grayscale.value}${filters.grayscale.unit})
    sepia(${filters.sepia.value}${filters.sepia.unit})
    opacity(${filters.opacity.value}${filters.opacity.unit})
    invert(${filters.invert.value}${filters.invert.unit})
    `.trim()
    canvasCTX.drawImage(image,0,0)
}

const defaults = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotation: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 0
}

function resetEditor() {
    if (activePreset) {
        activePreset.classList.remove("active")
        activePreset = null
    }

    Object.keys(filters).forEach(k => {
        filters[k].value = defaults[k]

        const slider = document.getElementById(k)
        slider.value = defaults[k]

        const valueText = document.getElementById(`${k}-value`)
        valueText.textContent = defaults[k] + filters[k].unit
    })
}

reset.addEventListener('click', ()=>{
    if (!originalImg) return

    resetEditor()

    image = originalImg
    imageCanvas.width = originalImg.width
    imageCanvas.height = originalImg.height
    imageCanvas.style.width = ''
    imageCanvas.style.height = ''

    applyFilters()
})

download.addEventListener('click', ()=>{
    if (!image) return

    const link = document.createElement('a')
    link.download = 'Edited-image.png'
    link.href = imageCanvas.toDataURL()
    link.click()
})


const presets = {
    Normal: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotation: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 0
    },

    Vivid: {
        brightness: 110,
        contrast: 125,
        saturation: 150,
        hueRotation: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 0
    },

    GoldenHour: {
        brightness: 115,
        contrast: 110,
        saturation: 125,
        hueRotation: 15,
        blur: 0,
        grayscale: 0,
        sepia: 20,
        opacity: 100,
        invert: 0
    },

    Cinematic: {
        brightness: 95,
        contrast: 140,
        saturation: 85,
        hueRotation: 10,
        blur: 0,
        grayscale: 0,
        sepia: 15,
        opacity: 100,
        invert: 0
    },

    HDR: {
        brightness: 110,
        contrast: 170,
        saturation: 150,
        hueRotation: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 0
    },

    Portrait: {
        brightness: 108,
        contrast: 105,
        saturation: 115,
        hueRotation: 0,
        blur: 1,
        grayscale: 0,
        sepia: 5,
        opacity: 100,
        invert: 0
    },

    Moody: {
        brightness: 85,
        contrast: 145,
        saturation: 80,
        hueRotation: 10,
        blur: 0,
        grayscale: 10,
        sepia: 10,
        opacity: 100,
        invert: 0
    },

    Vintage: {
        brightness: 105,
        contrast: 95,
        saturation: 75,
        hueRotation: 15,
        blur: 0,
        grayscale: 5,
        sepia: 45,
        opacity: 100,
        invert: 0
    },

    Dreamy: {
        brightness: 120,
        contrast: 80,
        saturation: 125,
        hueRotation: 0,
        blur: 3,
        grayscale: 0,
        sepia: 8,
        opacity: 100,
        invert: 0
    },

    Noir: {
        brightness: 95,
        contrast: 180,
        saturation: 0,
        hueRotation: 0,
        blur: 0,
        grayscale: 100,
        sepia: 0,
        opacity: 100,
        invert: 0
    },

    Cyberpunk: {
        brightness: 105,
        contrast: 160,
        saturation: 180,
        hueRotation: 270,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 0
    },

    Negative: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotation: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 100
    }
}

const presetContainer = document.querySelector(".presets")

Object.keys(presets).forEach(presetName => {
    const presetButton = document.createElement("button")
    presetButton.classList.add("btn","preset-btn")
    presetButton.innerText = presetName
    presetContainer.append(presetButton)

    presetButton.addEventListener('click', ()=>{
        if (!image) return

        if(activePreset){
            activePreset.classList.remove('active')
        }

        presetButton.classList.add('active')
        activePreset = presetButton

        const pre = presets[presetName]

        Object.keys(pre).forEach(fname => {
            filters[fname].value = pre[fname]

            const slider = document.getElementById(fname)
            if (slider) slider.value = pre[fname]

            document.getElementById(`${fname}-value`).textContent = pre[fname] + filters[fname].unit
        })

        applyFilters()
    })
})