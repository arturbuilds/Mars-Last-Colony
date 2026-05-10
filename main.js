// змінні
let metal = 100;
let energy = 0;
let selected = null;
let isNight = false;
let people = [];
let totalPeople = 0;
let maxPeople = 50;
let food = 0;

// елементи html
const ghost = document.getElementById('ghost');
const map = document.getElementById('map');

// данні про будівлі
const buildings = {
    solar: {
        name: 'Solar panel',
        price: 40,
        size: 1,
        buildTime: 3000,
        icon: 'assets/solar.png',
        energyPerSecond: 1,
        upgradeCosts: {
            2: 25,
            3: 45
        }
    },
    mine: {
        name: 'Mine metal',
        price: 80,
        size: 1,
        buildTime: 6000,
        icon: 'assets/mine.png',
        energyPerSecond: 0,
        metalPerSecond: 1,
        upgradeCosts: {
            2: 40,
            3: 70
        }
    },
    dome: {
        name: 'Main dome',
        price: 160,
        size: 2,
        buildTime: 8000,
        icon: 'assets/dome.png',
        energyPerSecond: -2,
    },
    garden: {
        name: 'Hydronics',
        price: 180,
        size: 2,
        buildTime: 5000,
        icon: 'assets/garden.png',
        energyPerSecond: -3,
        foodPerCycles: 10,
        cycleTime: 10000
    }
}

const occupiedTiles = [];

const grid_size = 30;

// вибрати будівлю для будівництва
function selectBuilding(type) {
    const building = buildings[type];
    if (metal >= building.price) {
        selected = type;
        ghost.src = building.icon;
        ghost.classList.remove('hidden');
        ghost.style.width = (grid_size * building.size) + 'px';
    } else {
        alert(`Недостатньо металу! Потрібно ${building.price}`);
    }
}

// скасувати вибір будівлі
function cancel() {
    selected = null;
    ghost.classList.add('hidden');
}

// перевірка чи можна ставити будівлю
function canPlace(x, y) {
    const rect = map.getBoundingClientRect();
    const padding = 10;

    const size = buildings[selected].size;
    const buildingSize = size * grid_size;

    if (
        x < padding ||
        y < padding ||
        x + buildingSize > rect.width - padding ||
        y + buildingSize > rect.height - padding
    ) {
        return false;
    }

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tileX = x + col * grid_size;
            const tileY = y + row * grid_size;

            for (let tile of occupiedTiles) {
                if (tile.x === tileX && tile.y === tileY) {
                    return false;
                }
            }
        }
    }

    return true;
}

// рух привида за курсором
function moveGhost(e) {
    if (!selected) return;
    
    const rect = map.getBoundingClientRect();
    const mouseX = e.pageX - rect.left;
    const mouseY = e.pageY - rect.top;
    
    const building = buildings[selected];
    const size = building.size;

    let snappedX, snappedY;
    if (size === 1) {
        snappedX = Math.floor(mouseX / grid_size) * grid_size + (grid_size / 2);
        snappedY = Math.floor(mouseY / grid_size) * grid_size + (grid_size / 2);
    } else {
        snappedX = Math.round(mouseX / grid_size) * grid_size;
        snappedY = Math.round(mouseY / grid_size) * grid_size;
    }

    ghost.style.left = snappedX + 'px';
    ghost.style.top = snappedY + 'px';

    if (!canPlace(snappedX, snappedY)) {
        ghost.style.filter = "brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)";
    } else {
        ghost.style.filter = "none";
    }
}

// поставити будівлю на місце
function placeBuilding(e) {
    closeMenus();

    if (!selected) return;

    const rect = map.getBoundingClientRect();
    const mouseX = e.pageX - rect.left;
    const mouseY = e.pageY - rect.top;
    
    const building = buildings[selected];
    const size = building.size;

    let snappedX, snappedY;
    if (size === 1) {
        snappedX = Math.floor(mouseX / grid_size) * grid_size + (grid_size / 2);
        snappedY = Math.floor(mouseY / grid_size) * grid_size + (grid_size / 2);
    } else {
        snappedX = Math.round(mouseX / grid_size) * grid_size;
        snappedY = Math.round(mouseY / grid_size) * grid_size;
    }

    if (!canPlace(snappedX, snappedY)) return;
    
    if (metal >= building.price) {
        metal -= building.price;
        updateUI();

        const buildWrapper = document.createElement('div');
        buildWrapper.className = 'build-wrapper';
        buildWrapper.style.left = snappedX + 'px';
        buildWrapper.style.top = snappedY + 'px';

        const b = document.createElement('img');
        b.src = building.icon;
        b.className = 'building under-construction';
        b.style.width = (grid_size * size) + 'px';
        buildWrapper.appendChild(b);

        const progressWrap = document.createElement('div');
        progressWrap.className = 'progress-wrap';
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        progressBar.style.transition = `width ${building.buildTime / 1000}s linear`;
        
        progressWrap.appendChild(progressBar);
        buildWrapper.appendChild(progressWrap);

        map.appendChild(buildWrapper);
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                occupiedTiles.push({
                    x: snappedX + col * grid_size,
                    y: snappedY + row * grid_size
                });
            }
        }

        const currentType = selected;

        const sparkInterval = setInterval(() => {
            createSparks(snappedX, snappedY);
        }, 120);
        
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 10);
        
        setTimeout(() => {
            clearInterval(sparkInterval);
            createBuildDust(snappedX, snappedY);

            b.classList.remove('under-construction');
            b.classList.add(currentType);

            b.dataset.progress = 0;
            b.dataset.food = 0;

            b.dataset.type = currentType;
            b.dataset.level = 1;
            b.onclick = (e) => {
                e.stopPropagation();
                openBuildingMenu(b);
            }
            b.style.pointerEvents = 'auto';
            progressWrap.remove();
        }, building.buildTime);

        cancel();
    }
}

// оновлення показників ui
function updateUI() {
    document.getElementById('met').innerText = metal;
    document.getElementById('en').innerText = energy;
    document.getElementById('people').innerText = `${totalPeople} / ${maxPeople}`;
    document.getElementById('food').innerText = food.toFixed(1);
}

// створення та показ меню керування будівлею
function openBuildingMenu(building) {
    const oldMenu = building.parentElement.querySelector('.building-menu');
    if (oldMenu) {
        oldMenu.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'building-menu';

    const type = building.dataset.type;
    const buildingData = buildings[type];
    const level = Number(building.dataset.level);
    const nextLevel = level + 1;

    const sellBtn = document.createElement('button');
    sellBtn.textContent = 'sell';

    sellBtn.onclick = (e) => {
        e.stopPropagation();

        metal += Math.floor(buildingData.price / 2);

        const wrapper = building.parentElement;
        const x = parseInt(wrapper.style.left);
        const y = parseInt(wrapper.style.top);
        const size = buildingData.size;

        for (let i = occupiedTiles.length - 1; i >= 0; i--) {
            const tile = occupiedTiles[i];

            if (
                tile.x >= x &&
                tile.x < x + size * grid_size &&
                tile.y >= y &&
                tile.y < y + size * grid_size
            ) {
                occupiedTiles.splice(i, 1);
            }
        }

        people.forEach(p => {
            if (p.targetBuilding === building) {
                p.state = 'wander';
                p.targetBuilding = null;
                p.el.style.display = 'block';
                setRandomTarget(p);
            }
        })

        wrapper.remove();
        updateUI();
    };

    menu.appendChild(sellBtn);

    if (buildingData.upgradeCosts) {
        const upgradeBtn = document.createElement('button');

        if (level >= 3) {
            upgradeBtn.textContent = 'max level';
            upgradeBtn.disabled = true;
        } else {
            const cost = buildingData.upgradeCosts[nextLevel];
            upgradeBtn.textContent = `upgrade ${nextLevel} (${cost})`;

            upgradeBtn.onclick = (e) => {
                e.stopPropagation();

                if (metal < cost) {
                    upgradeBtn.textContent = 'not enough';
                    upgradeBtn.classList.add('error-btn');
                    upgradeBtn.disabled = true;

                    setTimeout(() => {
                        upgradeBtn.textContent = `upgrade ${nextLevel} (${cost})`;
                        upgradeBtn.classList.remove('error-btn');
                        upgradeBtn.disabled = false;
                    }, 500);

                    return;
                }

                metal -= cost;
                building.dataset.level = nextLevel;
                updateUI();
                menu.remove();
            };
        }

        menu.appendChild(upgradeBtn);
    }

    if (type === 'dome') {
        const peopleBtn = document.createElement('button');
        const currentPeople = Number(building.dataset.people || 0);
        peopleBtn.textContent = `${currentPeople} / 5 👤`;
        peopleBtn.disabled = true;
        menu.appendChild(peopleBtn);
    }

    if (type === 'garden') {
        const workerBtn = document.createElement('button');
        const currentPeople = Number(building.dataset.people || 0);
        workerBtn.textContent = `${currentPeople} / 2 👤`;;
        workerBtn.disabled = true;
        menu.appendChild(workerBtn);
    }

    building.parentElement.appendChild(menu);
}

// закриття вікон на рандом клацанья миші
function closeMenus() {
    const menus = document.querySelectorAll('.building-menu');
    menus.forEach(menu => menu.remove());
}

// спавн людини
function spawnPersone() {
    if (totalPeople >= maxPeople) return;

    const persone = document.createElement('img');
    persone.src = 'assets/persone.png';
    persone.className = 'persone';

    const x = Math.random() * (map.clientWidth - 60) + 30;
    const y = Math.random() * (map.clientHeight - 60) + 30;

    persone.style.left = x + 'px';
    persone.style.top = y + 'px';

    map.appendChild(persone);

    const data = {
        el: persone,
        x: x,
        y: y,
        targetX: x,
        targetY: y,
        oxygen: 100,
        state: 'wander',
        targetBuilding: null
    };

    people.push(data);
    totalPeople++;

    setRandomTarget(data);

    persone.onclick = (e) => {
        e.stopPropagation();
        openPersoneMenu(data);
    };

    updateUI();
}

// знаходити рандомну точку
function setRandomTarget(person) {
    person.targetX = Math.random() * (map.clientWidth - 60) + 30;
    person.targetY = Math.random() * (map.clientHeight - 60) + 30;
}

// пошук будівлі
function findBuilding(type, fromX = null, fromY = null) {
    const list = [...document.querySelectorAll('.building')].filter(b => b.dataset.type === type);

    if (list.length === 0) return null;

    if (fromX === null || fromY === null) return list[0];

    let best = list[0];
    let bestDist = Infinity;

    for (let b of list) {
        const w = b.parentElement;
        const x = parseInt(w.style.left);
        const y = parseInt(w.style.top);

        const dx = x - fromX;
        const dy = y - fromY;
        const d = dx * dx + dy * dy;

        if (d < bestDist) {
            bestDist = d;
            best = b;
        }
    }

    return best;
}

// відправлення людини до певної будівлі
function sendPersonToBuilding(persone, type) {
    const building = findBuilding(type);
    if (!building) return false;

    if (type == 'garden') {
        const workers = Number(building.dataset.people || 0);
        const incoming =
        people.filter(p =>
            p.state === 'goToBuilding' &&
            p.targetBuilding === building
        ).length;

        if (workers + incoming >= 2) {
            return false;
        }
    }

    if (type == 'dome') {
        const workers = Number(building.dataset.people || 0);
        const incoming =
        people.filter(p =>
            p.state === 'goToBuilding' &&
            p.targetBuilding === building
        ).length;

        if (workers + incoming >= 5) {
            return false;
        }
    }

    const wrapper = building.parentElement;

    persone.targetX = parseInt(wrapper.style.left);
    persone.targetY = parseInt(wrapper.style.top);
    persone.state = 'goToBuilding';
    persone.targetBuilding = building;

    return true;
}

// рух людинки
function movePeople() {
    people.forEach(person => {
        if (person.state === 'inside') {
            person.insideTimer--;

            const domeActive = person.targetBuilding?.dataset?.active === 'true';

            person.oxygen -= 0.04;

            if (domeActive && energy > 0) {
                person.oxygen += 0.2;
            }

            if (person.oxygen > 100) person.oxygen = 100;
            if (person.oxygen < 0) person.oxygen = 0;

            if (person.insideTimer <= 0) {
                person.state = 'wander';
                person.el.style.display = 'block';

                if (person.targetBuilding) {
                    let current = Number(person.targetBuilding.dataset.people || 0);
                    person.targetBuilding.dataset.people = Math.max(0, current - 1);
                }

                person.targetBuilding = null;
                setRandomTarget(person);
                return;
            }

            return;
        }

        if (person.state === 'working') {
            if (!person.targetBuilding || !document.body.contains(person.targetBuilding)) {
                person.state = 'wander';
                person.targetBuilding = null;
                person.el.style.display = 'block';
                setRandomTarget(person);

                return;
            }

            if (energy > 0) {
                person.oxygen += 0.03;
            } else {
                person.oxygen -= 0.04;
            }

            if (person.oxygen > 100) {
                person.oxygen = 100;
            }

            if (person.oxygen <= 0) {
                let current = Number(person.targetBuilding.dataset.people || 0);

                person.targetBuilding.dataset.people = Math.max(0, current - 1);

                if (person.menu) {
                    person.menu.remove();
                }

                person.el.remove();
                people = people.filter(p => p !== person);
                totalPeople--;
                updateUI();

                return;
            }
            return;
        }

        const dx = person.targetX - person.x;
        const dy = person.targetY - person.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (person.oxygen < 30 && person.state === 'wander') {
            sendPersonToBuilding(person, 'dome');
        }

        if (dist < 35) {
            if (person.state === 'goToBuilding') {
                if (person.targetBuilding.dataset.type === 'garden') {
                    person.state = 'working';
                } else {
                    person.state = 'inside';
                    person.insideTimer = 600;
                }

                person.el.style.display = 'none';

                if (person.targetBuilding) {
                    let current = Number(person.targetBuilding.dataset.people || 0);
                    person.targetBuilding.dataset.people = current + 1;
                }

                return;
            }

            if (person.state === 'wander') {
                const garden = findBuilding('garden');

                if (garden) {
                    const workers = Number(garden.dataset.people || 0);

                    if (workers < 2 && garden.dataset.active === 'true') {
                        sendPersonToBuilding(person, 'garden');
                        return;
                    }
                }
            }

            setRandomTarget(person);
            return;
        }

        const speed = 0.4;

        const nextX = person.x + (dx / dist) * speed;
        const nextY = person.y + (dy / dist) * speed;

        if (canPersonMove(person, nextX, nextY)) {
            person.x = nextX;
            person.y = nextY;
        } else {
            setRandomTarget(person);
        }

        person.el.style.left = person.x + 'px';
        person.el.style.top = person.y + 'px';

        if (person.menu) {
            person.menu.style.left = person.x + 'px';
            person.menu.style.top = (person.y - 13) + 'px';

            const btn = person.menu.querySelector('button');
            if (btn) {
                btn.textContent = `O₂ ${Math.floor(person.oxygen)}%`;
            }
        }

        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        person.el.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

        person.oxygen -= 0.06;

        if (person.oxygen <= 0) {
            if (person.menu) person.menu.remove();
            person.el.remove();
            people = people.filter(p => p !== person);
            totalPeople--;
            updateUI();
        }
    });
}

// відкриття меню кислорода над людиною
function openPersoneMenu(personData) {
    closeMenus();

    const menu = document.createElement('div');
    menu.className = 'building-menu';

    const oxygenBtn = document.createElement('button');
    oxygenBtn.disabled = true;
    oxygenBtn.textContent = `O₂ ${Math.floor(personData.oxygen)}%`;

    menu.appendChild(oxygenBtn);
    map.appendChild(menu);

    menu.style.position = 'absolute';
    menu.style.left = personData.x + 'px';
    menu.style.top = (personData.y - 13) + 'px';

    personData.menu = menu;
}

// колізія ігрока
function canPersonMove(person, newX, newY) {
    const personSize = 20;

    for (let tile of occupiedTiles) {
        if (
            person.state === 'goToBuilding' &&
            person.targetBuilding
        ) {
            const wrapper = person.targetBuilding.parentElement;
            const bx = parseInt(wrapper.style.left);
            const by = parseInt(wrapper.style.top);

            if (
                newX > bx - personSize &&
                newX < bx + 60 &&
                newY > by - personSize &&
                newY < by + 60
            ) {
                return true;
            }
        }

        if (
            newX > tile.x - personSize &&
            newX < tile.x + grid_size &&
            newY > tile.y - personSize &&
            newY < tile.y + grid_size
        ) {
            return false;
        }
    }

    return true;
}

// обновлення головного купола
function updateDomesStatus() {
    const domes = document.querySelectorAll('.building[data-type="dome"]');

    domes.forEach(dome => {
        const active = energy > 0;

        dome.dataset.active = active ? 'true' : 'false';

        if (!active) {
            dome.style.filter = 'grayscale(1) brightness(0.4)';
            dome.classList.remove('dome-active');
            return;
        }

        dome.style.filter = '';

        if (isNight) {
            dome.classList.add('dome-active');
        } else {
            dome.classList.remove('dome-active');
        }
    });
}

// оновлення огороду
function updateGardenStatus() {
    const gardens = document.querySelectorAll('.building[data-type="garden"]');

    gardens.forEach(g => {
        const active = energy > 0;

        if (!active) {
            g.style.filter = 'grayscale(1) brightness(0.4)';
            g.classList.remove('garden-active');
            return;
        }

        g.style.filter = '';

        if (isNight) {
            g.classList.add('garden-active');
        } else {
            g.classList.remove('garden-active');
        }
    });
}

// створення пилі
function createDust() {
    const dust = document.createElement('div');
    dust.className = 'dust';

    dust.style.left = Math.random() * map.clientWidth + 'px';
    dust.style.top = Math.random() * map.clientHeight + 'px';

    dust.style.animationDuration = (8 + Math.random() * 8) + 's';

    map.appendChild(dust);

    setTimeout(() => {
        dust.remove();
    }, 16000);
}

// створення іскор
function createSparks(x, y) {
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';

        spark.style.left = x + 'px';
        spark.style.top = y + 'px';

        spark.style.setProperty(
            '--x',
            (Math.random() * 80 - 40) + 'px'
        );
        spark.style.setProperty(
            '--y',
            (Math.random() * 80 - 40) + 'px'
        );
        spark.style.animationDuration =
            (0.4 + Math.random() * 0.5) + 's';

        map.appendChild(spark);

        setTimeout(() => {
            spark.remove();
        }, 900);
    }
}

// створення хмаринки після стройки
function createBuildDust(x, y) {
    for (let i = 0; i < 8; i++) {
        const dust = document.createElement('div');

        dust.className = 'build-dust';
        dust.style.left =
            (x + Math.random() * 30 - 15) + 'px';
        dust.style.top =
            (y + Math.random() * 30 - 15) + 'px';
        map.appendChild(dust);

        setTimeout(() => {
            dust.remove();
        }, 1200);
    }
}

// основний цикл
setInterval(() => {
    let totalEnergy = 0;
    let totalMetal = 0;

    const placedBuildings = document.querySelectorAll('.building:not(.under-construction)');

    placedBuildings.forEach(build => {

        if (build.dataset.type === 'solar' && !isNight) {
            totalEnergy += buildings.solar.energyPerSecond * Number(build.dataset.level);
        }
        if (build.dataset.type === 'mine') {
            totalMetal += buildings.mine.metalPerSecond * Number(build.dataset.level);
        }
        if (build.dataset.type === 'dome') {
            totalEnergy += buildings.dome.energyPerSecond;
        }
        if (build.dataset.type === 'garden') {
            totalEnergy += buildings.garden.energyPerSecond;
            const workers = Number(build.dataset.people || 0);
            const hasEnergy = energy > 0;

            if (workers > 0 && hasEnergy) {
                let p = Number(build.dataset.progress || 0);

                p += 0.02 * workers;
                build.dataset.progress = p;

                if (p >= 1) {
                    p = 0;
                    build.dataset.progress = p;
                    food += 10;
                    people.forEach(person => {
                        if (
                            person.state === 'working' &&
                            person.targetBuilding === build
                        ) {
                            person.state = 'wander';
                            person.el.style.display = 'block';

                            let current = Number(build.dataset.people || 0);
                            build.dataset.people = Math.max(0, current - 1);

                            person.targetBuilding = null;
                            setRandomTarget(person);
                        }
                    });
                }

                if (p > 0.5) {
                    build.src = '/assets/garden_green.png';
                } else {
                    build.src = '/assets/garden.png';
                }
            }
        }
    });

    energy += totalEnergy;
    metal += totalMetal;
    if (energy < 0) energy = 0;
    updateDomesStatus();
    updateGardenStatus();

    updateUI();
}, 1000);

// цикл дня та ночі
setInterval(() => {
    isNight = !isNight;

    const overlay = document.getElementById('night-overlay');

    if (isNight) {
        overlay.style.background = 'rgba(30, 10, 40, 0.35)';
    } else {
        overlay.style.background = 'rgba(10, 20, 50, 0)';
    }

    updateDomesStatus();
    updateGardenStatus();
}, 60000);

// рух людей
setInterval(movePeople, 30);

// зїдання їжі
setInterval(() => {
    people.forEach(p => {
        if (food > 0) {
            food -= 1;
            p.oxygen += 15;

            if (p.oxygen > 100) {
                p.oxygen = 100;
            }
        } else {
            p.oxygen -= 10;
        }
    });
    updateUI();
}, 20000);

// створення пилинок
setInterval(createDust, 400);
