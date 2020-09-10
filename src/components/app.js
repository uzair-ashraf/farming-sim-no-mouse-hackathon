import Level from './level'
import Player from './player'
import Tools from './tools'
import Inventory from './inventory'
import Modal from './modal'

export default class App {
  constructor(container, modalContainer) {
    this.container = container
    this.time = 0;
    this.gameLoopIntervalId = null;
    this.map = new Level()
    this.player = new Player(19, 5, 'down')
    this.tools = new Tools()
    this.inventory = new Inventory()
    this.modal = new Modal(modalContainer)
    this.view = 'map'
    this.currentTile = null
    this.playerMovementKeyMap = {
      w: 'up',
      a: 'left',
      s: 'down',
      d: 'right',
      ' ': 'action'
    }
    this.toolsNavigateKeyMap = {
      ArrowLeft: 'previous',
      ArrowRight: 'next'
    }
    this.seedSelectionKeyMap = {
      a: 'previous',
      d: 'next',
      Escape: 'close',
      ' ': 'select'
    }
  }
  startGameLoop() {
    this.gameLoopIntervalId = setInterval(this.gameLoop.bind(this), 1000)
  }
  gameLoop() {
    this.time++
    this.map.ageCrops()
  }
  setView(view) {
    this.view = view
  }
  handleKeyPress(e) {
    const { key } = e
    console.log(key)
    const views = {
      map: () => this.handleMapViewKeyPress(key),
      seedSelection: () => this.handleSeedSelectionKeyPress(key)
    }
    views[this.view]()
  }
  handleMapViewKeyPress(key) {
    if (this.playerMovementKeyMap.hasOwnProperty(key)) {
      this.handlePlayerMovement(key)
    } else if (this.toolsNavigateKeyMap.hasOwnProperty(key)) {
      this.handleToolNavigation(key)
    }
  }
  handleSeedSelectionKeyPress(key) {
    const action = this.seedSelectionKeyMap[key]
    if(!action) return;
    this.modal.navigateSeedModal(action)
  }
  handlePlayerMovement(key) {
    const direction = this.playerMovementKeyMap[key];
    let [x, y] = this.player.position
    const directionHandler = {
      up: () => y--,
      left: () => x--,
      down: () => y++,
      right: () => x++
    }
    if(direction === 'action') {
      // If the user pressed the space bar then we use the current location instead of an updated direction
      directionHandler[this.player.direction]()
      const action = this.tools.selectedActionToExecute
      const tile = this.map.getTile(x, y)
      const actions = {
        inventory: () => {
          if (this.map.checkIfPlantable(x, y)) {
            this.setCurrentTile(tile)
            this.modal.generateSeedModal(this.inventory.getSeeds())
            this.setView('seedSelection')
          }
        },
        shovel: () => {
          if(!tile.hasCrop) return;
          if(!tile.isCropReadyToHarvest) return;
          const harvestedCrop = tile.harvestCrop()
          this.inventory.addCrop(harvestedCrop)
          console.log(this.inventory)
          this.map.removePlantedTile(tile)
        },
        'watering-can': () => {
          if(!tile.hasCrop) return;
          if(tile.isCropWatered || tile.isCropReadyToHarvest) return;
          tile.waterCrop()
        },
        hoe: () => {
          if (!tile.hasCrop) return;
          this.map.removePlantedTile(tile)
        }
      }
      actions[action]()
    } else {
      this.player.updateDirection(direction)
      directionHandler[direction]()
      if (this.map.checkIfWalkable(x, y)) {
        this.player.updatePosition(x, y)
      }
    }
  }
  plantSeed(type) {
    this.inventory.removeSeed(type)
    this.currentTile.createCrop(type, this.time)
    this.container.appendChild(this.currentTile.crop.domElement)
    this.map.addPlantedTile(this.currentTile)
    this.setCurrentTile(null)
  }
  handleToolNavigation(key) {
    const action = this.toolsNavigateKeyMap[key]
    this.tools.navigate(action)
  }
  setCurrentTile(tile) {
    this.currentTile = tile
  }
  setCallbacks() {
    this.modal.setViewCb(this.setView.bind(this))
    this.modal.setCurrentTileCb(this.setCurrentTile.bind(this))
    this.modal.setPlantSeedCb(this.plantSeed.bind(this))
  }
  setListeners() {
    window.addEventListener('keydown', this.handleKeyPress.bind(this))
    this.player.setListeners()
  }
  setupDomElements() {
    this.container.appendChild(this.player.domElement)
    this.container.appendChild(this.tools.domElement)
  }
  start() {
    this.setCallbacks()
    this.setupDomElements()
    this.setListeners()
    this.startGameLoop()
    console.log(this.map.tileMap)
  }
}
