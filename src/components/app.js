import Level from './level'
import Player from './player'
import Tools from './tools'
import Inventory from './inventory'
import Modal from './modal'

export default class App {
  constructor(container, modalContainer) {
    this.container = container
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
      ArrowLeft: 'previous',
      ArrowRight: 'next',
      Escape: 'close',
      Enter: 'select'
    }
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
      if(this.map.checkIfPlantable(x, y)) {
        const tile = this.map.getTile(x, y)
        this.setCurrentTile(tile)
        this.modal.generateSeedModal(this.inventory.getSeeds())
        this.setView('seedSelection')
      }
    } else {
      this.player.updateDirection(direction)
      directionHandler[direction]()
      if (this.map.checkIfWalkable(x, y)) {
        this.player.updatePosition(x, y)
      }
    }
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
    console.log(this.map.tileMap)
  }
}
