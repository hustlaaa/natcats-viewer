let natcats = []
let filtered_natcats = []
let natcats_result = []
let filter_choices = []

const itemsPerPage = 1000

const filterForm = document.querySelector('#filter-form')
const filterChoices = document.querySelector('#filter-choices')
const filteredAmount = document.querySelector('#filtered-amount')
const result = document.querySelector('#result')
let mscribe_listings = []

let numberOfPages = 10
let currentPage = 1

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
})

let params_natcats = params && params.natcats ? params.natcats.split(',') : []

const get_listings = async () => {
    const myHeaders = new Headers()
    myHeaders.append('Accept', 'application/json')
    myHeaders.append('Cache-Control', 'no-cache')
    myHeaders.append('Connection', 'keep-alive')
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Pragma', 'no-cache')
    myHeaders.append('Sec-Fetch-Dest', 'empty')
    myHeaders.append('Sec-Fetch-Mode', 'cors')
    myHeaders.append('Sec-Fetch-Site', 'same-origin')
    
    const raw = JSON.stringify({
        'limit': 1000,
        'offset': 0,
        'search_text': 'NATCATS',
        'latest': 1,
        'price_range': [
            null,
            null
        ],
        'listing_type': 3,
        'access_token': 'EJGHPQVL4PDM2G6KB8YKLEDYXZS5L4F7'
    })

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    }
    
    return fetch('https://mscribe.io/api/listings/list', requestOptions)
}

const setActivePage = page => {
    // reset all active states first
    document.querySelectorAll('.page-item').forEach(item=>{
        item.classList.remove('active')
    }
    )
    // add active state to current page
    document.querySelectorAll(`.page-link[href="#${page}"]`).forEach(item=>{
        item.parentNode.classList.add('active')
    }
    )
}

const showItems = page => {
    const startIndex = (page - 1) * itemsPerPage
    const itemsToShow = natcats_result.slice(startIndex, startIndex + itemsPerPage)

    let html = '<ul>'

    itemsToShow.forEach(item => {
        let { id, name, attributes, for_sale = false, price = 0 } = item
        html += `
            <li title="${name}">
                <div class="natcat">
                    <img class="pixel-image" src="./img/${id}.png" data-bs-toggle="modal" data-bs-target="#modal" data-natcat-id="${id}">
                    <span class="h6"><a href="./img/${id}.png" target="_blank">${id}</a></span>

                    ${for_sale ? `<div class="for-sale">For Sale<br />${price.toFixed(3)} BTC</div>` : ''}
                </div>
            </li>`
    })

    html += '</ul>'

    result.innerHTML = html

    setActivePage(page)
}

const setAmount = () => {
    filteredAmount.innerHTML = `Result: ${natcats_result.length} Natcats`

    if(params_natcats.length) {
        filteredAmount.innerHTML += ` <button id="remove_preselected" class="btn btn-danger ms-3">show all natcats</button>`

        document.querySelector('#remove_preselected').addEventListener('click', e => {
            e.preventDefault()

            params_natcats = []
            window.history.pushState('', '', `?natcats=`)

            filtered_natcats = natcats
            natcats_result = natcats

            makeFilter()
        })
    }

    updatePaginationNav()
}

const selectFilter = (name, value) => {
    if(value === '') {
        delete filter_choices[name]

        // also reset listed checkbox
        document.querySelector('#filter-for-sale').checked = false
    } else {
        filter_choices[name] = value
    }

    filtered_natcats = natcats

    document.querySelector('#search').value = ''

    // remove them all
    filterChoices.innerHTML = ''

    Object.keys(filter_choices).forEach(key => {
        let value = filter_choices[key]

        filtered_natcats = filtered_natcats.filter(n => {
            let match = n.attributes.filter(a => a.trait_type === key && a.value === value)

            return match.length
        })

        filterChoices.innerHTML += 
            `<span class="badge text-bg-light m-1">
                ${key}: ${value}
                <i class="ms-1 remove-filter bi bi-x-square-fill" data-key="${key}" data-value="${value}"></i>
            </span>`
    })

    natcats_result = filtered_natcats

    document.querySelectorAll('.remove-filter').forEach(item => item.addEventListener('click', e => {
        const el = e.target

        selectFilter(el.getAttribute('data-key'), '')
    }))

    makeFilter()
}

const updatePaginationNav = () => {
    numberOfPages = Math.ceil(natcats_result.length / itemsPerPage)

    let html = `<nav aria-label="Page navigation">
                    <ul class="pagination text-center">
                        <li class="page-item disabled">
                            <a class="page-link" href="#prev">Previous</a>
                        </li>`
    
    for(let i=1; i<=numberOfPages; i++) {
        html += `<li class="page-item">
            <a class="page-link" href="#${i}">${i}</a>
        </li>`
    }                    
        
    html += `<li class="page-item ${numberOfPages === 1 ? "disabled" : ""}">
                <a class="page-link" href="#next">Next</a>
            </li>
        </ul>
    </nav>`

    document.querySelectorAll('.pagination-nav').forEach(nav => {
        nav.innerHTML = html
    })

    document.querySelectorAll('.page-link').forEach(item=>{
        item.addEventListener('click', event=>{
            event.preventDefault();
    
            const page = event.target.getAttribute('href').replace('#', '')
    
            if (page === 'prev') {
                currentPage--
            } else if (page === 'next') {
                currentPage++
            } else {
                currentPage = parseInt(page)
            }
    
            document.querySelectorAll('.page-link[href="#prev"]').forEach(item=>{
                item.parentNode.classList[currentPage === 1 ? 'add' : 'remove']('disabled')
            }
            )
            document.querySelectorAll('.page-link[href="#next"]').forEach(item=>{
                item.parentNode.classList[currentPage === numberOfPages ? 'add' : 'remove']('disabled')
            }
            )
    
            showItems(currentPage)
        }
        )
    }
    )    
}

const setupEventHandlers = () => {
    document.querySelector('#search').addEventListener("keyup", (e) => {
        if (e.isComposing || e.keyCode === 229) {
          return;
        }

        natcats_result = filtered_natcats.filter(n => n.id.toString().includes(document.querySelector('#search').value))
        setAmount()
        showItems(1)
    })

    document.querySelector('#filter-for-sale').addEventListener("change", (e) => {
        if(e.target.checked) {
            natcats_result = filtered_natcats
                .filter(n => n.for_sale)
                .sort((a, b) => a.price - b.price)

            setAmount()
            showItems(1)    
        } else {
            natcats_result = filtered_natcats
            setAmount()
            showItems(1) 
        }
    })
}

const makeFilter = () => {
    const keys = []
    const options = []

    filterForm.innerHTML = ''
    result.innerHTML = 'Loading data..'
    let filterFormHTML = ''

    if(mscribe_listings.length) {
        filterFormHTML += `<div class="row g-3 mb-2 align-items-center">
            <label for="mscribe_listings" class="col-sm-4 col-form-label text-start">Mscribe Listings</label>
            <div class="col-sm-8">
                <select class="form-select" id="mscribe_listings" aria-label="Default select example">
                    <option value="">- all -</option>
                    <option value="true">- all -</option>
                    <option value="">- all -</option>
                </select>
            </div>
        </div>`
    }

    natcats[0].attributes.forEach(attr => {
        keys.push(attr.trait_type)

        if(!['inscription_number', 'magic_eden_link'].includes(attr.trait_type)) {
            filterFormHTML += `<div class="row g-3 mb-2 align-items-center">
                <label for="${attr.trait_type}" class="col-sm-4 col-form-label text-start">${attr.trait_type}</label>
                <div class="col-sm-8">
                    <select class="form-select" id="${attr.trait_type}" aria-label="Default select example">
                        <option value="">- all -</option>
                    </select>
                </div>
            </div>`
        }
    })

    filterForm.innerHTML = filterFormHTML

    filtered_natcats.forEach(cat => {
        cat.attributes.forEach(attr => {
            let f = options.filter(v => v.key === attr.trait_type)

            if(f.length) {
                let val = f[0].values.filter(v => v.value === attr.value)
                
                if(val.length) {
                    val[0].count = val[0].count + 1
                } else {
                    f[0].values.push({
                        value: attr.value,
                        count: 1
                    })
                }
            } else {
                options.push({
                    key: attr.trait_type,
                    values: [{
                        value: attr.value,
                        count: 1
                    }]
                })
            }
        })
    })

    options.forEach(a => {
        if(!['inscription_number', 'magic_eden_link'].includes(a.key)) {
            a.values.forEach(b => {

                let has_filter_choice = !!Object.keys(filter_choices).filter(key => {
                    let value = filter_choices[key]

                    return key === a.key && value === b.value
                }).length

                document.querySelector(`#${a.key}`).innerHTML += `<option ${has_filter_choice ? 'selected' : ''} value="${b.value}">${b.value} (${b.count})</option>`
            })
        }
    })

    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', e => {
            let name = e.target.getAttribute('id')
            let value = e.target.value === "true" ? true : e.target.value === "false" ? false : e.target.value

            if(value !== '') {
                selectFilter(name, value)
            } else {
                filtered_natcats = natcats

                selectFilter(name, value)
            }

            setAmount()
            showItems(1)        
        })
    })

    setAmount()
    showItems(1)
}

const setupModal = () => {
    try {
        const modal = document.getElementById('modal')
        if (modal) {
            modal.addEventListener('show.bs.modal', event => {
                const img = event.relatedTarget
                const catId = parseInt(img.getAttribute('data-natcat-id'), 10)
                const cat = natcats.find(c => c.name === `Natcat #${catId}`)

                if(cat) {
                    const {
                        attributes,
                        name,
                        for_sale = false,
                        price = 0
                    } = cat

                    const modalTitle = modal.querySelector('.modal-title')
                    const modalBody = modal.querySelector('.modal-body')

                    let html = '<div class="row">'
                    html += '<div class="col-12 col-md-4 mb-4 mb-md-0">'
                    html += `<img src="./img/${catId}.png" style="width: 100%" />`

                    html += '<div class="d-grid gap-2 pt-3">'
                    html += `<a href="${attributes.find(a => a.trait_type === 'magic_eden_link').value}" target="_blank" class="btn btn-magiceden">View on MagicEden</a>`
                    if(for_sale) {
                        html += `<a href="https://mscribe.io/marketplace" target="_blank" class="btn btn-warning">Listed at ${price.toFixed(3)} BTC<br />on Mscribe (select "UNAT")</a>`
                    }
                    html += '</div>'

                    html += '</div>'

                    html += '<div class="col-12 col-md-8">'
                    html += `<table class="table table-striped"><tbody>`

                    attributes.forEach(attr => {
                        const { trait_type, value } = attr

                        if(!['magic_eden_link'].includes(trait_type) && ![false, null].includes(value)) {
                            html += `<tr><td>${trait_type}</td><td>${value}</td></tr>`
                        }
                    })

                    html += '</tbody></table>'

                    html += '</div>'

                    html += '</div>'
                    modalTitle.textContent = `${name}`
                    modalBody.innerHTML = html
                }
            })
        }                
    } catch(e) {
        console.log(e)
    }
}

const init = async () => {
    try {
        natcats = await fetch('./traits.json?ts=1708880751776').then(res=>res.json()).catch(e=>console.log(e))

        try {
            let listings = await get_listings().then(response => response.json())

            if(listings.success) {
                mscribe_listings = listings.data

                natcats.forEach(n => {
                    const { id } = n
                    const listing = mscribe_listings.filter(m => m.json.blk === id.toString())

                    if(listing.length) {
                        n.for_sale = true
                        n.price = parseInt(listing[0].seller_price, 10) / (10 ** 8)
                    } else {
                        n.for_sale = false
                    }
                })
            }
        } catch(e) {
            console.log(e)
        }

        if(params_natcats.length) {
            filtered_natcats = natcats.filter(n => params_natcats.includes(n.id.toString()))
        } else {
            filtered_natcats = natcats
        }

        natcats_result = filtered_natcats


        makeFilter()
        setupEventHandlers()

        // load first page by default
        showItems(currentPage)

        setupModal()
    } catch(e) {
        console.log(e)
    }
}

init()