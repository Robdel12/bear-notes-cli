import { homedir } from 'node:os'
import { join } from 'node:path'

let home = homedir()

export let DB_PATH = join(home, 'Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite')
export let CONFIG_PATH = join(home, '.bear-cli.json')
export let CORE_DATA_EPOCH = 978307200
export let BEAR_SCHEME = 'bear://x-callback-url'
