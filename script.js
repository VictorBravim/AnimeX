const firebaseConfig = {
    apiKey: "AIzaSyB5ZAtw7K5-i7Lbsr1Lg8uQXVyxZjbkuvM",
    authDomain: "anime-x-lista.firebaseapp.com",
    projectId: "anime-x-lista",
    storageBucket: "anime-x-lista.appspot.com",
    messagingSenderId: "712102156874",
    appId: "1:712102156874:web:cdc5b9afc9492cf779e4b3",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let myAnimeList = [];

const list = document.getElementById("list")

let searchResults = []
const resultList = document.querySelector("#resultList")
const mainHTML = document.querySelector("html")
const body = document.querySelector("body")
const fixedAddButton = document.querySelector("#addbuttonatbottom")

checkLocalStorage();

async function getListFromFirestore() {
    list.innerHTML = "";
    try {
        const doc = await db.collection('animes').doc('lista').get();
        if (doc.exists) {
            const data = doc.data();
            const myAnimeListFromFirestore = data.lista;

            myAnimeListFromFirestore.forEach((animeFromFirestore) => {
                const existingIndex = myAnimeList.findIndex(anime => anime.id === animeFromFirestore.id);
                if (existingIndex === -1) {
                    myAnimeList.push(animeFromFirestore);
                } else {
                    myAnimeList[existingIndex] = animeFromFirestore;
                }
            });

            if (myAnimeListFromFirestore.length === 0) {
                fixedAddButton.classList.add("d-none");
                let emptyPageTemplate = `
                    <div class="blank-page-cover">
                        <div class="display-3 fw-bold text-light-emphasis">AnimeX</div>
                        <p class="lead text-light-emphasis fw-bold">Adicione aqui algum anime</p>
                        <button class="btn btn-info col-6 col-sm-4 col-md-2" data-bs-toggle="modal" data-bs-target="#addAnimeModal">
                            <i class="fa-solid fa-plus"></i> Add Anime
                        </button>
                    </div>
                `;
                list.insertAdjacentHTML("beforeend", emptyPageTemplate);
            } else {
                fixedAddButton.classList.remove("d-none");

                let animeCount = document.querySelector("#animeCount");
                animeCount.innerText = myAnimeListFromFirestore.length;

                let localData = localStorage.getItem("myAnimeList");
                let localAnimeList = localData ? JSON.parse(localData) : [];

                function renderAnimeBatch(startIndex, batchSize) {
                    for (let i = startIndex; i < Math.min(startIndex + batchSize, myAnimeListFromFirestore.length); i++) {
                        const anime = myAnimeListFromFirestore[i];

                        let status = {};
                        if (anime.watched === anime.episodes) {
                            status.text = "Completo";
                            status.class = "text-orange fw-bold";
                            status.color = "text-orange";
                        } else if (anime.watched > 0 && anime.watched < anime.episodes) {
                            status.text = "Assistido";
                            status.class = "text-assistido";
                            status.color = "";
                        } else {
                            status.text = "Não Assistido";
                            status.class = "text-secondari";
                            status.color = "";
                        }

                        let oldIndex = localAnimeList.findIndex((list) => list.id === anime.id);

                        let li = `
                        <section class="list-item " id="${anime.id}">
                        <div class="position-relative rounded-3 d-flex flex-sm-column shadow overflow-hidden" style="background-color:#ffffff11;border:2px solid transparent">
                            <div class="col-4 col-sm-12 position-relative" loading="lazy" style="background-image:url('${anime.image}');background-size: cover; aspect-ratio:2/3">
                                <div class="anime-name-oncover d-none d-sm-block">${anime.name}</div>
                            </div>
                            <div class="col-8 col-sm-12 d-flex flex-column justify-content-between bg-black">
                                <div class="text-center">
                                    <div class="anime-name d-block py-2 p-2 d-sm-none">${anime.name}</div>
                                </div>
                                <ul class="list-group list-group-flush">
                                <li class="list-group-item bg-black">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="${status.class} small"><i class="fa-regular fa-eye d-none d-sm-inline"></i> ${status.text}</div>
                                            <div class="d-flex justify-content-between align-items-center">
                                            <button type="button" onclick="countDown(${anime.id})" class="btn btn-lg1 border" aria-label="Diminuir contador"><i class="fa-solid fa-minus"></i></button>
                                            <span class="px-2 fw-bold fs-2 watched-count">${anime.watched}</span>
                                            <button type="button" onclick="countUp(${anime.id})" class="btn btn-lg2 border" aria-label="Aumentar contador"><i class="fa-solid fa-plus"></i></button>
                                            </div>
                                        </div>
                                    </li>
                                    <li class="list-group-item bg-black">
                                        <div class="d-flex justify-content-between text-secondari">
                                            <div class="small"><i class="fa-solid fa-bell d-none d-sm-inline"></i> Episódios</div>
                                            <div>${anime.episodes}</div>
                                        </div>
                                    </li>
                                    <li class="list-group-item position-relative bg-black">
                                        <div class="d-flex flex-column text-secondari small">
                                            <div><i class="fa-regular fa-circle-check d-none d-sm-inline"></i>  Nota</div>
                                        </div>
                                        <!-- Anime card menu btn -->
                                        <div class="position-absolute end-0 bottom-0">
                                            <div class="btn-group">
                                            <div class="p-31 small" data-bs-toggle="dropdown" style="cursor:pointer">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                                </div>
                                                <ul class="dropdown-menu shadow">
                                                    <li><button type="button" class="dropdown-item" onclick="openEdit(${anime.id})"><i class="fa-solid fa-edit me-2"></i>Editar</button></li>
                                                    <li><button type="button" class="dropdown-item" onclick="removeAnimeFromFirestore('${anime.id}')"><i class="fa-solid fa-trash me-2"></i> Excluir</button></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <!-- Edid Panel -->
                            <form id="editpanel-${anime.id}" class="editpanel" style="display:none">
                                <div class="form-floating mb-2 w-100">
                                    <textarea minlength="3" type="text" class="form-control" id="inputName-${anime.id}" style="height:5rem" required>${anime.name}</textarea>
                                    <label for="inputName-${anime.id}"> Nome do Anime</label>
                                </div>
                                <div class="form-floating mb-2  w-100">
                                    <input type="number" class="form-control" min="0" max="${anime.episodes}" id="inputEpisodes-${anime.id}" value="${anime.watched}" required>
                                    <label for="inputEpisodes-${anime.id}">Episódios Assistidos</label>
                                </div>
                                <div class="btn-group w-100">
                                    <button type="button" class="btn btn-info btn-sm col-8 d-flex justify-content-center align-items-center" onclick="cancelEdit(${anime.id})"> Cancelar
                                    </button>
                                    <button type="button" class="btn btn-info btn-sm col-8 d-flex justify-content-center align-items-center"
                                    onclick="saveEdit(${anime.id})">
                                    <i class="fa-solid fa-floppy-disk me-2"></i>
                                    <span> Atualizar</span></button>
                                </div>
                            </form>
                        </div>
                        
                        </section>`
                        list.insertAdjacentHTML("beforeend", li);

                        if (oldIndex !== -1) {
                            listAnimation(oldIndex, myAnimeListFromFirestore.indexOf(anime));
                        }
                    }
                }

                renderAnimeBatch(0, 10);

                let currentIndex = 10;
                setInterval(() => {
                    renderAnimeBatch(currentIndex, 10);
                    currentIndex += 10;
                }, 1000);
            }
        } else {
            console.log('Nenhum documento encontrado no Firestore!');
        }
    } catch (error) {
        console.error('Erro ao recuperar lista de animes do Firestore: ', error);
    }
}

db.collection('animes').doc('lista')
    .get()
    .then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const listaRecuperada = data.lista;
            console.log('Lista de animes', listaRecuperada);

            getListFromFirestore();
        } else {
            console.log('Nenhum Anime encontrado!');
        }
    })
    .catch((error) => {
        console.error('Erro ao recuperar lista: ', error);
    });

function listAnimation(oldIndex, newIndex) {
    setTimeout(() => {
        childIndex = oldIndex + 1
        changedIndex = newIndex + 1
        let childElemOld = document.querySelector("#list > section:nth-child(" + childIndex + ")")
        if (childElemOld) childElemOld.classList.add("fade-up")
        let childElemNew = document.querySelector("#list > section:nth-child(" + changedIndex + ")")
        childElemNew.classList.add("fade-down")
    }, 10);
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const animeID = urlParams.get('anime')
if (animeID) addbyURLparams(animeID);

async function addbyURLparams(animeID) {
    let itemID = myAnimeList.find(list => list.id == animeID)
    if (!itemID) {
        let response = await fetch("https://kitsu.io/api/edge/anime/" + animeID)
        if (response.ok) {
            let jsonData = await response.json();
            animeData = jsonData.data
            let payload = new NewAnime(animeData.attributes.titles.en_jp, animeData.attributes.episodeCount, animeData.attributes.posterImage.medium, animeData.id)
            pushList(payload)
        }
    }
}

function openEdit(id) {
    const editpanel = document.getElementById("editpanel-" + id)
    editpanel.style.display = ("flex")
}

async function saveEdit(id) {
    const editpanel = document.getElementById("editpanel-" + id);
    const inputName = document.getElementById("inputName-" + id).value;
    const inputEpisodes = document.getElementById("inputEpisodes-" + id).value;

    let itemIndex = myAnimeList.findIndex(list => list.id == id);

    if (inputName !== myAnimeList[itemIndex].name) {
        myAnimeList[itemIndex].name = inputName;
        updateAnimeInFirestore(myAnimeList[itemIndex]);
    }

    if (inputEpisodes > myAnimeList[itemIndex].episodes) {
        myAnimeList[itemIndex].watched = myAnimeList[itemIndex].episodes;
    } else {
        myAnimeList[itemIndex].watched = inputEpisodes;
    }

    let status = {};
    if (myAnimeList[itemIndex].watched === myAnimeList[itemIndex].episodes) {
        status.text = "Completo";
        status.class = "text-orange fw-bold";
        status.color = "text-orange";
    } else if (myAnimeList[itemIndex].watched > 0 && myAnimeList[itemIndex].watched < myAnimeList[itemIndex].episodes) {
        status.text = "Assistido";
        status.class = "text-secondari";
        status.color = "";
    } else {
        status.text = "Não Assistido";
        status.class = "text-muted";
        status.color = "";
    }

    const animeElement = document.getElementById(id);

    if (animeElement) {
        const animeName = animeElement.querySelector('.anime-name-oncover');
        if (animeName) {
            animeName.textContent = inputName;
        }
        const watchedCount = animeElement.querySelector('.watched-count');
        watchedCount.innerText = myAnimeList[itemIndex].watched;

        const statusElement = animeElement.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = status.text;
            statusElement.classList = status.class;
        }
    }

    editpanel.style.display = "none";
    saveListToFirestore(myAnimeList);
}


function cancelEdit(id) {
    const editpanel = document.getElementById("editpanel-" + id)
    editpanel.style.display = ("none")
}

function checkLocalStorage() {
    localData = localStorage.getItem("myAnimeList")
    if (localData) {
        myAnimeList = JSON.parse(localData)
    }
}

function updateLocalStorage() {
    localStorage.setItem("myAnimeList", JSON.stringify(myAnimeList))
}

function countUp(id) {
    let itemIndex = myAnimeList.findIndex(list => list.id == id);
    if (itemIndex !== -1 && myAnimeList[itemIndex].watched < myAnimeList[itemIndex].episodes) {
        myAnimeList[itemIndex].watched++;
        myAnimeList[itemIndex].lastWatched = new Date().toLocaleString();
        updateAnimeInFirestore(myAnimeList[itemIndex]);
    }
    renderList();
}

function countDown(id) {
    let itemIndex = myAnimeList.findIndex(list => list.id == id);
    if (itemIndex !== -1 && myAnimeList[itemIndex].watched > 0) {
        myAnimeList[itemIndex].watched--;
        myAnimeList[itemIndex].lastWatched = myAnimeList[itemIndex].watched === 0 ? "-" : new Date().toLocaleString();
        updateAnimeInFirestore(myAnimeList[itemIndex]);
    }
    renderList();
}

function countBlink(id) {
    let itemli = document.getElementById(id);
    if (itemli) {
        itemli.firstElementChild.classList.add("item-blink");
        setTimeout(() => {
            itemli.firstElementChild.classList.remove("item-blink");
        }, 200);
    }
}

function updateAnimeInFirestore(updatedAnime) {
    const animeRef = db.collection('animes').doc('lista');

    animeRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            const lista = docSnapshot.data().lista;
            const index = lista.findIndex(anime => anime.id === updatedAnime.id);

            if (index !== -1) {
                lista[index] = updatedAnime;

                animeRef.update({ lista })
                    .then(() => {
                        console.log('Anime atualizado!');

                        const animeElement = document.getElementById(updatedAnime.id);
                        if (animeElement) {
                            const watchedCount = animeElement.querySelector('.watched-count');
                            watchedCount.innerText = updatedAnime.watched;
                        }
                    })
                    .catch((error) => {
                        console.error('Erro ao atualizar anime: ', error);
                    });
            } else {
                console.error('Anime não encontrado.');
            }
        } else {
            console.error('Lista de animes não existe.');
        }
    }).catch((error) => {
        console.error('Erro ao obter lista de animes: ', error);
    });
}

function renderList() {
}

class NewAnime {
    constructor(name, episode, img, id) {
        this.name = name
        this.episode = episode
        this.img = img
        this.date = "-"
        this.watched = 0
        this.id = id
    }
}

function addNewAnime(name, episode, img, id) {
    const existingAnime = myAnimeList.find(anime => anime.id === id);

    if (!existingAnime) {
        let payload = new NewAnime(name, episode, img, id);
        let addBtn = document.getElementById(id);
        addBtn.classList.remove("btn-info");
        addBtn.disabled = true;
        addBtn.classList.add("btn-success");
        addBtn.firstElementChild.classList.remove("fa-plus");
        addBtn.firstElementChild.classList.add("fa-check");

        pushList(payload);
        saveListToFirestore(myAnimeList);
    }
}

function pushList(payload) {
    const existingAnime = myAnimeList.find(anime => anime.id === payload.id);
    if (!existingAnime) {
        let animeListItem = {
            "name": payload.name,
            "episodes": payload.episode,
            "watched": payload.watched,
            "image": payload.img,
            "lastWatched": payload.date,
            "id": payload.id
        };
        myAnimeList.unshift(animeListItem);
        getListFromFirestore();
    }
}

function saveListToFirestore(updatedList) {
    db.collection('animes').doc('lista')
        .set({ lista: updatedList })
        .then(() => {
            console.log('Lista de animes salva no Firestore!');
        })
        .catch((error) => {
            console.error('Erro ao salvar lista de animes: ', error);
        });
}

async function addNewAnimeToList(payload) {
    const existingAnime = myAnimeList.find(anime => anime.name === payload.name);
    if (!existingAnime) {
        const lastIndex = myAnimeList.length > 0 ? myAnimeList[myAnimeList.length - 1].id : -1;
        const newAnimeId = lastIndex + 1;

        const animeListItem = {
            "name": payload.name,
            "episodes": payload.episode,
            "watched": payload.watched,
            "image": payload.img,
            "lastWatched": payload.date,
            "id": newAnimeId
        };

        myAnimeList.push(animeListItem);
        saveListToFirestore(myAnimeList);
    }
}

function removeAnimeFromFirestore(animeId) {
    const animeRef = db.collection('animes').doc('lista');

    const idToRemove = parseInt(animeId);

    animeRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            const lista = docSnapshot.data().lista;

            console.log('ID do anime a ser removido:', idToRemove);
            console.log('IDs na lista:', lista.map(anime => anime.id));

            let indexToRemove = lista.findIndex(anime => parseInt(anime.id) === idToRemove);

            if (indexToRemove !== -1) {
                lista.splice(indexToRemove, 1);

                animeRef.update({ lista })
                    .then(() => {
                        console.log('Anime removido');

                        getListFromFirestore();
                    })
                    .catch((error) => {
                        console.error('Erro ao remover anime: ', error);
                    });
            } else {
                console.error('Anime não encontrado na lista.');
            }
        } else {
            console.error('lista de animes não existe.');
        }
    }).catch((error) => {
        console.error('Erro ao obter lista de animes: ', error);
    });
}

async function fetchAnimeData(type) {
    const spinner = document.querySelector(".spinner-border")
    spinner.classList.remove("d-none")
    resultList.innerHTML = ""
    const searchText = document.querySelector("#searchText").value
    let response;
    if (type == "mostPopular") {
        response = await fetch("https://kitsu.io/api/edge/anime?page%5Blimit%5D=20&page%5Boffset%5D=0&sort=popularityRank,popularityRank");
    } else if (type == "mostRating") {
        response = await fetch("https://kitsu.io/api/edge/anime?page%5Blimit%5D=20&page%5Boffset%5D=0&sort=-averageRating,-averageRating");
    } else {
        response = await fetch("https://kitsu.io/api/edge/anime?page%5Blimit%5D=20&page%5Boffset%5D=0&filter[text]=" + searchText);
    }
    const jsonData = await response.json();
    searchResults = jsonData.data
    if (searchResults.length > 0) {
        for (let result of searchResults) {
            let li = `
            <li class="list-group-item p-0 d-flex position-relative">
                <img class="col-2" src="${result.attributes.posterImage.small}"/>
                <div class="px-3 py-1 py-sm-2 col-10 d-flex flex-column bg-black">
                    <div class="fw-bold">${result.attributes.titles.en_jp}</div>
                    <div class="small">${result.attributes.canonicalTitle}</div>
                    <span class="small">Episodes: ${result.attributes.episodeCount}</span>
                    <div>
                        <span class="badge w-auto bg-body-secondary text-secondari-emphasis">Rating: ${result.attributes.averageRating}</span>
                        <span class="badge w-auto bg-body-secondary text-secondari-emphasis">Popularity: # ${result.attributes.popularityRank}</span>
                    </div>
                    
                    <button id="${result.id}" class="rounded-circle position-absolute btn btn-sm btn-info end-0 bottom-0 m-2" style="width:2rem; height:2rem"
                    onclick="addNewAnime('${result.attributes.titles.en_jp}', ${result.attributes.episodeCount}, '${result.attributes.posterImage.medium}', ${result.id})">
                    <i class="fa-solid fa-plus"></i>
                </button>
                </div>
            </li>
            `
            resultList.insertAdjacentHTML("beforeend", li)
        }
    } else {
        resultList.innerHTML = "OOPS! >_<"
    }
    spinner.classList.add("d-none")
}

const datalistOptions = [
]
const AnimeXDatalist = document.getElementById("AnimeXDatalist")
for (let i = 0; i < datalistOptions.length; i++) {
    let optionElement = `<option value="${datalistOptions[i]}">`
    AnimeXDatalist.insertAdjacentHTML("beforeend", optionElement)
}

function searchAnime() {
    const searchInput = document.getElementById("searchAnimeTxT");

    if (searchInput.value.trim() === "") {
        getListFromFirestore();
        return;
    }

    const filteredAnimes = myAnimeList.filter(anime => anime.name.toLowerCase().includes(searchInput.value.toLowerCase()));

    renderSearchResults(filteredAnimes);
}

const searchInput = document.getElementById("searchAnimeTxT");
searchInput.addEventListener("input", searchAnime);

function renderSearchResults(animes) {
    list.innerHTML = "";

    if (animes.length === 0) {
        list.innerHTML = "<p>Nenhum anime correspondente encontrado.</p>";
        updateAnimeCount(0);
        return;
    }

    animes.forEach(anime => {
        let status = {};
        if (anime.watched === anime.episodes) {
            status.text = "Completo";
            status.class = "text-orange fw-bold";
            status.color = "text-orange";
        } else if (anime.watched > 0 && anime.watched < anime.episodes) {
            status.text = "Assistido";
            status.class = "text-assistido";
            status.color = "";
        } else {
            status.text = "Não Assistido";
            status.class = "text-secondari";
            status.color = "";
        }

        let li = `
        <section class="list-item " id="${anime.id}">
        <div class="position-relative rounded-3 d-flex flex-sm-column shadow overflow-hidden" style="background-color:#ffffff11;border:2px solid transparent">
            <div class="col-4 col-sm-12 position-relative" loading="lazy" style="background-image:url('${anime.image}');background-size: cover; aspect-ratio:2/3">
                <div class="anime-name-oncover d-none d-sm-block">${anime.name}</div>
            </div>
            <div class="col-8 col-sm-12 d-flex flex-column justify-content-between bg-black">
                <div class="text-center">
                    <div class="anime-name d-block py-2 p-2 d-sm-none">${anime.name}</div>
                </div>
                <ul class="list-group list-group-flush">
                <li class="list-group-item bg-black">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="${status.class} small"><i class="fa-regular fa-eye d-none d-sm-inline"></i> ${status.text}</div>
                            <div class="d-flex justify-content-between align-items-center">
                            <button type="button" onclick="countDown(${anime.id})" class="btn btn-lg1 border" aria-label="Diminuir contador"><i class="fa-solid fa-minus"></i></button>
                            <span class="px-2 fw-bold fs-2 watched-count">${anime.watched}</span>
                            <button type="button" onclick="countUp(${anime.id})" class="btn btn-lg2 border" aria-label="Aumentar contador"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </div>
                    </li>
                    <li class="list-group-item bg-black">
                        <div class="d-flex justify-content-between text-secondari">
                            <div class="small"><i class="fa-solid fa-bell d-none d-sm-inline"></i> Episódios</div>
                            <div>${anime.episodes}</div>
                        </div>
                    </li>
                    <li class="list-group-item position-relative bg-black">
                        <div class="d-flex flex-column text-secondari small">
                            <div><i class="fa-regular fa-circle-check d-none d-sm-inline"></i> Última visualização</div>
                            <div>${anime.lastWatched}</div>
                        </div>
                        <!-- Anime card menu btn -->
                        <div class="position-absolute end-0 bottom-0">
                            <div class="btn-group">
                            <div class="p-31 small" data-bs-toggle="dropdown" style="cursor:pointer">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                </div>
                                <ul class="dropdown-menu shadow">
                                    <li><button type="button" class="dropdown-item" onclick="openEdit(${anime.id})"><i class="fa-solid fa-edit me-2"></i>Editar</button></li>
                                    <li><button type="button" class="dropdown-item" onclick="removeAnimeFromFirestore('${anime.id}')"><i class="fa-solid fa-trash me-2"></i> Excluir</button></li>
                                </ul>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <!-- Edid Panel -->
            <form id="editpanel-${anime.id}" class="editpanel" style="display:none">
                <div class="form-floating mb-2 w-100">
                    <textarea minlength="3" type="text" class="form-control" id="inputName-${anime.id}" style="height:5rem" required>${anime.name}</textarea>
                    <label for="inputName-${anime.id}"> Nome do Anime</label>
                </div>
                <div class="form-floating mb-2  w-100">
                    <input type="number" class="form-control" min="0" max="${anime.episodes}" id="inputEpisodes-${anime.id}" value="${anime.watched}" required>
                    <label for="inputEpisodes-${anime.id}">Episódios Assistidos</label>
                </div>
                <div class="btn-group w-100">
                    <button type="button" class="btn btn-secondary btn-sm col-4 small" onclick="cancelEdit(${anime.id})"> Cancelar
                    </button>
                    <button type="button" class="btn btn-info btn-sm col-8 d-flex justify-content-center align-items-center"
                    onclick="saveEdit(${anime.id})">
                    <i class="fa-solid fa-floppy-disk me-2"></i>
                    <span> Atualizar</span></button>
                </div>
            </form>
        </div>
        
    </section>`
        list.insertAdjacentHTML("beforeend", li);
    });
    updateAnimeCount(animes.length);
}

function updateAnimeCount(count) {
    let animeCount = document.querySelector("#animeCount");
    animeCount.innerText = count;
}

function openLoginModal() {
    // Abrir o modal de login usando jQuery (Bootstrap requer jQuery para modais)
    $('#loginModal').modal('show');
}

function openSignupModal() {
    // Abrir o modal de cadastro usando jQuery (Bootstrap requer jQuery para modais)
    $('#signupModal').modal('show');
}

// Event listener para o formulário de login
$('#loginForm').on('submit', function (event) {
    event.preventDefault();
    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido, feche o modal e faça outras ações necessárias
            $('#loginModal').modal('hide');
            const user = userCredential.user;
            console.log('Usuário logado:', user.uid);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Erro ao fazer login:', errorCode, errorMessage);
        });
});

// Event listener para o formulário de cadastro
$('#signupForm').on('submit', function (event) {
    event.preventDefault();
    const email = $('#signupEmail').val();
    const password = $('#signupPassword').val();

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Cadastro bem-sucedido, feche o modal e faça outras ações necessárias
            $('#signupModal').modal('hide');
            const user = userCredential.user;
            console.log('Novo usuário cadastrado:', user.uid);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Erro ao cadastrar:', errorCode, errorMessage);
        });
});
