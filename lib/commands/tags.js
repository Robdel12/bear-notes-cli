import { parseArgs } from 'node:util'
import { listTags, getTagNoteCounts } from '../db.js'
import { normalizeTag, output } from '../format.js'

export let help = `Usage: bear tags [options]

List all tags.

Options:
  --with-counts     Show note count per tag
  --flat            Flat list instead of tree
  --json            Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts } = parseArgs({
    args,
    strict: false,
    options: {
      'with-counts': { type: 'boolean', default: false },
      flat:          { type: 'boolean', default: false },
      help:          { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help) {
    console.log(help)
    return
  }

  let json = globalOpts.json || opts.json

  if (opts['with-counts']) {
    let tagsWithCounts = getTagNoteCounts()

    if (json) {
      output(tagsWithCounts.map(t => ({ title: t.ZTITLE, noteCount: t.count })), true)
      return
    }

    if (opts.flat) {
      for (let t of tagsWithCounts) {
        console.log(`${t.ZTITLE} (${t.count})`)
      }
    } else {
      printTree(tagsWithCounts.map(t => ({ name: t.ZTITLE, count: t.count })))
    }
    return
  }

  let tags = listTags()

  if (json) {
    output(tags.map(normalizeTag), true)
    return
  }

  if (opts.flat) {
    for (let t of tags) {
      let prefix = t.ZPINNED ? '[pinned] ' : ''
      console.log(`${prefix}${t.ZTITLE}`)
    }
  } else {
    printTree(tags.map(t => ({ name: t.ZTITLE, pinned: t.ZPINNED })))
  }
}

function printTree(items) {
  // Group by root tag
  let roots = new Map()

  for (let item of items) {
    let parts = item.name.split('/')
    let root = parts[0]
    if (!roots.has(root)) roots.set(root, [])
    if (parts.length > 1) {
      roots.get(root).push({ ...item, indent: parts.slice(1).join('/') })
    } else {
      // Mark root entry
      roots.get(root).unshift({ ...item, isRoot: true })
    }
  }

  for (let [root, children] of roots) {
    let rootItem = children.find(c => c.isRoot)
    let countStr = rootItem?.count != null ? ` (${rootItem.count})` : ''
    let pinStr = rootItem?.pinned ? ' [pinned]' : ''
    console.log(`${root}${countStr}${pinStr}`)

    for (let child of children) {
      if (child.isRoot) continue
      let countStr = child.count != null ? ` (${child.count})` : ''
      let pinStr = child.pinned ? ' [pinned]' : ''
      console.log(`  ${child.indent}${countStr}${pinStr}`)
    }
  }
}
