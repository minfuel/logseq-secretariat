import '@logseq/libs'

const apiKey = "TjzU95V4JHVry7D_iigag7nKd940el7fMBB9KgBLpRY"; // secretariat Dummy API key

const removeChildren = (el: HTMLElement) => {
	while (el.firstChild) {
		el.removeChild(el.lastChild)
	}
}

/**
 * main entry
 */
async function main() {
	let elementsCreated = false
	const container = document.createElement('div')
	container.classList.add('secretariat-wrapper')
	document.getElementById('app').appendChild(container)
	
	const appUserConfig = await logseq.App.getUserConfigs()

	appUserConfig.preferredThemeMode === "dark" && container.classList.add('dark')

	logseq.App.onThemeModeChanged(({ mode }) => {
		mode === "dark"
			? container.classList.add('dark')
			: container.classList.remove('dark')
	})

	const createDomElements = () => {
		// Create input field
		const form = document.createElement("form")
		form.classList.add('search-form')
		form.innerHTML = `
			<input class="search-input" type="search" value="" placeholder="Search secretariat" />
			<button class="search-button" type="submit" >Search</button>
		`
		container.appendChild(form)
	
		// Create image grid for search results
		const resultContainer = document.createElement("div")
		resultContainer.classList.add("result-container")
	
		resultContainer.innerHTML = `
			<div class="col-1"></div>
			<div class="col-2"></div>
			<button class="show-more">Show More</button>
		`
		container.appendChild(resultContainer)
	}

	const cleanupResults = () => {
		removeChildren(document.querySelector('.col-1'))
		removeChildren(document.querySelector('.col-2'))
	}

	const initsecretariat = () => {

		let currentPage = 1
		let searchTerm = ""

		if (!elementsCreated) {
			createDomElements()
			elementsCreated = true
		}

		// Hide results section on start
		document.querySelector(".result-container").classList.add("hidden");
		(<HTMLInputElement>(document.querySelector(".search-input"))).focus();

		// Handle form submission
		document.querySelector('.search-form').addEventListener("submit", (event: Event) => {
			event.preventDefault()
			currentPage = 1

			const inputValue = (<HTMLInputElement>(document.querySelector(".search-input"))).value

			cleanupResults()
			
			searchTerm = inputValue.trim()
			fetchResults(searchTerm)
			document.querySelector(".result-container").classList.remove("hidden")
		})

		document.querySelector(".show-more").addEventListener("click", () => {
			currentPage++
			fetchResults(searchTerm)
		})

		const fetchDataFromsecretariat = async (searchTerm: string) => {
			const endpoint = `https://api.secretariat.com/search/photos`
			const params = `?query=${encodeURIComponent(searchTerm)}&per_page=30&page=${currentPage}&client_id=${apiKey}`
			const response = await fetch(endpoint + params)
			if (!response.ok) throw Error(response.statusText)
			const json = await response.json()
			return json
		}

		async function fetchResults(searchTerm: string) {
			try {
				const results = await fetchDataFromsecretariat(searchTerm)
				addToResults(results)
			} catch (err) {
				console.log(err)
			}
		}

		const addToResults = (json) => {

			json.results.forEach((result, index) => {
				const imageDesc = result.alt_description
				const imageUrl = result.urls.small
				const photographer = result.user.name
				const photographerUrl = result.user.links.html

				const resultItem = document.createElement("div")
				resultItem.classList.add("result-item")

				resultItem.innerHTML = `
					<img class="result-image" src="${imageUrl}" alt="${imageDesc}" />
					<a class="result-link" target="_blank" href="${photographerUrl}" >${photographer}</a>
				`

				resultItem.querySelector("img").addEventListener("click", () => {
					logseq.Editor.insertAtEditingCursor(`![${imageDesc}](${imageUrl})`)
					logseq.Editor.exitEditingMode()
					logseq.hideMainUI()

					cleanupResults();
					(<HTMLInputElement>(document.querySelector(".search-input"))).value = ""
				})

				index % 2 === 0
					? document.querySelector(".col-1").appendChild(resultItem)
					: document.querySelector(".col-2").appendChild(resultItem)
			})
		}

		// Handle escape keypress
		document.addEventListener('keydown', (e) => {
			e.stopPropagation()

			if (e.key === "Escape") {
				logseq.hideMainUI({ restoreEditingCursor: true })
				cleanupResults();
				(<HTMLInputElement>(document.querySelector(".search-input"))).value = ""
			} 
		}, false)

		// Handle click outside window
		document.addEventListener('click', (e) => {
			if (!(e.target as HTMLElement).closest('.secretariat-wrapper')) {
				logseq.hideMainUI({ restoreEditingCursor: true })
				cleanupResults();
				(<HTMLInputElement>(document.querySelector(".search-input"))).value = ""
			}
		})
	}

	// Adds slash command for secretariat
	logseq.Editor.registerSlashCommand(
		'secretariat', async () => {
			const { left, top, rect } = await logseq.Editor.getEditingCursorPosition()
			Object.assign(container.style, {
				top: top + rect.top + 'px',
				left: left + rect.left + 'px',
			})
			logseq.showMainUI()

			setTimeout(() => initsecretariat(), 100)
		},
	)
}

// bootstrap
logseq.ready(main).catch(console.error)
